import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const teamId = searchParams.get('teamId')

    const members = await prisma.member.findMany({
      where: teamId ? { teamId } : undefined,
      include: {
        team: true,
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamId, roleId, name, weeklyHours, startDate, endDate } = body

    if (!teamId || !roleId || !name || !startDate) {
      return NextResponse.json(
        { error: 'TeamId, roleId, name, and startDate are required' },
        { status: 400 }
      )
    }

    const member = await prisma.member.create({
      data: {
        teamId,
        roleId,
        name,
        weeklyHours: weeklyHours || 40,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error creating member:', error)
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    )
  }
}
