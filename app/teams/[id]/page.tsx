'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  roleId: string
  role: Role
}

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)

  // Role form state
  const [showRoleForm, setShowRoleForm] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [hourlyCost, setHourlyCost] = useState('0')

  // Member form state
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [weeklyHours, setWeeklyHours] = useState('40')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadTeam()
  }, [teamId])

  const loadTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data)
      } else {
        router.push('/teams')
      }
    } catch (error) {
      console.error('Error loading team:', error)
    } finally {
      setLoading(false)
    }
  }

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          name: roleName,
          hourlyCost: parseFloat(hourlyCost),
        }),
      })
      if (response.ok) {
        setRoleName('')
        setHourlyCost('0')
        setShowRoleForm(false)
        loadTeam()
      }
    } catch (error) {
      console.error('Error creating role:', error)
    }
  }

  const deleteRole = async (roleId: string) => {
    if (!confirm('Delete this role? This will also remove associated members.')) return
    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        loadTeam()
      }
    } catch (error) {
      console.error('Error deleting role:', error)
    }
  }

  const createMember = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          roleId: selectedRoleId,
          name: memberName,
          weeklyHours: parseFloat(weeklyHours),
          startDate,
          endDate: endDate || null,
        }),
      })
      if (response.ok) {
        setMemberName('')
        setSelectedRoleId('')
        setWeeklyHours('40')
        setStartDate('')
        setEndDate('')
        setShowMemberForm(false)
        loadTeam()
      }
    } catch (error) {
      console.error('Error creating member:', error)
    }
  }

  const deleteMember = async (memberId: string) => {
    if (!confirm('Delete this member?')) return
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        loadTeam()
      }
    } catch (error) {
      console.error('Error deleting member:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!team) {
    return <div>Team not found</div>
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <Link href="/teams" style={{ color: '#0066cc', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to Teams
      </Link>

      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{team.name}</h1>
      {team.description && <p style={{ color: '#666', marginBottom: '2rem' }}>{team.description}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* Roles Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Roles</h2>
            <button
              onClick={() => setShowRoleForm(!showRoleForm)}
              style={{
                backgroundColor: '#0066cc',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {showRoleForm ? 'Cancel' : '+ Add Role'}
            </button>
          </div>

          {showRoleForm && (
            <form onSubmit={createRole} style={{
              backgroundColor: '#f9f9f9',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Role Name *</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Hourly Cost ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={hourlyCost}
                  onChange={(e) => setHourlyCost(e.target.value)}
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
                Create Role
              </button>
            </form>
          )}

          <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
            {team.roles.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>No roles yet</p>
            ) : (
              team.roles.map((role) => (
                <div
                  key={role.id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <strong>{role.name}</strong>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>${role.hourlyCost}/hr</div>
                  </div>
                  <button
                    onClick={() => deleteRole(role.id)}
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
                </div>
              ))
            )}
          </div>
        </section>

        {/* Members Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Members</h2>
            <button
              onClick={() => setShowMemberForm(!showMemberForm)}
              disabled={team.roles.length === 0}
              style={{
                backgroundColor: team.roles.length === 0 ? '#ccc' : '#0066cc',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: team.roles.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {showMemberForm ? 'Cancel' : '+ Add Member'}
            </button>
          </div>

          {showMemberForm && (
            <form onSubmit={createMember} style={{
              backgroundColor: '#f9f9f9',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1rem',
            }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Name *</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Role *</label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                >
                  <option value="">Select a role</option>
                  {team.roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Weekly Hours *</label>
                <input
                  type="number"
                  step="0.1"
                  value={weeklyHours}
                  onChange={(e) => setWeeklyHours(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem' }}>End Date (optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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
                Add Member
              </button>
            </form>
          )}

          <div style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
            {team.members.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
                {team.roles.length === 0 ? 'Add roles first' : 'No members yet'}
              </p>
            ) : (
              team.members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                  }}
                >
                  <div>
                    <strong>{member.name}</strong>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {member.role.name} • {member.weeklyHours}h/week
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#999' }}>
                      {new Date(member.startDate).toLocaleDateString()} - {member.endDate ? new Date(member.endDate).toLocaleDateString() : 'Ongoing'}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMember(member.id)}
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
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
