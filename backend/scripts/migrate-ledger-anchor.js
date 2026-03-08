import database from '../src/config/database.js';

async function run() {
  try {
    console.log('🔗 Ejecutando migración de anclaje blockchain para ledger...');

    await database.query(`
      ALTER TABLE ledger_blocks ADD COLUMN IF NOT EXISTS anchor_status VARCHAR(20) DEFAULT 'pending';
      ALTER TABLE ledger_blocks ADD COLUMN IF NOT EXISTS anchor_tx_hash TEXT;
      ALTER TABLE ledger_blocks ADD COLUMN IF NOT EXISTS anchor_network VARCHAR(40);
      ALTER TABLE ledger_blocks ADD COLUMN IF NOT EXISTS anchor_contract TEXT;
      ALTER TABLE ledger_blocks ADD COLUMN IF NOT EXISTS anchored_at TIMESTAMP;
    `);

    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_ledger_blocks_anchor_status ON ledger_blocks(anchor_status);
      CREATE INDEX IF NOT EXISTS idx_ledger_blocks_anchor_tx ON ledger_blocks(anchor_tx_hash);
      CREATE INDEX IF NOT EXISTS idx_ledger_blocks_anchored_at ON ledger_blocks(anchored_at DESC);
    `);

    console.log('✅ Migración de anclaje blockchain completada');
  } catch (error) {
    console.error('❌ Error en migración de anclaje blockchain:', error.message);
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}

run();
