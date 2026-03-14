import React from 'react';
import DeckGL from '@deck.gl/react';
import { Map } from 'react-map-gl';
import { GeoJsonLayer } from '@deck.gl/layers';
import { Box, Paper } from '@mui/material';

// Ejemplo de datos GeoJSON (puedes reemplazarlo por props o fetch)
const exampleGeojson = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[
          -58.3816, -34.6037
        ], [
          -58.3816, -34.6137
        ], [
          -58.3716, -34.6137
        ], [
          -58.3716, -34.6037
        ], [
          -58.3816, -34.6037
        ]]]
      },
      "properties": {
        "name": "Zona demo",
        "value": 120
      }
    }
  ]
};

const INITIAL_VIEW_STATE = {
  longitude: -58.3816,
  latitude: -34.6037,
  zoom: 13,
  pitch: 45,
  bearing: 0
};

export default function Map3DDeckGL({ geojson = exampleGeojson, height = 500, metric = 'cobertura' }) {
  // Métricas: cobertura, poblacion, prioridad
  const getMetricValue = (f) => {
    if (!f || !f.properties) return 0;
    if (metric === 'cobertura') return Number(f.properties.coverage || f.properties.cobertura || 0);
    if (metric === 'poblacion') return Number(f.properties.population || f.properties.poblacion || f.properties.value || 0);
    if (metric === 'prioridad') return Number(f.properties.priority || f.properties.prioridad || 0);
    return 0;
  };

  // Escalado de altura y color
  const getElevation = f => {
    const v = getMetricValue(f);
    if (metric === 'cobertura') return v * 3; // cobertura %
    if (metric === 'poblacion') return Math.sqrt(v) * 2; // escala raíz para población
    if (metric === 'prioridad') return v * 20; // prioridad 1-5
    return 10;
  };

  const getFillColor = f => {
    const v = getMetricValue(f);
    if (metric === 'cobertura') return [40, 180 + v, 120, 180];
    if (metric === 'poblacion') return [100 + Math.min(v, 155), 120, 238, 180];
    if (metric === 'prioridad') {
      if (v >= 4) return [239, 68, 68, 200]; // rojo
      if (v === 3) return [245, 158, 11, 200]; // naranja
      if (v === 2) return [102, 119, 238, 200]; // azul
      return [16, 185, 129, 200]; // verde
    }
    return [102, 119, 238, 180];
  };

  const layers = [
    new GeoJsonLayer({
      id: 'geojson-layer',
      data: geojson,
      extruded: true,
      wireframe: true,
      filled: true,
      getElevation,
      getFillColor,
      getLineColor: [40, 40, 40, 200],
      pickable: true,
      autoHighlight: true,
    })
  ];

  return (
    <Paper elevation={0} sx={{ height, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
      <Box sx={{ width: '100%', height }}>
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller={true}
          layers={layers}
        >
          <Map
            mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN || ''}
            reuseMaps
            style={{ width: '100%', height: '100%' }}
          />
        </DeckGL>
      </Box>
    </Paper>
  );
}
