// Modelos y typedefs para propuestas y votos estudiantiles

/**
 * @typedef {Object} StudentProposal
 * @property {number} id - ID único de la propuesta
 * @property {number} userId - ID del usuario creador
 * @property {string} title - Título de la propuesta
 * @property {string} description - Descripción de la propuesta
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de actualización
 */
export const StudentProposalModel = {
  id: 'number',
  userId: 'number',
  title: 'string',
  description: 'string',
  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

/**
 * @typedef {Object} StudentVote
 * @property {number} id - ID único del voto
 * @property {number} proposalId - ID de la propuesta
 * @property {number} userId - ID del usuario votante
 * @property {number} value - Valor del voto (1 = a favor, -1 = en contra)
 * @property {Date} createdAt - Fecha de creación
 */
export const StudentVoteModel = {
  id: 'number',
  proposalId: 'number',
  userId: 'number',
  value: 'number',
  createdAt: 'timestamp'
};
