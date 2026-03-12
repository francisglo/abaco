import database from '../src/config/database.js';

async function run() {
  try {
    console.log('🧾 Ejecutando migración de bitácora de decisiones operativas...');

    await database.query(`
      CREATE TABLE IF NOT EXISTS operational_decision_log (
        id BIGSERIAL PRIMARY KEY,
        zone_id INTEGER REFERENCES zones(id),
        action_title VARCHAR(220) NOT NULL,
        rationale TEXT,
        priority VARCHAR(20) NOT NULL DEFAULT 'medium',
        owner_role VARCHAR(40) NOT NULL DEFAULT 'manager',
        estimated_cost NUMERIC(14,2) DEFAULT 0,
        source_module VARCHAR(80) NOT NULL DEFAULT 'action_center',
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        status VARCHAR(30) NOT NULL DEFAULT 'planned',
        outcome_note TEXT,
        effectiveness_score NUMERIC(6,2),
        created_by INTEGER REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_op_decision_created
        ON operational_decision_log(created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_op_decision_zone
        ON operational_decision_log(zone_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_op_decision_status
        ON operational_decision_log(status, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_op_decision_priority
        ON operational_decision_log(priority, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_op_decision_payload_gin
        ON operational_decision_log USING GIN (payload);
    `);

    console.log('✅ Migración de bitácora operativa completada');
  } catch (error) {
    console.error('❌ Error en migración de bitácora operativa:', error.message);
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}

run();
