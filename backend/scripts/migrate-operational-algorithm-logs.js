import database from '../src/config/database.js';

async function run() {
  try {
    console.log('🧠 Ejecutando migración de historial de activaciones autónomas...');

    await database.query(`
      CREATE TABLE IF NOT EXISTS operational_algorithm_activation_logs (
        id BIGSERIAL PRIMARY KEY,
        zone_id INTEGER REFERENCES zones(id),
        activation_mode VARCHAR(30) NOT NULL DEFAULT 'autonomous',
        severity VARCHAR(20),
        composite_signal NUMERIC(6,2) DEFAULT 0,
        activated_count INTEGER DEFAULT 0,
        activated_algorithms JSONB NOT NULL DEFAULT '[]'::jsonb,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_op_algo_logs_created
        ON operational_algorithm_activation_logs(created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_op_algo_logs_zone
        ON operational_algorithm_activation_logs(zone_id, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_op_algo_logs_severity
        ON operational_algorithm_activation_logs(severity, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_op_algo_logs_mode
        ON operational_algorithm_activation_logs(activation_mode, created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_op_algo_logs_algorithms_gin
        ON operational_algorithm_activation_logs USING GIN (activated_algorithms);

      CREATE INDEX IF NOT EXISTS idx_op_algo_logs_payload_gin
        ON operational_algorithm_activation_logs USING GIN (payload);
    `);

    console.log('✅ Migración de historial autónomo completada');
  } catch (error) {
    console.error('❌ Error en migración de historial autónomo:', error.message);
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}

run();
