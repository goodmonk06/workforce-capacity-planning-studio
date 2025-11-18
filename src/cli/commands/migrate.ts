import { Command } from 'commander'
import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '../../../lib/logger'

const execAsync = promisify(exec)

export const migrateCommand = new Command('migrate')
  .description('Database migration helpers')
  .option('--dev', 'Run development migrations')
  .option('--deploy', 'Deploy migrations to production')
  .option('--reset', 'Reset database (WARNING: destroys all data)')
  .option('--status', 'Show migration status')
  .action(async (options) => {
    try {
      if (options.dev) {
        logger.info('Running development migrations')
        await execAsync('npx prisma migrate dev')
        logger.info('Migrations completed')
      } else if (options.deploy) {
        logger.info('Deploying migrations')
        await execAsync('npx prisma migrate deploy')
        logger.info('Migrations deployed')
      } else if (options.reset) {
        logger.warn('WARNING: Resetting database - all data will be lost')
        await execAsync('npx prisma migrate reset --force')
        logger.info('Database reset complete')
      } else if (options.status) {
        const { stdout } = await execAsync('npx prisma migrate status')
        console.log(stdout)
      } else {
        console.log('Please specify an option: --dev, --deploy, --reset, or --status')
      }

      process.exit(0)
    } catch (error) {
      logger.error({ error }, 'Migration command failed')
      process.exit(1)
    }
  })
