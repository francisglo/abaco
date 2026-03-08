import Joi from 'joi';

/**
 * ===== CITIZEN REQUESTS VALIDATION SCHEMAS =====
 */
export const createCitizenRequestSchema = Joi.object({
  request_type: Joi.string().valid('petition', 'complaint', 'suggestion', 'claim').required(),
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  citizen_name: Joi.string().min(3).max(100).required(),
  citizen_phone: Joi.string().regex(/^[0-9+\-\s()]+$/).required(),
  citizen_email: Joi.string().email().required(),
  zone_id: Joi.number().integer().positive().required(),
  urgency: Joi.number().integer().min(1).max(5).required(),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180)
});

export const updateCitizenRequestSchema = Joi.object({
  status: Joi.string().valid('pending', 'in_progress', 'resolved').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  assigned_to: Joi.number().integer().positive().optional(),
  urgency: Joi.number().integer().min(1).max(5).optional(),
  resolution_notes: Joi.string().max(2000).optional()
});

export const addCaseTrackingSchema = Joi.object({
  activity: Joi.string().min(10).max(500).required(),
  status_change: Joi.string().valid('pending', 'in_progress', 'resolved').required(),
  notes: Joi.string().max(1000)
});

/**
 * ===== TERRITORIAL COMMUNICATION VALIDATION SCHEMAS =====
 */
export const createEventSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  event_type: Joi.string().valid('community_meeting', 'training', 'mobilization', 'assembly', 'other').required(),
  zone_id: Joi.number().integer().positive().required(),
  location: Joi.string().min(5).max(300).required(),
  event_date: Joi.date().iso().required(),
  event_time: Joi.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/).required(),
  expected_attendees: Joi.number().integer().min(0),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180)
});

export const updateEventAttendanceSchema = Joi.object({
  actual_attendees: Joi.number().integer().min(0).required(),
  report: Joi.string().max(2000).optional(),
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional()
});

export const createActivitySchema = Joi.object({
  event_id: Joi.number().integer().positive().required(),
  activity_type: Joi.string().valid('workshop', 'discussion', 'networking', 'presentation', 'other').required(),
  description: Joi.string().min(10).max(1000).required(),
  assigned_to: Joi.number().integer().positive().required(),
  scheduled_date: Joi.date().iso().required()
});

export const updateActivitySchema = Joi.object({
  status: Joi.string().valid('pending', 'in_progress', 'completed').optional(),
  progress: Joi.number().integer().min(0).max(100).optional(),
  completion_date: Joi.date().iso().optional(),
  notes: Joi.string().max(1000).optional()
});

export const createVolunteerSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().regex(/^[0-9+\-\s()]+$/).required(),
  skill_area: Joi.string().min(3).max(100).required(),
  availability: Joi.string().valid('weekdays', 'weekends', 'both').required(),
  zone_id: Joi.number().integer().positive().required(),
  organization: Joi.string().min(3).max(200).optional()
});

export const assignVolunteerSchema = Joi.object({
  volunteer_id: Joi.number().integer().positive().required(),
  activity_id: Joi.number().integer().positive().required()
});

export const recordVolunteerHoursSchema = Joi.object({
  volunteer_id: Joi.number().integer().positive().required(),
  assignment_id: Joi.number().integer().positive().required(),
  hours_worked: Joi.number().min(0).max(24).required(),
  feedback: Joi.string().max(500).optional()
});

export const submitFieldReportSchema = Joi.object({
  zone_id: Joi.number().integer().positive().required(),
  report_type: Joi.string().valid('observation', 'incident', 'achievement', 'problem').required(),
  title: Joi.string().min(5).max(200).required(),
  observations: Joi.string().min(10).max(2000).required(),
  findings: Joi.object().optional(),
  photos_count: Joi.number().integer().min(0).optional(),
  location: Joi.string().max(300).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional()
});

export const reviewFieldReportSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'needs_revision').required(),
  review_notes: Joi.string().max(1000).optional()
});

/**
 * ===== MANAGEMENT INDICATORS VALIDATION SCHEMAS =====
 */
export const createGoalSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(1000).required(),
  zone_id: Joi.number().integer().positive().required(),
  manager_id: Joi.number().integer().positive().required(),
  target_value: Joi.number().positive().required(),
  unit: Joi.string().min(2).max(50).required(),
  start_date: Joi.date().iso().required(),
  due_date: Joi.date().iso().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional()
});

export const updateGoalProgressSchema = Joi.object({
  current_value: Joi.number().min(0).required(),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'at_risk').optional(),
  notes: Joi.string().max(500).optional()
});

