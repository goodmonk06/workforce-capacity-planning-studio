# Workforce Capacity Planning Studio

A comprehensive web application for modeling teams, projecting demand, and simulating workforce capacity to identify gaps and optimize resource allocation.

## Overview

This studio helps organizations plan and visualize workforce capacity by:

- **Modeling Teams**: Define teams with roles (e.g., Senior Developer, Designer) and members with their availability and costs
- **Projecting Demand**: Create time-series data representing projected workload over weeks or months
- **Running Simulations**: Compare available capacity against demand to identify overload or underutilization periods
- **Visualizing Results**: Interactive charts show capacity vs demand, utilization rates, and surplus/deficit analysis

## Domain Concepts

### Team
A group of people working together. Each team contains:
- **Roles**: Job functions with associated hourly costs (e.g., "Senior Developer" at $75/hr)
- **Members**: People assigned to roles with weekly hours and availability dates

### Demand Series
A projection of required work hours over a time period (horizon). Contains:
- **Demand Points**: Individual data points specifying required hours on specific dates
- Typically represents project roadmaps, support volumes, or seasonal workload

### Simulation
Compares team capacity against a demand series to produce:
- **Capacity**: Total available hours per period based on active team members
- **Utilization Rate**: Percentage of capacity consumed by demand
- **Surplus/Deficit**: Excess capacity (positive) or shortfall (negative)
- **Cost Analysis**: Total cost based on hourly rates and hours worked

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Charts**: Recharts for data visualization
- **Deployment**: Docker + Docker Compose

## Prerequisites

- Node.js 20+
- Docker and Docker Compose (for containerized deployment)
- Or: PostgreSQL 16+ (for local development)

## Getting Started

### Option 1: Docker (Recommended)

1. **Clone and setup**
   ```bash
   git clone <repo-url>
   cd workforce-capacity-planning-studio
   cp .env.example .env
   ```

2. **Build and run**
   ```bash
   docker-compose up --build
   ```

   This will:
   - Start PostgreSQL database
   - Run database migrations
   - Seed demo data
   - Start the Next.js app at http://localhost:3000

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup database**
   ```bash
   # Make sure PostgreSQL is running locally
   # Update .env with your database connection string
   cp .env.example .env
   # Edit .env and set DATABASE_URL
   ```

3. **Run migrations and seed**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Open http://localhost:3000

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations (dev)
- `npm run db:migrate:prod` - Run migrations (production)
- `npm run db:seed` - Seed database with demo data
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:generate` - Generate Prisma Client

## Usage Guide

### 1. Define Your Team

Navigate to **Teams** and create a new team:

1. Click "New Team"
2. Enter team name and description
3. Click "Manage Team" to add roles and members

**Add Roles:**
- Click "Add Role"
- Enter role name (e.g., "Senior Developer")
- Set hourly cost (e.g., $75)

**Add Members:**
- Click "Add Member"
- Enter name, select role, set weekly hours
- Set start date (and optional end date)

### 2. Model Demand

Navigate to **Demand** and create a demand series:

1. Click "New Demand Series"
2. Select the team
3. Enter name and description
4. Set horizon start and end dates (e.g., Q1 2025)
5. Click "Manage Demand Points"
6. Add individual demand points with date and required hours

**Tip:** Demand points can represent daily or weekly projections. The simulation will aggregate them by week.

### 3. Run a Simulation

Navigate to **Simulations**:

1. Click "Run New Simulation"
2. Select team and demand series
3. Click "Run Simulation"
4. View results summary
5. Click "View Detailed Chart" for full analysis

### 4. Interpret Results

The simulation shows:

**Summary Metrics:**
- **Average Utilization**: Overall capacity usage percentage
  - <85%: Underutilized (consider reducing team size)
  - 85-100%: Healthy utilization
  - >100%: Overloaded (hire more people or reduce scope)

- **Weeks in Deficit**: Periods where demand exceeds capacity
  - Action: Add team members or extend deadlines

- **Total Deficit Hours**: Total shortfall across all periods
  - Use this to calculate how many additional people to hire

- **Total Cost**: Projected cost based on member hours and hourly rates

**Charts:**
- **Capacity vs Demand**: Line chart showing available capacity vs required work
- **Utilization Rate**: Bar chart showing percentage utilization per week
- **Surplus/Deficit**: Bar chart highlighting capacity gaps (red) or excess (green)

**Period Details Table:**
- Week-by-week breakdown
- Status indicators: deficit (red), surplus (green), balanced (gray)
- Active member count and weekly cost

## Example Interpretation

### Scenario: Engineering Team Q1 Roadmap

**Results:**
- Average Utilization: 112%
- Weeks in Deficit: 4/12
- Total Deficit: 160 hours

**Interpretation:**
- Team is overcommitted during peak weeks
- Need ~1 additional full-time developer (40h/week × 4 weeks = 160h)
- Or reduce scope by 160 hours

**Actions:**
1. Hire a contractor for the 4 peak weeks
2. Extend deadlines for some features
3. Reduce scope of mid-priority items
4. Re-run simulation with adjusted team or demand

## Data Model

```
Team
├── Roles (e.g., "Senior Dev", "Designer")
└── Members (people assigned to roles)

