import database from '../src/config/database.js';

async function run() {
  try {
    console.log('🔐 Migración: Agregando pin_hash y pattern_hash a users...');

    await database.query(`
      ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(128),
        ADD COLUMN IF NOT EXISTS pattern_hash VARCHAR(256);
    `);

    console.log('✅ Migración de pin_hash y pattern_hash completada');
  } catch (error) {
    console.error('❌ Error en migración de pin_hash/pattern_hash:', error.message);
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}

run();
