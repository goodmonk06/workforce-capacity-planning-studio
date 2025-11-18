import { Command } from 'commander'
import { PrismaClient } from '@prisma/client'
import { runSimulation } from '../../../lib/simulation'
import { simulationLogger } from '../../../lib/logger'

const prisma = new PrismaClient()

export const simulateCommand = new Command('simulate')
  .description('Run a capacity simulation')
  .option('-t, --team <teamId>', 'Team ID')
  .option('-s, --series <seriesId>', 'Demand series ID')
  .option('-o, --output <format>', 'Output format: json, table', 'table')
  .action(async (options) => {
    try {
      if (!options.team || !options.series) {
        console.error('Error: Both --team and --series are required')
        process.exit(1)
      }

      simulationLogger.info(
        { teamId: options.team, seriesId: options.series },
        'Running simulation via CLI'
      )

      // Fetch team with members
      const team = await prisma.team.findUnique({
        where: { id: options.team },
        include: {
          members: {
            include: {
              role: true,
            },
          },
        },
      })

      if (!team) {
        console.error('Error: Team not found')
        process.exit(1)
      }

      // Fetch demand series with points
      const series = await prisma.demandSeries.findUnique({
        where: { id: options.series },
        include: {
          demandPoints: {
            orderBy: {
              date: 'asc',
            },
          },
        },
      })

      if (!series) {
        console.error('Error: Demand series not found')
        process.exit(1)
      }

      // Prepare data
      const members = team.members.map((m) => ({
        id: m.id,
        name: m.name,
        weeklyHours: m.weeklyHours,
        startDate: m.startDate,
        endDate: m.endDate,
        role: {
          id: m.role.id,
          name: m.role.name,
          hourlyCost: m.role.hourlyCost,
        },
      }))

      const demandPoints = series.demandPoints.map((dp) => ({
        id: dp.id,
        date: dp.date,
        requiredHours: dp.requiredHours,
      }))

      const params = {
        teamId: options.team,
        seriesId: options.series,
        horizonStart: series.horizonStart,
        horizonEnd: series.horizonEnd,
      }

      // Run simulation
      const result = runSimulation(members, demandPoints, params)

      // Save to database
      await prisma.simulationRun.create({
        data: {
          teamId: options.team,
          seriesId: options.series,
          paramsJson: params as any,
          resultJson: result as any,
        },
      })

      // Output results
      if (options.output === 'json') {
        console.log(JSON.stringify(result, null, 2))
      } else {
        console.log('\n=== Simulation Summary ===')
        console.log(`Total Weeks: ${result.summary.totalWeeks}`)
        console.log(`Average Utilization: ${result.summary.averageUtilization.toFixed(1)}%`)
        console.log(`Weeks in Deficit: ${result.summary.weeksInDeficit}`)
        console.log(`Total Deficit Hours: ${result.summary.totalDeficit.toFixed(1)}`)
        console.log(`Total Surplus Hours: ${result.summary.totalSurplus.toFixed(1)}`)
        console.log(`Total Cost: $${result.summary.totalCost.toFixed(0)}`)
        console.log('\nDeficit Periods:')
        result.periods
          .filter((p) => p.status === 'deficit')
          .forEach((p) => {
            console.log(
              `  ${new Date(p.weekStart).toLocaleDateString()}: ${p.surplus.toFixed(1)}h (${p.utilizationRate.toFixed(1)}% utilization)`
            )
          })
      }

      simulationLogger.info('Simulation completed successfully')
      process.exit(0)
    } catch (error) {
      simulationLogger.error({ error }, 'Simulation failed')
      process.exit(1)
    }
  })
