import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const demandSeries = await prisma.demandSeries.findUnique({
      where: { id: params.id },
      include: {
        team: true,
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

    return NextResponse.json(demandSeries)
  } catch (error) {
    console.error('Error fetching demand series:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demand series' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, description, horizonStart, horizonEnd } = body

    const demandSeries = await prisma.demandSeries.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(horizonStart && { horizonStart: new Date(horizonStart) }),
        ...(horizonEnd && { horizonEnd: new Date(horizonEnd) }),
      },
    })

    return NextResponse.json(demandSeries)
  } catch (error) {
    console.error('Error updating demand series:', error)
    return NextResponse.json(
      { error: 'Failed to update demand series' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.demandSeries.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting demand series:', error)
    return NextResponse.json(
      { error: 'Failed to delete demand series' },
      { status: 500 }
    )
  }
}
