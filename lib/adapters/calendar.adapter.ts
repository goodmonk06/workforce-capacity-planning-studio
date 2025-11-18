export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  startTime: Date
  endTime: Date
  attendees?: string[]
  location?: string
}

export interface ICalendarAdapter {
  createEvent(event: CalendarEvent): Promise<string>
  updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void>
  deleteEvent(eventId: string): Promise<void>
  listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>
  isConfigured(): boolean
}

// No-op adapter for development
export class NoOpCalendarAdapter implements ICalendarAdapter {
  async createEvent(event: CalendarEvent): Promise<string> {
    console.log('[Calendar] Would create event:', event.summary)
    return `noop-${Date.now()}`
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    console.log('[Calendar] Would update event:', eventId)
  }

  async deleteEvent(eventId: string): Promise<void> {
    console.log('[Calendar] Would delete event:', eventId)
  }

  async listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    console.log('[Calendar] Would list events from', startDate, 'to', endDate)
    return []
  }

  isConfigured(): boolean {
    return true
  }
}

// Google Calendar adapter (stub)
export class GoogleCalendarAdapter implements ICalendarAdapter {
  constructor(private credentials: any) {}

  async createEvent(event: CalendarEvent): Promise<string> {
    throw new Error('Google Calendar adapter not implemented - install google-auth-library')
  }

  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    throw new Error('Google Calendar adapter not implemented')
  }

  async deleteEvent(eventId: string): Promise<void> {
    throw new Error('Google Calendar adapter not implemented')
  }

  async listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    throw new Error('Google Calendar adapter not implemented')
  }

  isConfigured(): boolean {
    return Boolean(this.credentials)
  }
}

// Factory function
export function getCalendarAdapter(): ICalendarAdapter {
  const adapterType = process.env.CALENDAR_ADAPTER || 'noop'

  switch (adapterType) {
    case 'google':
      // Would load credentials from env/file
      return new GoogleCalendarAdapter({})
    case 'noop':
    default:
      return new NoOpCalendarAdapter()
  }
}
