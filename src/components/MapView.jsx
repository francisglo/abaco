import React from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'

export default function MapView({ geojson }) {
  const center = [-34.6, -58.4]

  return (
    <div style={{ height: 420 }}>
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {geojson && <GeoJSON data={geojson} />}
      </MapContainer>
    </div>
  )
}
