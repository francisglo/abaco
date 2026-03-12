import database from '../src/config/database.js';

function sanitizeUsername(seed = '') {
  const normalized = String(seed || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalized.slice(0, 24) || 'user';
}

async function run() {
  try {
    console.log('👤 Ejecutando migración de username en users...');

    await database.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(LOWER(username));
    `);

    const { rows } = await database.query(`
      SELECT id, email, name
      FROM users
      WHERE username IS NULL OR TRIM(username) = ''
      ORDER BY id ASC
    `);

    for (const row of rows || []) {
      const emailPrefix = String(row.email || '').split('@')[0];
      const nameSeed = String(row.name || '').split(' ')[0];
      const base = sanitizeUsername(emailPrefix || nameSeed || `user${row.id}`);
      let candidate = base;
      let suffix = 1;

      while (true) {
        const exists = await database.queryOne(
          'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id <> $2',
          [candidate, row.id]
        );

        if (!exists) break;
        suffix += 1;
        const trimmedBase = base.slice(0, Math.max(1, 24 - String(suffix).length));
        candidate = `${trimmedBase}${suffix}`;
      }

      await database.query(
        'UPDATE users SET username = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [candidate, row.id]
      );
    }

    console.log('✅ Migración de username completada');
  } catch (error) {
    console.error('❌ Error en migración de username:', error.message);
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}

run();
