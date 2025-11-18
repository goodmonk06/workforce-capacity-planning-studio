'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Cell,
} from 'recharts'

interface SimulationRun {
  id: string
  createdAt: string
  team: {
    id: string
    name: string
  }
  series: {
    id: string
    name: string
    horizonStart: string
    horizonEnd: string
  }
  resultJson: {
    summary: {
      totalWeeks: number
      averageUtilization: number
      totalDeficit: number
      totalSurplus: number
      weeksInDeficit: number
      weeksInSurplus: number
      totalCost: number
    }
    periods: Array<{
      weekStart: string
      weekEnd: string
      totalCapacity: number
      totalDemand: number
      surplus: number
      utilizationRate: number
      status: string
      activeMembers: number
      totalCost: number
    }>
  }
}

export default function SimulationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const simId = params.id as string

  const [simulation, setSimulation] = useState<SimulationRun | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSimulation()
  }, [simId])

  const loadSimulation = async () => {
    try {
      const response = await fetch(`/api/simulations/${simId}`)
      if (response.ok) {
        const data = await response.json()
        setSimulation(data)
      } else {
        router.push('/simulations')
      }
    } catch (error) {
      console.error('Error loading simulation:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!simulation) {
    return <div>Simulation not found</div>
  }

  const { summary, periods } = simulation.resultJson

  // Prepare chart data
  const chartData = periods.map((p) => ({
    week: new Date(p.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    capacity: p.totalCapacity,
    demand: p.totalDemand,
    surplus: p.surplus,
    utilization: p.utilizationRate,
    members: p.activeMembers,
  }))

  return (
    <div style={{ padding: '2rem 0' }}>
      <Link href="/simulations" style={{ color: '#0066cc', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to Simulations
      </Link>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          Simulation: {simulation.team.name} • {simulation.series.name}
        </h1>
        <p style={{ color: '#999', fontSize: '0.9rem' }}>
          Run at: {new Date(simulation.createdAt).toLocaleString()}
        </p>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          Period: {new Date(simulation.series.horizonStart).toLocaleDateString()} -{' '}
          {new Date(simulation.series.horizonEnd).toLocaleDateString()}
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Average Utilization</div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 600,
            color: summary.averageUtilization > 100 ? '#dc3545' : summary.averageUtilization > 85 ? '#ffc107' : '#28a745'
          }}>
            {summary.averageUtilization.toFixed(1)}%
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Weeks in Deficit</div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 600,
            color: summary.weeksInDeficit > 0 ? '#dc3545' : '#28a745'
          }}>
            {summary.weeksInDeficit} / {summary.totalWeeks}
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total Deficit Hours</div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>
            {summary.totalDeficit.toFixed(0)}h
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total Surplus Hours</div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>
            {summary.totalSurplus.toFixed(0)}h
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total Cost</div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>
            ${summary.totalCost.toLocaleString()}
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>Total Weeks</div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>
            {summary.totalWeeks}
          </div>
        </div>
      </div>

      {/* Capacity vs Demand Chart */}
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Capacity vs Demand Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="capacity" fill="#82ca9d" stroke="#82ca9d" fillOpacity={0.3} name="Capacity" />
            <Line type="monotone" dataKey="demand" stroke="#ff7300" strokeWidth={2} name="Demand" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Utilization Rate Chart */}
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Utilization Rate (%)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="utilization" fill="#8884d8" name="Utilization %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Surplus/Deficit Chart */}
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Surplus / Deficit (Hours)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="surplus" name="Surplus/Deficit">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.surplus >= 0 ? '#28a745' : '#dc3545'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '1.5rem',
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Period Details</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f9f9f9' }}>
              <tr>
                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Week</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Capacity</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Demand</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Surplus</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Utilization</th>
                <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '2px solid #e0e0e0' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Members</th>
                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period, index) => (
                <tr key={index}>
                  <td style={{ padding: '0.75rem', borderBottom: '1px solid #e0e0e0' }}>
                    {new Date(period.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>
                    {period.totalCapacity.toFixed(1)}h
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>
                    {period.totalDemand.toFixed(1)}h
                  </td>
                  <td style={{
                    padding: '0.75rem',
                    textAlign: 'right',
                    borderBottom: '1px solid #e0e0e0',
                    color: period.surplus >= 0 ? '#28a745' : '#dc3545',
                    fontWeight: 500,
                  }}>
                    {period.surplus > 0 ? '+' : ''}{period.surplus.toFixed(1)}h
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>
                    {period.utilizationRate.toFixed(1)}%
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e0e0e0' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      backgroundColor: period.status === 'deficit' ? '#f8d7da' : period.status === 'surplus' ? '#d4edda' : '#e2e3e5',
                      color: period.status === 'deficit' ? '#721c24' : period.status === 'surplus' ? '#155724' : '#383d41',
                    }}>
                      {period.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>
                    {period.activeMembers}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>
                    ${period.totalCost.toFixed(0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
