import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { apiLogger } from './logger'
import { ApiMetrics } from './metrics'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, id ? `${resource} with id ${id} not found` : `${resource} not found`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT')
    this.name = 'ConflictError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

interface ErrorResponse {
  error: {
    message: string
    code?: string
    details?: any
  }
}

export function handleApiError(error: unknown, context?: string): NextResponse<ErrorResponse> {
  // Log error
  apiLogger.error({ error, context }, 'API error occurred')

  // Zod validation error
  if (error instanceof ZodError) {
    ApiMetrics.recordError('unknown', 'unknown', 'validation_error')
    return NextResponse.json(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
      },
      { status: 400 }
    )
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    ApiMetrics.recordError('unknown', 'unknown', 'database_error')

    // Unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          error: {
            message: 'A record with this value already exists',
            code: 'CONFLICT',
            details: { fields: error.meta?.target },
          },
        },
        { status: 409 }
      )
    }

    // Foreign key constraint violation
    if (error.code === 'P2003') {
      return NextResponse.json(
        {
          error: {
            message: 'Related record not found',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      )
    }

    // Record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          error: {
            message: 'Record not found',
            code: 'NOT_FOUND',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: {
          message: 'Database operation failed',
          code: 'DATABASE_ERROR',
        },
      },
      { status: 500 }
    )
  }

  // Custom AppError
  if (error instanceof AppError) {
    ApiMetrics.recordError('unknown', 'unknown', error.code || 'app_error')
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
        },
      },
      { status: error.statusCode }
    )
  }

  // Generic error
  ApiMetrics.recordError('unknown', 'unknown', 'internal_error')
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'

  return NextResponse.json(
    {
      error: {
        message,
        code: 'INTERNAL_ERROR',
      },
    },
    { status: 500 }
  )
}

// Helper to wrap async route handlers with error handling
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
): (...args: T) => Promise<R | NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
