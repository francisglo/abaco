import database from '../src/config/database.js';

async function run() {
  try {
    console.log('🔁 Ejecutando migración de reintentos inteligentes de anclaje...');

    await database.query(`
      ALTER TABLE ledger_blocks ADD COLUMN IF NOT EXISTS anchor_retry_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE ledger_blocks ADD COLUMN IF NOT EXISTS anchor_last_error TEXT;
      ALTER TABLE ledger_blocks ADD COLUMN IF NOT EXISTS anchor_last_attempt_at TIMESTAMP;
      ALTER TABLE ledger_blocks ADD COLUMN IF NOT EXISTS next_anchor_retry_at TIMESTAMP;
    `);

    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_ledger_blocks_retry_count ON ledger_blocks(anchor_retry_count);
      CREATE INDEX IF NOT EXISTS idx_ledger_blocks_next_retry ON ledger_blocks(next_anchor_retry_at);
    `);

    console.log('✅ Migración de reintentos completada');
  } catch (error) {
    console.error('❌ Error en migración de reintentos:', error.message);
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}

run();
