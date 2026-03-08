import app from './src/app.js';
import database from './src/config/database.js';
import { startLedgerAnchorScheduler, stopLedgerAnchorScheduler } from './src/services/ledgerAnchorScheduler.js';

const PORT = process.env.PORT || 3000;
let serverInstance;

async function startServer() {
  try {
    // Conectar a base de datos
    console.log('🔌 Conectando a PostgreSQL...');
    await database.ping();
    console.log('✅ Conexión a BD establecida');

    // Iniciar servidor HTTP
    serverInstance = app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════╗
║          🗳️  ÁBACO BACKEND API v1.0.0               ║
╠═══════════════════════════════════════════════════════╣
║  Ambiente:    ${process.env.NODE_ENV || 'development'}
║  Puerto:      ${PORT}
║  URL:         http://localhost:${PORT}
║  Docs:        http://localhost:${PORT}/api/docs
╚═══════════════════════════════════════════════════════╝
      `);

      startLedgerAnchorScheduler();
    });
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
