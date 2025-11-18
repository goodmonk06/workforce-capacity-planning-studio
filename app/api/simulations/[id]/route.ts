import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const simulation = await prisma.simulationRun.findUnique({
      where: { id: params.id },
      include: {
        team: true,
        series: {
          include: {
            demandPoints: {
              orderBy: {
                date: 'asc',
              },
            },
          },
        },
      },
    })

    if (!simulation) {
      return NextResponse.json(
        { error: 'Simulation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(simulation)
  } catch (error) {
    console.error('Error fetching simulation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch simulation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.simulationRun.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting simulation:', error)
    return NextResponse.json(
      { error: 'Failed to delete simulation' },
      { status: 500 }
    )
  }
}
