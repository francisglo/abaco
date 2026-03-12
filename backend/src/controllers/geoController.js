import database from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import geobuf from 'geobuf';
import Pbf from 'pbf';

const VALID_TYPES = ['voters', 'citizen_requests', 'events', 'field_reports'];

function parseTypes(rawTypes) {
  if (!rawTypes || rawTypes === 'all') return VALID_TYPES;
  const types = String(rawTypes)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const valid = types.filter((item) => VALID_TYPES.includes(item));
  return valid.length ? valid : VALID_TYPES;
}

function parseLimit(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

function parseZoneId(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function parseBBox(value) {
  if (!value) return [-180, -85, 180, 85];
  const parts = String(value).split(',').map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    throw new AppError('bbox inválido. Formato esperado: minLng,minLat,maxLng,maxLat', 400, 'INVALID_BBOX');
  }

  const [minLng, minLat, maxLng, maxLat] = parts;
  if (minLng >= maxLng || minLat >= maxLat) {
    throw new AppError('bbox inválido: min debe ser menor que max', 400, 'INVALID_BBOX');
  }

  return [minLng, minLat, maxLng, maxLat];
}

function safeNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function inferHeightMeters(properties = {}) {
  const directHeight = safeNumber(properties.height_meters);
  if (directHeight !== null) return Math.max(directHeight, 0);

  const directAltitude = safeNumber(properties.altitude_meters);
  if (directAltitude !== null) return Math.max(directAltitude, 0);

  const elevation = safeNumber(properties.elevation);
  if (elevation !== null) return Math.max(elevation, 0);

  const decisionScore = safeNumber(properties.decision_score);
  if (decisionScore !== null) return Math.max(Number((decisionScore * 0.6).toFixed(2)), 0);

  const priority = safeNumber(properties.priority_score);
  if (priority !== null) return Math.max(Number((priority * 0.6).toFixed(2)), 0);

  return 0;
}

function addZToCoordinates(coords, zValue) {
  if (!Array.isArray(coords)) return coords;
  if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return [coords[0], coords[1], zValue];
  }
  return coords.map((item) => addZToCoordinates(item, zValue));
}

function to3DGeometry(geometry, zValue) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return geometry;
  return {
    ...geometry,
    coordinates: addZToCoordinates(geometry.coordinates, zValue)
  };
}

function collectLngLatVertices(coords, output) {
  if (!Array.isArray(coords)) return;
  if (coords.length >= 2 && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    output.push([coords[0], coords[1]]);
    return;
  }
  coords.forEach((item) => collectLngLatVertices(item, output));
}

function geometryToVertices(geometry, heightMeters) {
  if (!geometry || !Array.isArray(geometry.coordinates)) return [];
  const vertices = [];
  collectLngLatVertices(geometry.coordinates, vertices);
  return vertices.map(([lng, lat]) => [lng, lat, heightMeters]);
}

function degreesToRadians(value) {
  return (value * Math.PI) / 180;
}

