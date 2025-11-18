import { EventHandler } from '../event-bus'
import { getNotificationAdapter } from '../../adapters/notification.adapter'
import {
  AlertTriggeredPayload,
  CapacityDeficitDetectedPayload,
  SimulationCompletedPayload,
  TimeOffApprovedPayload,
  TimeOffRequestedPayload,
} from '../types'
import { logger } from '../../logger'

const notificationLogger = logger.child({ context: 'notification-handler' })

/**
 * Handler that sends notifications when alerts are triggered
 */
export const alertNotificationHandler: EventHandler<AlertTriggeredPayload> = async (event) => {
  const adapter = getNotificationAdapter()

  if (!adapter.isConfigured()) {
    notificationLogger.warn('Notification adapter not configured, skipping alert notification')
    return
  }

  const { severity, title, message } = event.payload

  try {
    await adapter.send({
      to: process.env.ALERT_EMAIL || 'admin@example.com',
      subject: `[${severity.toUpperCase()}] ${title}`,
      body: message,
      priority: severity === 'critical' ? 'high' : 'normal',
      metadata: {
        eventId: event.id,
        timestamp: event.timestamp,
      },
    })

    notificationLogger.info({ alertId: event.payload.alertId }, 'Alert notification sent')
  } catch (error) {
    notificationLogger.error({ error }, 'Failed to send alert notification')
  }
}

/**
 * Handler that sends notifications when capacity deficits are detected
 */
export const deficitNotificationHandler: EventHandler<CapacityDeficitDetectedPayload> = async (
  event
) => {
  const adapter = getNotificationAdapter()

  if (!adapter.isConfigured()) {
    return
  }

  const { teamId, weekStart, deficit, utilizationRate } = event.payload

  try {
    await adapter.send({
      to: process.env.CAPACITY_ALERT_EMAIL || 'capacity@example.com',
      subject: `Capacity Deficit Detected - Team ${teamId}`,
      body: `A capacity deficit of ${deficit.toFixed(
        1
      )} hours was detected for week ${weekStart}. Utilization rate: ${utilizationRate.toFixed(1)}%`,
      priority: deficit > 100 ? 'high' : 'normal',
    })
  } catch (error) {
    notificationLogger.error({ error }, 'Failed to send deficit notification')
  }
}

/**
 * Handler for simulation completion summaries
 */
export const simulationSummaryHandler: EventHandler<SimulationCompletedPayload> = async (
  event
) => {
  const { teamId, summary } = event.payload

  notificationLogger.info(
    {
      teamId,
      averageUtilization: summary.averageUtilization,
      weeksInDeficit: summary.weeksInDeficit,
    },
    'Simulation completed'
  )

  // Could send summary email here if configured
}

/**
 * Handler for time-off requests
 */
export const timeOffRequestHandler: EventHandler<TimeOffRequestedPayload> = async (event) => {
  const adapter = getNotificationAdapter()

  if (!adapter.isConfigured()) {
    return
  }

  const { memberId, type, startDate, endDate } = event.payload

  try {
    await adapter.send({
      to: process.env.APPROVAL_EMAIL || 'manager@example.com',
      subject: `Time Off Request - ${type}`,
      body: `Member ${memberId} has requested ${type} from ${startDate} to ${endDate}`,
      priority: 'normal',
    })
  } catch (error) {
    notificationLogger.error({ error }, 'Failed to send time-off request notification')
  }
}

/**
 * Handler for time-off approvals
 */
export const timeOffApprovalHandler: EventHandler<TimeOffApprovedPayload> = async (event) => {
  const adapter = getNotificationAdapter()

  if (!adapter.isConfigured()) {
    return
  }

  const { memberId, approvedBy } = event.payload

  notificationLogger.info({ memberId, approvedBy }, 'Time-off request approved')

  // Could send confirmation email to member
}
