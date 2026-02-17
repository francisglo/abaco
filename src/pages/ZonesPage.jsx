import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchZones, createZone, updateZone, deleteZone } from '../store/zonesSlice'
import ZoneForm from '../components/ZoneForm'
import ProtectedRoute from '../components/ProtectedRoute'

export default function ZonesPage() {
  const dispatch = useDispatch()
  const { zones, loading, error } = useSelector(state => state.zones)
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    if (!zones || zones.length === 0) dispatch(fetchZones())
  }, [dispatch])

  function handleCreate(payload) {
    dispatch(createZone(payload))
  }

  function handleUpdate(payload) {
    dispatch(updateZone({ id: payload.id, payload }))
    setEditing(null)
  }

  function handleDelete(id) {
    if (!confirm('¿Eliminar zona?')) return
    dispatch(deleteZone(id))
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
