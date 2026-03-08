import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControlLabel,
  FormGroup,
  Slider,
  Divider,
  Alert,
} from '@mui/material'
import { fetchGeoFeatures, fetchGeoNearby, fetchGeoSyncStatus, fetchZonesSecure } from '../api'
import { useAuth } from '../context/AuthContext'
import {
  MdMap,
  MdLayers,
  MdFilterList,
  MdRefresh,
  MdDownload,
  MdLocationOn,
  MdMyLocation,
  MdWarning,
  MdCheckCircle,
} from 'react-icons/md'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Tooltip as MapTooltip, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix para iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Componente para ajustar el centro del mapa
function MapController({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, zoom)
    }
  }, [center, zoom, map])
  return null
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      if (onMapClick) {
        onMapClick(event.latlng)
      }
    }
  })

  return null
}

export default function GeoReferencePage() {
  const { token } = useAuth()
  const [data, setData] = useState({
    voters: [],
    zones: [],
    geojson: null,
  })
  const [geoFeatures, setGeoFeatures] = useState([])
  const [geoSync, setGeoSync] = useState(null)
  const [focusPoint, setFocusPoint] = useState(null)
  const [nearbyFeatures, setNearbyFeatures] = useState([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState([-34.6037, -58.3816])
  const [mapZoom, setMapZoom] = useState(12)
  const [message, setMessage] = useState('')

  // Filtros
  const [selectedZone, setSelectedZone] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')
  const [radiusFilter, setRadiusFilter] = useState(1000) // metros

  // Capas
  const [layers, setLayers] = useState({
    voters: true,
    zones: true,
    heatmap: false,
    priorityAreas: true,
    citizenRequests: true,
    events: true,
    fieldReports: true,
    nearby: true,
  })

  // Estadísticas territoriales
  const [territoryStats, setTerritoryStats] = useState(null)

  const getZoneCenters = (geojson, zones) => {
    const centers = {}

    if (geojson?.features?.length) {
      geojson.features.forEach((feature) => {
        if (feature.geometry?.type === 'Polygon' && Array.isArray(feature.geometry.coordinates?.[0])) {
          const ring = feature.geometry.coordinates[0]
          const validPoints = ring.filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat))
          if (validPoints.length > 0) {
            const avgLng = validPoints.reduce((sum, p) => sum + p[0], 0) / validPoints.length
            const avgLat = validPoints.reduce((sum, p) => sum + p[1], 0) / validPoints.length
            centers[feature.properties?.name] = [avgLat, avgLng]
          }
        }
      })
    }

    // Fallback determinístico para zonas sin polígono
    zones.forEach((zone, index) => {
      if (!centers[zone.name]) {
        centers[zone.name] = [
          -34.6037 + (index * 0.01),
          -58.3816 - (index * 0.01)
        ]
      }
    })

    return centers
  }

  const assignZoneToVoter = (voter, zoneCenters) => {
    if (!Number.isFinite(Number(voter?.lat)) || !Number.isFinite(Number(voter?.lng))) return null
    const voterLat = Number(voter.lat)
    const voterLng = Number(voter.lng)

    let nearestZone = null
    let nearestDistance = Number.POSITIVE_INFINITY

    Object.entries(zoneCenters).forEach(([zoneName, [lat, lng]]) => {
      const distance = Math.hypot(voterLat - lat, voterLng - lng)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestZone = zoneName
      }
    })

    return nearestZone
  }

  // Cargar datos
  useEffect(() => {
    if (!token) return
    loadData()
  }, [token])

  useEffect(() => {
    if (!token || !focusPoint?.lat || !focusPoint?.lng) {
      setNearbyFeatures([])
      return
    }

    let active = true

    const loadNearby = async () => {
      try {
        setNearbyLoading(true)
        const response = await fetchGeoNearby(token, {
          lat: focusPoint.lat,
          lng: focusPoint.lng,
          radius_meters: radiusFilter,
          limit: 200,
          types: 'voters,citizen_requests,events,field_reports'
        })
        if (!active) return
        setNearbyFeatures(Array.isArray(response?.features) ? response.features : [])
      } catch {
        if (!active) return
        setNearbyFeatures([])
      } finally {
        if (active) setNearbyLoading(false)
      }
    }

    loadNearby()

    return () => {
      active = false
    }
  }, [token, focusPoint, radiusFilter])

  const normalizeVotersFromFeatures = (features = []) => {
    return features
      .filter((feature) => feature?.properties?.entity_type === 'voters')
      .filter((feature) => feature?.geometry?.type === 'Point' && Array.isArray(feature?.geometry?.coordinates))
      .map((feature) => {
        const coordinates = feature.geometry.coordinates
        const properties = feature.properties || {}
        return {
          id: properties.entity_id,
          name: properties.title || 'Contacto',
          dni: properties.dni || '-',
          phone: properties.phone || '-',
          email: properties.email || '-',
          address: properties.address || '-',
          status: properties.status || 'pending',
          priority: properties.priority || 'medium',
          zone_id: properties.zone_id || null,
          lat: Number(coordinates[1]),
          lng: Number(coordinates[0])
        }
      })
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [zonesRes, geoRes, syncRes] = await Promise.all([
        fetchZonesSecure(token, { limit: 500 }),
        fetchGeoFeatures(token, { limit: 5000, types: 'all' }),
        fetchGeoSyncStatus(token)
      ])

      const zonesData = Array.isArray(zonesRes?.data) ? zonesRes.data : []
      const rawFeatures = Array.isArray(geoRes?.features) ? geoRes.features : []
      const votersData = normalizeVotersFromFeatures(rawFeatures)

      const newData = {
        voters: votersData,
        zones: zonesData,
        geojson: null,
      }

      setData(newData)
      setGeoFeatures(rawFeatures)
      setGeoSync(syncRes)

      calculateTerritoryStats(votersData, zonesData, null)
      setLoading(false)
    } catch (error) {
      setMessage(`Error cargando datos sincronizados: ${error.message}`)
      setLoading(false)
    }
  }

  // Calcular estadísticas territoriales
  const calculateTerritoryStats = (voters, zones, geojson) => {
    const zoneCenters = getZoneCenters(geojson, zones)

    const stats = {
      totalVoters: voters.length,
      votersWithCoords: voters.filter(v => v.lat && v.lng).length,
      totalZones: zones.length,
      byZone: {},
      byStatus: {},
      byPriority: {},
    }

    // Por zona (real, asignación por centroide más cercano)
    zones.forEach(zone => {
      const inZone = voters.filter((voter) => assignZoneToVoter(voter, zoneCenters) === zone.name)
      const withCoverage = inZone.filter((voter) => ['confirmed', 'active'].includes(voter.status)).length
      const coverage = inZone.length > 0 ? Math.round((withCoverage / inZone.length) * 100) : 0

      stats.byZone[zone.name] = {
        voters: inZone.length,
        coverage,
      }
    })

    // Por estado
    voters.forEach(v => {
      stats.byStatus[v.status] = (stats.byStatus[v.status] || 0) + 1
      stats.byPriority[v.priority] = (stats.byPriority[v.priority] || 0) + 1
    })

    setTerritoryStats(stats)
  }

  // Filtrar votantes
  const getFilteredVoters = () => {
    let filtered = data.voters.filter(v => v.lat && v.lng)
    const zoneCenters = getZoneCenters(data.geojson, data.zones)

    if (selectedZone) {
      filtered = filtered.filter(v => assignZoneToVoter(v, zoneCenters) === selectedZone)
    }

    if (selectedStatus) {
      filtered = filtered.filter(v => v.status === selectedStatus)
    }
    if (selectedPriority) {
      filtered = filtered.filter(v => v.priority === selectedPriority)
    }

    return filtered
  }

  const filteredVoters = getFilteredVoters()

  const getEntityPoints = (entityType) => {
    return geoFeatures
      .filter((feature) => feature?.properties?.entity_type === entityType)
      .filter((feature) => feature?.geometry?.type === 'Point' && Array.isArray(feature?.geometry?.coordinates))
      .map((feature) => {
        const [lng, lat] = feature.geometry.coordinates
        return {
          id: feature.properties?.entity_id,
          title: feature.properties?.title || entityType,
          status: feature.properties?.status || 'unknown',
          zoneId: feature.properties?.zone_id || null,
          lat: Number(lat),
          lng: Number(lng),
          properties: feature.properties || {}
        }
      })
  }

  const citizenRequestPoints = getEntityPoints('citizen_requests')
  const eventPoints = getEntityPoints('events')
  const fieldReportPoints = getEntityPoints('field_reports')
  const nearbyPoints = nearbyFeatures
    .filter((feature) => feature?.geometry?.type === 'Point' && Array.isArray(feature?.geometry?.coordinates))
    .map((feature) => {
      const [lng, lat] = feature.geometry.coordinates
      return {
        id: feature.id,
        lat: Number(lat),
        lng: Number(lng),
        title: feature.properties?.title || 'Entidad',
        entityType: feature.properties?.entity_type || 'entity',
        distance: feature.properties?.distance_meters || 0,
        status: feature.properties?.status || '-'
      }
    })

  // Colores
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981'
      case 'pending': return '#f59e0b'
      case 'active': return '#667eea'
      case 'inactive': return '#ef4444'
      default: return '#9ca3af'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#9ca3af'
    }
  }

  // Identificar áreas prioritarias (zonas con prioridad 1)
  const priorityZones = data.zones.filter(z => z.priority === 1)
  const zoneCenters = getZoneCenters(data.geojson, data.zones)

  // Centrar en zona seleccionada
  const handleZoneSelect = (zoneName) => {
    setSelectedZone(zoneName)

    const coords = zoneCenters[zoneName]
    if (coords) {
      setMapCenter(coords)
      setMapZoom(14)
    }
  }

  // Exportar datos georreferenciados
  const handleExportGeo = () => {
    const geoJson = {
      type: 'FeatureCollection',
      features: geoFeatures,
    }

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `georeferencia_${new Date().toISOString().split('T')[0]}.geojson`
    link.click()
    setMessage('Datos georreferenciados sincronizados exportados')
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#1f2937' }}>
                Georreferenciación Territorial
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Análisis espacial interactivo con segmentación territorial y áreas prioritarias
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<MdRefresh />}
                onClick={loadData}
                size="small"
              >
                Actualizar
              </Button>
              <Button
                variant="outlined"
                startIcon={<MdDownload />}
                onClick={handleExportGeo}
                size="small"
              >
                Exportar GeoJSON
              </Button>
            </Box>
          </Box>

          {message && (
            <Alert severity="success" onClose={() => setMessage('')} sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}

          {geoSync?.summary && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Sincronización geoespacial activa: {geoSync.summary.records_with_geom}/{geoSync.summary.total_records} registros con geometría ({geoSync.summary.coverage_percent}%).
            </Alert>
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Panel de control lateral */}
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Estadísticas */}
              <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                <CardHeader
                  title="Estadísticas Territoriales"
                  titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                  sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)', py: 1.5 }}
                />
                <CardContent sx={{ pt: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Total Contactos
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                        {territoryStats?.totalVoters || 0}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Con Geolocalización
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {territoryStats?.votersWithCoords || 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Zonas Territoriales
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {territoryStats?.totalZones || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Filtros territoriales */}
              <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                <CardHeader
                  title="Filtros Territoriales"
                  titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                  sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)', py: 1.5 }}
                />
                <CardContent sx={{ pt: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Zona</InputLabel>
                      <Select
                        value={selectedZone}
                        onChange={(e) => handleZoneSelect(e.target.value)}
                        label="Zona"
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {data.zones.map(zone => (
                          <MenuItem key={zone.id} value={zone.name}>{zone.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel>Estado</InputLabel>
                      <Select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        label="Estado"
                      >
                        <MenuItem value="">Todos</MenuItem>
                        <MenuItem value="pending">Pendientes</MenuItem>
                        <MenuItem value="confirmed">Confirmados</MenuItem>
                        <MenuItem value="active">Activos</MenuItem>
                        <MenuItem value="inactive">Inactivos</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth size="small">
                      <InputLabel>Prioridad</InputLabel>
                      <Select
                        value={selectedPriority}
                        onChange={(e) => setSelectedPriority(e.target.value)}
                        label="Prioridad"
                      >
                        <MenuItem value="">Todas</MenuItem>
                        <MenuItem value="high">Alta</MenuItem>
                        <MenuItem value="medium">Media</MenuItem>
                        <MenuItem value="low">Baja</MenuItem>
                      </Select>
                    </FormControl>

                    <Box>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Radio de análisis: {(radiusFilter / 1000).toFixed(1)} km
                      </Typography>
                      <Slider
                        value={radiusFilter}
                        onChange={(e, v) => setRadiusFilter(v)}
                        min={500}
                        max={5000}
                        step={500}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(v) => `${(v / 1000).toFixed(1)} km`}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Control de capas */}
              <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                <CardHeader
                  title="Capas del Mapa"
                  titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                  sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)', py: 1.5 }}
                />
                <CardContent sx={{ pt: 1 }}>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={layers.voters}
                          onChange={(e) => setLayers({ ...layers, voters: e.target.checked })}
                        />
                      }
                      label="Contactos"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={layers.zones}
                          onChange={(e) => setLayers({ ...layers, zones: e.target.checked })}
                        />
                      }
                      label="Zonas Territoriales"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={layers.priorityAreas}
                          onChange={(e) => setLayers({ ...layers, priorityAreas: e.target.checked })}
                        />
                      }
                      label="Áreas Prioritarias"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={layers.citizenRequests}
                          onChange={(e) => setLayers({ ...layers, citizenRequests: e.target.checked })}
                        />
                      }
                      label="Solicitudes Ciudadanas"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={layers.events}
                          onChange={(e) => setLayers({ ...layers, events: e.target.checked })}
                        />
                      }
                      label="Eventos Territoriales"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={layers.fieldReports}
                          onChange={(e) => setLayers({ ...layers, fieldReports: e.target.checked })}
                        />
                      }
                      label="Reportes de Campo"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={layers.nearby}
                          onChange={(e) => setLayers({ ...layers, nearby: e.target.checked })}
                        />
                      }
                      label="Análisis de Cercanía"
                    />
                  </FormGroup>
                </CardContent>
              </Card>

              <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                <CardHeader
                  title="Análisis de Cercanía"
                  titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                  sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)', py: 1.5 }}
                />
                <CardContent sx={{ pt: 2 }}>
                  {!focusPoint && (
                    <Typography variant="body2" color="text.secondary">
                      Selecciona cualquier punto en el mapa para calcular entidades cercanas en tiempo real.
                    </Typography>
                  )}

                  {focusPoint && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Punto activo: {focusPoint.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tipo: {focusPoint.entityType} · Radio: {(radiusFilter / 1000).toFixed(1)} km
                      </Typography>
                      <Chip
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={nearbyLoading ? 'Calculando cercanía...' : `${nearbyPoints.length} entidades cercanas`}
                      />
                      <List dense>
                        {nearbyPoints.slice(0, 6).map((item) => (
                          <ListItem key={`nearby-list-${item.id}`} sx={{ px: 0 }}>
                            <ListItemText
                              primary={`${item.title} (${item.entityType})`}
                              secondary={`${Math.round(Number(item.distance || 0))} m · ${item.status}`}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Áreas prioritarias */}
              <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                <CardHeader
                  title="Áreas Prioritarias"
                  titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                  sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)', py: 1.5 }}
                />
                <CardContent sx={{ pt: 1 }}>
                  <List dense>
                    {priorityZones.map(zone => (
                      <ListItem
                        key={zone.id}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#f9fafb' },
                          borderRadius: 1,
                        }}
                        onClick={() => handleZoneSelect(zone.name)}
                      >
                        <MdWarning size={18} color="#ef4444" style={{ marginRight: 8 }} />
                        <ListItemText
                          primary={zone.name}
                          secondary={`Prioridad: ${zone.priority}`}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          </Grid>

          {/* Mapa principal */}
          <Grid item xs={12} md={9}>
            <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', height: 'calc(100vh - 140px)' }}>
              <CardHeader
                title={`Mapa Territorial - ${filteredVoters.length} contactos + ${citizenRequestPoints.length + eventPoints.length + fieldReportPoints.length} entidades geoespaciales`}
                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
                sx={{ bgcolor: '#f3f4f6', borderBottom: '1px solid rgba(0,0,0,0.08)', py: 1.5 }}
                action={
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip
                      icon={<MdLocationOn />}
                      label={`${filteredVoters.length} puntos`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip label={`Solicitudes: ${citizenRequestPoints.length}`} size="small" color="warning" variant="outlined" />
                    <Chip label={`Eventos: ${eventPoints.length}`} size="small" color="info" variant="outlined" />
                    <Chip label={`Reportes: ${fieldReportPoints.length}`} size="small" color="secondary" variant="outlined" />
                    {selectedStatus && (
                      <Chip
                        label={selectedStatus}
                        size="small"
                        onDelete={() => setSelectedStatus('')}
                        color="info"
                        variant="outlined"
                      />
                    )}
                    {selectedPriority && (
                      <Chip
                        label={selectedPriority}
                        size="small"
                        onDelete={() => setSelectedPriority('')}
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
              />
              <Box sx={{ height: 'calc(100% - 60px)', position: 'relative' }}>
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                >
                  <MapController center={mapCenter} zoom={mapZoom} />
                  <MapClickHandler
                    onMapClick={(latlng) => {
                      setFocusPoint({
                        lat: Number(latlng.lat),
                        lng: Number(latlng.lng),
                        title: `Punto libre (${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)})`,
                        entityType: 'punto libre'
                      })
                    }}
                  />
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />

                  {/* Capa de zonas territoriales (polígonos) */}
                  {layers.zones && data.geojson?.features.map((feature, idx) => {
                    if (feature.geometry.type === 'Polygon') {
                      const coords = feature.geometry.coordinates[0].map(c => [c[1], c[0]])
                      return (
                        <Polygon
                          key={idx}
                          positions={coords}
                          pathOptions={{
                            color: feature.properties.priority === 1 ? '#ef4444' : '#667eea',
                            fillColor: feature.properties.priority === 1 ? '#ef4444' : '#667eea',
                            fillOpacity: 0.1,
                            weight: 2,
                          }}
                        >
                          <Popup>
                            <Box sx={{ p: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {feature.properties.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Prioridad: {feature.properties.priority}
                              </Typography>
                            </Box>
                          </Popup>
                          <MapTooltip direction="center" permanent={false}>
                            {feature.properties.name}
                          </MapTooltip>
                        </Polygon>
                      )
                    }
                    return null
                  })}

                  {/* Capa de áreas prioritarias (círculos) */}
                  {layers.priorityAreas && priorityZones.map((zone, idx) => {
                    const center = zoneCenters[zone.name]
                    if (center) {
                      return (
                        <Circle
                          key={`priority-${idx}`}
                          center={center}
                          radius={radiusFilter}
                          pathOptions={{
                            color: '#ef4444',
                            fillColor: '#ef4444',
                            fillOpacity: 0.15,
                            weight: 2,
                            dashArray: '5, 5',
                          }}
                        >
                          <Popup>
                            <Box sx={{ p: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <MdWarning size={16} color="#ef4444" />
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  Área Prioritaria
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {zone.name} - Radio: {(radiusFilter / 1000).toFixed(1)} km
                              </Typography>
                            </Box>
                          </Popup>
                        </Circle>
                      )
                    }
                    return null
                  })}

                  {/* Capa de votantes (marcadores) */}
                  {layers.voters && filteredVoters.map((voter) => {
                    const position = [Number(voter.lat), Number(voter.lng)]
                    const iconColor = getStatusColor(voter.status)

                    const customIcon = L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="
                        background-color: ${iconColor};
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      "></div>`,
                      iconSize: [12, 12],
                      iconAnchor: [6, 6],
                    })

                    return (
                      <Marker
                        key={voter.id}
                        position={position}
                        icon={customIcon}
                        eventHandlers={{
                          click: () => setFocusPoint({ lat: position[0], lng: position[1], title: voter.name, entityType: 'voters' })
                        }}
                      >
                        <Popup>
                          <Box sx={{ minWidth: 200 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              {voter.name}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Typography variant="caption">
                                <strong>DNI:</strong> {voter.dni}
                              </Typography>
                              <Typography variant="caption">
                                <strong>Teléfono:</strong> {voter.phone}
                              </Typography>
                              <Typography variant="caption">
                                <strong>Dirección:</strong> {voter.address}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                                <Chip
                                  label={voter.status}
                                  size="small"
                                  sx={{
                                    bgcolor: iconColor,
                                    color: 'white',
                                    fontSize: '0.65rem',
                                  }}
                                />
                                <Chip
                                  label={voter.priority}
                                  size="small"
                                  sx={{
                                    bgcolor: getPriorityColor(voter.priority),
                                    color: 'white',
                                    fontSize: '0.65rem',
                                  }}
                                />
                              </Box>
                            </Box>
                          </Box>
                        </Popup>
                        <MapTooltip direction="top" offset={[0, -5]}>
                          {voter.name}
                        </MapTooltip>
                      </Marker>
                    )
                  })}

                  {layers.citizenRequests && citizenRequestPoints.map((item) => {
                    const position = [item.lat, item.lng]
                    const customIcon = L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="
                        background-color: #f59e0b;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      "></div>`,
                      iconSize: [12, 12],
                      iconAnchor: [6, 6],
                    })

                    return (
                      <Marker
                        key={`request-${item.id}`}
                        position={position}
                        icon={customIcon}
                        eventHandlers={{
                          click: () => setFocusPoint({ lat: position[0], lng: position[1], title: item.title, entityType: 'citizen_requests' })
                        }}
                      >
                        <Popup>
                          <Box sx={{ minWidth: 210 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{item.title}</Typography>
                            <Typography variant="caption" display="block"><strong>Estado:</strong> {item.status}</Typography>
                            <Typography variant="caption" display="block"><strong>Urgencia:</strong> {item.properties?.urgency || '-'}</Typography>
                            <Typography variant="caption" display="block"><strong>Tipo:</strong> {item.properties?.request_type || '-'}</Typography>
                            <Typography variant="caption" display="block"><strong>Ciudadano:</strong> {item.properties?.citizen_name || '-'}</Typography>
                          </Box>
                        </Popup>
                      </Marker>
                    )
                  })}

                  {layers.events && eventPoints.map((item) => {
                    const position = [item.lat, item.lng]
                    const customIcon = L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="
                        background-color: #0ea5e9;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      "></div>`,
                      iconSize: [12, 12],
                      iconAnchor: [6, 6],
                    })

                    return (
                      <Marker
                        key={`event-${item.id}`}
                        position={position}
                        icon={customIcon}
                        eventHandlers={{
                          click: () => setFocusPoint({ lat: position[0], lng: position[1], title: item.title, entityType: 'events' })
                        }}
                      >
                        <Popup>
                          <Box sx={{ minWidth: 210 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{item.title}</Typography>
                            <Typography variant="caption" display="block"><strong>Estado:</strong> {item.status}</Typography>
                            <Typography variant="caption" display="block"><strong>Tipo:</strong> {item.properties?.event_type || '-'}</Typography>
                            <Typography variant="caption" display="block"><strong>Fecha:</strong> {item.properties?.event_date || '-'}</Typography>
                            <Typography variant="caption" display="block"><strong>Lugar:</strong> {item.properties?.location || '-'}</Typography>
                          </Box>
                        </Popup>
                      </Marker>
                    )
                  })}

                  {layers.fieldReports && fieldReportPoints.map((item) => {
                    const position = [item.lat, item.lng]
                    const customIcon = L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="
                        background-color: #8b5cf6;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      "></div>`,
                      iconSize: [12, 12],
                      iconAnchor: [6, 6],
                    })

                    return (
                      <Marker
                        key={`report-${item.id}`}
                        position={position}
                        icon={customIcon}
                        eventHandlers={{
                          click: () => setFocusPoint({ lat: position[0], lng: position[1], title: item.title, entityType: 'field_reports' })
                        }}
                      >
                        <Popup>
                          <Box sx={{ minWidth: 210 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{item.title}</Typography>
                            <Typography variant="caption" display="block"><strong>Estado:</strong> {item.status}</Typography>
                            <Typography variant="caption" display="block"><strong>Tipo:</strong> {item.properties?.report_type || '-'}</Typography>
                            <Typography variant="caption" display="block"><strong>Fecha:</strong> {item.properties?.report_date || '-'}</Typography>
                            <Typography variant="caption" display="block"><strong>Ubicación:</strong> {item.properties?.location || '-'}</Typography>
                          </Box>
                        </Popup>
                      </Marker>
                    )
                  })}

                  {layers.nearby && focusPoint && (
                    <Marker position={[focusPoint.lat, focusPoint.lng]}>
                      <Popup>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {focusPoint.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Origen del análisis de cercanía
                        </Typography>
                      </Popup>
                    </Marker>
                  )}

                  {layers.nearby && focusPoint && (
                    <Circle
                      center={[focusPoint.lat, focusPoint.lng]}
                      radius={radiusFilter}
                      pathOptions={{
                        color: '#7c3aed',
                        fillColor: '#7c3aed',
                        fillOpacity: 0.08,
                        weight: 2,
                        dashArray: '6,6'
                      }}
                    >
                      <Popup>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Radio de cercanía activo
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(radiusFilter / 1000).toFixed(1)} km desde {focusPoint.title}
                        </Typography>
                      </Popup>
                    </Circle>
                  )}

                  {layers.nearby && nearbyPoints.map((item) => {
                    const position = [item.lat, item.lng]
                    const customIcon = L.divIcon({
                      className: 'custom-marker',
                      html: `<div style="
                        background-color: #7c3aed;
                        width: 9px;
                        height: 9px;
                        border-radius: 50%;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                      "></div>`,
                      iconSize: [9, 9],
                      iconAnchor: [4.5, 4.5],
                    })

                    return (
                      <Marker key={`nearby-${item.id}`} position={position} icon={customIcon}>
                        <Popup>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.entityType} · {Math.round(Number(item.distance || 0))} m
                          </Typography>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MapContainer>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Resumen por zona */}
        {territoryStats && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {data.zones.map(zone => (
              <Grid item xs={12} sm={6} md={4} key={zone.id}>
                <Card sx={{ borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {zone.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Prioridad: {zone.priority}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={zone.priority === 1 ? 'Alta' : zone.priority === 2 ? 'Media' : 'Baja'}
                        color={zone.priority === 1 ? 'error' : zone.priority === 2 ? 'warning' : 'success'}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Contactos
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {territoryStats.byZone[zone.name]?.voters || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">
                        Cobertura
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981' }}>
                        {territoryStats.byZone[zone.name]?.coverage || 0}%
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  )
}
