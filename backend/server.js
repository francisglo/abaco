import app from './src/app.js';
import database from './src/config/database.js';
import { startLedgerAnchorScheduler, stopLedgerAnchorScheduler } from './src/services/ledgerAnchorScheduler.js';

const BASE_PORT = Number(process.env.PORT || 3000);
let serverInstance;

function listenOnPort(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);

    server.once('listening', () => {
      resolve({ port, server });
    });

    server.once('error', (error) => {
      if (error?.code === 'EADDRINUSE') {
        resolve(null);
        return;
      }
      reject(error);
    });
  });
}

async function resolveRuntimePort(basePort, maxOffset = 20) {
  for (let offset = 0; offset <= maxOffset; offset += 1) {
    const candidate = basePort + offset;
    const binding = await listenOnPort(candidate);
    if (binding) return binding;
  }

  throw new Error(`No hay puertos disponibles en el rango ${basePort}-${basePort + maxOffset}`);
}

async function startServer() {
  try {
    // Conectar a base de datos
    console.log('🔌 Conectando a PostgreSQL...');
    await database.ping();
    console.log('✅ Conexión a BD establecida');

    const binding = await resolveRuntimePort(BASE_PORT);
    const runtimePort = binding.port;
    if (runtimePort !== BASE_PORT) {
      console.warn(`⚠️ Puerto ${BASE_PORT} ocupado. ÁBACO iniciará en puerto alterno ${runtimePort}.`);
    }

    // Iniciar servidor HTTP
    serverInstance = binding.server;
    console.log(`
╔═══════════════════════════════════════════════════════╗
║          🗳️  ÁBACO BACKEND API v1.0.0               ║
╠═══════════════════════════════════════════════════════╣
║  Ambiente:    ${process.env.NODE_ENV || 'development'}
║  Puerto:      ${runtimePort}
║  URL:         http://localhost:${runtimePort}
║  Docs:        http://localhost:${runtimePort}/api/docs
╚═══════════════════════════════════════════════════════╝
      `);

    startLedgerAnchorScheduler();
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

// Manejar errores no capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Rechazo no manejado:', error);
  stopLedgerAnchorScheduler();
  if (serverInstance) {
    serverInstance.close(() => process.exit(1));
    return;
  }
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  stopLedgerAnchorScheduler();
  if (serverInstance) {
    serverInstance.close(() => process.exit(1));
    return;
  }
  process.exit(1);
});

startServer();
