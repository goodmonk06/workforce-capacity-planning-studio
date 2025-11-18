import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const teamId = searchParams.get('teamId')

    const demandSeries = await prisma.demandSeries.findMany({
      where: teamId ? { teamId } : undefined,
      include: {
        team: true,
        demandPoints: {
          orderBy: {
            date: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(demandSeries)
  } catch (error) {
    console.error('Error fetching demand series:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demand series' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamId, name, description, horizonStart, horizonEnd } = body

    if (!teamId || !name || !horizonStart || !horizonEnd) {
      return NextResponse.json(
        { error: 'TeamId, name, horizonStart, and horizonEnd are required' },
        { status: 400 }
      )
    }

    const demandSeries = await prisma.demandSeries.create({
      data: {
        teamId,
        name,
        description,
        horizonStart: new Date(horizonStart),
        horizonEnd: new Date(horizonEnd),
      },
    })

    return NextResponse.json(demandSeries, { status: 201 })
  } catch (error) {
    console.error('Error creating demand series:', error)
    return NextResponse.json(
      { error: 'Failed to create demand series' },
      { status: 500 }
    )
  }
}
