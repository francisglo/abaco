import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = String(process.env.NODE_ENV || '').trim().toLowerCase();
const DB_CONNECTION_STRING = String(process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim();
const DB_HOST = String(process.env.DB_HOST || process.env.PGHOST || 'localhost').trim();
const DB_PORT = Number(String(process.env.DB_PORT || process.env.PGPORT || '5432').trim()) || 5432;
const DB_NAME = String(process.env.DB_NAME || process.env.PGDATABASE || 'abaco_db').trim();
const DB_USER = String(process.env.DB_USER || process.env.PGUSER || 'abaco_user').trim();
const DB_PASSWORD = String(process.env.DB_PASSWORD || process.env.PGPASSWORD || 'password').trim();

const TRANSIENT_ERROR_CODES = new Set([
  '40001',
  '40P01',
  '53300',
  '57014',
  '57P01',
  '57P02',
  '57P03'
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientDbError(error) {
  if (!error) return false;
  if (error.code && TRANSIENT_ERROR_CODES.has(error.code)) return true;

  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('connection terminated unexpectedly') ||
    message.includes('connection reset') ||
    message.includes('timeout') ||
    message.includes('econnreset') ||
    message.includes('too many clients')
  );
}

function computeBackoffMs(attempt) {
  const base = 25;
  const growth = base * (2 ** Math.max(attempt - 1, 0));
  const jitter = Math.floor(Math.random() * 20);
  return Math.min(growth + jitter, 500);
}

/**
 * Pool de conexiones a PostgreSQL
 * Gestiona conexiones reutilizables para mejor rendimiento
 */
const sslConfig = NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;

const pool = new Pool(
  DB_CONNECTION_STRING
    ? {
        connectionString: DB_CONNECTION_STRING,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000,
        ssl: sslConfig
      }
    : {
        host: DB_HOST,
        port: DB_PORT,
        database: DB_NAME,
        user: DB_USER,
        password: DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 8000,
        ssl: sslConfig
      }
);

// Manejar errores de conexión
pool.on('error', (error) => {
  console.error('Error no esperado en el pool de conexiones:', error);
});

/**
 * Clase para interactuar con la base de datos
 */
class Database {
  /**
   * Ejecutar una consulta SQL
   * @param {string} query - Consulta SQL
   * @param {array} values - Valores para prepared statements
   * @returns {Promise<object>} Resultado de la consulta
   */
  async query(query, values = []) {
    const start = Date.now();
    const maxRetries = Math.max(Number(process.env.DB_QUERY_MAX_RETRIES || 2), 0);

    for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
      try {
        const result = await pool.query(query, values);
        const duration = Date.now() - start;

        if (process.env.NODE_ENV === 'development') {
          console.log('⏱️  Consulta ejecutada:', { query: query.substring(0, 50), duration: `${duration}ms`, rows: result.rowCount, attempt });
        }

        return result;
      } catch (error) {
        const retryable = isTransientDbError(error);
        const hasNextAttempt = attempt <= maxRetries;

        if (retryable && hasNextAttempt) {
          const waitMs = computeBackoffMs(attempt);
          if (process.env.NODE_ENV !== 'production') {
            console.warn('⚠️ Reintentando consulta SQL por error transitorio', {
              attempt,
              maxRetries,
              waitMs,
              code: error.code,
              message: error.message
            });
          }
          await sleep(waitMs);
          continue;
        }

        console.error('Error en consulta SQL:', {
          query,
          code: error.code,
          attempts: attempt,
          error: error.message
        });
        throw error;
      }
    }
  }

  /**
   * Ejecutar una sola fila
   * @param {string} query - Consulta SQL
   * @param {array} values - Valores
   * @returns {Promise<object>} Una fila o null
   */
  async queryOne(query, values = []) {
    const result = await this.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Insertar un registro
   * @param {string} table - Nombre de tabla
   * @param {object} data - Datos a insertar
   * @returns {Promise<object>} Registro insertado
   */
  async insert(table, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(',');
    const query = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders}) RETURNING *`;
    
    return this.queryOne(query, values);
  }

  /**
   * Actualizar registros
   * @param {string} table - Nombre de tabla
   * @param {object} data - Datos a actualizar
   * @param {object} where - Condición WHERE
   * @returns {Promise<array>} Registros actualizados
   */
  async update(table, data, where) {
    const dataKeys = Object.keys(data);
    const whereKeys = Object.keys(where);
    const setClause = dataKeys.map((key, i) => `${key}=$${i + 1}`).join(',');
    const whereClause = whereKeys.map((key, i) => `${key}=$${dataKeys.length + i + 1}`).join(' AND ');
    
    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
    const values = [...Object.values(data), ...Object.values(where)];
    
    const result = await this.query(query, values);
    return result.rows;
  }

  /**
   * Eliminar registros
   * @param {string} table - Nombre de tabla
   * @param {object} where - Condición WHERE
   * @returns {Promise<number>} Cantidad de registros eliminados
   */
  async delete(table, where) {
    const whereKeys = Object.keys(where);
    const whereClause = whereKeys.map((key, i) => `${key}=$${i + 1}`).join(' AND ');
    const query = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    const result = await this.query(query, Object.values(where));
    return result.rowCount;
  }

  /**
   * Verificar conexión
   * @returns {Promise<void>}
   */
  async ping() {
    try {
      await pool.query('SELECT NOW()');
      return true;
    } catch (error) {
      console.error('Error en conexión a BD:', error);
      throw error;
    }
  }

  /**
   * Obtener pool para transacciones
   * @returns {Pool}
   */
  getPool() {
    return pool;
  }

  /**
   * Cerrar conexiones
   * @returns {Promise<void>}
   */
  async close() {
    await pool.end();
  }
}

export default new Database();
