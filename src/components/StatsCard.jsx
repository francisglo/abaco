import React, { useEffect } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useDispatch, useSelector } from 'react-redux'
import { fetchMetrics } from '../store/metricsSlice'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function StatsCard() {
  const dispatch = useDispatch()
  const { metrics, loading, error } = useSelector(s => s.metrics)

  useEffect(() => {
    if (!metrics) dispatch(fetchMetrics())
  }, [dispatch])

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
