import { logger } from './logger'

const metricsLogger = logger.child({ context: 'metrics' })

interface MetricLabels {
  [key: string]: string | number
}

// In-memory metrics store for development
const metrics = new Map<string, number>()

export function recordCounter(name: string, labels: MetricLabels = {}, value: number = 1) {
  const key = `${name}:${JSON.stringify(labels)}`
  const current = metrics.get(key) || 0
  metrics.set(key, current + value)

  metricsLogger.debug({ metric: name, labels, value, total: current + value }, 'Counter recorded')
}

export function recordGauge(name: string, labels: MetricLabels = {}, value: number) {
  const key = `${name}:${JSON.stringify(labels)}`
  metrics.set(key, value)

  metricsLogger.debug({ metric: name, labels, value }, 'Gauge recorded')
}

export function recordHistogram(name: string, labels: MetricLabels = {}, value: number) {
  // For now, just log - in production this would go to Prometheus/DataDog/etc
  metricsLogger.debug({ metric: name, labels, value }, 'Histogram recorded')
}

export function getMetrics(): Record<string, number> {
  return Object.fromEntries(metrics)
}

export function clearMetrics() {
  metrics.clear()
}

// Domain-specific metric helpers
export const SimulationMetrics = {
  recordRun: (teamId: string, seriesId: string, durationMs: number) => {
    recordCounter('simulation.runs', { teamId, seriesId })
    recordHistogram('simulation.duration_ms', { teamId }, durationMs)
  },
  recordError: (teamId: string, error: string) => {
    recordCounter('simulation.errors', { teamId, error })
  },
}

export const ApiMetrics = {
  recordRequest: (method: string, path: string, status: number, durationMs: number) => {
    recordCounter('api.requests', { method, path, status })
    recordHistogram('api.duration_ms', { method, path }, durationMs)
  },
  recordError: (method: string, path: string, error: string) => {
    recordCounter('api.errors', { method, path, error })
  },
}
