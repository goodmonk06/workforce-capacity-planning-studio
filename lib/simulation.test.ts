import { describe, it, expect } from 'vitest'
import { runSimulation, type Member, type DemandPoint, type SimulationParams } from './simulation'
import { addDays, addWeeks, startOfWeek } from 'date-fns'

describe('Simulation Engine', () => {
  const today = new Date('2025-01-06') // Monday
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const horizonEnd = addWeeks(weekStart, 4)

  const createMember = (overrides: Partial<Member> = {}): Member => ({
    id: 'member-1',
    name: 'Test Member',
    weeklyHours: 40,
    startDate: addDays(weekStart, -30),
    endDate: null,
    role: {
      id: 'role-1',
      name: 'Developer',
      hourlyCost: 50,
    },
    ...overrides,
  })

  const createDemandPoint = (date: Date, hours: number): DemandPoint => ({
    id: `demand-${date.toISOString()}`,
    date,
    requiredHours: hours,
  })

  describe('Basic simulation', () => {
    it('should calculate capacity correctly for a single member', () => {
      const members = [createMember()]
      const demandPoints: DemandPoint[] = []
      const params: SimulationParams = {
        teamId: 'team-1',
        seriesId: 'series-1',
        horizonStart: weekStart,
        horizonEnd,
      }

      const result = runSimulation(members, demandPoints, params)

      expect(result.periods).toHaveLength(4)
      expect(result.periods[0].totalCapacity).toBe(40)
      expect(result.periods[0].totalDemand).toBe(0)
      expect(result.periods[0].surplus).toBe(40)
      expect(result.periods[0].status).toBe('surplus')
      expect(result.periods[0].activeMembers).toBe(1)
    })

    it('should calculate capacity for multiple members', () => {
      const members = [
        createMember({ id: 'member-1', weeklyHours: 40 }),
        createMember({ id: 'member-2', weeklyHours: 30 }),
        createMember({ id: 'member-3', weeklyHours: 35 }),
      ]
      const demandPoints: DemandPoint[] = []
      const params: SimulationParams = {
        teamId: 'team-1',
        seriesId: 'series-1',
        horizonStart: weekStart,
        horizonEnd,
      }

      const result = runSimulation(members, demandPoints, params)

      expect(result.periods[0].totalCapacity).toBe(105) // 40 + 30 + 35
      expect(result.periods[0].activeMembers).toBe(3)
    })

    it('should aggregate demand points by week', () => {
      const members = [createMember({ weeklyHours: 40 })]
      const demandPoints = [
        createDemandPoint(addDays(weekStart, 0), 10), // Monday
        createDemandPoint(addDays(weekStart, 1), 8),  // Tuesday
        createDemandPoint(addDays(weekStart, 2), 9),  // Wednesday
        createDemandPoint(addDays(weekStart, 3), 7),  // Thursday
        createDemandPoint(addDays(weekStart, 4), 6),  // Friday
      ]
      const params: SimulationParams = {
        teamId: 'team-1',
        seriesId: 'series-1',
        horizonStart: weekStart,
        horizonEnd,
      }

      const result = runSimulation(members, demandPoints, params)

      expect(result.periods[0].totalDemand).toBe(40) // 10 + 8 + 9 + 7 + 6
      expect(result.periods[0].utilizationRate).toBe(100)
      expect(result.periods[0].status).toBe('balanced')
    })
  })

  describe('Member availability', () => {
    it('should only count active members in capacity', () => {
      const members = [
        createMember({
          id: 'member-1',
          startDate: weekStart,
          endDate: null,
          weeklyHours: 40,
        }),
        createMember({
          id: 'member-2',
          startDate: addWeeks(weekStart, 2), // Starts in week 3
          endDate: null,
          weeklyHours: 40,
        }),
      ]
      const demandPoints: DemandPoint[] = []
      const params: SimulationParams = {
        teamId: 'team-1',
        seriesId: 'series-1',
        horizonStart: weekStart,
        horizonEnd,
      }

      const result = runSimulation(members, demandPoints, params)

      // Week 1 & 2: only member-1
      expect(result.periods[0].totalCapacity).toBe(40)
      expect(result.periods[0].activeMembers).toBe(1)
      expect(result.periods[1].totalCapacity).toBe(40)
      expect(result.periods[1].activeMembers).toBe(1)

      // Week 3 & 4: both members
      expect(result.periods[2].totalCapacity).toBe(80)
      expect(result.periods[2].activeMembers).toBe(2)
      expect(result.periods[3].totalCapacity).toBe(80)
      expect(result.periods[3].activeMembers).toBe(2)
    })

    it('should handle members with end dates', () => {
      const members = [
        createMember({
          id: 'member-1',
          startDate: weekStart,
          endDate: addWeeks(weekStart, 2), // Ends after week 2
          weeklyHours: 40,
        }),
      ]
      const demandPoints: DemandPoint[] = []
      const params: SimulationParams = {
        teamId: 'team-1',
        seriesId: 'series-1',
        horizonStart: weekStart,
        horizonEnd,
      }

      const result = runSimulation(members, demandPoints, params)

      // Week 1 & 2: member is active
      expect(result.periods[0].totalCapacity).toBe(40)
      expect(result.periods[1].totalCapacity).toBe(40)

      // Week 3 & 4: member has left
      expect(result.periods[2].totalCapacity).toBe(0)
      expect(result.periods[2].activeMembers).toBe(0)
      expect(result.periods[3].totalCapacity).toBe(0)
    })
  })

  describe('Deficit and surplus detection', () => {
    it('should detect capacity deficit', () => {
      const members = [createMember({ weeklyHours: 40 })]
      const demandPoints = [
        createDemandPoint(addDays(weekStart, 0), 15),
        createDemandPoint(addDays(weekStart, 1), 15),
        createDemandPoint(addDays(weekStart, 2), 15),
        createDemandPoint(addDays(weekStart, 3), 15),
      ]
      const params: SimulationParams = {
        teamId: 'team-1',
        seriesId: 'series-1',
        horizonStart: weekStart,
        horizonEnd,
      }

      const result = runSimulation(members, demandPoints, params)

      expect(result.periods[0].totalDemand).toBe(60)
      expect(result.periods[0].surplus).toBe(-20)
      expect(result.periods[0].status).toBe('deficit')
      expect(result.periods[0].utilizationRate).toBe(150)
      expect(result.summary.weeksInDeficit).toBe(1)
      expect(result.summary.totalDeficit).toBe(20)
    })

    it('should detect capacity surplus', () => {
      const members = [createMember({ weeklyHours: 40 })]
      const demandPoints = [
        createDemandPoint(addDays(weekStart, 0), 5),
        createDemandPoint(addDays(weekStart, 1), 4),
      ]
      const params: SimulationParams = {
        teamId: 'team-1',
        seriesId: 'series-1',
        horizonStart: weekStart,
        horizonEnd,
      }

      const result = runSimulation(members, demandPoints, params)

      expect(result.periods[0].totalDemand).toBe(9)
      expect(result.periods[0].surplus).toBe(31)
      expect(result.periods[0].status).toBe('surplus')
      expect(result.summary.weeksInSurplus).toBe(1)
      expect(result.summary.totalSurplus).toBeGreaterThan(31)
    })
  })

  describe('Cost calculation', () => {
    it('should calculate weekly cost correctly', () => {
      const members = [
        createMember({
          weeklyHours: 40,
          role: { id: 'role-1', name: 'Senior Dev', hourlyCost: 75 },
        }),
        createMember({
          weeklyHours: 30,
          role: { id: 'role-2', name: 'Junior Dev', hourlyCost: 35 },
        }),
      ]
      const demandPoints: DemandPoint[] = []
      const params: SimulationParams = {
        teamId: 'team-1',
        seriesId: 'series-1',
        horizonStart: weekStart,
        horizonEnd,
      }

      const result = runSimulation(members, demandPoints, params)

      // Week cost = (40 * 75) + (30 * 35) = 3000 + 1050 = 4050
      expect(result.periods[0].totalCost).toBe(4050)
      expect(result.summary.totalCost).toBe(4050 * 4) // 4 weeks
    })
  })

  describe('Summary metrics', () => {
    it('should calculate average utilization correctly', () => {
      const members = [createMember({ weeklyHours: 40 })]
      const demandPoints = [
        // Week 1: 50% utilization
        createDemandPoint(addDays(weekStart, 0), 20),
        // Week 2: 100% utilization
        createDemandPoint(addDays(weekStart, 7), 40),
        // Week 3: 75% utilization
        createDemandPoint(addDays(weekStart, 14), 30),
        // Week 4: 0% utilization
      ]
      const params: SimulationParams = {
        teamId: 'team-1',
        seriesId: 'series-1',
        horizonStart: weekStart,
        horizonEnd,
      }

      const result = runSimulation(members, demandPoints, params)

      // Average = (50 + 100 + 75 + 0) / 4 = 56.25
      expect(result.summary.averageUtilization).toBeCloseTo(56.25, 1)
      expect(result.summary.totalWeeks).toBe(4)
    })
  })

  describe('Edge cases', () => {
    it('should handle zero capacity gracefully', () => {
      const members: Member[] = [] // No members
      const demandPoints = [createDemandPoint(weekStart, 40)]
      const params: SimulationParams = {
        teamId: 'team-1',
        seriesId: 'series-1',
        horizonStart: weekStart,
        horizonEnd,
      }

      const result = runSimulation(members, demandPoints, params)

      expect(result.periods[0].totalCapacity).toBe(0)
      expect(result.periods[0].utilizationRate).toBe(0) // Avoid division by zero
      expect(result.periods[0].status).toBe('deficit')
    })

    it('should handle empty demand points', () => {
      const members = [createMember({ weeklyHours: 40 })]
      const demandPoints: DemandPoint[] = []
      const params: SimulationParams = {
        teamId: 'team-1',
        seriesId: 'series-1',
        horizonStart: weekStart,
        horizonEnd,
      }

      const result = runSimulation(members, demandPoints, params)

      expect(result.periods.every((p) => p.totalDemand === 0)).toBe(true)
      expect(result.periods.every((p) => p.status === 'surplus')).toBe(true)
      expect(result.summary.totalDeficit).toBe(0)
    })
  })
})
