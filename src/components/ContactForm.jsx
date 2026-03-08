import React, { useState } from 'react'

export default function ContactForm({ voter, onSubmit, onCancel }) {
  const [note, setNote] = useState('')
  const [result, setResult] = useState('pending')

  function submit(e) {
    e.preventDefault()
    onSubmit({ voterId: voter.id, note, result, contactType: 'manual', timestamp: new Date().toISOString() })
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div><strong>{voter.name}</strong> — {voter.dni}</div>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Nota del contacto" />
      <select value={result} onChange={e => setResult(e.target.value)}>
        <option value="confirmed">Confirmado</option>
        <option value="pending">Pendiente</option>
        <option value="no_answer">Sin respuesta</option>
        <option value="rejected">Rechazado</option>
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit">Guardar contacto</button>
        <button type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}
