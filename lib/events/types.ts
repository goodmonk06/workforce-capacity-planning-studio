export interface DomainEvent<T = any> {
  id: string
  type: string
  timestamp: Date
  payload: T
  metadata?: Record<string, any>
}

// Team events
export interface TeamCreatedPayload {
  teamId: string
  name: string
  categoryId?: string
}

export interface TeamUpdatedPayload {
  teamId: string
  changes: Record<string, any>
}

export interface TeamDeletedPayload {
  teamId: string
  name: string
}

// Member events
export interface MemberAddedPayload {
  memberId: string
  teamId: string
  name: string
  roleId: string
}

export interface MemberRemovedPayload {
  memberId: string
  teamId: string
  name: string
}

// Simulation events
export interface SimulationStartedPayload {
  simulationId: string
  teamId: string
  seriesId: string
  scenarioId?: string
}

export interface SimulationCompletedPayload {
  simulationId: string
  teamId: string
  seriesId: string
  summary: {
    averageUtilization: number
    weeksInDeficit: number
    totalDeficit: number
  }
}

export interface SimulationFailedPayload {
  simulationId: string
  teamId: string
  seriesId: string
  error: string
}

// Capacity events
export interface CapacityDeficitDetectedPayload {
  simulationId: string
  teamId: string
  weekStart: string
  deficit: number
  utilizationRate: number
}

export interface CapacitySurplusDetectedPayload {
  simulationId: string
  teamId: string
  weekStart: string
  surplus: number
  utilizationRate: number
}

// Alert events
export interface AlertTriggeredPayload {
  alertId: string
  simulationId: string
  ruleId?: string
  severity: string
  title: string
  message: string
}

export interface AlertAcknowledgedPayload {
  alertId: string
  acknowledgedBy: string
}

export interface AlertResolvedPayload {
  alertId: string
  resolvedBy: string
}

// Project events
export interface ProjectCreatedPayload {
  projectId: string
  teamId: string
  name: string
}

export interface ProjectMilestoneReachedPayload {
  milestoneId: string
  projectId: string
  name: string
  dueDate: string
}

// Time-off events
export interface TimeOffRequestedPayload {
  requestId: string
  memberId: string
  type: string
  startDate: string
  endDate: string
}

export interface TimeOffApprovedPayload {
  requestId: string
  memberId: string
  approvedBy: string
}

export interface TimeOffRejectedPayload {
  requestId: string
  memberId: string
  rejectedBy: string
  reason?: string
}

// Event type registry
export enum EventTypes {
  TEAM_CREATED = 'team.created',
  TEAM_UPDATED = 'team.updated',
  TEAM_DELETED = 'team.deleted',

  MEMBER_ADDED = 'member.added',
  MEMBER_REMOVED = 'member.removed',

  SIMULATION_STARTED = 'simulation.started',
  SIMULATION_COMPLETED = 'simulation.completed',
  SIMULATION_FAILED = 'simulation.failed',

  CAPACITY_DEFICIT_DETECTED = 'capacity.deficit_detected',
  CAPACITY_SURPLUS_DETECTED = 'capacity.surplus_detected',

  ALERT_TRIGGERED = 'alert.triggered',
  ALERT_ACKNOWLEDGED = 'alert.acknowledged',
  ALERT_RESOLVED = 'alert.resolved',

  PROJECT_CREATED = 'project.created',
  PROJECT_MILESTONE_REACHED = 'project.milestone_reached',

  TIME_OFF_REQUESTED = 'time_off.requested',
  TIME_OFF_APPROVED = 'time_off.approved',
  TIME_OFF_REJECTED = 'time_off.rejected',
}
