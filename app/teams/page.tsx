'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Team {
  id: string
  name: string
  description: string | null
  roles: Role[]
  members: Member[]
}

interface Role {
  id: string
  name: string
  hourlyCost: number
}

interface Member {
  id: string
  name: string
  weeklyHours: number
  startDate: string
  endDate: string | null
  role: Role
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewTeamForm, setShowNewTeamForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamDescription, setNewTeamDescription] = useState('')

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/teams')
      const data = await response.json()
      setTeams(data)
    } catch (error) {
      console.error('Error loading teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDescription,
        }),
      })
      if (response.ok) {
        setNewTeamName('')
        setNewTeamDescription('')
        setShowNewTeamForm(false)
        loadTeams()
      }
    } catch (error) {
      console.error('Error creating team:', error)
    }
  }

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        loadTeams()
      }
    } catch (error) {
      console.error('Error deleting team:', error)
    }
  }

  if (loading) {
    return <div>Loading teams...</div>
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Teams</h1>
        <button
          onClick={() => setShowNewTeamForm(!showNewTeamForm)}
          style={{
            backgroundColor: '#0066cc',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          {showNewTeamForm ? 'Cancel' : '+ New Team'}
        </button>
      </div>

      {showNewTeamForm && (
        <form onSubmit={createTeam} style={{
          backgroundColor: '#fff',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Create New Team</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Name *</label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
            <textarea
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              rows={3}
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
              padding: '0.5rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Create Team
          </button>
        </form>
      )}

      {teams.length === 0 ? (
        <div style={{
          backgroundColor: '#f9f9f9',
          padding: '3rem',
          textAlign: 'center',
          borderRadius: '8px',
        }}>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>
            No teams yet. Create your first team to get started!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {teams.map((team) => (
            <div
              key={team.id}
              style={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{team.name}</h2>
                  {team.description && (
                    <p style={{ color: '#666', marginBottom: '1rem' }}>{team.description}</p>
                  )}
                </div>
                <button
                  onClick={() => deleteTeam(team.id)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                    Roles ({team.roles.length})
                  </h3>
                  {team.roles.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {team.roles.map((role) => (
                        <li key={role.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                          <strong>{role.name}</strong>
                          <span style={{ color: '#666', marginLeft: '0.5rem' }}>
                            ${role.hourlyCost}/hr
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: '#999' }}>No roles defined</p>
                  )}
                </div>

                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
                    Members ({team.members.length})
                  </h3>
                  {team.members.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {team.members.map((member) => (
                        <li key={member.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                          <strong>{member.name}</strong>
                          <div style={{ fontSize: '0.9rem', color: '#666' }}>
                            {member.role.name} • {member.weeklyHours}h/week
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: '#999' }}>No members</p>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e0e0e0' }}>
                <Link
                  href={`/teams/${team.id}`}
                  style={{
                    color: '#0066cc',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Manage Team →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
