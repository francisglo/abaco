import database from '../src/config/database.js';

async function run() {
  try {
    console.log('⛓️ Ejecutando migración de ledger encadenado...');

    await database.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    await database.query(`
      CREATE TABLE IF NOT EXISTS ledger_blocks (
        id BIGSERIAL PRIMARY KEY,
        block_index BIGINT NOT NULL UNIQUE,
        previous_hash TEXT NOT NULL,
        current_hash TEXT NOT NULL UNIQUE,
        payload_ciphertext TEXT NOT NULL,
        payload_iv VARCHAR(64) NOT NULL,
        payload_auth_tag VARCHAR(64) NOT NULL,
        payload_algorithm VARCHAR(40) NOT NULL DEFAULT 'aes-256-gcm',
        resource_type VARCHAR(80) NOT NULL,
        resource_id VARCHAR(80),
        action VARCHAR(80) NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        decision_score NUMERIC(12,4),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_ledger_blocks_resource
        ON ledger_blocks(resource_type, resource_id);

      CREATE INDEX IF NOT EXISTS idx_ledger_blocks_action_created
        ON ledger_blocks(action, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_ledger_blocks_created_by
        ON ledger_blocks(created_by);
    `);

    console.log('✅ Migración de ledger completada');
  } catch (error) {
    console.error('❌ Error en migración de ledger:', error.message);
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}

run();
