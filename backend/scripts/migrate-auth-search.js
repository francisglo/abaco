import database from '../src/config/database.js';

async function run() {
  try {
    console.log('🔄 Ejecutando migración auth + search...');

    await database.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'local';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(128);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);

    await database.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
      CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin (name gin_trgm_ops);
    `).catch(async () => {
      await database.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');
      await database.query('CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin (name gin_trgm_ops)');
    });

    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_voters_name_trgm ON voters USING gin (name gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm ON tasks USING gin (title gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_citizen_requests_title_trgm ON citizen_requests USING gin (title gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_events_title_trgm ON events USING gin (title gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_volunteers_name_trgm ON volunteers USING gin (name gin_trgm_ops);
    `).catch(() => {});

    console.log('✅ Migración completada');
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}

run();
