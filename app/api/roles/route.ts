import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const teamId = searchParams.get('teamId')

    const roles = await prisma.role.findMany({
      where: teamId ? { teamId } : undefined,
      include: {
        team: true,
        members: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamId, name, hourlyCost, metaJson } = body

    if (!teamId || !name) {
      return NextResponse.json(
        { error: 'TeamId and name are required' },
        { status: 400 }
      )
    }

    const role = await prisma.role.create({
      data: {
        teamId,
        name,
        hourlyCost: hourlyCost || 0,
        metaJson,
      },
    })

    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}
