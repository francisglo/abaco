import React, { useEffect, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { fetchMetrics } from '../api'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function StatsCard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchMetrics()
      .then(data => {
        setMetrics(data)
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  if (loading) return <div>Loading metrics...</div>
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>
  if (!metrics) return null

  const data = {
    labels: ['Coverage', 'Contacts', 'Conversion'],
    datasets: [
      {
        label: 'Metrics',
        data: [metrics.coverage, metrics.contacts, metrics.conversion],
        backgroundColor: ['#36A2EB', '#FFCE56', '#FF6384']
      }
    ]
  }

  return (
    <div>
      <h3>Métricas</h3>
      <div style={{ maxWidth: 320 }}>
        <Doughnut data={data} />
      </div>
    </div>
  )
}
