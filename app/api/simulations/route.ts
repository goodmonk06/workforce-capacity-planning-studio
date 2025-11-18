import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const teamId = searchParams.get('teamId')
    const seriesId = searchParams.get('seriesId')

    const simulations = await prisma.simulationRun.findMany({
      where: {
        ...(teamId && { teamId }),
        ...(seriesId && { seriesId }),
      },
      include: {
        team: true,
        series: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(simulations)
  } catch (error) {
    console.error('Error fetching simulations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch simulations' },
      { status: 500 }
    )
  }
}
