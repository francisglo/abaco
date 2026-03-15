import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  getStudentProposals,
  createStudentProposal,
  voteStudentProposal,
  getStudentProposalVotes,
  deleteStudentProposal
} from '../controllers/studentProposalsController.js';

const router = express.Router();

router.use(authenticate);

// Propuestas estudiantiles
router.get('/', getStudentProposals); // Listar propuestas
router.post('/', validate('createStudentProposal'), createStudentProposal); // Crear propuesta
router.post('/vote', validate('voteStudentProposal'), voteStudentProposal); // Votar
router.get('/:proposalId/votes', getStudentProposalVotes); // Obtener votos de una propuesta
router.delete('/:id', deleteStudentProposal); // Eliminar propuesta

export default router;