function buildGltfFromFeatures(features) {
  const allVertices = [];
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let minHeight = Infinity;
  let maxHeight = -Infinity;

  features.forEach((feature) => {
    const heightMeters = inferHeightMeters(feature.properties);
    const vertices = geometryToVertices(feature.geometry, heightMeters);
    vertices.forEach(([lng, lat, h]) => {
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
      minHeight = Math.min(minHeight, h);
      maxHeight = Math.max(maxHeight, h);
    });
    allVertices.push(...vertices);
  });

  if (!allVertices.length) {
    throw new AppError('No hay vértices geoespaciales para construir glTF', 404, 'NO_GEO_VERTICES');
  }

  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  const latScale = 111320;
  const lngScale = Math.cos(degreesToRadians(centerLat)) * 111320;

  const packed = new Float32Array(allVertices.length * 3);
  for (let i = 0; i < allVertices.length; i += 1) {
    const [lng, lat, h] = allVertices[i];
    packed[i * 3] = Number(((lng - centerLng) * lngScale).toFixed(3));
    packed[i * 3 + 1] = Number(((lat - centerLat) * latScale).toFixed(3));
    packed[i * 3 + 2] = Number((h || 0).toFixed(3));
  }

  const buffer = Buffer.from(packed.buffer);
  const uri = `data:application/octet-stream;base64,${buffer.toString('base64')}`;

  return {
    gltf: {
      asset: { version: '2.0', generator: 'ABACO geo 3D exporter' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ mesh: 0, name: 'abaco-geo-points' }],
      meshes: [{
        primitives: [{
          attributes: { POSITION: 0 },
          mode: 0
        }]
      }],
      buffers: [{
        uri,
        byteLength: buffer.length
      }],
      bufferViews: [{
        buffer: 0,
        byteOffset: 0,
        byteLength: buffer.length,
        target: 34962
      }],
      accessors: [{
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126,
        count: allVertices.length,
        type: 'VEC3',
        min: [
          Math.min(...packed.filter((_, idx) => idx % 3 === 0)),
          Math.min(...packed.filter((_, idx) => idx % 3 === 1)),
          Math.min(...packed.filter((_, idx) => idx % 3 === 2))
        ],
        max: [
          Math.max(...packed.filter((_, idx) => idx % 3 === 0)),
          Math.max(...packed.filter((_, idx) => idx % 3 === 1)),
          Math.max(...packed.filter((_, idx) => idx % 3 === 2))
        ]
      }],
      extras: {
        source: 'geo_entities',
        points: allVertices.length,
        center_wgs84: [centerLng, centerLat],
        bounds_wgs84: [minLng, minLat, maxLng, maxLat],
        height_range_meters: [minHeight, maxHeight]
      }
    },
    bounds: { minLng, minLat, maxLng, maxLat, minHeight, maxHeight }
  };
}

function padBufferTo4Bytes(buffer, fillByte = 0x00) {
  const padding = (4 - (buffer.length % 4)) % 4;
  if (!padding) return buffer;
  return Buffer.concat([buffer, Buffer.alloc(padding, fillByte)]);
}

function buildGlbFromGltf(gltf) {
  const sourceUri = gltf?.buffers?.[0]?.uri;
  if (!sourceUri || !sourceUri.startsWith('data:application/octet-stream;base64,')) {
    throw new AppError('No fue posible construir GLB: buffer glTF inválido', 500, 'GLB_BUILD_ERROR');
  }

  const base64 = sourceUri.replace('data:application/octet-stream;base64,', '');
  const binChunk = padBufferTo4Bytes(Buffer.from(base64, 'base64'));

  const gltfForGlb = JSON.parse(JSON.stringify(gltf));
  gltfForGlb.buffers = [{ byteLength: binChunk.length }];
  if (Array.isArray(gltfForGlb.bufferViews) && gltfForGlb.bufferViews.length > 0) {
    gltfForGlb.bufferViews[0].byteLength = binChunk.length;
  }

  const jsonChunk = padBufferTo4Bytes(Buffer.from(JSON.stringify(gltfForGlb), 'utf8'), 0x20);

  const headerLength = 12;
  const chunkHeaderLength = 8;
  const totalLength = headerLength + chunkHeaderLength + jsonChunk.length + chunkHeaderLength + binChunk.length;

  const header = Buffer.alloc(headerLength);
  header.writeUInt32LE(0x46546C67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(chunkHeaderLength);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4E4F534A, 4);

  const binHeader = Buffer.alloc(chunkHeaderLength);
  binHeader.writeUInt32LE(binChunk.length, 0);
  binHeader.writeUInt32LE(0x004E4942, 4);

  return Buffer.concat([header, jsonHeader, jsonChunk, binHeader, binChunk]);
}

function rowToFeature(row) {
  return {
    type: 'Feature',
    id: `${row.entity_type}-${row.entity_id}`,
    geometry: row.geometry,
    properties: {
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      zone_id: row.zone_id,
      title: row.title,
      status: row.status,
      created_at: row.created_at,
      ...row.properties
    }
  };
}

