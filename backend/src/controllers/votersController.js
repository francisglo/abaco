import database from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

/**
 * Controlador de Votantes
 */

/**
 * Obtener todos los votantes con paginación y filtros
 * GET /api/voters?page=1&limit=20&status=pending
 */
export const getVoters = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, priority, zoneId, search } = req.query;

  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM voters WHERE 1=1';
  const values = [];
  let paramCount = 1;

  // Filtro por estado
  if (status) {
    query += ` AND status = $${paramCount}`;
    values.push(status);
    paramCount++;
  }

  // Filtro por prioridad
  if (priority) {
    query += ` AND priority = $${paramCount}`;
    values.push(priority);
    paramCount++;
  }

  // Filtro por zona
  if (zoneId) {
    query += ` AND zone_id = $${paramCount}`;
    values.push(parseInt(zoneId));
    paramCount++;
  }

  // Búsqueda por nombre, email o teléfono
  if (search) {
    query += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`;
    values.push(`%${search}%`);
    paramCount++;
  }

  // Contar total
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const countResult = await database.queryOne(countQuery, values);
  const total = parseInt(countResult.count);

  // Paginación
  query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(limit, offset);

  const result = await database.query(query, values);

  res.json({
    data: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Obtener un votante por ID
 * GET /api/voters/:id
 */
export const getVoterById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const voter = await database.queryOne(
    'SELECT * FROM voters WHERE id = $1',
    [id]
  );

  if (!voter) {
    throw new AppError('Votante no encontrado', 404, 'VOTER_NOT_FOUND');
  }

  res.json({ data: voter });
});

/**
 * Crear nuevo votante
 * POST /api/voters
 */
export const createVoter = asyncHandler(async (req, res) => {
  const { name, dni, phone, email, address, zoneId, status, priority, latitude, longitude } = req.body;

  // Verificar DNI único
  const existing = await database.queryOne(
    'SELECT id FROM voters WHERE dni = $1',
    [dni]
  );

  if (existing) {
    throw new AppError('DNI ya registrado', 409, 'DNI_EXISTS');
  }

  const voter = await database.insert('voters', {
    name,
    dni,
    phone,
    email,
    address,
    zone_id: zoneId,
    status: status || 'pending',
    priority: priority || 'medium',
    latitude,
    longitude,
    created_at: new Date(),
    updated_at: new Date()
  });

  res.status(201).json({
    message: 'Votante creado correctamente',
    data: voter
  });
});

/**
 * Actualizar votante
 * PUT /api/voters/:id
 */
export const updateVoter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Verificar que existe
  const voter = await database.queryOne(
    'SELECT id FROM voters WHERE id = $1',
    [id]
  );

  if (!voter) {
    throw new AppError('Votante no encontrado', 404, 'VOTER_NOT_FOUND');
  }

  // Agregar timestamp de actualización
  updates.updated_at = new Date();

  const updated = await database.update('voters', updates, { id });

  res.json({
    message: 'Votante actualizado correctamente',
    data: updated[0]
  });
});

/**
 * Eliminar votante
 * DELETE /api/voters/:id
 */
export const deleteVoter = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const rowCount = await database.delete('voters', { id });

  if (rowCount === 0) {
    throw new AppError('Votante no encontrado', 404, 'VOTER_NOT_FOUND');
  }

  res.json({
    message: 'Votante eliminado correctamente'
  });
});

/**
 * Importar votantes en lote (CSV)
 * POST /api/voters/import
 */
export const importVoters = asyncHandler(async (req, res) => {
  const { voters } = req.body;

  if (!Array.isArray(voters) || voters.length === 0) {
    throw new AppError('Array de votantes requerido', 400, 'INVALID_FORMAT');
  }

  const inserted = [];
  const errors = [];

  for (const voter of voters) {
    try {
      const result = await database.insert('voters', {
        ...voter,
        created_at: new Date(),
        updated_at: new Date()
      });
      inserted.push(result);
    } catch (error) {
      errors.push({
        voter: voter.name || 'Unknown',
        error: error.message
      });
    }
  }

  res.json({
    message: `${inserted.length} votantes importados correctamente`,
    inserted: inserted.length,
    errors: errors.length,
    details: errors.length > 0 ? errors : undefined
  });
});

/**
 * Obtener estadísticas de votantes
 * GET /api/voters/stats
 */
export const getVoterStats = asyncHandler(async (req, res) => {
  const stats = await database.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
      COUNT(CASE WHEN priority = 'high' THEN 1 END) as highPriority
    FROM voters
  `);

  res.json({
    stats: stats.rows[0]
  });
});
