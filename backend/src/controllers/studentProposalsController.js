import database from '../config/database.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

// Obtener todas las propuestas estudiantiles (paginado)
export const getStudentProposals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const countResult = await database.query('SELECT COUNT(*) as count FROM student_proposals');
  const total = parseInt(countResult.rows[0].count);
  const pages = Math.ceil(total / limit);
  const result = await database.query(
    'SELECT * FROM student_proposals ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  res.json({
    data: result.rows,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages }
  });
});

// Crear nueva propuesta estudiantil
export const createStudentProposal = asyncHandler(async (req, res) => {
  const { userId, title, description } = req.body;
  if (!userId || !title || !description) throw new AppError('Faltan campos obligatorios', 400);
  const result = await database.query(
    'INSERT INTO student_proposals (user_id, title, description, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *',
    [userId, title, description]
  );
  res.status(201).json(result.rows[0]);
});

// Votar propuesta estudiantil
export const voteStudentProposal = asyncHandler(async (req, res) => {
  const { proposalId, userId, value } = req.body;
  if (!proposalId || !userId || ![1, -1].includes(value)) throw new AppError('Datos de voto inválidos', 400);
  // Un usuario solo puede votar una vez por propuesta
  const existing = await database.query('SELECT * FROM student_votes WHERE proposal_id = $1 AND user_id = $2', [proposalId, userId]);
  if (existing.rows.length > 0) {
    await database.query('UPDATE student_votes SET value = $1 WHERE proposal_id = $2 AND user_id = $3', [value, proposalId, userId]);
    res.json({ message: 'Voto actualizado' });
  } else {
    await database.query('INSERT INTO student_votes (proposal_id, user_id, value, created_at) VALUES ($1, $2, $3, NOW())', [proposalId, userId, value]);
    res.status(201).json({ message: 'Voto registrado' });
  }
});

// Obtener votos de una propuesta
export const getStudentProposalVotes = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const result = await database.query('SELECT value, COUNT(*) as count FROM student_votes WHERE proposal_id = $1 GROUP BY value', [proposalId]);
  res.json(result.rows);
});

// Eliminar propuesta (solo autor o admin)
export const deleteStudentProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, isAdmin } = req.body;
  const proposal = await database.query('SELECT * FROM student_proposals WHERE id = $1', [id]);
  if (!proposal.rows.length) throw new AppError('Propuesta no encontrada', 404);
  if (proposal.rows[0].user_id !== userId && !isAdmin) throw new AppError('No autorizado', 403);
  await database.query('DELETE FROM student_proposals WHERE id = $1', [id]);
  await database.query('DELETE FROM student_votes WHERE proposal_id = $1', [id]);
  res.json({ message: 'Propuesta eliminada' });
});
