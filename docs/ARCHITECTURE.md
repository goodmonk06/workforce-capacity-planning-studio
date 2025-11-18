# Architecture Documentation

## System Overview

The Workforce Capacity Planning Studio is built as a modern full-stack TypeScript application with clear separation of concerns and extensibility at its core.

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│                   Next.js App Router                     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/REST
┌──────────────────────┴──────────────────────────────────┐
│                    API Layer (Next.js Route Handlers)    │
│                  - Validation (Zod)                      │
│                  - Error Handling                        │
│                  - Logging                               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                    Service Layer                         │
│  - Simulation Engine                                     │
│  - Capacity Calculator                                   │
│  - Alert Processor                                       │
│  - Report Generator                                      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                    Domain Layer                          │
│  - Business Logic                                        │
│  - Domain Events                                         │
│  - Event Handlers                                        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│                  Infrastructure Layer                    │
│  - Prisma ORM                                            │
│  - Adapters (Notifications, Export, Calendar)           │
│  - Event Bus                                             │
│  - Metrics & Logging                                     │
└──────────────────────┬──────────────────────────────────┘
                       │
                  PostgreSQL
```

## Layers

### 1. Frontend Layer
- **Technology**: React + Next.js 14 App Router
- **Responsibilities**:
  - User interface rendering
  - Client-side state management
  - Form handling and validation
  - Data visualization (Recharts)
- **Key Components**:
  - Navigation
  - Team Management UI
  - Demand Series Editor
  - Simulation Dashboard with Charts

### 2. API Layer
- **Technology**: Next.js Route Handlers
- **Responsibilities**:
  - Request routing and handling
  - Input validation with Zod
  - Error handling and formatting
  - API documentation
- **Endpoints**:
  - `/api/teams` - Team CRUD
  - `/api/roles` - Role CRUD
  - `/api/members` - Member CRUD
  - `/api/demand-series` - Demand series CRUD
  - `/api/demand-points` - Demand point CRUD
  - `/api/simulations` - Simulation runs
  - `/api/projects` - Project management (Phase 3)
  - `/api/skills` - Skills tracking (Phase 3)
  - `/api/time-off` - Time-off management (Phase 3)

### 3. Service Layer
- **Location**: `lib/services/`
- **Responsibilities**:
  - Business logic orchestration
  - Cross-entity operations
  - Transaction management
  - Event emission
- **Key Services**:
  - `SimulationService` - Runs capacity simulations
  - `AlertService` - Processes and triggers alerts
  - `ReportService` - Generates reports
  - `AnalyticsService` - Computes insights

### 4. Domain Layer
- **Location**: `lib/domain/`
- **Responsibilities**:
  - Core business logic
  - Domain models
  - Business rule validation
  - Domain events
- **Key Concepts**:
  - Capacity calculation formulas
  - Deficit/surplus detection
  - Utilization metrics
  - Cost calculations

### 5. Infrastructure Layer
- **Location**: `lib/`
- **Responsibilities**:
  - Data persistence (Prisma)
  - External integrations (Adapters)
  - Cross-cutting concerns (Logging, Metrics)
  - Event infrastructure
- **Components**:
  - `prisma.ts` - Database client
  - `adapters/` - External service abstractions
  - `events/` - Event bus and handlers
  - `logger.ts` - Structured logging
  - `metrics.ts` - Application metrics

## Data Flow

### Typical Request Flow

```
1. User Action (Frontend)
   ↓
2. HTTP Request to API Route
   ↓
3. Request Validation (Zod)
   ↓
4. Service Layer Invocation
   ↓
5. Domain Logic Execution
   ↓
6. Event Emission (if applicable)
   ↓
7. Database Persistence (Prisma)
   ↓
8. Response Formatting
   ↓
9. HTTP Response to Frontend
```

### Simulation Flow

```
1. User triggers simulation
   ↓
2. API: POST /api/simulations/run
   ↓
3. Validate: teamId, seriesId
   ↓
4. Fetch: Team members + Demand points
   ↓
5. Execute: Simulation Engine
   │  ├─ Calculate weekly capacity
   │  ├─ Aggregate weekly demand
   │  ├─ Compare and detect deficits
   │  └─ Compute metrics
   ↓
6. Emit: SimulationCompleted event
   ↓
7. Process: Alert rules
   ↓
8. Save: SimulationRun + Alerts
   ↓
9. Return: Results to frontend
   ↓
10. Display: Charts and metrics
```

## Extensibility Points

### 1. Adapter Pattern
All external integrations use the adapter pattern, allowing easy swapping:

```typescript
interface INotificationAdapter {
  send(payload: NotificationPayload): Promise<void>
}

