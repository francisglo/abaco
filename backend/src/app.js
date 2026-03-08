import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import compression from 'compression';

// Importar rutas
import authRoutes from './routes/auth.js';
import votersRoutes from './routes/voters.js';
import usersRoutes from './routes/users.js';
import zonesRoutes from './routes/zones.js';
import tasksRoutes from './routes/tasks.js';
import citizenRequestsRoutes from './routes/citizenRequests.js';
import territorialCommunicationRoutes from './routes/territorialCommunication.js';
import managementIndicatorsRoutes from './routes/managementIndicators.js';
import strategicIntelligenceRoutes from './routes/strategicIntelligence.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import searchRoutes from './routes/search.js';
import geoRoutes from './routes/geo.js';
import geoAnalyticsRoutes from './routes/geoAnalytics.js';
import ledgerRoutes from './routes/ledger.js';

// Importar middleware
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/logging.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const NODE_ENV = String(process.env.NODE_ENV || '').trim().toLowerCase();

const allowedOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const corsUseWildcard = allowedOrigins.length === 0 || allowedOrigins.includes('*');

// ===== MIDDLEWARE DE SEGURIDAD =====
app.use(helmet());

// ===== CORS =====
app.use(cors({
  origin: corsUseWildcard ? true : allowedOrigins,
  credentials: !corsUseWildcard,
  optionsSuccessStatus: 200
}));

// ===== BODY PARSER =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(compression());

// ===== LOGGING =====
const morganFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));
app.use(requestLogger);

// ===== RUTAS PÚBLICAS =====
app.use('/api/auth', authRoutes);
app.use('/api/v1/auth', authRoutes);

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===== API DOCS =====
app.get('/api', (req, res) => {
  res.json({
    api: 'ÁBACO Backend API',
    version: '2.0.0',
    description: 'Plataforma integral de gestión territorial, social y política',
    modules: {
      electoral: ['voters', 'users', 'zones', 'tasks'],
      citizenServices: ['citizen-requests'],
      territorial: ['territorial-communication'],
      indicators: ['management-indicators'],
      intelligence: ['strategic-intelligence'],
      business: ['subscriptions'],
      utilities: ['search', 'geo', 'geo-analytics', 'ledger']
    },
    endpoints: {
      auth: '/api/auth',
      voters: '/api/voters',
      users: '/api/users',
      zones: '/api/zones',
      tasks: '/api/tasks',
      citizenRequests: '/api/citizen-requests',
      territorialCommunication: '/api/territorial-communication',
      managementIndicators: '/api/management-indicators',
      strategicIntelligence: '/api/strategic-intelligence',
      subscriptions: '/api/subscriptions',
      search: '/api/search?q=texto',
      geo: '/api/geo/features',
      geoModels: '/api/geo/models?types=all&limit=500',
      geoExportShapefile: '/api/geo/export/shapefile?types=all&limit=500',
      geoExportBinary: '/api/geo/export/binary?types=all&limit=500&include_3d=true',
      geoExportBinaryTile: '/api/geo/export/binary-tile?bbox=-74.2,4.5,-73.9,4.8&types=all',
      geoExportGltf: '/api/geo/export/3d/model.gltf?types=all&limit=500',
      geoExportGlb: '/api/geo/export/3d/model.glb?types=all&limit=500',
      geoExport3DTileset: '/api/geo/export/3d/tileset.json?types=all&limit=500',
      geoAnalytics: '/api/geo-analytics/summary',
      decisionEngine: '/api/geo-analytics/decision-engine?horizon_days=45',
      ledger: '/api/ledger/blocks',
      ledgerAnchorLatest: '/api/ledger/anchor-latest',
      ledgerAnchorStatus: '/api/ledger/anchor-status',
      ledgerAnchorPending: '/api/ledger/anchor-pending?limit=20',
      ledgerAnchorMetrics: '/api/ledger/anchor-metrics'
    },
    docs: 'https://github.com/tu-repo/wiki/API'
  });
});

// ===== RUTAS PROTEGIDAS =====
// Las rutas protegidas requieren autenticación JWT en el middleware
app.use('/api/voters', votersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/zones', zonesRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/v1/voters', votersRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/zones', zonesRoutes);
app.use('/api/v1/tasks', tasksRoutes);

// Módulo de Gestión de Solicitudes Ciudadanas
app.use('/api/citizen-requests', citizenRequestsRoutes);
app.use('/api/v1/citizen-requests', citizenRequestsRoutes);

// Módulo de Comunicación Territorial
app.use('/api/territorial-communication', territorialCommunicationRoutes);
app.use('/api/v1/territorial-communication', territorialCommunicationRoutes);

// Módulo de Indicadores de Gestión
app.use('/api/management-indicators', managementIndicatorsRoutes);
app.use('/api/v1/management-indicators', managementIndicatorsRoutes);

// Módulo de Inteligencia Estratégica
app.use('/api/strategic-intelligence', strategicIntelligenceRoutes);
app.use('/api/v1/strategic-intelligence', strategicIntelligenceRoutes);

// Módulo de Suscripciones y Monetización
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/v1/subscriptions', subscriptionsRoutes);

// Búsqueda global de plataforma
app.use('/api/search', searchRoutes);
app.use('/api/v1/search', searchRoutes);

// API geoespacial unificada (PostGIS)
app.use('/api/geo', geoRoutes);
app.use('/api/v1/geo', geoRoutes);

// API de análisis geoestadístico avanzado
app.use('/api/geo-analytics', geoAnalyticsRoutes);
app.use('/api/v1/geo-analytics', geoAnalyticsRoutes);

// Ledger encadenado cifrado (blockchain interno)
app.use('/api/ledger', ledgerRoutes);
app.use('/api/v1/ledger', ledgerRoutes);

// ===== MANEJO DE RUTAS NO ENCONTRADAS =====
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method
  });
});

// ===== ERROR HANDLER (debe ser el último) =====
app.use(errorHandler);

export default app;
