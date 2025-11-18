import { PrismaClient } from '@prisma/client'
import { addDays, addWeeks, startOfWeek } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean up existing data
  await prisma.simulationRun.deleteMany()
  await prisma.demandPoint.deleteMany()
  await prisma.demandSeries.deleteMany()
  await prisma.member.deleteMany()
  await prisma.role.deleteMany()
  await prisma.team.deleteMany()

  // Create a demo team
  const team = await prisma.team.create({
    data: {
      name: 'Engineering Team',
      description: 'Software development team working on product features',
    },
  })
  console.log('✓ Created team:', team.name)

  // Create roles
  const seniorDev = await prisma.role.create({
    data: {
      teamId: team.id,
      name: 'Senior Developer',
      hourlyCost: 75,
    },
  })

  const midDev = await prisma.role.create({
    data: {
      teamId: team.id,
      name: 'Mid-Level Developer',
      hourlyCost: 55,
    },
  })

  const juniorDev = await prisma.role.create({
    data: {
      teamId: team.id,
      name: 'Junior Developer',
      hourlyCost: 35,
    },
  })

  const designer = await prisma.role.create({
    data: {
      teamId: team.id,
      name: 'UX Designer',
      hourlyCost: 65,
    },
  })

  console.log('✓ Created 4 roles')

  // Create team members
  const today = new Date()
  const threeMonthsAgo = addDays(today, -90)
  const twoMonthsFromNow = addDays(today, 60)

  await prisma.member.createMany({
    data: [
      {
        teamId: team.id,
        roleId: seniorDev.id,
        name: 'Alice Johnson',
        weeklyHours: 40,
        startDate: threeMonthsAgo,
        endDate: null,
      },
      {
        teamId: team.id,
        roleId: seniorDev.id,
        name: 'Bob Smith',
        weeklyHours: 40,
        startDate: threeMonthsAgo,
        endDate: null,
      },
      {
        teamId: team.id,
        roleId: midDev.id,
        name: 'Carol Williams',
        weeklyHours: 40,
        startDate: threeMonthsAgo,
        endDate: null,
      },
      {
        teamId: team.id,
        roleId: midDev.id,
        name: 'David Brown',
        weeklyHours: 35,
        startDate: threeMonthsAgo,
        endDate: null,
      },
      {
        teamId: team.id,
        roleId: juniorDev.id,
        name: 'Emma Davis',
        weeklyHours: 40,
        startDate: addDays(today, -30),
        endDate: null,
      },
      {
        teamId: team.id,
        roleId: designer.id,
        name: 'Frank Miller',
        weeklyHours: 30,
        startDate: threeMonthsAgo,
        endDate: null,
      },
    ],
  })

  console.log('✓ Created 6 team members')

  // Create demand series for Q1 2025
  const horizonStart = startOfWeek(today, { weekStartsOn: 1 })
  const horizonEnd = addWeeks(horizonStart, 12)

  const demandSeries = await prisma.demandSeries.create({
    data: {
      teamId: team.id,
      name: 'Q1 2025 Product Roadmap',
      description: 'Projected workload for new features and maintenance',
      horizonStart,
      horizonEnd,
    },
  })

  console.log('✓ Created demand series:', demandSeries.name)

  // Create demand points with realistic variation
  const demandPoints = []
  for (let i = 0; i < 12; i++) {
    const weekDate = addWeeks(horizonStart, i)

    // Simulate realistic demand pattern
    // Week 1-2: Ramp up (120-150 hours/week)
    // Week 3-6: Peak (180-220 hours/week)
    // Week 7-9: Moderate (140-170 hours/week)
    // Week 10-12: Wind down (100-130 hours/week)

    let baseHours = 150
    if (i < 2) {
      baseHours = 120 + Math.random() * 30
    } else if (i >= 2 && i < 6) {
      baseHours = 180 + Math.random() * 40
    } else if (i >= 6 && i < 9) {
      baseHours = 140 + Math.random() * 30
    } else {
      baseHours = 100 + Math.random() * 30
    }

    // Add some daily variation within the week
    for (let day = 0; day < 5; day++) {
      const dayDate = addDays(weekDate, day)
      const dailyHours = (baseHours / 5) * (0.8 + Math.random() * 0.4)

      demandPoints.push({
        seriesId: demandSeries.id,
        date: dayDate,
        requiredHours: Math.round(dailyHours * 10) / 10,
      })
    }
  }

  await prisma.demandPoint.createMany({
    data: demandPoints,
  })

  console.log('✓ Created', demandPoints.length, 'demand points')

  // Create a second team for variety
  const careTeam = await prisma.team.create({
    data: {
      name: 'Customer Care Team',
      description: 'Customer support and success team',
    },
  })

  const supportAgent = await prisma.role.create({
    data: {
      teamId: careTeam.id,
      name: 'Support Agent',
      hourlyCost: 30,
    },
  })

  const seniorAgent = await prisma.role.create({
    data: {
      teamId: careTeam.id,
      name: 'Senior Support Agent',
      hourlyCost: 45,
    },
  })

  await prisma.member.createMany({
    data: [
      {
        teamId: careTeam.id,
        roleId: seniorAgent.id,
        name: 'Grace Lee',
        weeklyHours: 40,
        startDate: threeMonthsAgo,
        endDate: null,
      },
      {
        teamId: careTeam.id,
        roleId: supportAgent.id,
        name: 'Henry Chen',
        weeklyHours: 40,
        startDate: threeMonthsAgo,
        endDate: null,
      },
      {
        teamId: careTeam.id,
        roleId: supportAgent.id,
        name: 'Iris Martinez',
        weeklyHours: 40,
        startDate: addDays(today, -45),
        endDate: null,
      },
    ],
  })

  console.log('✓ Created second team:', careTeam.name)

  // Create demand series for care team
  const careDemandSeries = await prisma.demandSeries.create({
    data: {
      teamId: careTeam.id,
      name: 'Q1 2025 Support Volume',
      description: 'Projected support ticket volume',
      horizonStart,
      horizonEnd,
    },
  })

  // Create lower, steadier demand for care team (60-80 hours/week)
  const careDemandPoints = []
  for (let i = 0; i < 12; i++) {
    const weekDate = addWeeks(horizonStart, i)
    const weeklyHours = 60 + Math.random() * 20

    for (let day = 0; day < 5; day++) {
      const dayDate = addDays(weekDate, day)
      const dailyHours = (weeklyHours / 5) * (0.9 + Math.random() * 0.2)

      careDemandPoints.push({
        seriesId: careDemandSeries.id,
        date: dayDate,
        requiredHours: Math.round(dailyHours * 10) / 10,
      })
    }
  }

  await prisma.demandPoint.createMany({
    data: careDemandPoints,
  })

  console.log('✓ Created demand series for care team')

  console.log('✅ Seeding completed successfully!')
  console.log('')
  console.log('Summary:')
  console.log('- 2 Teams created')
  console.log('- 6 Roles created')
  console.log('- 9 Members created')
  console.log('- 2 Demand series created')
  console.log('- ' + (demandPoints.length + careDemandPoints.length) + ' Demand points created')
  console.log('')
  console.log('You can now:')
  console.log('1. View teams at /teams')
  console.log('2. View demand series at /demand')
  console.log('3. Run simulations at /simulations')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