async function fetchGeoRows({ types, zoneId, limit }) {
  const query = `
    SELECT
      entity_type,
      entity_id,
      zone_id,
      title,
      status,
      created_at,
      properties,
      ST_AsGeoJSON(geom)::jsonb AS geometry
    FROM geo_entities
    WHERE entity_type = ANY($1::text[])
      AND ($2::int IS NULL OR zone_id = $2)
    ORDER BY created_at DESC NULLS LAST
    LIMIT $3
  `;

  const { rows } = await database.query(query, [types, zoneId, limit]);
  return rows;
}

async function buildFeatureCollection({ types, zoneId, limit }) {
  const rows = await fetchGeoRows({ types, zoneId, limit });
  const features = rows.map(rowToFeature);
  return {
    type: 'FeatureCollection',
    total: features.length,
    types,
    features
  };
}

export const getGeoFeatures = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit, 500, 5000);
  const zoneId = req.query.zone_id ? parseZoneId(req.query.zone_id) : null;
  const types = parseTypes(req.query.types);

  const featureCollection = await buildFeatureCollection({ types, zoneId, limit });
  res.json(featureCollection);
});

export const getNearbyGeoFeatures = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusMeters = Math.min(parseInt(req.query.radius_meters, 10) || 2000, 100000);
  const limit = Math.min(parseInt(req.query.limit, 10) || 300, 2000);
  const types = parseTypes(req.query.types);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new AppError('lat y lng son requeridos', 400, 'INVALID_COORDINATES');
  }

  const query = `
    WITH origin AS (
      SELECT ST_SetSRID(ST_MakePoint($1, $2), 4326) AS point
    )
    SELECT
      g.entity_type,
      g.entity_id,
      g.zone_id,
      g.title,
      g.status,
      g.created_at,
      g.properties,
      ST_AsGeoJSON(g.geom)::jsonb AS geometry,
      ROUND(CAST(ST_Distance(g.geom::geography, o.point::geography) AS numeric), 2) AS distance_meters
    FROM geo_entities g
    CROSS JOIN origin o
    WHERE g.entity_type = ANY($3::text[])
      AND ST_DWithin(g.geom::geography, o.point::geography, $4)
    ORDER BY distance_meters ASC
    LIMIT $5
  `;

  const { rows } = await database.query(query, [lng, lat, types, radiusMeters, limit]);

  const features = rows.map((row) => ({
    type: 'Feature',
    id: `${row.entity_type}-${row.entity_id}`,
    geometry: row.geometry,
    properties: {
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      zone_id: row.zone_id,
      title: row.title,
      status: row.status,
      created_at: row.created_at,
      distance_meters: Number(row.distance_meters || 0),
      ...row.properties
    }
  }));

  res.json({
    type: 'FeatureCollection',
    origin: { lat, lng },
    radius_meters: radiusMeters,
    total: features.length,
    types,
    features
  });
});

export const getGeoSyncStatus = asyncHandler(async (_req, res) => {
  const query = `
    SELECT
      'voters'::text AS module,
      COUNT(*)::int AS total_records,
      COUNT(geom)::int AS records_with_geom
    FROM voters
    UNION ALL
    SELECT
      'citizen_requests'::text AS module,
      COUNT(*)::int AS total_records,
      COUNT(geom)::int AS records_with_geom
    FROM citizen_requests
    UNION ALL
    SELECT
      'events'::text AS module,
      COUNT(*)::int AS total_records,
      COUNT(geom)::int AS records_with_geom
    FROM events
    UNION ALL
    SELECT
      'field_reports'::text AS module,
      COUNT(*)::int AS total_records,
      COUNT(geom)::int AS records_with_geom
    FROM field_reports
  `;

  const { rows } = await database.query(query);

  const summary = rows.reduce(
    (acc, row) => {
      acc.total_records += Number(row.total_records || 0);
      acc.records_with_geom += Number(row.records_with_geom || 0);
      return acc;
    },
    { total_records: 0, records_with_geom: 0 }
  );

  const coverage = summary.total_records > 0
    ? Number(((summary.records_with_geom / summary.total_records) * 100).toFixed(2))
    : 100;

  res.json({
    modules: rows,
    summary: {
      ...summary,
      coverage_percent: coverage
    }
  });
});

