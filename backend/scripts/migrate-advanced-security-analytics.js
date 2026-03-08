import database from '../src/config/database.js';

async function run() {
  try {
    console.log('🔐 Ejecutando migración avanzada de seguridad + eficiencia...');

    await database.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    await database.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_voters_latitude_range'
        ) THEN
          ALTER TABLE voters
            ADD CONSTRAINT chk_voters_latitude_range
            CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)) NOT VALID;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_voters_longitude_range'
        ) THEN
          ALTER TABLE voters
            ADD CONSTRAINT chk_voters_longitude_range
            CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180)) NOT VALID;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_citizen_requests_latitude_range'
        ) THEN
          ALTER TABLE citizen_requests
            ADD CONSTRAINT chk_citizen_requests_latitude_range
            CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)) NOT VALID;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_citizen_requests_longitude_range'
        ) THEN
          ALTER TABLE citizen_requests
            ADD CONSTRAINT chk_citizen_requests_longitude_range
            CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180)) NOT VALID;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_events_latitude_range'
        ) THEN
          ALTER TABLE events
            ADD CONSTRAINT chk_events_latitude_range
            CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)) NOT VALID;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_events_longitude_range'
        ) THEN
          ALTER TABLE events
            ADD CONSTRAINT chk_events_longitude_range
            CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180)) NOT VALID;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_field_reports_latitude_range'
        ) THEN
          ALTER TABLE field_reports
            ADD CONSTRAINT chk_field_reports_latitude_range
            CHECK (latitude IS NULL OR (latitude BETWEEN -90 AND 90)) NOT VALID;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'chk_field_reports_longitude_range'
        ) THEN
          ALTER TABLE field_reports
            ADD CONSTRAINT chk_field_reports_longitude_range
            CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180)) NOT VALID;
        END IF;
      END
      $$;
    `);

    await database.query(`
      ALTER TABLE voters ADD COLUMN IF NOT EXISTS data_hash TEXT;
      ALTER TABLE citizen_requests ADD COLUMN IF NOT EXISTS data_hash TEXT;
      ALTER TABLE events ADD COLUMN IF NOT EXISTS data_hash TEXT;
      ALTER TABLE field_reports ADD COLUMN IF NOT EXISTS data_hash TEXT;
    `);

    await database.query(`
      CREATE OR REPLACE FUNCTION set_advanced_data_hash()
      RETURNS trigger AS
      $hash$
      BEGIN
        IF TG_TABLE_NAME = 'voters' THEN
          NEW.data_hash := encode(
            digest(
              concat_ws('|', NEW.id, NEW.name, NEW.dni, NEW.zone_id, NEW.status, NEW.priority, NEW.latitude, NEW.longitude),
              'sha256'
            ),
            'hex'
          );
        ELSIF TG_TABLE_NAME = 'citizen_requests' THEN
          NEW.data_hash := encode(
            digest(
              concat_ws('|', NEW.id, NEW.title, NEW.request_type, NEW.zone_id, NEW.status, NEW.priority, NEW.urgency, NEW.latitude, NEW.longitude),
              'sha256'
            ),
            'hex'
          );
        ELSIF TG_TABLE_NAME = 'events' THEN
          NEW.data_hash := encode(
            digest(
              concat_ws('|', NEW.id, NEW.title, NEW.event_type, NEW.zone_id, NEW.status, NEW.event_date, NEW.latitude, NEW.longitude),
              'sha256'
            ),
            'hex'
          );
        ELSIF TG_TABLE_NAME = 'field_reports' THEN
          NEW.data_hash := encode(
            digest(
              concat_ws('|', NEW.id, NEW.title, NEW.report_type, NEW.zone_id, NEW.status, NEW.report_date, NEW.latitude, NEW.longitude),
              'sha256'
            ),
            'hex'
          );
        END IF;

        RETURN NEW;
      END
      $hash$ LANGUAGE plpgsql;
    `);

    await database.query(`
      DROP TRIGGER IF EXISTS trg_voters_data_hash ON voters;
      CREATE TRIGGER trg_voters_data_hash
      BEFORE INSERT OR UPDATE ON voters
      FOR EACH ROW EXECUTE FUNCTION set_advanced_data_hash();

      DROP TRIGGER IF EXISTS trg_citizen_requests_data_hash ON citizen_requests;
      CREATE TRIGGER trg_citizen_requests_data_hash
      BEFORE INSERT OR UPDATE ON citizen_requests
      FOR EACH ROW EXECUTE FUNCTION set_advanced_data_hash();

      DROP TRIGGER IF EXISTS trg_events_data_hash ON events;
      CREATE TRIGGER trg_events_data_hash
      BEFORE INSERT OR UPDATE ON events
      FOR EACH ROW EXECUTE FUNCTION set_advanced_data_hash();

      DROP TRIGGER IF EXISTS trg_field_reports_data_hash ON field_reports;
      CREATE TRIGGER trg_field_reports_data_hash
      BEFORE INSERT OR UPDATE ON field_reports
      FOR EACH ROW EXECUTE FUNCTION set_advanced_data_hash();
    `);

    await database.query(`
      UPDATE voters SET updated_at = updated_at;
      UPDATE citizen_requests SET updated_at = updated_at;
      UPDATE events SET updated_at = updated_at;
      UPDATE field_reports SET updated_at = updated_at;
    `);

    await database.query(`
      CREATE INDEX IF NOT EXISTS idx_voters_zone_status_created ON voters(zone_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_requests_zone_status_created ON citizen_requests(zone_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_events_zone_status_created ON events(zone_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reports_zone_status_created ON field_reports(zone_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_voters_data_hash ON voters(data_hash);
      CREATE INDEX IF NOT EXISTS idx_requests_data_hash ON citizen_requests(data_hash);
      CREATE INDEX IF NOT EXISTS idx_events_data_hash ON events(data_hash);
      CREATE INDEX IF NOT EXISTS idx_reports_data_hash ON field_reports(data_hash);
    `);

    await database.query(`
      CREATE TABLE IF NOT EXISTS analytics_snapshots (
        id BIGSERIAL PRIMARY KEY,
        snapshot_type VARCHAR(60) NOT NULL,
        zone_id INTEGER,
        payload JSONB NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_type_created
        ON analytics_snapshots(snapshot_type, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_zone
        ON analytics_snapshots(zone_id);
    `);

    console.log('✅ Migración avanzada completada');
  } catch (error) {
    console.error('❌ Error en migración avanzada:', error.message);
    process.exitCode = 1;
  } finally {
    await database.close();
  }
}

run();
