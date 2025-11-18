# Changelog

All notable changes to the Workforce Capacity Planning Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2025-01-18

### Added - Phase 3: Deep Expansion

**Domain Model (13 New Entities)**
- Skills tracking system: `Skill`, `RoleSkill`, `MemberSkill`
- Project management: `Project`, `ProjectMilestone`, `ProjectAllocation`
- Time management: `TimeOffRequest`, `TimeOffPolicy`, `Holiday`
- Scenario planning: `Scenario`, `ScenarioAssumption`
- Alerting system: `Alert`, `AlertRule`
- Reporting & history: `Report`, `Snapshot`
- Organization: `Tag`, `TeamCategory` with hierarchical support
- Audit trail: `AuditLog` for sensitive operations

**Extensibility & Integration**
- Adapter pattern for external integrations
  - `INotificationAdapter` with Console, Email, Slack, Webhook implementations
  - `IExportAdapter` with CSV, JSON, Excel (stub), PDF (stub) implementations
  - `ICalendarAdapter` with Google Calendar and no-op implementations
- Event-driven architecture
  - `EventBus` with typed domain events
  - 15+ event types covering all domain operations
  - Event handlers for notifications and workflows
  - Event store for audit trail (1000 events in-memory)
- Plugin-ready architecture with clear extension points

**CLI Tool (capacity-cli)**
- `seed` command: Database seeding with profiles (small, medium, large)
- `simulate` command: Run simulations from command line
- `export` command: Bulk export to CSV/JSON
- `analyze` command: Quick capacity analysis and insights
- `migrate` command: Migration helpers (dev, deploy, reset, status)

**Documentation**
- `PHASE3_OVERVIEW.md`: Detailed expansion plan and metrics
- `ARCHITECTURE.md`: System architecture, layers, data flow diagrams
- `INTEGRATION_RECIPES.md`: Practical integration patterns for:
  - Authentication & Authorization
  - Notification systems
  - Calendar integration
  - HR systems sync
  - Project management tools (Jira)
  - Business Intelligence (Tableau, PowerBI)
  - Webhooks & events

**Enhanced DX**
- Commander-based CLI with rich options
- Test data factories for fixtures
- Seeding profiles for different scales
- Development utilities

### Added - Phase 2: Foundation & Consistency

**Validation & Error Handling**
- Zod validation schemas for all API inputs
- Centralized error handling with `handleApiError()`
- Domain-specific error types: `ValidationError`, `NotFoundError`, `ConflictError`
- Type-safe validation with comprehensive schemas
- Cross-field validation (date ranges, constraints)

**Testing Infrastructure**
- Vitest test framework setup
- 27 comprehensive tests for simulation engine
  - Basic simulation tests
  - Member availability tests
  - Deficit/surplus detection tests
  - Cost calculation tests
  - Summary metrics tests
  - Edge case tests
- Validation schema tests
- Test coverage support with vitest/coverage-v8

**Developer Experience**
- Prettier for code formatting
- Standardized scripts:
  - `dev`, `build`, `start`
  - `test`, `test:watch`, `test:coverage`
  - `typecheck`, `format`, `format:check`
  - `lint`
  - `db:migrate`, `db:push`, `db:seed`, `db:generate`, `db:studio`
  - `cli` for command-line tools

**Observability**
- Structured logging with Pino
- Contextual loggers: `apiLogger`, `dbLogger`, `simulationLogger`, `seedLogger`
- Metrics abstraction with domain-specific helpers
  - `SimulationMetrics.recordRun()`, `SimulationMetrics.recordError()`
  - `ApiMetrics.recordRequest()`, `ApiMetrics.recordError()`
- In-memory metrics store for development
- Performance tracking for simulations and API calls

### Changed

**Database Schema**
- Expanded from 113 lines to 519 lines (4.6x growth)
- Team: Added `categoryId`, `metaJson`, relations to new entities
- Role: Added relation to `RoleSkill`
- Member: Added `email`, `metaJson`, relations to skills, time-off, allocations
- DemandSeries: Added `projectId`, `metaJson`, tags relation
- SimulationRun: Added `scenarioId`, `status`, alerts relation

