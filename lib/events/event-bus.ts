import { DomainEvent, EventTypes } from './types'
import { logger } from '../logger'
import { v4 as uuidv4 } from 'crypto'

const eventLogger = logger.child({ context: 'events' })

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void

interface RegisteredHandler {
  id: string
  eventType: string
  handler: EventHandler
}

class EventBus {
  private handlers: RegisteredHandler[] = []
  private eventStore: DomainEvent[] = []
  private maxStoreSize = 1000

  /**
   * Register an event handler for a specific event type
   */
  on<T>(eventType: string | EventTypes, handler: EventHandler<T>): () => void {
    const id = this.generateId()
    this.handlers.push({
      id,
      eventType: String(eventType),
      handler: handler as EventHandler,
    })

    eventLogger.debug({ eventType, handlerId: id }, 'Event handler registered')

    // Return unsubscribe function
    return () => this.off(id)
  }

  /**
   * Unregister an event handler
   */
  off(handlerId: string): void {
    const index = this.handlers.findIndex((h) => h.id === handlerId)
    if (index !== -1) {
      this.handlers.splice(index, 1)
      eventLogger.debug({ handlerId }, 'Event handler unregistered')
    }
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit<T>(eventType: string | EventTypes, payload: T, metadata?: Record<string, any>): Promise<void> {
    const event: DomainEvent<T> = {
      id: this.generateId(),
      type: String(eventType),
      timestamp: new Date(),
      payload,
      metadata,
    }

    // Store event for audit trail
    this.storeEvent(event)

    eventLogger.info({ eventType, eventId: event.id }, 'Event emitted')

    // Find and execute all handlers for this event type
    const matchingHandlers = this.handlers.filter((h) => h.eventType === event.type)

    for (const { handler, id } of matchingHandlers) {
      try {
        await handler(event)
        eventLogger.debug({ eventType, handlerId: id }, 'Event handler executed successfully')
      } catch (error) {
        eventLogger.error(
          { error, eventType, handlerId: id },
          'Event handler execution failed'
        )
      }
    }
  }

  /**
   * Emit an event synchronously (fire and forget)
   */
  emitSync<T>(eventType: string | EventTypes, payload: T, metadata?: Record<string, any>): void {
    this.emit(eventType, payload, metadata).catch((error) => {
      eventLogger.error({ error, eventType }, 'Async event emission failed')
    })
  }

  /**
   * Get stored events (for debugging/audit)
   */
  getEvents(filter?: { type?: string; since?: Date; limit?: number }): DomainEvent[] {
    let events = [...this.eventStore]

    if (filter?.type) {
      events = events.filter((e) => e.type === filter.type)
    }

    if (filter?.since) {
      events = events.filter((e) => e.timestamp >= filter.since!)
    }

    if (filter?.limit) {
      events = events.slice(-filter.limit)
    }

    return events
  }

  /**
   * Clear event store
   */
  clearEvents(): void {
    this.eventStore = []
    eventLogger.info('Event store cleared')
  }

  /**
   * Get count of registered handlers
   */
  getHandlerCount(): number {
    return this.handlers.length
  }

  private storeEvent(event: DomainEvent): void {
    this.eventStore.push(event)

    // Keep store size bounded
    if (this.eventStore.length > this.maxStoreSize) {
      this.eventStore = this.eventStore.slice(-this.maxStoreSize)
    }
  }

  private generateId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Singleton instance
export const eventBus = new EventBus()

// Helper function to create typed event emitters
export function createEventEmitter<T>(eventType: string | EventTypes) {
  return (payload: T, metadata?: Record<string, any>) => {
    return eventBus.emit(eventType, payload, metadata)
  }
}
