import React from 'react'

export default function VoterRow({ v, onContact, onEdit }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid #eee', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div><strong>{v.name}</strong> — {v.dni}</div>
        <div style={{ fontSize: 12, color: '#666' }}>{v.address} • {v.phone}</div>
      </div>
      <div style={{ width: 120 }}><span>Status: {v.status}</span></div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onContact(v)}>Registrar contacto</button>
        <button onClick={() => onEdit(v)}>Editar</button>
      </div>
    </div>
  )
}
