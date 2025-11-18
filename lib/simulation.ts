import { eachWeekOfInterval, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

export interface Member {
  id: string
  name: string
  weeklyHours: number
  startDate: Date
  endDate: Date | null
  role: {
    id: string
    name: string
    hourlyCost: number
  }
}

export interface DemandPoint {
  id: string
  date: Date
  requiredHours: number
}

export interface SimulationParams {
  teamId: string
  seriesId: string
  horizonStart: Date
  horizonEnd: Date
}

export interface PeriodResult {
  weekStart: string
  weekEnd: string
  totalCapacity: number
  totalDemand: number
  surplus: number
  utilizationRate: number
  status: 'surplus' | 'deficit' | 'balanced'
  activeMembers: number
  totalCost: number
}

export interface SimulationResult {
  summary: {
    totalWeeks: number
    averageUtilization: number
    totalDeficit: number
    totalSurplus: number
    weeksInDeficit: number
    weeksInSurplus: number
    totalCost: number
  }
  periods: PeriodResult[]
}

/**
 * Calculates the available capacity for a given week based on active members
 */
function calculateWeeklyCapacity(
  members: Member[],
  weekStart: Date,
  weekEnd: Date
): { capacity: number; activeCount: number; cost: number } {
  let totalCapacity = 0
  let activeCount = 0
  let totalCost = 0

  for (const member of members) {
    const memberStart = new Date(member.startDate)
    const memberEnd = member.endDate ? new Date(member.endDate) : new Date('2099-12-31')

    // Check if member is active during this week
    const isActive =
      memberStart <= weekEnd &&
      memberEnd >= weekStart

    if (isActive) {
      totalCapacity += member.weeklyHours
      activeCount++
      totalCost += member.weeklyHours * member.role.hourlyCost
    }
  }

  return { capacity: totalCapacity, activeCount, cost: totalCost }
}

/**
 * Aggregates demand points for a given week
 */
function aggregateWeeklyDemand(
  demandPoints: DemandPoint[],
  weekStart: Date,
  weekEnd: Date
): number {
  let totalDemand = 0

  for (const point of demandPoints) {
    const pointDate = new Date(point.date)

    if (isWithinInterval(pointDate, { start: weekStart, end: weekEnd })) {
      totalDemand += point.requiredHours
    }
  }

  return totalDemand
}

/**
 * Main simulation function
 * Compares team capacity vs demand over time horizon
 */
export function runSimulation(
  members: Member[],
  demandPoints: DemandPoint[],
  params: SimulationParams
): SimulationResult {
  const { horizonStart, horizonEnd } = params

  // Get all weeks in the simulation period
  const weeks = eachWeekOfInterval(
    { start: new Date(horizonStart), end: new Date(horizonEnd) },
    { weekStartsOn: 1 } // Monday
  )

  const periods: PeriodResult[] = []
  let totalDeficit = 0
  let totalSurplus = 0
  let weeksInDeficit = 0
  let weeksInSurplus = 0
  let totalUtilization = 0
  let totalCost = 0

  for (const weekStart of weeks) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

    // Calculate capacity for this week
    const { capacity, activeCount, cost } = calculateWeeklyCapacity(members, weekStart, weekEnd)

    // Aggregate demand for this week
    const demand = aggregateWeeklyDemand(demandPoints, weekStart, weekEnd)

    // Calculate metrics
    const surplus = capacity - demand
    const utilizationRate = capacity > 0 ? (demand / capacity) * 100 : 0

    let status: 'surplus' | 'deficit' | 'balanced' = 'balanced'
    if (surplus > 0.5) status = 'surplus'
    else if (surplus < -0.5) status = 'deficit'

    if (status === 'deficit') {
      totalDeficit += Math.abs(surplus)
      weeksInDeficit++
    } else if (status === 'surplus') {
      totalSurplus += surplus
      weeksInSurplus++
    }

    totalUtilization += utilizationRate
    totalCost += cost

    periods.push({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalCapacity: capacity,
      totalDemand: demand,
      surplus,
      utilizationRate,
      status,
      activeMembers: activeCount,
      totalCost: cost,
    })
  }

  const totalWeeks = periods.length
  const averageUtilization = totalWeeks > 0 ? totalUtilization / totalWeeks : 0

  return {
    summary: {
      totalWeeks,
      averageUtilization,
      totalDeficit,
      totalSurplus,
      weeksInDeficit,
      weeksInSurplus,
      totalCost,
    },
    periods,
  }
}
