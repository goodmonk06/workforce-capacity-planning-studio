import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ padding: '2rem 0' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        Workforce Capacity Planning Studio
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '3rem' }}>
        Model teams, roles, and people. Project demand over time. Simulate and visualize capacity gaps.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <Card
          title="1. Define Teams"
          description="Create teams with roles and members. Set weekly hours and costs."
          link="/teams"
          linkText="Manage Teams"
        />
        <Card
          title="2. Model Demand"
          description="Create demand series with projected workload over time."
          link="/demand"
          linkText="Manage Demand"
        />
        <Card
          title="3. Run Simulations"
          description="Compare capacity vs demand. Identify gaps and optimize."
          link="/simulations"
          linkText="View Simulations"
        />
      </div>

      <section style={{
        backgroundColor: '#f9f9f9',
        padding: '2rem',
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Quick Start</h2>
        <ol style={{ lineHeight: '2' }}>
          <li>Create a team and add roles (e.g., Developer, Designer)</li>
          <li>Add team members with their weekly hours and availability dates</li>
          <li>Create a demand series with projected workload</li>
          <li>Run a simulation to see capacity vs demand analysis</li>
          <li>Review the visualization to identify overload or underutilization periods</li>
        </ol>
      </section>
    </div>
  )
}

function Card({ title, description, link, linkText }: {
  title: string
  description: string
  link: string
  linkText: string
}) {
  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '1.5rem',
      transition: 'box-shadow 0.2s',
    }}>
      <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#666', marginBottom: '1rem', minHeight: '3rem' }}>{description}</p>
      <Link
        href={link}
        style={{
          color: '#0066cc',
          textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        {linkText} →
      </Link>
    </div>
  )
}
