'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Team {
  id: string
  name: string
}

interface DemandSeries {
  id: string
  name: string
  team: Team
}

interface SimulationRun {
  id: string
  createdAt: string
  team: Team
  series: DemandSeries
  resultJson: any
}

export default function SimulationsPage() {
  const [simulations, setSimulations] = useState<SimulationRun[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [demandSeries, setDemandSeries] = useState<DemandSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewSimForm, setShowNewSimForm] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const [selectedSeriesId, setSelectedSeriesId] = useState('')
  const [runningSimulation, setRunningSimulation] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      loadSeriesForTeam(selectedTeamId)
    } else {
      setDemandSeries([])
      setSelectedSeriesId('')
    }
  }, [selectedTeamId])

  const loadData = async () => {
    try {
      const [simsResponse, teamsResponse] = await Promise.all([
        fetch('/api/simulations'),
        fetch('/api/teams'),
      ])
      const simsData = await simsResponse.json()
      const teamsData = await teamsResponse.json()
      setSimulations(simsData)
      setTeams(teamsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSeriesForTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/demand-series?teamId=${teamId}`)
      const data = await response.json()
      setDemandSeries(data)
    } catch (error) {
      console.error('Error loading demand series:', error)
    }
  }

  const runSimulation = async (e: React.FormEvent) => {
    e.preventDefault()
    setRunningSimulation(true)
    try {
      const response = await fetch('/api/simulations/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeamId,
          seriesId: selectedSeriesId,
        }),
      })
      if (response.ok) {
        setSelectedTeamId('')
        setSelectedSeriesId('')
        setShowNewSimForm(false)
        loadData()
      } else {
        const error = await response.json()
        alert('Error running simulation: ' + error.error)
      }
    } catch (error) {
      console.error('Error running simulation:', error)
      alert('Error running simulation')
    } finally {
      setRunningSimulation(false)
    }
  }

  const deleteSimulation = async (simId: string) => {
    if (!confirm('Delete this simulation?')) return
    try {
      const response = await fetch(`/api/simulations/${simId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Error deleting simulation:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Simulations</h1>
        <button
          onClick={() => setShowNewSimForm(!showNewSimForm)}
          disabled={teams.length === 0}
          style={{
            backgroundColor: teams.length === 0 ? '#ccc' : '#0066cc',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: teams.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
          }}
        >
          {showNewSimForm ? 'Cancel' : '+ Run New Simulation'}
        </button>
      </div>

      {teams.length === 0 && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '2rem',
        }}>
          Please <Link href="/teams" style={{ color: '#0066cc' }}>create a team</Link> and{' '}
          <Link href="/demand" style={{ color: '#0066cc' }}>demand series</Link> first.
        </div>
      )}

      {showNewSimForm && (
        <form onSubmit={runSimulation} style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Run New Simulation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Team *</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Demand Series *</label>
              <select
                value={selectedSeriesId}
                onChange={(e) => setSelectedSeriesId(e.target.value)}
                required
                disabled={!selectedTeamId || demandSeries.length === 0}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              >
                <option value="">
                  {!selectedTeamId ? 'Select a team first' : demandSeries.length === 0 ? 'No demand series for this team' : 'Select a series'}
                </option>
                {demandSeries.map((series) => (
                  <option key={series.id} value={series.id}>
                    {series.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={runningSimulation}
            style={{
              backgroundColor: runningSimulation ? '#ccc' : '#0066cc',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1.5rem',
              borderRadius: '4px',
              cursor: runningSimulation ? 'not-allowed' : 'pointer',
              marginTop: '1rem',
            }}
          >
            {runningSimulation ? 'Running...' : 'Run Simulation'}
          </button>
        </form>
      )}

      {simulations.length === 0 ? (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '3rem',
          textAlign: 'center',
          borderRadius: '8px',
        }}>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>
            No simulations yet. Run your first simulation to see capacity vs demand analysis!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {simulations.map((sim) => {
            const result = sim.resultJson
            const summary = result?.summary

            return (
              <div
                key={sim.id}
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>
                      {sim.team.name} • {sim.series.name}
                    </h2>
                    <p style={{ color: '#999', fontSize: '0.9rem' }}>
                      Run at: {new Date(sim.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteSimulation(sim.id)}
                    style={{
                      backgroundColor: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                    }}
                  >
                    Delete
                  </button>
                </div>

                {summary && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      backgroundColor: '#f9f9f9',
                      padding: '1rem',
                      borderRadius: '4px',
                    }}>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Avg Utilization</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 600, color: summary.averageUtilization > 100 ? '#dc3545' : summary.averageUtilization > 85 ? '#ffc107' : '#28a745' }}>
                        {summary.averageUtilization.toFixed(1)}%
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: '#f9f9f9',
                      padding: '1rem',
                      borderRadius: '4px',
                    }}>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Weeks in Deficit</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 600, color: summary.weeksInDeficit > 0 ? '#dc3545' : '#28a745' }}>
                        {summary.weeksInDeficit}/{summary.totalWeeks}
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: '#f9f9f9',
                      padding: '1rem',
                      borderRadius: '4px',
                    }}>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Total Deficit</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                        {summary.totalDeficit.toFixed(0)}h
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: '#f9f9f9',
                      padding: '1rem',
                      borderRadius: '4px',
                    }}>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Total Cost</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                        ${summary.totalCost.toFixed(0)}
                      </div>
                    </div>
                  </div>
                )}

                <Link
                  href={`/simulations/${sim.id}`}
                  style={{
                    color: '#0066cc',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  View Detailed Chart →
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
