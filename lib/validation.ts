import { z } from 'zod'

// Common schemas
export const idSchema = z.string().cuid()
export const dateSchema = z.string().datetime().or(z.date())
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

// Team schemas
export const createTeamSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
})

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
})

export const teamQuerySchema = z.object({
  includeRoles: z.boolean().optional(),
  includeMembers: z.boolean().optional(),
  includeDemandSeries: z.boolean().optional(),
})

// Role schemas
export const createRoleSchema = z.object({
  teamId: idSchema,
  name: z.string().min(1).max(255),
  hourlyCost: z.number().min(0).max(10000),
  metaJson: z.record(z.any()).optional().nullable(),
})

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  hourlyCost: z.number().min(0).max(10000).optional(),
  metaJson: z.record(z.any()).optional().nullable(),
})

export const roleQuerySchema = z.object({
  teamId: idSchema.optional(),
})

// Member schemas
export const createMemberSchema = z.object({
  teamId: idSchema,
  roleId: idSchema,
  name: z.string().min(1).max(255),
  weeklyHours: z.number().min(0).max(168), // Max hours in a week
  startDate: dateSchema,
  endDate: dateSchema.optional().nullable(),
})

export const updateMemberSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  roleId: idSchema.optional(),
  weeklyHours: z.number().min(0).max(168).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional().nullable(),
})

export const memberQuerySchema = z.object({
  teamId: idSchema.optional(),
  roleId: idSchema.optional(),
  active: z.boolean().optional(), // Filter by currently active members
})

// DemandSeries schemas
export const createDemandSeriesSchema = z.object({
  teamId: idSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional().nullable(),
  horizonStart: dateSchema,
  horizonEnd: dateSchema,
}).refine(
  (data) => new Date(data.horizonEnd) > new Date(data.horizonStart),
  {
    message: 'horizonEnd must be after horizonStart',
    path: ['horizonEnd'],
  }
)

export const updateDemandSeriesSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  horizonStart: dateSchema.optional(),
  horizonEnd: dateSchema.optional(),
})

export const demandSeriesQuerySchema = z.object({
  teamId: idSchema.optional(),
  includePoints: z.boolean().optional(),
})

// DemandPoint schemas
export const createDemandPointSchema = z.object({
  seriesId: idSchema,
  date: dateSchema,
  requiredHours: z.number().min(0).max(1000),
  metaJson: z.record(z.any()).optional().nullable(),
})

export const updateDemandPointSchema = z.object({
  date: dateSchema.optional(),
  requiredHours: z.number().min(0).max(1000).optional(),
  metaJson: z.record(z.any()).optional().nullable(),
})

export const demandPointQuerySchema = z.object({
  seriesId: idSchema.optional(),
  fromDate: dateSchema.optional(),
  toDate: dateSchema.optional(),
})

// Simulation schemas
export const runSimulationSchema = z.object({
  teamId: idSchema,
  seriesId: idSchema,
})

export const simulationQuerySchema = z.object({
  teamId: idSchema.optional(),
  seriesId: idSchema.optional(),
  limit: z.number().int().positive().max(100).default(20),
})

// Bulk operations
export const bulkCreateDemandPointsSchema = z.object({
  seriesId: idSchema,
  points: z.array(
    z.object({
      date: dateSchema,
      requiredHours: z.number().min(0).max(1000),
      metaJson: z.record(z.any()).optional().nullable(),
    })
  ).min(1).max(1000),
})

// Helper to validate and return typed data
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

// Helper for async validation
export async function validateAsync<T>(schema: z.ZodSchema<T>, data: unknown): Promise<T> {
  return schema.parseAsync(data)
}

// Type exports for use in other modules
export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
export type CreateRoleInput = z.infer<typeof createRoleSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
export type CreateMemberInput = z.infer<typeof createMemberSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
export type CreateDemandSeriesInput = z.infer<typeof createDemandSeriesSchema>
export type UpdateDemandSeriesInput = z.infer<typeof updateDemandSeriesSchema>
export type CreateDemandPointInput = z.infer<typeof createDemandPointSchema>
export type UpdateDemandPointInput = z.infer<typeof updateDemandPointSchema>
export type RunSimulationInput = z.infer<typeof runSimulationSchema>
export type BulkCreateDemandPointsInput = z.infer<typeof bulkCreateDemandPointsSchema>
