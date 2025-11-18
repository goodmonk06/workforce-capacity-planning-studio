import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const demandPoint = await prisma.demandPoint.findUnique({
      where: { id: params.id },
      include: {
        series: true,
      },
    })

    if (!demandPoint) {
      return NextResponse.json(
        { error: 'Demand point not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(demandPoint)
  } catch (error) {
    console.error('Error fetching demand point:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demand point' },
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
    const { date, requiredHours, metaJson } = body

    const demandPoint = await prisma.demandPoint.update({
      where: { id: params.id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(requiredHours !== undefined && { requiredHours }),
        ...(metaJson !== undefined && { metaJson }),
      },
    })

    return NextResponse.json(demandPoint)
  } catch (error) {
    console.error('Error updating demand point:', error)
    return NextResponse.json(
      { error: 'Failed to update demand point' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.demandPoint.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting demand point:', error)
    return NextResponse.json(
      { error: 'Failed to delete demand point' },
      { status: 500 }
    )
  }
}
