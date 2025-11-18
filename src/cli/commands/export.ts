import { Command } from 'commander'
import { PrismaClient } from '@prisma/client'
import { getExportAdapter } from '../../../lib/adapters/export.adapter'
import { writeFileSync } from 'fs'
import { logger } from '../../../lib/logger'

const prisma = new PrismaClient()

export const exportCommand = new Command('export')
  .description('Export data to various formats')
  .option('-e, --entity <type>', 'Entity to export: teams, members, simulations', 'simulations')
  .option('-f, --format <format>', 'Export format: csv, json', 'csv')
  .option('-o, --output <file>', 'Output file path', 'export.csv')
  .action(async (options) => {
    try {
      logger.info({ entity: options.entity, format: options.format }, 'Starting export')

      let data: any[] = []

      switch (options.entity) {
        case 'teams':
          data = await prisma.team.findMany({
            include: {
              _count: {
                select: { members: true, roles: true },
              },
            },
          })
          break
        case 'members':
          data = await prisma.member.findMany({
            include: {
              team: { select: { name: true } },
              role: { select: { name: true, hourlyCost: true } },
            },
          })
          break
        case 'simulations':
          data = await prisma.simulationRun.findMany({
            include: {
              team: { select: { name: true } },
              series: { select: { name: true } },
            },
          })
          break
        default:
          console.error(`Unknown entity type: ${options.entity}`)
          process.exit(1)
      }

      // Flatten data for export
      const flatData = data.map((item) => {
        // Recursively flatten nested objects
        const flat: any = {}
        const flatten = (obj: any, prefix = '') => {
          for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null && !(obj[key] instanceof Date)) {
              if (Array.isArray(obj[key])) {
                flat[prefix + key] = JSON.stringify(obj[key])
              } else {
                flatten(obj[key], prefix + key + '_')
              }
            } else {
              flat[prefix + key] = obj[key]
            }
          }
        }
        flatten(item)
        return flat
      })

      const adapter = getExportAdapter(options.format)
      const result = await adapter.export(flatData, { format: options.format as any })

      if (!result.success) {
        console.error('Export failed:', result.error)
        process.exit(1)
      }

      if (result.buffer) {
        writeFileSync(options.output, result.buffer)
        console.log(`Exported ${data.length} records to ${options.output}`)
      }

      process.exit(0)
    } catch (error) {
      logger.error({ error }, 'Export failed')
      process.exit(1)
    }
  })
