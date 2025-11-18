import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const seriesId = searchParams.get('seriesId')

    const demandPoints = await prisma.demandPoint.findMany({
      where: seriesId ? { seriesId } : undefined,
      include: {
        series: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    return NextResponse.json(demandPoints)
  } catch (error) {
    console.error('Error fetching demand points:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demand points' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { seriesId, date, requiredHours, metaJson } = body

    if (!seriesId || !date || requiredHours === undefined) {
      return NextResponse.json(
        { error: 'SeriesId, date, and requiredHours are required' },
        { status: 400 }
      )
    }

    const demandPoint = await prisma.demandPoint.create({
      data: {
        seriesId,
        date: new Date(date),
        requiredHours,
        metaJson,
      },
    })

    return NextResponse.json(demandPoint, { status: 201 })
  } catch (error) {
    console.error('Error creating demand point:', error)
    return NextResponse.json(
      { error: 'Failed to create demand point' },
      { status: 500 }
    )
  }
}
