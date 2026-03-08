import React, { useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet'
import { Box, Paper, Typography, ToggleButtonGroup, ToggleButton, Chip } from '@mui/material'
import { MdLayers, MdSatellite, MdTerrain } from 'react-icons/md'
import L from 'leaflet'

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function MapController({ center, zoom }) {
  const map = useMap()
  React.useEffect(() => {
    if (center) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  return null
}

export default function MapView({ geojson, contacts = [], territories = [] }) {
  const [mapType, setMapType] = useState('street')
  const [center] = useState([-34.6, -58.4])
  const [zoom] = useState(13)

  const tileUrls = {
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  }

  const handleMapTypeChange = (event, newType) => {
    if (newType !== null) {
      setMapType(newType)
    }
  }

  const onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.name) {
      layer.bindPopup(`
        <div style="padding: 8px;">
          <strong style="font-size: 14px; color: #667eea;">${feature.properties.name}</strong>
          ${feature.properties.type ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Tipo: ${feature.properties.type}</p>` : ''}
        </div>
      `)
    }
    layer.setStyle({
      fillColor: '#667eea',
      fillOpacity: 0.2,
      color: '#667eea',
      weight: 2,
    })
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        height: 500, 
        position: 'relative', 
        borderRadius: 2,
        overflow: 'hidden',
        border: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Paper elevation={3} sx={{ p: 1 }}>
          <ToggleButtonGroup
            value={mapType}
            exclusive
            onChange={handleMapTypeChange}
            size="small"
            orientation="vertical"
          >
            <ToggleButton value="street" aria-label="street map">
              <MdLayers size={20} />
            </ToggleButton>
            <ToggleButton value="satellite" aria-label="satellite map">
              <MdSatellite size={20} />
            </ToggleButton>
            <ToggleButton value="terrain" aria-label="terrain map">
              <MdTerrain size={20} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>
        
        {contacts && contacts.length > 0 && (
          <Paper elevation={3} sx={{ p: 1.5 }}>
            <Chip 
              label={`${contacts.length} contactos`} 
              size="small" 
              color="primary"
              sx={{ fontWeight: 600 }}
            />
          </Paper>
        )}
      </Box>

      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <MapController center={center} zoom={zoom} />
        <TileLayer 
          url={tileUrls[mapType]} 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {geojson && (
          <GeoJSON 
            data={geojson} 
            onEachFeature={onEachFeature}
          />
        )}
        {contacts && contacts.map((contact) => {
          if (contact.coords && contact.coords.lat && contact.coords.lng) {
            return (
              <Marker 
                key={contact.id} 
                position={[contact.coords.lat, contact.coords.lng]}
              >
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#667eea' }}>
                      {contact.name}
                    </Typography>
                    {contact.phone && (
                      <Typography variant="caption" display="block">
                        📱 {contact.phone}
                      </Typography>
                    )}
                    {contact.status && (
                      <Chip 
                        label={contact.status} 
                        size="small" 
                        sx={{ mt: 0.5, fontSize: '0.65rem', height: 20 }}
                        color={contact.status === 'confirmed' ? 'success' : 'default'}
                      />
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          }
          return null
        })}
      </MapContainer>
    </Paper>
  )
}
