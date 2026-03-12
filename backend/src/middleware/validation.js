import Joi from 'joi';
import {
  createCitizenRequestSchema,
  updateCitizenRequestSchema,
  addCaseTrackingSchema,
  createEventSchema,
  updateEventAttendanceSchema,
  createActivitySchema,
  updateActivitySchema,
  createVolunteerSchema,
  assignVolunteerSchema,
  recordVolunteerHoursSchema,
  submitFieldReportSchema,
  reviewFieldReportSchema,
  createGoalSchema,
  updateGoalProgressSchema,
  createProjectSchema,
  updateProjectStatusSchema,
  addMilestoneSchema,
  completeMilestoneSchema,
  recordIndicatorSchema,
  compareZonesSchema,
  getTrendsSchema,
  analyzePoliticalRisksSchema,
  createStrategicAlertSchema,
  acknowledgeAlertSchema,
  recordSocialLeaderSchema,
  recordCommitmentSchema,
  completeCommitmentSchema,
  paginationSchema,
  filterByStatusSchema,
  filterByZoneSchema,
  filterByDateRangeSchema,
  filterCitizenRequestsSchema,
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
  createSubscriptionSchema,
  updateSubscriptionSchema,
  cancelSubscriptionSchema,
  renewSubscriptionSchema,
  recordSubscriptionPaymentSchema,
  filterSubscriptionsSchema
} from './validationSchemas.js';

/**
 * Schemas de validación para endpoints
 */

