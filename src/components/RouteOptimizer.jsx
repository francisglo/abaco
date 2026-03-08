/**
 * ÁBACO - Optimizador de Rutas
 */

import React, { useState, useEffect } from 'react'
import { optimizeFieldRoute } from '../utils/optimization'
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider
} from '@mui/material'
import { MdRoute, MdLocationOn, MdTimer, MdDirections } from 'react-icons/md'
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet'

export default function RouteOptimizer({ contacts, startLocation }) {
  const [optimizedRoute, setOptimizedRoute] = useState([])
  const [totalDistance, setTotalDistance] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)

  const calculateRoute = () => {
    const contactsWithCoords = contacts.filter(c => c.coords && c.coords.lat && c.coords.lng)
    const route = optimizeFieldRoute(startLocation, contactsWithCoords)
    setOptimizedRoute(route)
    
    // Calcular distancia total
    let distance = 0
    for (let i = 0; i < route.length - 1; i++) {
      const coord1 = route[i].coords || route[i]
      const coord2 = route[i + 1].coords || route[i + 1]
      distance += calculateDistance(coord1, coord2)
    }
    setTotalDistance(distance)
    setEstimatedTime((distance / 30) * 60) // Asumiendo 30 km/h, resultado en minutos
  }

  const calculateDistance = (point1, point2) => {
    const R = 6371
    const dLat = toRadians(point2.lat - point1.lat)
    const dLng = toRadians(point2.lng - point1.lng)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(point1.lat)) * Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const toRadians = (degrees) => degrees * (Math.PI / 180)

  const exportToGoogleMaps = () => {
    if (optimizedRoute.length === 0) return
    
    const waypoints = optimizedRoute.map(p => {
      const coords = p.coords || p
      return `${coords.lat},${coords.lng}`
    }).join('/')
    
    const url = `https://www.google.com/maps/dir/${waypoints}`
    window.open(url, '_blank')
  }

  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Optimizador de Rutas
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<MdRoute />}
            onClick={calculateRoute}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Calcular Ruta Óptima
          </Button>
          
          {optimizedRoute.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<MdDirections />}
              onClick={exportToGoogleMaps}
            >
              Abrir en Google Maps
            </Button>
          )}
        </Box>

        {optimizedRoute.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip
              icon={<MdLocationOn />}
              label={`${optimizedRoute.length} puntos`}
              color="primary"
            />
            <Chip
              icon={<MdRoute />}
              label={`${totalDistance.toFixed(2)} km`}
              color="primary"
            />
            <Chip
              icon={<MdTimer />}
              label={`${Math.round(estimatedTime)} min`}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {optimizedRoute.length > 0 && (
        <>
          <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Orden de Visitas:
            </Typography>
            <List dense>
              {optimizedRoute.map((point, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Chip label={index + 1} size="small" color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={point.name || `Punto ${index + 1}`}
                    secondary={point.estimatedArrival ? new Date(point.estimatedArrival).toLocaleTimeString() : ''}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Paper elevation={0} sx={{ height: 400, borderRadius: 2, overflow: 'hidden' }}>
            <MapContainer
              center={startLocation}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Polyline
                positions={optimizedRoute.map(p => {
                  const coords = p.coords || p
                  return [coords.lat, coords.lng]
                })}
                color="#667eea"
                weight={4}
              />
              {optimizedRoute.map((point, index) => {
                const coords = point.coords || point
                return (
                  <Marker key={index} position={[coords.lat, coords.lng]}>
                    <Popup>
                      <div>
                        <strong>{index + 1}. {point.name || 'Punto'}</strong>
                        {point.estimatedArrival && (
                          <p>Llegada: {new Date(point.estimatedArrival).toLocaleTimeString()}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </Paper>
        </>
      )}
    </Box>
  )
}
