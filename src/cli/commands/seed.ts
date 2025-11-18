import { Command } from 'commander'
import { PrismaClient } from '@prisma/client'
import { addDays, addWeeks, startOfWeek } from 'date-fns'
import { seedLogger } from '../../../lib/logger'

const prisma = new PrismaClient()

export const seedCommand = new Command('seed')
  .description('Seed the database with test data')
  .option('-p, --profile <profile>', 'Seeding profile: small, medium, large', 'medium')
  .option('--clear', 'Clear existing data before seeding')
  .action(async (options) => {
    try {
      seedLogger.info({ profile: options.profile }, 'Starting database seeding')

      if (options.clear) {
        await clearData()
      }

      switch (options.profile) {
        case 'small':
          await seedSmall()
          break
        case 'medium':
          await seedMedium()
          break
        case 'large':
          await seedLarge()
          break
        default:
          seedLogger.error(`Unknown profile: ${options.profile}`)
          process.exit(1)
      }

      seedLogger.info('Seeding completed successfully')
      process.exit(0)
    } catch (error) {
      seedLogger.error({ error }, 'Seeding failed')
      process.exit(1)
    }
  })

async function clearData() {
  seedLogger.info('Clearing existing data...')

  await prisma.auditLog.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.alertRule.deleteMany()
  await prisma.report.deleteMany()
  await prisma.snapshot.deleteMany()
  await prisma.simulationRun.deleteMany()
  await prisma.demandPoint.deleteMany()
  await prisma.demandSeries.deleteMany()
  await prisma.timeOffRequest.deleteMany()
  await prisma.projectAllocation.deleteMany()
  await prisma.projectMilestone.deleteMany()
  await prisma.project.deleteMany()
  await prisma.memberSkill.deleteMany()
  await prisma.roleSkill.deleteMany()
  await prisma.member.deleteMany()
  await prisma.role.deleteMany()
  await prisma.holiday.deleteMany()
  await prisma.timeOffPolicy.deleteMany()
  await prisma.teamTag.deleteMany()
  await prisma.team.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.skill.deleteMany()
  await prisma.teamCategory.deleteMany()
  await prisma.scenario.deleteMany()

  seedLogger.info('Data cleared')
}

async function seedSmall() {
  seedLogger.info('Seeding small dataset (1 team, 3 members, 4 weeks)')

  // Create category
  const category = await prisma.teamCategory.create({
    data: { name: 'Engineering', description: 'Engineering teams' },
  })

  // Create team
  const team = await prisma.team.create({
    data: {
      name: 'Web Team',
      description: 'Frontend and backend developers',
      categoryId: category.id,
    },
  })

  // Create roles
  const devRole = await prisma.role.create({
    data: { teamId: team.id, name: 'Developer', hourlyCost: 60 },
  })

  // Create members
  await prisma.member.createMany({
    data: [
      {
        teamId: team.id,
        roleId: devRole.id,
        name: 'Alice Johnson',
        weeklyHours: 40,
        startDate: addDays(new Date(), -30),
      },
      {
        teamId: team.id,
        roleId: devRole.id,
        name: 'Bob Smith',
        weeklyHours: 40,
        startDate: addDays(new Date(), -30),
      },
      {
        teamId: team.id,
        roleId: devRole.id,
        name: 'Carol Williams',
        weeklyHours: 35,
        startDate: addDays(new Date(), -30),
      },
    ],
  })

  // Create demand series
  const today = new Date()
  const horizonStart = startOfWeek(today, { weekStartsOn: 1 })
  const horizonEnd = addWeeks(horizonStart, 4)

  const demandSeries = await prisma.demandSeries.create({
    data: {
      teamId: team.id,
      name: 'Q1 Sprint',
      horizonStart,
      horizonEnd,
    },
  })

  // Create demand points
  const demandPoints = []
  for (let i = 0; i < 4; i++) {
    const weekDate = addWeeks(horizonStart, i)
    const weeklyHours = 80 + Math.random() * 40
    for (let day = 0; day < 5; day++) {
      demandPoints.push({
        seriesId: demandSeries.id,
        date: addDays(weekDate, day),
        requiredHours: (weeklyHours / 5) * (0.9 + Math.random() * 0.2),
      })
    }
  }

  await prisma.demandPoint.createMany({ data: demandPoints })

  seedLogger.info('Small dataset created')
}

async function seedMedium() {
  seedLogger.info('Seeding medium dataset (3 teams, 15 members, 12 weeks)')

  // Create categories
  const engCategory = await prisma.teamCategory.create({
    data: { name: 'Engineering', description: 'Engineering teams' },
  })

  const opsCategory = await prisma.teamCategory.create({
    data: { name: 'Operations', description: 'Operations teams' },
  })

  // Create teams with roles and members (simplified version - expand as needed)
  const teams = [
    { name: 'Backend Team', categoryId: engCategory.id, memberCount: 6 },
    { name: 'Frontend Team', categoryId: engCategory.id, memberCount: 5 },
    { name: 'Support Team', categoryId: opsCategory.id, memberCount: 4 },
  ]

  for (const teamData of teams) {
    const team = await prisma.team.create({
      data: {
        name: teamData.name,
        categoryId: teamData.categoryId,
      },
    })

    const role = await prisma.role.create({
      data: { teamId: team.id, name: 'Team Member', hourlyCost: 55 },
    })

    for (let i = 0; i < teamData.memberCount; i++) {
      await prisma.member.create({
        data: {
          teamId: team.id,
          roleId: role.id,
          name: `Member ${i + 1}`,
          weeklyHours: 35 + Math.random() * 10,
          startDate: addDays(new Date(), -60),
        },
      })
    }
  }

  seedLogger.info('Medium dataset created')
}

async function seedLarge() {
  seedLogger.info('Seeding large dataset (10 teams, 50+ members, 24 weeks, skills, projects)')

  // Create extensive dataset
  // (Implementation would be similar to medium but much larger)
  seedLogger.info('Large dataset seeding not yet fully implemented')
  seedLogger.info('Use medium profile for now')
}