export const validationSchemas = {
  // ===== USUARIOS =====
  createUser: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional().allow('', null),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('admin', 'manager', 'operator', 'auditor', 'viewer', 'campaign_manager', 'visitor', 'security_monitor').default('operator'),
    zoneId: Joi.number().integer().positive(),
    phone: Joi.string().pattern(/^[0-9\-\+\s]{10,}$/).optional()
  }).or('email', 'username'),

  loginUser: Joi.object({
    identifier: Joi.string().min(3).max(120).optional(),
    email: Joi.string().email().optional(),
    username: Joi.string().alphanum().min(3).max(30).optional(),
    password: Joi.string().required()
  }).or('identifier', 'email', 'username'),

  googleAuth: Joi.object({
    idToken: Joi.string().min(20).required(),
    role: Joi.string().valid('admin', 'manager', 'operator', 'auditor', 'viewer', 'campaign_manager', 'visitor', 'security_monitor').default('operator'),
    phone: Joi.string().pattern(/^[0-9\-\+\s]{7,}$/).optional(),
    zoneId: Joi.number().integer().positive().optional()
  }),

  updateUser: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    role: Joi.string().valid('admin', 'manager', 'operator', 'auditor', 'viewer', 'campaign_manager', 'visitor', 'security_monitor'),
    zoneId: Joi.number().integer().positive(),
    phone: Joi.string().pattern(/^[0-9\-\+\s]{10,}$/),
    active: Joi.boolean()
  }).min(1),

  // ===== VOTANTES =====
  createVoter: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    dni: Joi.string().pattern(/^[0-9]{6,10}$/).required(),
    phone: Joi.string().pattern(/^[0-9\-\+\s]{10,}$/).required(),
    email: Joi.string().email().required(),
    address: Joi.string().max(255).required(),
    zoneId: Joi.number().integer().positive().required(),
    status: Joi.string().valid('pending', 'confirmed', 'active', 'inactive').default('pending'),
    priority: Joi.string().valid('high', 'medium', 'low').default('medium'),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  }),

  updateVoter: Joi.object({
    name: Joi.string().min(2).max(100),
    phone: Joi.string().pattern(/^[0-9\-\+\s]{10,}$/),
    email: Joi.string().email(),
    address: Joi.string().max(255),
    status: Joi.string().valid('pending', 'confirmed', 'active', 'inactive'),
    priority: Joi.string().valid('high', 'medium', 'low'),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
  }).min(1),

  // ===== ZONAS =====
  createZone: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    priority: Joi.number().integer().min(1).default(3),
    manager: Joi.string().max(100),
    description: Joi.string().max(500)
  }),

  updateZone: Joi.object({
    name: Joi.string().min(2).max(100),
    priority: Joi.number().integer().min(1),
    manager: Joi.string().max(100),
    description: Joi.string().max(500)
  }).min(1),

  // ===== TAREAS =====
  createTask: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(1000),
    assignedTo: Joi.number().integer().positive().required(),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').default('pending'),
    priority: Joi.string().valid('high', 'medium', 'low').default('medium'),
    dueDate: Joi.date().iso(),
    type: Joi.string().valid('field_work', 'meeting', 'data', 'report').default('field_work')
  }),

  updateTask: Joi.object({
    title: Joi.string().min(3).max(100),
    description: Joi.string().max(1000),
    assignedTo: Joi.number().integer().positive(),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled'),
    priority: Joi.string().valid('high', 'medium', 'low'),
    dueDate: Joi.date().iso(),
    completed: Joi.boolean()
  }).min(1),

  // ===== PAGINACIÓN =====
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string(),
    order: Joi.string().valid('ASC', 'DESC').default('DESC')
  }),

  globalSearch: Joi.object({
    q: Joi.string().min(2).max(120).required(),
    limit: Joi.number().integer().min(1).max(50).default(8),
    scope: Joi.string().max(200).default('all')
  }),

  // ===== CITIZEN REQUESTS =====
  createCitizenRequest: createCitizenRequestSchema,
  updateCitizenRequest: updateCitizenRequestSchema,
  addCaseTracking: addCaseTrackingSchema,
  filterCitizenRequests: filterCitizenRequestsSchema,

  // ===== TERRITORIAL COMMUNICATION =====
  createEvent: createEventSchema,
  updateEventAttendance: updateEventAttendanceSchema,
  createActivity: createActivitySchema,
  updateActivity: updateActivitySchema,
  createVolunteer: createVolunteerSchema,
  assignVolunteer: assignVolunteerSchema,
  recordVolunteerHours: recordVolunteerHoursSchema,
  submitFieldReport: submitFieldReportSchema,
  reviewFieldReport: reviewFieldReportSchema,

  // ===== MANAGEMENT INDICATORS =====
  createGoal: createGoalSchema,
  updateGoalProgress: updateGoalProgressSchema,
  createProject: createProjectSchema,
  updateProjectStatus: updateProjectStatusSchema,
  addMilestone: addMilestoneSchema,
  completeMilestone: completeMilestoneSchema,
  recordIndicator: recordIndicatorSchema,

  // ===== STRATEGIC INTELLIGENCE =====
  compareZones: compareZonesSchema,
  getTrends: getTrendsSchema,
  analyzePoliticalRisks: analyzePoliticalRisksSchema,
  createStrategicAlert: createStrategicAlertSchema,
  acknowledgeAlert: acknowledgeAlertSchema,
  recordSocialLeader: recordSocialLeaderSchema,
  recordCommitment: recordCommitmentSchema,
  completeCommitment: completeCommitmentSchema,

  // ===== FILTERS =====
  filterByStatus: filterByStatusSchema,
  filterByZone: filterByZoneSchema,
  filterByDateRange: filterByDateRangeSchema,

  // ===== SUBSCRIPTIONS =====
  createSubscriptionPlan: createSubscriptionPlanSchema,
  updateSubscriptionPlan: updateSubscriptionPlanSchema,
  createSubscription: createSubscriptionSchema,
  updateSubscription: updateSubscriptionSchema,
  cancelSubscription: cancelSubscriptionSchema,
  renewSubscription: renewSubscriptionSchema,
  recordSubscriptionPayment: recordSubscriptionPaymentSchema,
  filterSubscriptions: filterSubscriptionsSchema,
  paginationExtended: paginationSchema
};

/**
 * Middleware de validación
 * @param {string} schemaKey - Clave del schema en validationSchemas
 * @returns {Function}
 */
export function validate(schemaKey) {
  return (req, res, next) => {
    const schema = validationSchemas[schemaKey];
    
    if (!schema) {
      return next(new Error(`Schema de validación no encontrado: ${schemaKey}`));
    }

    const dataToValidate = ['GET', 'DELETE'].includes(req.method)
      ? req.query
      : req.body;

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      error.isJoi = true;
      return next(error);
    }

    // Reemplazar con datos validados
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      req.body = value;
    } else {
      req.query = value;
    }

    next();
  };
}