export const getGeoModelCollection = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit, 500, 5000);
  const zoneId = req.query.zone_id ? parseZoneId(req.query.zone_id) : null;
  const types = parseTypes(req.query.types);

  const featureCollection = await buildFeatureCollection({ types, zoneId, limit });

  const models = featureCollection.features.map((feature) => {
    const height_meters = inferHeightMeters(feature.properties);
    const geometry3d = to3DGeometry(feature.geometry, height_meters);

    return {
      model_id: feature.id,
      geometry_type: feature.geometry?.type || null,
      source_type: feature.properties?.entity_type || null,
      source_id: feature.properties?.entity_id || null,
      zone_id: feature.properties?.zone_id || null,
      height_meters,
      shape_ready: true,
      binary_ready: true,
      model_3d: {
        format: 'geojson-3d',
        geometry: geometry3d,
        properties: {
          ...feature.properties,
          extrusion_height_meters: height_meters
        }
      }
    };
  });

  res.json({
    generated_at: new Date().toISOString(),
    source: 'geo_entities',
    total_models: models.length,
    types,
    exports: {
      shapefile: '/api/v1/geo/export/shapefile',
      binary: '/api/v1/geo/export/binary',
      binary_tile_mvt: '/api/v1/geo/export/binary-tile?bbox=-74.2,4.5,-73.9,4.8&types=all'
    },
    models
  });
});

