import dotenv from 'dotenv';
import pkg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function queryExtensions() {
  const extResult = await pool.query(
    "SELECT extname FROM pg_extension WHERE extname IN ('postgis', 'postgis_topology') ORDER BY extname"
  );
  return extResult.rows.map((row) => row.extname);
}

async function main() {
  const shouldEnable = process.argv.includes('--enable-postgis');

  try {
    const identity = await pool.query(
      'SELECT NOW() AS now, current_database() AS db, current_user AS usr, version() AS pg_version'
    );

    const before = await queryExtensions();
    let spatialProbe = null;

    if (before.includes('postgis')) {
      const probeResult = await pool.query(
        "SELECT ST_AsText(ST_SetSRID(ST_Point(-74.0721, 4.7110), 4326)) AS point_wkt, ST_DistanceSphere(ST_SetSRID(ST_Point(-74.0721, 4.7110), 4326), ST_SetSRID(ST_Point(-74.0817, 4.6097), 4326)) AS meters"
      );
      spatialProbe = probeResult.rows[0] || null;
    }

    let enableResult = null;
    if (shouldEnable && !before.includes('postgis')) {
      try {
        await pool.query('CREATE EXTENSION IF NOT EXISTS postgis');
        enableResult = { enabled: true, message: 'PostGIS habilitado con éxito' };
      } catch (error) {
        enableResult = {
          enabled: false,
          message: 'No se pudo habilitar PostGIS automáticamente',
          error: error.message,
          code: error.code || null
        };
      }
    }

    const after = await queryExtensions();

    console.log(
      JSON.stringify(
        {
          connected: true,
          database: identity.rows[0].db,
          user: identity.rows[0].usr,
          serverTime: identity.rows[0].now,
          postgresVersion: identity.rows[0].pg_version,
          postgis: {
            installedBefore: before,
            installedAfter: after,
            enabledByScript: enableResult
          },
          spatialProbe
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          connected: false,
          error: error.message,
          code: error.code || null
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

main();
