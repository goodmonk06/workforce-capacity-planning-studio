export interface NotificationPayload {
  to: string | string[]
  subject: string
  body: string
  priority?: 'low' | 'normal' | 'high'
  metadata?: Record<string, any>
}

export interface INotificationAdapter {
  send(payload: NotificationPayload): Promise<void>
  sendBulk(payloads: NotificationPayload[]): Promise<void>
  isConfigured(): boolean
}

// In-memory/console adapter for development
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async send(payload: NotificationPayload): Promise<void> {
    console.log('[Notification]', {
      to: payload.to,
      subject: payload.subject,
      body: payload.body.substring(0, 100),
      priority: payload.priority || 'normal',
    })
  }

  async sendBulk(payloads: NotificationPayload[]): Promise<void> {
    console.log(`[Notification] Sending ${payloads.length} notifications`)
    for (const payload of payloads) {
      await this.send(payload)
    }
  }

  isConfigured(): boolean {
    return true
  }
}

// Email adapter (stub - implement with SendGrid, SES, etc.)
export class EmailNotificationAdapter implements INotificationAdapter {
  constructor(private config: { apiKey: string; fromEmail: string }) {}

  async send(payload: NotificationPayload): Promise<void> {
    // TODO: Implement with actual email service
    throw new Error('Email adapter not fully implemented')
  }

  async sendBulk(payloads: NotificationPayload[]): Promise<void> {
    // TODO: Implement bulk sending
    throw new Error('Email adapter not fully implemented')
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.fromEmail)
  }
}

// Slack adapter (stub)
export class SlackNotificationAdapter implements INotificationAdapter {
  constructor(private webhookUrl: string) {}

  async send(payload: NotificationPayload): Promise<void> {
    // TODO: Implement Slack webhook posting
    throw new Error('Slack adapter not fully implemented')
  }

  async sendBulk(payloads: NotificationPayload[]): Promise<void> {
    for (const payload of payloads) {
      await this.send(payload)
    }
  }

  isConfigured(): boolean {
    return Boolean(this.webhookUrl)
  }
}

// Webhook adapter for custom integrations
export class WebhookNotificationAdapter implements INotificationAdapter {
  constructor(private webhookUrl: string, private secret?: string) {}

  async send(payload: NotificationPayload): Promise<void> {
    // TODO: Implement HTTP POST to webhook with signature
    throw new Error('Webhook adapter not fully implemented')
  }

  async sendBulk(payloads: NotificationPayload[]): Promise<void> {
    // Send as array to webhook
    throw new Error('Webhook adapter not fully implemented')
  }

  isConfigured(): boolean {
    return Boolean(this.webhookUrl)
  }
}

// Factory function to get the configured adapter
export function getNotificationAdapter(): INotificationAdapter {
  const adapterType = process.env.NOTIFICATION_ADAPTER || 'console'

  switch (adapterType) {
    case 'email':
      return new EmailNotificationAdapter({
        apiKey: process.env.EMAIL_API_KEY || '',
        fromEmail: process.env.FROM_EMAIL || 'noreply@example.com',
      })
    case 'slack':
      return new SlackNotificationAdapter(process.env.SLACK_WEBHOOK_URL || '')
    case 'webhook':
      return new WebhookNotificationAdapter(
        process.env.WEBHOOK_URL || '',
        process.env.WEBHOOK_SECRET
      )
    case 'console':
    default:
      return new ConsoleNotificationAdapter()
  }
}