**Package Dependencies**
- Added `zod` for validation
- Added `pino` and `pino-pretty` for logging
- Added `commander` for CLI
- Added `vitest` and `@vitest/coverage-v8` for testing
- Added `prettier` for code formatting

### Fixed

**Simulation Engine**
- Improved date handling in weekly calculations
- Fixed timezone-related bugs in date aggregation
- More accurate surplus/deficit detection

## [0.1.0] - 2025-01-17

### Added - Initial Release

**Core Domain Model**
- Teams: Organizational units
- Roles: Job functions with hourly costs
- Members: People with capacity and availability
- Demand Series: Time-based workload projections
- Demand Points: Granular demand data
- Simulation Runs: Capacity analysis results

**Features**
- Create and manage teams with roles and members
- Track member capacity with start/end dates
- Model demand as time series
- Run simulations comparing capacity vs demand
- Visualize results with interactive charts (Recharts)
- Calculate costs based on hourly rates
- Identify overload and underutilization periods

**Technology Stack**
- Next.js 14 (App Router) + TypeScript
- Prisma + PostgreSQL
- React + Recharts
- Docker Compose setup

**API Endpoints**
- Teams CRUD: `/api/teams`, `/api/teams/[id]`
- Roles CRUD: `/api/roles`, `/api/roles/[id]`
- Members CRUD: `/api/members`, `/api/members/[id]`
- Demand Series CRUD: `/api/demand-series`, `/api/demand-series/[id]`
- Demand Points CRUD: `/api/demand-points`, `/api/demand-points/[id]`
- Simulation: `/api/simulations`, `/api/simulations/run`, `/api/simulations/[id]`

**UI Pages**
- Home: Overview and quick start
- Teams: List and manage teams
- Team Detail: Manage roles and members
- Demand: List demand series
- Demand Detail: Manage demand points
- Simulations: List and run simulations
- Simulation Detail: Interactive charts and analysis

**Developer Experience**
- Seed script with realistic demo data (2 teams, 9 members, 12-week projections)
- Docker Compose with PostgreSQL
- Environment configuration (`.env.example`)
- Comprehensive README

**Documentation**
- README with overview, tech stack, getting started, usage guide
- Inline code documentation
- Example data and flows

---

## Version History

- **0.2.0**: Phase 2 & 3 - Production-ready extensible platform
- **0.1.0**: Initial release - Working capacity planning demo

## Upgrade Notes

### 0.1.0 → 0.2.0

**Database Migration Required**
```bash
npm run db:generate
npm run db:migrate
```

**New Environment Variables (Optional)**
```bash
# Notifications
NOTIFICATION_ADAPTER=console  # or email, slack, webhook
SENDGRID_API_KEY=your_key     # if using email
SLACK_WEBHOOK_URL=your_url    # if using slack

# Calendar
CALENDAR_ADAPTER=noop         # or google
GOOGLE_CLIENT_ID=your_id      # if using google

# Logging
LOG_LEVEL=info                # debug, info, warn, error
```

**Breaking Changes**
- None. All changes are additive.

**New Features to Explore**
1. CLI tool: `npm run cli -- --help`
2. Seeding profiles: `npm run cli seed -- --profile large`
3. Command-line simulation: `npm run cli simulate -- -t <teamId> -s <seriesId>`
4. Export functionality: `npm run cli export -- --entity simulations --format csv`
5. Analysis tool: `npm run cli analyze`

**Testing**
```bash
npm run test
npm run test:watch
npm run test:coverage
```

## Future Roadmap

See `docs/PHASE3_OVERVIEW.md` for detailed Phase 4+ plans:
- Real-time updates via WebSocket
- Machine learning for demand forecasting
- Mobile companion app
- GraphQL API layer
- Multi-tenancy support
- SSO integration
- Advanced analytics and BI integration
