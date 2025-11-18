import { describe, it, expect } from 'vitest'
import {
  createTeamSchema,
  createMemberSchema,
  createDemandSeriesSchema,
  createRoleSchema,
  runSimulationSchema,
} from './validation'
import { ZodError } from 'zod'

describe('Validation Schemas', () => {
  describe('Team validation', () => {
    it('should validate valid team data', () => {
      const validData = {
        name: 'Engineering Team',
        description: 'Our main engineering team',
      }

      expect(() => createTeamSchema.parse(validData)).not.toThrow()
    })

    it('should reject empty team name', () => {
      const invalidData = {
        name: '',
        description: 'Description',
      }

      expect(() => createTeamSchema.parse(invalidData)).toThrow(ZodError)
    })

    it('should reject too long team name', () => {
      const invalidData = {
        name: 'a'.repeat(256),
        description: 'Description',
      }

      expect(() => createTeamSchema.parse(invalidData)).toThrow(ZodError)
    })

    it('should allow nullable description', () => {
      const validData = {
        name: 'Team',
        description: null,
      }

      expect(() => createTeamSchema.parse(validData)).not.toThrow()
    })
  })

  describe('Role validation', () => {
    it('should validate valid role data', () => {
      const validData = {
        teamId: 'cludj7r5g0000s60814vdmfky',
        name: 'Senior Developer',
        hourlyCost: 75.5,
      }

      expect(() => createRoleSchema.parse(validData)).not.toThrow()
    })

    it('should reject negative hourly cost', () => {
      const invalidData = {
        teamId: 'cludj7r5g0000s60814vdmfky',
        name: 'Developer',
        hourlyCost: -10,
      }

      expect(() => createRoleSchema.parse(invalidData)).toThrow(ZodError)
    })

    it('should reject excessive hourly cost', () => {
      const invalidData = {
        teamId: 'cludj7r5g0000s60814vdmfky',
        name: 'Developer',
        hourlyCost: 20000,
      }

      expect(() => createRoleSchema.parse(invalidData)).toThrow(ZodError)
    })
  })

  describe('Member validation', () => {
    it('should validate valid member data', () => {
      const validData = {
        teamId: 'cludj7r5g0000s60814vdmfky',
        roleId: 'cludj7r5g0000s60814vdmfkz',
        name: 'John Doe',
        weeklyHours: 40,
        startDate: '2025-01-01T00:00:00Z',
        endDate: null,
      }

      expect(() => createMemberSchema.parse(validData)).not.toThrow()
    })

    it('should reject invalid weekly hours', () => {
      const invalidData = {
        teamId: 'cludj7r5g0000s60814vdmfky',
        roleId: 'cludj7r5g0000s60814vdmfkz',
        name: 'John Doe',
        weeklyHours: 200, // More than 168 hours in a week
        startDate: '2025-01-01T00:00:00Z',
      }

      expect(() => createMemberSchema.parse(invalidData)).toThrow(ZodError)
    })

    it('should reject negative weekly hours', () => {
      const invalidData = {
        teamId: 'cludj7r5g0000s60814vdmfky',
        roleId: 'cludj7r5g0000s60814vdmfkz',
        name: 'John Doe',
        weeklyHours: -5,
        startDate: '2025-01-01T00:00:00Z',
      }

      expect(() => createMemberSchema.parse(invalidData)).toThrow(ZodError)
    })

    it('should accept Date objects for dates', () => {
      const validData = {
        teamId: 'cludj7r5g0000s60814vdmfky',
        roleId: 'cludj7r5g0000s60814vdmfkz',
        name: 'John Doe',
        weeklyHours: 40,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      }

      expect(() => createMemberSchema.parse(validData)).not.toThrow()
    })
  })

  describe('DemandSeries validation', () => {
    it('should validate valid demand series data', () => {
      const validData = {
        teamId: 'cludj7r5g0000s60814vdmfky',
        name: 'Q1 2025 Roadmap',
        description: 'Our Q1 projects',
        horizonStart: '2025-01-01T00:00:00Z',
        horizonEnd: '2025-03-31T23:59:59Z',
      }

      expect(() => createDemandSeriesSchema.parse(validData)).not.toThrow()
    })

    it('should reject horizonEnd before horizonStart', () => {
      const invalidData = {
        teamId: 'cludj7r5g0000s60814vdmfky',
        name: 'Q1 2025 Roadmap',
        description: 'Our Q1 projects',
        horizonStart: '2025-03-31T00:00:00Z',
        horizonEnd: '2025-01-01T00:00:00Z', // Before start!
      }

      expect(() => createDemandSeriesSchema.parse(invalidData)).toThrow(ZodError)
    })
  })

  describe('Simulation validation', () => {
    it('should validate valid simulation request', () => {
      const validData = {
        teamId: 'cludj7r5g0000s60814vdmfky',
        seriesId: 'cludj7r5g0000s60814vdmfkz',
      }

      expect(() => runSimulationSchema.parse(validData)).not.toThrow()
    })

    it('should reject missing teamId', () => {
      const invalidData = {
        seriesId: 'cludj7r5g0000s60814vdmfkz',
      }

      expect(() => runSimulationSchema.parse(invalidData)).toThrow(ZodError)
    })

    it('should reject invalid cuid format', () => {
      const invalidData = {
        teamId: 'not-a-cuid',
        seriesId: 'also-not-a-cuid',
      }

      expect(() => runSimulationSchema.parse(invalidData)).toThrow(ZodError)
    })
  })
})
