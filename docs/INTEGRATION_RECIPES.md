# Integration Recipes

This document provides practical recipes for integrating the Workforce Capacity Planning Studio with other systems in your ecosystem.

## Table of Contents
1. [Authentication & Authorization](#authentication--authorization)
2. [Notification Systems](#notification-systems)
3. [Calendar Integration](#calendar-integration)
4. [HR Systems](#hr-systems)
5. [Project Management Tools](#project-management-tools)
6. [Business Intelligence](#business-intelligence)
7. [Webhooks & Events](#webhooks--events)

---

## Authentication & Authorization

### Integrating with NextAuth.js

```typescript
// lib/auth.ts
import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'

export const { handlers, auth } = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub
      return session
    },
  },
})
```

### Protecting API Routes

```typescript
// app/api/teams/route.ts
import { auth } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Your existing code...
}
```

### Role-Based Access Control

```typescript
// lib/rbac.ts
export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  VIEWER = 'viewer',
}

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  const hierarchy = {
    admin: 3,
    manager: 2,
    viewer: 1,
  }

  return hierarchy[userRole] >= hierarchy[requiredRole]
}

// Usage in API route
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()

  if (!hasPermission(session.user.role, Role.MANAGER)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete logic...
}
```

---

## Notification Systems

### SendGrid Email Integration

```typescript
// lib/adapters/sendgrid.adapter.ts
import sgMail from '@sendgrid/mail'
import { INotificationAdapter, NotificationPayload } from './notification.adapter'

export class SendGridAdapter implements INotificationAdapter {
  constructor(apiKey: string) {
    sgMail.setApiKey(apiKey)
  }

  async send(payload: NotificationPayload): Promise<void> {
    await sgMail.send({
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      from: process.env.FROM_EMAIL || 'noreply@example.com',
      subject: payload.subject,
      text: payload.body,
      html: payload.body.replace(/\n/g, '<br>'),
    })
  }

  async sendBulk(payloads: NotificationPayload[]): Promise<void> {
    const messages = payloads.map(p => ({
      to: Array.isArray(p.to) ? p.to : [p.to],
      from: process.env.FROM_EMAIL || 'noreply@example.com',
      subject: p.subject,
      text: p.body,
    }))

    await sgMail.send(messages)
  }

  isConfigured(): boolean {
    return Boolean(process.env.SENDGRID_API_KEY)
  }
}

// .env
NOTIFICATION_ADAPTER=sendgrid
SENDGRID_API_KEY=your_api_key
FROM_EMAIL=noreply@yourcompany.com
```

### Slack Integration

```typescript
// lib/adapters/slack.adapter.ts
import { WebClient } from '@slack/web-api'
import { INotificationAdapter, NotificationPayload } from './notification.adapter'

export class SlackAdapter implements INotificationAdapter {
  private client: WebClient

  constructor(token: string) {
    this.client = new WebClient(token)
  }

  async send(payload: NotificationPayload): Promise<void> {
    const channel = Array.isArray(payload.to) ? payload.to[0] : payload.to

    await this.client.chat.postMessage({
      channel,
      text: `*${payload.subject}*\n\n${payload.body}`,
      mrkdwn: true,
    })
  }

  async sendBulk(payloads: NotificationPayload[]): Promise<void> {
    for (const payload of payloads) {
      await this.send(payload)
    }
  }

  isConfigured(): boolean {
    return Boolean(process.env.SLACK_BOT_TOKEN)
  }
}

// .env
NOTIFICATION_ADAPTER=slack
SLACK_BOT_TOKEN=xoxb-your-token
```

---

## Calendar Integration

### Google Calendar Sync

```typescript
// lib/adapters/google-calendar.adapter.ts
import { google } from 'googleapis'
import { ICalendarAdapter, CalendarEvent } from './calendar.adapter'

export class GoogleCalendarAdapter implements ICalendarAdapter {
  private calendar

  constructor(credentials: any) {
    const auth = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUrl
    )
    auth.setCredentials({ refresh_token: credentials.refreshToken })

    this.calendar = google.calendar({ version: 'v3', auth })
  }

  async createEvent(event: CalendarEvent): Promise<string> {
    const response = await this.calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.startTime.toISOString() },
        end: { dateTime: event.endTime.toISOString() },
        attendees: event.attendees?.map(email => ({ email })),
      },
    })

    return response.data.id!
  }

  async listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const response = await this.calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    return (response.data.items || []).map(item => ({
      id: item.id!,
      summary: item.summary!,
      description: item.description,
      startTime: new Date(item.start!.dateTime!),
      endTime: new Date(item.end!.dateTime!),
    }))
  }

  // ... other methods
}
```

### Syncing Time-Off to Calendar

```typescript
// lib/services/time-off.service.ts
import { eventBus, EventTypes } from '@/lib/events'
import { getCalendarAdapter } from '@/lib/adapters/calendar.adapter'

// Register event handler
eventBus.on(EventTypes.TIME_OFF_APPROVED, async (event) => {
  const { requestId, memberId } = event.payload

  // Fetch time-off details
  const timeOff = await prisma.timeOffRequest.findUnique({
    where: { id: requestId },
    include: { member: true },
  })

  if (!timeOff) return

  // Create calendar event
  const calendar = getCalendarAdapter()
  await calendar.createEvent({
    summary: `${timeOff.member.name} - ${timeOff.type}`,
    description: `Time off: ${timeOff.type}`,
    startTime: timeOff.startDate,
    endTime: timeOff.endDate,
  })
})
```

---

## HR Systems

### Sync from Workday/BambooHR

```typescript
// lib/integrations/hr-sync.ts
export async function syncEmployeesFromHR() {
  // Fetch from HR system API
  const employees = await fetchFromHRSystem()

  for (const emp of employees) {
    // Upsert team member
    await prisma.member.upsert({
      where: { email: emp.email },
      update: {
        name: emp.name,
        weeklyHours: emp.workingHours,
        endDate: emp.terminationDate,
      },
      create: {
        teamId: await getTeamIdByDepartment(emp.department),
        roleId: await getRoleIdByTitle(emp.jobTitle),
        name: emp.name,
        email: emp.email,
        weeklyHours: emp.workingHours,
        startDate: emp.startDate,
      },
    })
  }
}

// Run as cron job
// 0 2 * * * npm run cli sync-hr
```

### Export to Payroll System

```typescript
// lib/integrations/payroll-export.ts
export async function exportToPayroll(startDate: Date, endDate: Date) {
  const simulations = await prisma.simulationRun.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      team: {
        include: {
          members: {
            include: { role: true },
          },
        },
      },
    },
  })

  // Calculate hours worked per member
  const payrollData = []
  for (const sim of simulations) {
    const result = sim.resultJson as any
    // Extract hours per member from simulation results
    // Format for payroll system
  }

  return payrollData
}
```

---

## Project Management Tools

### Jira Integration

```typescript
// lib/integrations/jira.ts
import JiraApi from 'jira-client'

export class JiraIntegration {
  private jira: JiraApi

  constructor() {
    this.jira = new JiraApi({
      protocol: 'https',
      host: process.env.JIRA_HOST!,
      username: process.env.JIRA_USERNAME!,
      password: process.env.JIRA_API_TOKEN!,
      apiVersion: '2',
      strictSSL: true,
    })
  }

  async importEpicsAsProjects() {
    const epics = await this.jira.searchJira(
      'issuetype = Epic AND status != Closed',
      { maxResults: 100 }
    )

    for (const epic of epics.issues) {
      await prisma.project.upsert({
        where: { metaJson: { path: ['jiraKey'], equals: epic.key } },
        update: {
          name: epic.fields.summary,
          status: this.mapJiraStatus(epic.fields.status.name),
        },
        create: {
          teamId: await this.getTeamForEpic(epic),
          name: epic.fields.summary,
          description: epic.fields.description,
          startDate: epic.fields.customfield_10015, // Epic start date
          endDate: epic.fields.customfield_10016, // Epic end date
          metaJson: {
            jiraKey: epic.key,
            jiraId: epic.id,
          },
        },
      })
    }
  }

  async exportCapacityToJira(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        demandSeries: {
          include: {
            simulations: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    })

    if (!project?.metaJson?.jiraKey) return

    const latestSim = project.demandSeries[0]?.simulations[0]
    if (!latestSim) return

    const result = latestSim.resultJson as any

    // Comment on Jira epic with capacity insights
    await this.jira.addComment(
      project.metaJson.jiraKey,
      `Capacity Analysis:\n` +
      `- Average Utilization: ${result.summary.averageUtilization.toFixed(1)}%\n` +
      `- Weeks in Deficit: ${result.summary.weeksInDeficit}\n` +
      `- Total Deficit: ${result.summary.totalDeficit.toFixed(1)} hours`
    )
  }
}
```

---

## Business Intelligence

### Export to Data Warehouse

```typescript
// lib/integrations/data-warehouse.ts
import { Pool } from 'pg'

export async function exportToWarehouse() {
  const warehouse = new Pool({
    connectionString: process.env.WAREHOUSE_URL,
  })

  // Export simulations
  const simulations = await prisma.simulationRun.findMany({
    include: {
      team: true,
      series: true,
    },
  })

  for (const sim of simulations) {
    const result = sim.resultJson as any

    await warehouse.query(
      `INSERT INTO capacity_simulations
       (id, team_id, team_name, series_name, avg_utilization, weeks_in_deficit, total_cost, run_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
       avg_utilization = EXCLUDED.avg_utilization`,
      [
        sim.id,
        sim.teamId,
        sim.team.name,
        sim.series.name,
        result.summary.averageUtilization,
        result.summary.weeksInDeficit,
        result.summary.totalCost,
        sim.createdAt,
      ]
    )
  }

  await warehouse.end()
}

// Schedule with cron: 0 3 * * * npm run cli export-warehouse
```

### Tableau/PowerBI Integration

```typescript
// app/api/reports/tableau/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  // Tableau Web Data Connector format
  const data = await prisma.$queryRaw`
    SELECT
      t.name as team_name,
      tc.name as category,
      COUNT(DISTINCT m.id) as member_count,
      AVG(sr.result_json->'summary'->>'averageUtilization')::float as avg_utilization,
      SUM((sr.result_json->'summary'->>'totalCost')::float) as total_cost
    FROM teams t
    LEFT JOIN team_categories tc ON t.category_id = tc.id
    LEFT JOIN members m ON m.team_id = t.id
    LEFT JOIN simulation_runs sr ON sr.team_id = t.id
    GROUP BY t.name, tc.name
  `

  return NextResponse.json({
    schema: {
      columns: [
        { id: 'team_name', dataType: 'string' },
        { id: 'category', dataType: 'string' },
        { id: 'member_count', dataType: 'int' },
        { id: 'avg_utilization', dataType: 'float' },
        { id: 'total_cost', dataType: 'float' },
      ],
    },
    data,
  })
}
```

---

## Webhooks & Events

### Outgoing Webhooks

```typescript
// lib/events/handlers/webhook.handler.ts
import { EventHandler } from '../event-bus'
import { SimulationCompletedPayload } from '../types'

export const webhookHandler: EventHandler<SimulationCompletedPayload> = async (event) => {
  const webhookUrl = process.env.WEBHOOK_URL
  if (!webhookUrl) return

  const payload = {
    event: event.type,
    timestamp: event.timestamp,
    data: event.payload,
  }

  const signature = createHMAC(JSON.stringify(payload), process.env.WEBHOOK_SECRET!)

  await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature,
    },
    body: JSON.stringify(payload),
  })
}

function createHMAC(data: string, secret: string): string {
  const crypto = require('crypto')
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex')
}
```

### Incoming Webhooks

```typescript
// app/api/webhooks/demand/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // Verify signature
  const signature = request.headers.get('x-signature')
  const body = await request.text()

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const data = JSON.parse(body)

  // Create demand series from external system
  if (data.type === 'demand.created') {
    await prisma.demandSeries.create({
      data: {
        teamId: data.teamId,
        name: data.name,
        horizonStart: new Date(data.startDate),
        horizonEnd: new Date(data.endDate),
        metaJson: {
          source: 'external_system',
          externalId: data.id,
        },
      },
    })
  }

  return NextResponse.json({ success: true })
}
```

---

## Example: Complete Integration Flow

### Scenario: Auto-allocate team based on Jira Sprint

```typescript
// lib/integrations/sprint-allocation.ts
import { JiraIntegration } from './jira'
import { eventBus, EventTypes } from '@/lib/events'

export async function autoAllocateFromSprint(sprintId: string) {
  const jira = new JiraIntegration()

  // 1. Fetch sprint from Jira
  const sprint = await jira.getSprint(sprintId)
  const issues = await jira.getSprintIssues(sprintId)

  // 2. Create project in capacity system
  const project = await prisma.project.create({
    data: {
      teamId: await getTeamByJiraBoard(sprint.boardId),
      name: sprint.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      metaJson: { jiraSprintId: sprintId },
    },
  })

  // 3. Create demand series from story points
  const demandSeries = await prisma.demandSeries.create({
    data: {
      teamId: project.teamId,
      projectId: project.id,
      name: `${sprint.name} - Demand`,
      horizonStart: sprint.startDate,
      horizonEnd: sprint.endDate,
    },
  })

  // 4. Convert story points to hours (configurable ratio)
  const storyPointToHours = 8 // 1 SP = 8 hours
  const sprintDays = getWorkingDays(sprint.startDate, sprint.endDate)
  const totalStoryPoints = issues.reduce((sum, i) => sum + (i.fields.customfield_10016 || 0), 0)
  const hoursPerDay = (totalStoryPoints * storyPointToHours) / sprintDays

  // 5. Create demand points
  for (let day of sprintDays) {
    await prisma.demandPoint.create({
      data: {
        seriesId: demandSeries.id,
        date: day,
        requiredHours: hoursPerDay,
      },
    })
  }

  // 6. Run simulation
  const simulation = await runSimulation(project.teamId, demandSeries.id)

  // 7. Post results back to Jira
  if (simulation.summary.weeksInDeficit > 0) {
    await jira.addComment(
      sprint.originBoardId,
      `⚠️ Capacity Warning: Sprint is overallocated by ${simulation.summary.totalDeficit.toFixed(1)} hours`
    )
  }

  // 8. Emit event
  await eventBus.emit(EventTypes.PROJECT_CREATED, {
    projectId: project.id,
    teamId: project.teamId,
    name: project.name,
  })

  return { project, simulation }
}
```

---

## Environment Variables Reference

```bash
# Authentication
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_secret

# Notifications
NOTIFICATION_ADAPTER=sendgrid  # console | email | slack | webhook
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@yourcompany.com
SLACK_BOT_TOKEN=xoxb-xxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/xxx
WEBHOOK_URL=https://yourapp.com/webhooks
WEBHOOK_SECRET=your_webhook_secret

# Calendar
CALENDAR_ADAPTER=google  # noop | google
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REFRESH_TOKEN=xxx

# HR Integration
HR_SYSTEM_URL=https://api.bamboohr.com
HR_API_KEY=xxx

# Jira
JIRA_HOST=yourcompany.atlassian.net
JIRA_USERNAME=your_email
JIRA_API_TOKEN=xxx

# Data Warehouse
WAREHOUSE_URL=postgresql://user:pass@warehouse:5432/analytics

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
DATADOG_API_KEY=xxx
```

---

## Best Practices

1. **Use Environment Variables**: Never hardcode credentials
2. **Validate Webhooks**: Always verify signatures
3. **Handle Failures Gracefully**: Use retry logic and circuit breakers
4. **Log Integration Events**: Track all external system interactions
5. **Monitor Rate Limits**: Respect API rate limits
6. **Cache When Possible**: Reduce external API calls
7. **Version Your APIs**: Support backward compatibility
8. **Document Integrations**: Keep this file updated