export const createProjectSchema = Joi.object({
  name: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  zone_id: Joi.number().integer().positive().required(),
  manager_id: Joi.number().integer().positive().required(),
  budget: Joi.number().positive().required(),
  start_date: Joi.date().iso().required(),
  due_date: Joi.date().iso().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  expected_impact: Joi.string().max(500).optional()
});

export const updateProjectStatusSchema = Joi.object({
  status: Joi.string().valid('planning', 'in_execution', 'paused', 'completed', 'cancelled').optional(),
  spent: Joi.number().min(0).optional(),
  completion_date: Joi.date().iso().optional(),
  actual_impact: Joi.string().max(500).optional()
});

export const addMilestoneSchema = Joi.object({
  project_id: Joi.number().integer().positive().required(),
  milestone: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(5).max(500).optional(),
  planned_date: Joi.date().iso().required()
});

export const completeMilestoneSchema = Joi.object({
  milestone_id: Joi.number().integer().positive().required(),
  progress: Joi.number().integer().min(0).max(100).required(),
  actual_date: Joi.date().iso().required(),
  notes: Joi.string().max(500).optional()
});

export const recordIndicatorSchema = Joi.object({
  zone_id: Joi.number().integer().positive().required(),
  indicator_name: Joi.string().min(5).max(200).required(),
  indicator_type: Joi.string().valid('operational', 'strategic', 'social', 'financial').required(),
  value: Joi.number().required(),
  baseline: Joi.number().optional(),
  target: Joi.number().optional(),
  unit: Joi.string().min(2).max(50).required(),
  data_source: Joi.string().max(200).optional()
});

/**
 * ===== STRATEGIC INTELLIGENCE VALIDATION SCHEMAS =====
 */
export const compareZonesSchema = Joi.object({
  zone_a_id: Joi.number().integer().positive().required(),
  zone_b_id: Joi.number().integer().positive().required(),
  metrics: Joi.array().items(
    Joi.string().valid('voters_count', 'events', 'pending_requests', 'volunteers', 'avg_urgency')
  ).min(1).required()
});

export const getTrendsSchema = Joi.object({
  zone_id: Joi.number().integer().positive().required(),
  timeframe: Joi.string().valid('30', '60', '90').optional()
});

export const analyzePoliticalRisksSchema = Joi.object({
  zone_id: Joi.number().integer().positive().required()
});

export const createStrategicAlertSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  alert_type: Joi.string().valid('social', 'political', 'operational', 'financial').required(),
  severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').required(),
  zone_id: Joi.number().integer().positive().required(),
  description: Joi.string().min(10).max(2000).required(),
  indicator_id: Joi.number().integer().positive().optional(),
  threshold_value: Joi.number().optional(),
  current_value: Joi.number().optional(),
  recommendation: Joi.string().max(500).optional()
});

export const acknowledgeAlertSchema = Joi.object({
  alert_id: Joi.number().integer().positive().required()
});

export const recordSocialLeaderSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  organization: Joi.string().min(3).max(200).required(),
  zone_id: Joi.number().integer().positive().required(),
  influence_level: Joi.string().valid('local', 'regional', 'departmental', 'national').required(),
  contact_phone: Joi.string().regex(/^[0-9+\-\s()]+$/),
  contact_email: Joi.string().email(),
  area_of_influence: Joi.string().min(5).max(300).required(),
  notes: Joi.string().max(1000).optional()
});

export const recordCommitmentSchema = Joi.object({
  commitment_type: Joi.string().valid('pledge', 'agreement', 'promise', 'covenant').required(),
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  committed_to: Joi.string().min(3).max(100).required(),
  committed_by: Joi.number().integer().positive().required(),
  zone_id: Joi.number().integer().positive().required(),
  due_date: Joi.date().iso().required(),
  notes: Joi.string().max(1000).optional()
});

export const completeCommitmentSchema = Joi.object({
  commitment_id: Joi.number().integer().positive().required(),
  completion_date: Joi.date().iso().required(),
  notes: Joi.string().max(1000).optional()
});

/**
 * ===== PAGINATION SCHEMA =====
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort_by: Joi.string().max(50),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * ===== FILTER SCHEMAS =====
 */
export const filterByStatusSchema = Joi.object({
  status: Joi.string().optional()
}).concat(paginationSchema);

export const filterByZoneSchema = Joi.object({
  zone_id: Joi.number().integer().positive().optional()
}).concat(paginationSchema);

export const filterByDateRangeSchema = Joi.object({
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional()
}).concat(paginationSchema);

export const filterCitizenRequestsSchema = Joi.object({
  status: Joi.string().optional(),
  priority: Joi.string().optional(),
  request_type: Joi.string().optional(),
  zone_id: Joi.number().integer().positive().optional(),
  urgency_min: Joi.number().integer().min(1).max(5).optional(),
  urgency_max: Joi.number().integer().min(1).max(5).optional()
}).concat(paginationSchema);

