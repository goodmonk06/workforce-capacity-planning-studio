import { Command } from 'commander'
import { PrismaClient } from '@prisma/client'
import { logger } from '../../../lib/logger'

const prisma = new PrismaClient()

export const analyzeCommand = new Command('analyze')
  .description('Quick capacity analysis and insights')
  .option('-t, --team <teamId>', 'Analyze specific team')
  .action(async (options) => {
    try {
      logger.info({ teamId: options.team }, 'Running capacity analysis')

      if (options.team) {
        await analyzeTeam(options.team)
      } else {
        await analyzeAll()
      }

      process.exit(0)
    } catch (error) {
      logger.error({ error }, 'Analysis failed')
      process.exit(1)
    }
  })

async function analyzeTeam(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          role: true,
        },
      },
      roles: {
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
      demandSeries: {
        include: {
          _count: {
            select: { demandPoints: true },
          },
        },
      },
      simulations: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  })

  if (!team) {
    console.error('Team not found')
    return
  }

  console.log(`\n=== Team Analysis: ${team.name} ===\n`)
  console.log(`Total Members: ${team.members.length}`)
  console.log(`Total Roles: ${team.roles.length}`)

  const activeMembers = team.members.filter(
    (m) => !m.endDate || new Date(m.endDate) > new Date()
  )
  console.log(`Active Members: ${activeMembers.length}`)

  const totalCapacity = activeMembers.reduce((sum, m) => sum + m.weeklyHours, 0)
  console.log(`Total Weekly Capacity: ${totalCapacity.toFixed(1)} hours`)

  const avgCost = team.members.length > 0
    ? team.members.reduce((sum, m) => sum + m.role.hourlyCost, 0) / team.members.length
    : 0
  console.log(`Average Hourly Cost: $${avgCost.toFixed(2)}`)

  console.log(`\nDemand Series: ${team.demandSeries.length}`)

  if (team.simulations.length > 0) {
    const latestSim = team.simulations[0]
    const result = latestSim.resultJson as any

    if (result && result.summary) {
      console.log('\nLatest Simulation:')
      console.log(`  Average Utilization: ${result.summary.averageUtilization.toFixed(1)}%`)
      console.log(`  Weeks in Deficit: ${result.summary.weeksInDeficit}`)
      console.log(`  Total Deficit: ${result.summary.totalDeficit.toFixed(1)} hours`)
    }
  }

  console.log('\nRole Breakdown:')
  team.roles.forEach((role) => {
    console.log(`  ${role.name}: ${role._count.members} members @ $${role.hourlyCost}/hr`)
  })
}

async function analyzeAll() {
  const teams = await prisma.team.findMany({
    include: {
      _count: {
        select: { members: true, simulations: true },
      },
    },
  })

  console.log('\n=== Overall Capacity Analysis ===\n')
  console.log(`Total Teams: ${teams.length}`)

  const totalMembers = teams.reduce((sum, t) => sum + t._count.members, 0)
  console.log(`Total Members: ${totalMembers}`)

  const totalSimulations = teams.reduce((sum, t) => sum + t._count.simulations, 0)
  console.log(`Total Simulations: ${totalSimulations}`)

  console.log('\nTeam Summary:')
  teams.forEach((team) => {
    console.log(`  ${team.name}: ${team._count.members} members, ${team._count.simulations} simulations`)
  })
}