export const exportGeoShapefile = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit, 500, 3000);
  const zoneId = req.query.zone_id ? parseZoneId(req.query.zone_id) : null;
  const types = parseTypes(req.query.types);

  const featureCollection = await buildFeatureCollection({ types, zoneId, limit });

  if (!featureCollection.features.length) {
    throw new AppError('No hay entidades geoespaciales para exportar', 404, 'NO_GEO_DATA');
  }

  const shpwriteModule = await import('shp-write');
  const shpwrite = shpwriteModule?.default || shpwriteModule;

  const zipArrayBuffer = shpwrite.zip(featureCollection, {
    folder: 'abaco_geo',
    filename: 'abaco_geo_entities',
    outputType: 'arraybuffer'
  });

  const zipBuffer = Buffer.from(zipArrayBuffer);
  const fileName = `abaco_geo_${Date.now()}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', String(zipBuffer.length));
  res.send(zipBuffer);
});

export const exportGeoBinaryModel = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit, 500, 5000);
  const zoneId = req.query.zone_id ? parseZoneId(req.query.zone_id) : null;
  const types = parseTypes(req.query.types);
  const include3d = parseBoolean(req.query.include_3d, true);

  const featureCollection = await buildFeatureCollection({ types, zoneId, limit });

  if (!featureCollection.features.length) {
    throw new AppError('No hay entidades geoespaciales para exportar', 404, 'NO_GEO_DATA');
  }

  const features = include3d
    ? featureCollection.features.map((feature) => {
      const height_meters = inferHeightMeters(feature.properties);
      return {
        ...feature,
        geometry: to3DGeometry(feature.geometry, height_meters),
        properties: {
          ...feature.properties,
          extrusion_height_meters: height_meters
        }
      };
    })
    : featureCollection.features;

  const payload = {
    type: 'FeatureCollection',
    features,
    metadata: {
      generated_at: new Date().toISOString(),
      include_3d: include3d,
      source: 'geo_entities'
    }
  };

  const binary = Buffer.from(geobuf.encode(payload, new Pbf()));
  const fileName = `abaco_geo_${include3d ? '3d_' : ''}${Date.now()}.pbf`;

  res.setHeader('Content-Type', 'application/x-protobuf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', String(binary.length));
  res.send(binary);
});

export const exportGeoBinaryTile = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit, 5000, 50000);
  const zoneId = req.query.zone_id ? parseZoneId(req.query.zone_id) : null;
  const types = parseTypes(req.query.types);
  const [minLng, minLat, maxLng, maxLat] = parseBBox(req.query.bbox);

  const query = `
    WITH bounds AS (
      SELECT ST_MakeEnvelope($1, $2, $3, $4, 4326) AS geom
    ), tile_data AS (
      SELECT
        entity_type,
        entity_id,
        zone_id,
        title,
        status,
        created_at,
        properties,
        ST_AsMVTGeom(g.geom, b.geom, 4096, 64, true) AS geom
      FROM geo_entities g
      CROSS JOIN bounds b
      WHERE g.entity_type = ANY($5::text[])
        AND ($6::int IS NULL OR g.zone_id = $6)
        AND ST_Intersects(g.geom, b.geom)
      LIMIT $7
    )
    SELECT ST_AsMVT(tile_data, 'abaco_geo', 4096, 'geom') AS tile
    FROM tile_data
  `;

  const row = await database.queryOne(query, [minLng, minLat, maxLng, maxLat, types, zoneId, limit]);
  const tile = row?.tile ? Buffer.from(row.tile) : Buffer.alloc(0);

  res.setHeader('Content-Type', 'application/vnd.mapbox-vector-tile');
  res.setHeader('Content-Disposition', `attachment; filename="abaco_geo_${Date.now()}.mvt"`);
  res.setHeader('Content-Length', String(tile.length));
  res.send(tile);
});

export const exportGeoGltfModel = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit, 500, 5000);
  const zoneId = req.query.zone_id ? parseZoneId(req.query.zone_id) : null;
  const types = parseTypes(req.query.types);

  const featureCollection = await buildFeatureCollection({ types, zoneId, limit });
  if (!featureCollection.features.length) {
    throw new AppError('No hay entidades geoespaciales para exportar', 404, 'NO_GEO_DATA');
  }

  const { gltf } = buildGltfFromFeatures(featureCollection.features);

  res.setHeader('Content-Type', 'model/gltf+json');
  res.setHeader('Content-Disposition', `attachment; filename="abaco_geo_${Date.now()}.gltf"`);
  res.json(gltf);
});

export const exportGeoGlbModel = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit, 500, 5000);
  const zoneId = req.query.zone_id ? parseZoneId(req.query.zone_id) : null;
  const types = parseTypes(req.query.types);

  const featureCollection = await buildFeatureCollection({ types, zoneId, limit });
  if (!featureCollection.features.length) {
    throw new AppError('No hay entidades geoespaciales para exportar', 404, 'NO_GEO_DATA');
  }

  const { gltf } = buildGltfFromFeatures(featureCollection.features);
  const glb = buildGlbFromGltf(gltf);

  res.setHeader('Content-Type', 'model/gltf-binary');
  res.setHeader('Content-Disposition', `attachment; filename="abaco_geo_${Date.now()}.glb"`);
  res.setHeader('Content-Length', String(glb.length));
  res.send(glb);
});

export const exportGeoTileset3D = asyncHandler(async (req, res) => {
  const limit = parseLimit(req.query.limit, 500, 5000);
  const zoneId = req.query.zone_id ? parseZoneId(req.query.zone_id) : null;
  const types = parseTypes(req.query.types);
  const featureCollection = await buildFeatureCollection({ types, zoneId, limit });

  if (!featureCollection.features.length) {
    throw new AppError('No hay entidades geoespaciales para exportar', 404, 'NO_GEO_DATA');
  }

  const { bounds } = buildGltfFromFeatures(featureCollection.features);
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  params.set('types', types.join(','));
  if (zoneId !== null) params.set('zone_id', String(zoneId));

  const tileset = {
    asset: {
      version: '1.1',
      generator: 'ABACO 3D Tiles bridge'
    },
    geometricError: 0,
    root: {
      boundingVolume: {
        region: [
          degreesToRadians(bounds.minLng),
          degreesToRadians(bounds.minLat),
          degreesToRadians(bounds.maxLng),
          degreesToRadians(bounds.maxLat),
          bounds.minHeight,
          bounds.maxHeight
        ]
      },
      geometricError: 0,
      refine: 'ADD',
      content: {
        uri: `/api/v1/geo/export/3d/model.gltf?${params.toString()}`
      }
    }
  };

  res.json(tileset);
});