/**
 * ===== SUBSCRIPTIONS VALIDATION SCHEMAS =====
 */
export const createSubscriptionPlanSchema = Joi.object({
  name: Joi.string().min(3).max(120).required(),
  model_type: Joi.string().valid('saas', 'perpetual', 'hybrid', 'campaign', 'institutional_annual').required(),
  tier: Joi.string().valid('basic', 'institutional', 'professional', 'national', 'enterprise').required(),
  billing_cycle: Joi.string().valid('monthly', 'annual', 'one_time', 'campaign').required(),
  price_min_millions: Joi.number().min(0).required(),
  price_max_millions: Joi.number().min(0).required(),
  setup_fee_millions: Joi.number().min(0).default(0),
  currency: Joi.string().valid('COP').default('COP'),
  features: Joi.array().items(Joi.string().max(255)).default([])
});

export const updateSubscriptionPlanSchema = Joi.object({
  name: Joi.string().min(3).max(120),
  tier: Joi.string().valid('basic', 'institutional', 'professional', 'national', 'enterprise'),
  billing_cycle: Joi.string().valid('monthly', 'annual', 'one_time', 'campaign'),
  price_min_millions: Joi.number().min(0),
  price_max_millions: Joi.number().min(0),
  setup_fee_millions: Joi.number().min(0),
  features: Joi.array().items(Joi.string().max(255)),
  active: Joi.boolean()
}).min(1);

export const createSubscriptionSchema = Joi.object({
  organization_name: Joi.string().min(3).max(180).required(),
  organization_type: Joi.string().valid('municipality', 'department', 'party', 'ngo', 'foundation', 'private_org', 'national_entity').required(),
  scope: Joi.string().valid('municipal', 'departmental', 'national').required(),
  plan_id: Joi.number().integer().positive().required(),
  model_type: Joi.string().valid('saas', 'perpetual', 'hybrid', 'campaign', 'institutional_annual').required(),
  billing_cycle: Joi.string().valid('monthly', 'annual', 'one_time', 'campaign').required(),
  amount_millions: Joi.number().positive().required(),
  setup_fee_millions: Joi.number().min(0).default(0),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().optional(),
  next_billing_date: Joi.date().iso().optional(),
  users_limit: Joi.number().integer().min(1).default(20),
  zones_limit: Joi.number().integer().min(1).default(5),
  notes: Joi.string().max(2000).allow('', null)
});

export const updateSubscriptionSchema = Joi.object({
  amount_millions: Joi.number().positive(),
  setup_fee_millions: Joi.number().min(0),
  billing_cycle: Joi.string().valid('monthly', 'annual', 'one_time', 'campaign'),
  next_billing_date: Joi.date().iso().allow(null),
  renewal_date: Joi.date().iso().allow(null),
  users_limit: Joi.number().integer().min(1),
  zones_limit: Joi.number().integer().min(1),
  status: Joi.string().valid('active', 'paused', 'cancelled', 'expired', 'trial'),
  notes: Joi.string().max(2000).allow('', null)
}).min(1);

export const cancelSubscriptionSchema = Joi.object({
  cancellation_reason: Joi.string().min(5).max(500).required(),
  cancelled_at: Joi.date().iso().default(() => new Date().toISOString())
});

export const renewSubscriptionSchema = Joi.object({
  renewal_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().required(),
  amount_millions: Joi.number().positive().required(),
  notes: Joi.string().max(1000).allow('', null)
});

export const recordSubscriptionPaymentSchema = Joi.object({
  payment_date: Joi.date().iso().required(),
  period_label: Joi.string().max(50).required(),
  amount_millions: Joi.number().positive().required(),
  payment_method: Joi.string().valid('bank_transfer', 'card', 'cash', 'contract_order', 'other').required(),
  status: Joi.string().valid('paid', 'pending', 'failed').default('paid'),
  reference: Joi.string().max(120).allow('', null),
  notes: Joi.string().max(1000).allow('', null)
});

export const filterSubscriptionsSchema = Joi.object({
  status: Joi.string().valid('active', 'paused', 'cancelled', 'expired', 'trial').optional(),
  model_type: Joi.string().valid('saas', 'perpetual', 'hybrid', 'campaign', 'institutional_annual').optional(),
  organization_type: Joi.string().valid('municipality', 'department', 'party', 'ngo', 'foundation', 'private_org', 'national_entity').optional(),
  scope: Joi.string().valid('municipal', 'departmental', 'national').optional()
}).concat(paginationSchema);
