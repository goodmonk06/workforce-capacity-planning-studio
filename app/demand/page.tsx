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
  description: string | null
  horizonStart: string
  horizonEnd: string
  team: Team
  demandPoints: DemandPoint[]
}

interface DemandPoint {
  id: string
  date: string
  requiredHours: number
}

export default function DemandPage() {
  const [series, setSeries] = useState<DemandSeries[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewSeriesForm, setShowNewSeriesForm] = useState(false)

  const [formData, setFormData] = useState({
    teamId: '',
    name: '',
    description: '',
    horizonStart: '',
    horizonEnd: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [seriesResponse, teamsResponse] = await Promise.all([
        fetch('/api/demand-series'),
        fetch('/api/teams'),
      ])
      const seriesData = await seriesResponse.json()
      const teamsData = await teamsResponse.json()
      setSeries(seriesData)
      setTeams(teamsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createSeries = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/demand-series', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setFormData({
          teamId: '',
          name: '',
          description: '',
          horizonStart: '',
          horizonEnd: '',
        })
        setShowNewSeriesForm(false)
        loadData()
      }
    } catch (error) {
      console.error('Error creating demand series:', error)
    }
  }

  const deleteSeries = async (seriesId: string) => {
    if (!confirm('Delete this demand series?')) return
    try {
      const response = await fetch(`/api/demand-series/${seriesId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Error deleting demand series:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Demand Series</h1>
        <button
          onClick={() => setShowNewSeriesForm(!showNewSeriesForm)}
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
          {showNewSeriesForm ? 'Cancel' : '+ New Demand Series'}
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
          Please <Link href="/teams" style={{ color: '#0066cc' }}>create a team</Link> first before adding demand series.
        </div>
      )}

      {showNewSeriesForm && (
        <form onSubmit={createSeries} style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Create Demand Series</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Team *</label>
              <select
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
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
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Horizon Start *</label>
              <input
                type="date"
                value={formData.horizonStart}
                onChange={(e) => setFormData({ ...formData, horizonStart: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Horizon End *</label>
              <input
                type="date"
                value={formData.horizonEnd}
                onChange={(e) => setFormData({ ...formData, horizonEnd: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
          <button
            type="submit"
            style={{
              backgroundColor: '#0066cc',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem',
            }}
          >
            Create Series
          </button>
        </form>
      )}

      {series.length === 0 ? (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '3rem',
          textAlign: 'center',
          borderRadius: '8px',
        }}>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>
            No demand series yet. Create one to project workload over time!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {series.map((s) => (
            <div
              key={s.id}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.name}</h2>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                    Team: <strong>{s.team.name}</strong>
                  </p>
                  {s.description && (
                    <p style={{ color: '#666', marginBottom: '0.5rem' }}>{s.description}</p>
                  )}
                  <p style={{ color: '#999', fontSize: '0.9rem' }}>
                    {new Date(s.horizonStart).toLocaleDateString()} - {new Date(s.horizonEnd).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteSeries(s.id)}
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

              <div style={{
                backgroundColor: '#f9f9f9',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}>
                <p style={{ margin: 0, color: '#666' }}>
                  <strong>{s.demandPoints.length}</strong> demand points •{' '}
                  Total: <strong>{s.demandPoints.reduce((sum, dp) => sum + dp.requiredHours, 0).toFixed(1)}</strong> hours
                </p>
              </div>

              <Link
                href={`/demand/${s.id}`}
                style={{
                  color: '#0066cc',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Manage Demand Points →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
