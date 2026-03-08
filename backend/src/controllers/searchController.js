import database from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const SEARCH_SCOPES = {
  users: {
    query: `
      SELECT id, name, email, role, 'users'::text AS source
      FROM users
      WHERE active = true
        AND (
          name ILIKE $1
          OR email ILIKE $1
          OR role ILIKE $1
        )
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
      LIMIT $2
    `
  },
  voters: {
    query: `
      SELECT id, name, email, phone, dni, status, priority, 'voters'::text AS source
      FROM voters
      WHERE (
        name ILIKE $1
        OR email ILIKE $1
        OR phone ILIKE $1
        OR dni ILIKE $1
      )
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
      LIMIT $2
    `
  },
  zones: {
    query: `
      SELECT id, name, manager, priority, 'zones'::text AS source
      FROM zones
      WHERE (
        name ILIKE $1
        OR manager ILIKE $1
        OR description ILIKE $1
      )
      ORDER BY priority ASC, updated_at DESC NULLS LAST
      LIMIT $2
    `
  },
  tasks: {
    query: `
      SELECT id, title, status, priority, due_date, 'tasks'::text AS source
      FROM tasks
      WHERE (
        title ILIKE $1
        OR description ILIKE $1
        OR status ILIKE $1
      )
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
      LIMIT $2
    `
  },
  citizen_requests: {
    query: `
      SELECT id, title, request_type, status, priority, citizen_name, 'citizen_requests'::text AS source
      FROM citizen_requests
      WHERE (
        title ILIKE $1
        OR description ILIKE $1
        OR citizen_name ILIKE $1
      )
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
      LIMIT $2
    `
  },
  events: {
    query: `
      SELECT id, title, event_type, event_date, status, location, 'events'::text AS source
      FROM events
      WHERE (
        title ILIKE $1
        OR description ILIKE $1
        OR location ILIKE $1
      )
      ORDER BY event_date DESC NULLS LAST, updated_at DESC NULLS LAST
      LIMIT $2
    `
  },
  volunteers: {
    query: `
      SELECT id, name, email, skill_area, status, 'volunteers'::text AS source
      FROM volunteers
      WHERE (
        name ILIKE $1
        OR email ILIKE $1
        OR skill_area ILIKE $1
        OR organization ILIKE $1
      )
      ORDER BY updated_at DESC NULLS LAST, created_at DESC
      LIMIT $2
    `
  }
};

export const globalSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(parseInt(req.query.limit, 10) || 8, 50);
  const scope = String(req.query.scope || 'all').trim();

  if (!q || q.length < 2) {
    return res.status(400).json({
      error: 'Parámetro q inválido',
      code: 'INVALID_SEARCH_QUERY',
      message: 'La búsqueda requiere al menos 2 caracteres'
    });
  }

  const searchTerm = `%${q}%`;
  const requestedScopes = scope === 'all'
    ? Object.keys(SEARCH_SCOPES)
    : scope.split(',').map((item) => item.trim()).filter(Boolean);

  const validScopes = requestedScopes.filter((item) => SEARCH_SCOPES[item]);

  if (validScopes.length === 0) {
    return res.status(400).json({
      error: 'Scope inválido',
      code: 'INVALID_SEARCH_SCOPE',
      validScopes: ['all', ...Object.keys(SEARCH_SCOPES)]
    });
  }

  const results = {};
  let total = 0;

  for (const searchScope of validScopes) {
    const query = SEARCH_SCOPES[searchScope].query;
    const response = await database.query(query, [searchTerm, limit]);
    results[searchScope] = response.rows;
    total += response.rows.length;
  }

  res.json({
    q,
    limit,
    scopes: validScopes,
    total,
    results
  });
});
