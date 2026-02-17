import React, { useState, useEffect } from 'react'

export default function ZoneForm({ initial = { name: '', priority: 1 }, onSubmit, onCancel }) {
  const [form, setForm] = useState(initial)

  useEffect(() => setForm(initial), [initial])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'priority' ? Number(value) : value }))
  }

  function submit(e) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre zona" required />
      <input name="priority" type="number" value={form.priority} onChange={handleChange} min={1} max={10} style={{ width: 80 }} />
      <button type="submit">Guardar</button>
      {onCancel && <button type="button" onClick={onCancel}>Cancelar</button>}
    </form>
  )
}
