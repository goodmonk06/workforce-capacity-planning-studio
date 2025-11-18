import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runSimulation } from '@/lib/simulation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamId, seriesId } = body

    if (!teamId || !seriesId) {
      return NextResponse.json(
        { error: 'TeamId and seriesId are required' },
        { status: 400 }
      )
    }

    // Fetch team with members and roles
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Fetch demand series with points
    const demandSeries = await prisma.demandSeries.findUnique({
      where: { id: seriesId },
      include: {
        demandPoints: {
          orderBy: {
            date: 'asc',
          },
        },
      },
    })

    if (!demandSeries) {
      return NextResponse.json(
        { error: 'Demand series not found' },
        { status: 404 }
      )
    }

    // Prepare data for simulation
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

    const demandPoints = demandSeries.demandPoints.map((dp) => ({
      id: dp.id,
      date: dp.date,
      requiredHours: dp.requiredHours,
    }))

    const params = {
      teamId,
      seriesId,
      horizonStart: demandSeries.horizonStart,
      horizonEnd: demandSeries.horizonEnd,
    }

    // Run the simulation
    const result = runSimulation(members, demandPoints, params)

    // Store simulation run
    const simulationRun = await prisma.simulationRun.create({
      data: {
        teamId,
        seriesId,
        paramsJson: params as any,
        resultJson: result as any,
      },
      include: {
        team: true,
        series: true,
      },
    })

    return NextResponse.json(simulationRun, { status: 201 })
  } catch (error) {
    console.error('Error running simulation:', error)
    return NextResponse.json(
      { error: 'Failed to run simulation' },
      { status: 500 }
    )
  }
}
