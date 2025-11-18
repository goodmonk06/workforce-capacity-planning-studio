'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface DemandSeries {
  id: string
  name: string
  description: string | null
  horizonStart: string
  horizonEnd: string
  team: {
    id: string
    name: string
  }
  demandPoints: DemandPoint[]
}

interface DemandPoint {
  id: string
  date: string
  requiredHours: number
}

export default function DemandSeriesDetailPage() {
  const params = useParams()
  const router = useRouter()
  const seriesId = params.id as string

  const [series, setSeries] = useState<DemandSeries | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPointForm, setShowPointForm] = useState(false)
  const [pointDate, setPointDate] = useState('')
  const [requiredHours, setRequiredHours] = useState('')

  useEffect(() => {
    loadSeries()
  }, [seriesId])

  const loadSeries = async () => {
    try {
      const response = await fetch(`/api/demand-series/${seriesId}`)
      if (response.ok) {
        const data = await response.json()
        setSeries(data)
      } else {
        router.push('/demand')
      }
    } catch (error) {
      console.error('Error loading series:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPoint = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/demand-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seriesId,
          date: pointDate,
          requiredHours: parseFloat(requiredHours),
        }),
      })
      if (response.ok) {
        setPointDate('')
        setRequiredHours('')
        setShowPointForm(false)
        loadSeries()
      }
    } catch (error) {
      console.error('Error creating demand point:', error)
    }
  }

  const deletePoint = async (pointId: string) => {
    if (!confirm('Delete this demand point?')) return
    try {
      const response = await fetch(`/api/demand-points/${pointId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        loadSeries()
      }
    } catch (error) {
      console.error('Error deleting demand point:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!series) {
    return <div>Demand series not found</div>
  }

  const totalHours = series.demandPoints.reduce((sum, dp) => sum + dp.requiredHours, 0)
  const avgHoursPerPoint = series.demandPoints.length > 0 ? totalHours / series.demandPoints.length : 0

  return (
    <div style={{ padding: '2rem 0' }}>
      <Link href="/demand" style={{ color: '#0066cc', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to Demand Series
      </Link>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{series.name}</h1>
        <p style={{ color: '#666', marginBottom: '0.5rem' }}>
          Team: <strong>{series.team.name}</strong>
        </p>
        {series.description && <p style={{ color: '#666', marginBottom: '0.5rem' }}>{series.description}</p>}
        <p style={{ color: '#999', fontSize: '0.9rem' }}>
          {new Date(series.horizonStart).toLocaleDateString()} - {new Date(series.horizonEnd).toLocaleDateString()}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Total Points</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{series.demandPoints.length}</div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Total Hours</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{totalHours.toFixed(1)}</div>
        </div>
        <div style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1rem',
        }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.25rem' }}>Avg Hours/Point</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{avgHoursPerPoint.toFixed(1)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Demand Points</h2>
        <button
          onClick={() => setShowPointForm(!showPointForm)}
          style={{
            backgroundColor: '#0066cc',
            color: '#fff',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showPointForm ? 'Cancel' : '+ Add Point'}
        </button>
      </div>

      {showPointForm && (
        <form onSubmit={createPoint} style={{
          backgroundColor: '#f9f9f9',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '1rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr auto',
          gap: '1rem',
          alignItems: 'end',
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Date *</label>
            <input
              type="date"
              value={pointDate}
              onChange={(e) => setPointDate(e.target.value)}
              min={series.horizonStart.split('T')[0]}
              max={series.horizonEnd.split('T')[0]}
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Required Hours *</label>
            <input
              type="number"
              step="0.1"
              value={requiredHours}
              onChange={(e) => setRequiredHours(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              backgroundColor: '#0066cc',
              color: '#fff',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Add Point
          </button>
        </form>
      )}

      <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
        {series.demandPoints.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
            No demand points yet. Add points to project workload!
          </p>
        ) : (
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9f9f9', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e0e0e0' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e0e0e0' }}>Required Hours</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e0e0e0', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {series.demandPoints.map((point) => (
                  <tr key={point.id}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e0e0e0' }}>
                      {new Date(point.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>
                      {point.requiredHours.toFixed(1)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e0e0e0' }}>
                      <button
                        onClick={() => deletePoint(point.id)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
