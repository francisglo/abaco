import React, { useEffect, useState } from 'react'
import { fetchZones, createZone, updateZone, deleteZone } from '../api'
import ZoneForm from '../components/ZoneForm'
import ProtectedRoute from '../components/ProtectedRoute'

export default function ZonesPage() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchZones()
      .then(data => { setZones(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  function handleCreate(payload) {
    createZone(payload)
      .then(newZone => setZones(prev => [...prev, newZone]))
      .catch(err => setError(err.message))
  }

  function handleUpdate(payload) {
    updateZone(payload.id, payload)
      .then(updated => setZones(prev => prev.map(z => z.id === updated.id ? updated : z)))
      .then(() => setEditing(null))
      .catch(err => setError(err.message))
  }

  function handleDelete(id) {
    if (!confirm('¿Eliminar zona?')) return
    deleteZone(id)
      .then(() => setZones(prev => prev.filter(z => z.id !== id)))
      .catch(err => setError(err.message))
  }

  return (
    <ProtectedRoute>
      <div style={{ padding: 16 }}>
        <h2>Gestión de Zonas</h2>
        {loading && <p>Cargando...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <section style={{ marginBottom: 12 }}>
          <h3>Crear zona</h3>
          <ZoneForm onSubmit={handleCreate} />
        </section>

        <section>
          <h3>Listado</h3>
          <ul>
            {zones.map(z => (
              <li key={z.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>{z.name} (prioridad: {z.priority ?? '—'})</div>
                <button onClick={() => setEditing(z)}>Editar</button>
                <button onClick={() => handleDelete(z.id)}>Eliminar</button>
              </li>
            ))}
          </ul>
        </section>

        {editing && (
          <section style={{ marginTop: 12 }}>
            <h3>Editar zona</h3>
            <ZoneForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
          </section>
        )}
      </div>
    </ProtectedRoute>
  )
}