DemandSeries (projection for a team)
└── DemandPoints (date + required hours)

SimulationRun (team + demand series)
└── Result (capacity, demand, gaps per period)
```

## Database Schema

See `prisma/schema.prisma` for the complete schema.

Key relationships:
- Team → Roles (1:many)
- Team → Members (1:many)
- Role → Members (1:many)
- Team → DemandSeries (1:many)
- DemandSeries → DemandPoints (1:many)
- Team + DemandSeries → SimulationRun (many:1)

## API Endpoints

All APIs are RESTful and return JSON:

**Teams**
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `PATCH /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

**Roles**
- `GET /api/roles?teamId=:id` - List roles for team
- `POST /api/roles` - Create role
- `DELETE /api/roles/:id` - Delete role

**Members**
- `GET /api/members?teamId=:id` - List members for team
- `POST /api/members` - Create member
- `PATCH /api/members/:id` - Update member
- `DELETE /api/members/:id` - Delete member

**Demand Series**
- `GET /api/demand-series?teamId=:id` - List series
- `POST /api/demand-series` - Create series
- `GET /api/demand-series/:id` - Get series with points
- `DELETE /api/demand-series/:id` - Delete series

**Demand Points**
- `GET /api/demand-points?seriesId=:id` - List points
- `POST /api/demand-points` - Create point
- `DELETE /api/demand-points/:id` - Delete point

**Simulations**
- `GET /api/simulations?teamId=:id` - List simulations
- `POST /api/simulations/run` - Run new simulation
- `GET /api/simulations/:id` - Get simulation results
- `DELETE /api/simulations/:id` - Delete simulation

## Demo Data

The seed script creates:
- **Engineering Team**: 6 members across 4 roles
  - 2 Senior Developers
  - 2 Mid-Level Developers
  - 1 Junior Developer
  - 1 UX Designer
  - Q1 2025 roadmap with realistic demand (120-220 hours/week)

- **Customer Care Team**: 3 support agents
  - 1 Senior Support Agent
  - 2 Support Agents
  - Q1 2025 support volume (60-80 hours/week)

Run simulations on these teams to see the app in action!

## Development

### Adding a New Feature

1. Update Prisma schema if needed
2. Run `npm run db:migrate` to create migration
3. Add API route in `app/api/`
4. Add UI component in `app/` or `components/`
5. Test locally

### Modifying Simulation Logic

The simulation engine is in `lib/simulation.ts`. Key functions:

- `calculateWeeklyCapacity()` - Sums member hours for active members
- `aggregateWeeklyDemand()` - Sums demand points within a week
- `runSimulation()` - Main simulation loop, returns periods and summary

### Database Migrations

```bash
# Create a new migration
npm run db:migrate

# View database in Prisma Studio
npm run db:studio
```

## Deployment

### Production Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_APP_URL` - Public URL of the app

## Troubleshooting

**Database connection errors:**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- For Docker: Check `db` service is healthy

**Seed data not appearing:**
- Run `npm run db:seed` manually
- Check database with `npm run db:studio`

**Charts not rendering:**
- Check browser console for errors
- Ensure simulation has run and has `resultJson` data

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open a GitHub issue.
