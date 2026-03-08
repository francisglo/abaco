import database from '../src/config/database.js';

async function ensurePostgis() {
  try {
    await database.query('CREATE EXTENSION IF NOT EXISTS postgis');
  } catch (error) {
    throw new Error(
      `No fue posible activar PostGIS automáticamente. Actívalo con un usuario administrador en la BD 'abaco_db': CREATE EXTENSION postgis; Detalle: ${error.message}`
    );
  }
}

async function run() {
  try {
    console.log('🗺️ Ejecutando migración PostGIS + sincronización geoespacial...');

    await ensurePostgis();

    await database.query(`
      ALTER TABLE voters ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);
      ALTER TABLE citizen_requests ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);
      ALTER TABLE events ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);
      ALTER TABLE field_reports ADD COLUMN IF NOT EXISTS geom geometry(Point, 4326);
    `);

    await database.query(`
      UPDATE voters
      SET geom = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)
      WHERE geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

      UPDATE citizen_requests
      SET geom = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)
      WHERE geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

      UPDATE events
      SET geom = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)
      WHERE geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

      UPDATE field_reports
      SET geom = ST_SetSRID(ST_MakePoint(longitude::double precision, latitude::double precision), 4326)
      WHERE geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;
    `);

    await database.query(`
      CREATE OR REPLACE FUNCTION sync_geo_from_latlng()
      RETURNS trigger AS
      $sync$
      BEGIN
        IF NEW.geom IS NULL AND NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
          NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude::double precision, NEW.latitude::double precision), 4326);
        END IF;

        IF NEW.geom IS NOT NULL THEN
          NEW.longitude := ROUND(CAST(ST_X(NEW.geom) AS numeric), 8);
          NEW.latitude := ROUND(CAST(ST_Y(NEW.geom) AS numeric), 8);
        END IF;

        RETURN NEW;
      END
      $sync$ LANGUAGE plpgsql;
    `);

    await database.query(`
      DROP TRIGGER IF EXISTS trg_sync_voters_geo ON voters;
      CREATE TRIGGER trg_sync_voters_geo
      BEFORE INSERT OR UPDATE ON voters
      FOR EACH ROW EXECUTE FUNCTION sync_geo_from_latlng();

      DROP TRIGGER IF EXISTS trg_sync_citizen_requests_geo ON citizen_requests;
      CREATE TRIGGER trg_sync_citizen_requests_geo
      BEFORE INSERT OR UPDATE ON citizen_requests
      FOR EACH ROW EXECUTE FUNCTION sync_geo_from_latlng();

      DROP TRIGGER IF EXISTS trg_sync_events_geo ON events;
      CREATE TRIGGER trg_sync_events_geo
      BEFORE INSERT OR UPDATE ON events
      FOR EACH ROW EXECUTE FUNCTION sync_geo_from_latlng();

      DROP TRIGGER IF EXISTS trg_sync_field_reports_geo ON field_reports;
      CREATE TRIGGER trg_sync_field_reports_geo
      BEFORE INSERT OR UPDATE ON field_reports
      FOR EACH ROW EXECUTE FUNCTION sync_geo_from_latlng();
    `);

    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_voters_geom_gist ON voters USING GIST (geom);
      CREATE INDEX IF NOT EXISTS idx_citizen_requests_geom_gist ON citizen_requests USING GIST (geom);
      CREATE INDEX IF NOT EXISTS idx_events_geom_gist ON events USING GIST (geom);
      CREATE INDEX IF NOT EXISTS idx_field_reports_geom_gist ON field_reports USING GIST (geom);
    `);

    await database.query(`
      CREATE OR REPLACE VIEW geo_entities AS
      SELECT
        'voters'::text AS entity_type,
        id AS entity_id,
        zone_id,
        name AS title,
        status,
        created_at,
        geom,
        jsonb_build_object(
          'priority', priority,
          'dni', dni,
          'email', email,
          'phone', phone,
          'address', address
        ) AS properties
      FROM voters
      WHERE geom IS NOT NULL

      UNION ALL

      SELECT
        'citizen_requests'::text AS entity_type,
        id AS entity_id,
        zone_id,
        title,
        status,
        created_at,
        geom,
        jsonb_build_object(
          'request_type', request_type,
          'priority', priority,
          'urgency', urgency,
          'citizen_name', citizen_name
        ) AS properties
      FROM citizen_requests
      WHERE geom IS NOT NULL

      UNION ALL

      SELECT
        'events'::text AS entity_type,
        id AS entity_id,
        zone_id,
        title,
        status,
        created_at,
        geom,
        jsonb_build_object(
          'event_type', event_type,
          'event_date', event_date,
          'location', location,
          'expected_attendees', expected_attendees,
          'actual_attendees', actual_attendees
        ) AS properties
      FROM events
      WHERE geom IS NOT NULL

      UNION ALL

      SELECT
        'field_reports'::text AS entity_type,
        id AS entity_id,
        zone_id,
        COALESCE(title, report_type) AS title,
        status,
        created_at,
        geom,
        jsonb_build_object(
          'report_type', report_type,
          'report_date', report_date,
          'reporter_id', reporter_id,
          'location', location
        ) AS properties
      FROM field_reports
      WHERE geom IS NOT NULL;
    `);

    console.log('✅ Migración PostGIS completada');
  } catch (error) {
    console.error('❌ Error en migración PostGIS:', error.message);
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}

run();