// Implementations:
- ConsoleNotificationAdapter (dev)
- EmailNotificationAdapter (production)
- SlackNotificationAdapter (production)
- WebhookNotificationAdapter (custom)
```

### 2. Event-Driven Architecture
Domain events allow decoupled reactions to business events:

```typescript
// Emit event
eventBus.emit(EventTypes.SIMULATION_COMPLETED, payload)

// Register handler
eventBus.on(EventTypes.SIMULATION_COMPLETED, async (event) => {
  // Send notifications
  // Update dashboards
  // Trigger workflows
})
```

### 3. Plugin System (Planned)
Future extension point for custom simulation logic:

```typescript
interface ISimulationPlugin {
  beforeSimulation(params): Promise<void>
  afterSimulation(result): Promise<void>
  customMetric(data): number
}
```

## Database Schema

### Core Entities
- **Team**: Organizational unit
- **Role**: Job function within team
- **Member**: Person with capacity and skills
- **DemandSeries**: Time-based workload projection
- **DemandPoint**: Individual demand data point
- **SimulationRun**: Simulation execution and results

### Extended Entities (Phase 3)
- **Skill**, **RoleSkill**, **MemberSkill**: Skills tracking
- **Project**, **ProjectMilestone**, **ProjectAllocation**: Project management
- **TimeOffRequest**, **TimeOffPolicy**, **Holiday**: Time management
- **Scenario**, **ScenarioAssumption**: What-if planning
- **Alert**, **AlertRule**: Alerting system
- **Report**, **Snapshot**: Reporting and history
- **Tag**, **TeamCategory**: Organization and categorization
- **AuditLog**: Audit trail

### Relationships
```
Team 1──* Role 1──* Member
Team 1──* DemandSeries 1──* DemandPoint
Team + DemandSeries ──→ SimulationRun 1──* Alert

Member *──* Skill (via MemberSkill)
Role *──* Skill (via RoleSkill)
Team 1──* Project 1──* DemandSeries
Member *──* Project (via ProjectAllocation)
```

## Technology Stack

### Core
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.5
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL 16
- **ORM**: Prisma 5.18

### Libraries
- **Validation**: Zod
- **Logging**: Pino
- **Charts**: Recharts
- **Date Utils**: date-fns
- **CLI**: Commander
- **Testing**: Vitest

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: (Ready for GitHub Actions, GitLab CI, etc.)

## Security Considerations

### Input Validation
- All API inputs validated with Zod schemas
- Type-safe end-to-end
- SQL injection prevented by Prisma

### Error Handling
- Generic error messages to users
- Detailed errors in logs
- No sensitive data leakage

### Audit Trail
- AuditLog table for sensitive operations
- Event store for business events
- Timestamped records

## Performance Optimizations

### Database
- Strategic indexes on foreign keys, dates, status fields
- Efficient joins with Prisma includes
- Batch operations for bulk data

### Caching (Future)
- Redis for simulation results
- API response caching
- Computed metric caching

### Scaling (Future)
- Horizontal scaling with load balancer
- Read replicas for reports
- Background job processing for simulations

## Deployment Architecture

### Development
```
Developer Machine
  ├─ Next.js Dev Server (port 3000)
  └─ PostgreSQL (Docker, port 5432)
```

### Production (Planned)
```
Load Balancer
  ├─ Next.js App (Container 1)
  ├─ Next.js App (Container 2)
  └─ Next.js App (Container 3)
      ↓
PostgreSQL Primary
  ├─ Read Replica 1
  └─ Read Replica 2
      ↓
Redis Cache
```

## Testing Strategy

### Unit Tests
- Domain logic (simulation engine)
- Validation schemas
- Utility functions

### Integration Tests
- API endpoint testing
- Database operations
- Event handler execution

### E2E Tests (Future)
- User workflows
- Critical paths
- Regression testing

## Monitoring & Observability

### Logging
- Structured logs with Pino
- Context-aware logging
- Log levels: debug, info, warn, error

### Metrics
- Custom metrics via metrics abstraction
- API request counts and latencies
- Simulation execution metrics
- Alert trigger rates

### Health Checks
- Database connectivity
- External service availability
- Resource utilization

## Future Enhancements

1. **Real-time Updates**: WebSocket support for live dashboards
2. **Advanced Scheduling**: Constraint-based team scheduling
3. **Machine Learning**: Predictive demand forecasting
4. **Mobile App**: React Native companion app
5. **API Gateway**: GraphQL layer for flexible queries
6. **Multi-tenancy**: Support for multiple organizations
7. **SSO Integration**: Enterprise authentication
8. **Advanced Analytics**: BI tool integration
