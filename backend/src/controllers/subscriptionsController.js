/**
 * Controlador de Suscripciones
 * Gestiona planes, contratos y pagos recurrentes de la plataforma ÁBACO
 */

import database from '../config/database.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

async function writeAuditLog(req, action, resourceType, resourceId, details = null) {
  await database.query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [req.user?.id || null, action, resourceType, resourceId, details, req.ip]
  );
}

export const getPlans = asyncHandler(async (req, res) => {
  const { active } = req.query;

  let query = 'SELECT * FROM subscription_plans WHERE 1=1';
  const values = [];

  if (active !== undefined) {
    values.push(active === 'true');
    query += ` AND active = $${values.length}`;
  }

  query += ' ORDER BY model_type ASC, tier ASC, created_at DESC';

  const result = await database.query(query, values);
  res.json({ data: result.rows });
});

export const createPlan = asyncHandler(async (req, res) => {
  const {
    name,
    model_type,
    tier,
    billing_cycle,
    price_min_millions,
    price_max_millions,
    setup_fee_millions,
    currency,
    features
  } = req.body;

  if (price_max_millions < price_min_millions) {
    throw new AppError('El precio máximo no puede ser menor al precio mínimo', 400, 'INVALID_PRICE_RANGE');
  }

  const result = await database.query(
    `INSERT INTO subscription_plans (
      name, model_type, tier, billing_cycle, price_min_millions, price_max_millions,
      setup_fee_millions, currency, features, active
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
    RETURNING *`,
    [
      name,
      model_type,
      tier,
      billing_cycle,
      price_min_millions,
      price_max_millions,
      setup_fee_millions,
      currency,
      JSON.stringify(features || [])
    ]
  );

  await writeAuditLog(req, 'CREATE', 'SUBSCRIPTION_PLAN', result.rows[0].id, { name, model_type, tier });

  res.status(201).json({
    message: 'Plan de suscripción creado correctamente',
    plan: result.rows[0]
  });
});

export const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await database.query('SELECT * FROM subscription_plans WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Plan de suscripción no encontrado', 404, 'PLAN_NOT_FOUND');
  }

  const {
    name,
    tier,
    billing_cycle,
    price_min_millions,
    price_max_millions,
    setup_fee_millions,
    features,
    active
  } = req.body;

  if (
    price_min_millions !== undefined &&
    price_max_millions !== undefined &&
    price_max_millions < price_min_millions
  ) {
    throw new AppError('El precio máximo no puede ser menor al precio mínimo', 400, 'INVALID_PRICE_RANGE');
  }

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }
  if (tier !== undefined) {
    updates.push(`tier = $${paramCount}`);
    values.push(tier);
    paramCount++;
  }
  if (billing_cycle !== undefined) {
    updates.push(`billing_cycle = $${paramCount}`);
    values.push(billing_cycle);
    paramCount++;
  }
  if (price_min_millions !== undefined) {
    updates.push(`price_min_millions = $${paramCount}`);
    values.push(price_min_millions);
    paramCount++;
  }
  if (price_max_millions !== undefined) {
    updates.push(`price_max_millions = $${paramCount}`);
    values.push(price_max_millions);
    paramCount++;
  }
  if (setup_fee_millions !== undefined) {
    updates.push(`setup_fee_millions = $${paramCount}`);
    values.push(setup_fee_millions);
    paramCount++;
  }
  if (features !== undefined) {
    updates.push(`features = $${paramCount}`);
    values.push(JSON.stringify(features));
    paramCount++;
  }
  if (active !== undefined) {
    updates.push(`active = $${paramCount}`);
    values.push(active);
    paramCount++;
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const result = await database.query(
    `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  await writeAuditLog(req, 'UPDATE', 'SUBSCRIPTION_PLAN', id, { updated: Object.keys(req.body) });

  res.json({
    message: 'Plan de suscripción actualizado correctamente',
    plan: result.rows[0]
  });
});

export const getSubscriptions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    model_type,
    organization_type,
    scope
  } = req.query;

  const offset = (page - 1) * limit;

  let query = `
    SELECT s.*, p.name AS plan_name, p.tier AS plan_tier
    FROM subscriptions s
    LEFT JOIN subscription_plans p ON p.id = s.plan_id
    WHERE 1=1
  `;
  const values = [];

  if (status) {
    values.push(status);
    query += ` AND s.status = $${values.length}`;
  }
  if (model_type) {
    values.push(model_type);
    query += ` AND s.model_type = $${values.length}`;
  }
  if (organization_type) {
    values.push(organization_type);
    query += ` AND s.organization_type = $${values.length}`;
  }
  if (scope) {
    values.push(scope);
    query += ` AND s.scope = $${values.length}`;
  }

  const countResult = await database.query(
    `SELECT COUNT(*) as count FROM (${query}) AS filtered_subscriptions`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);
  const pages = Math.ceil(total / limit);

  values.push(limit);
  values.push(offset);

  const result = await database.query(
    query + ` ORDER BY s.created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  res.json({
    data: result.rows,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      pages
    }
  });
});

export const getSubscriptionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await database.query(
    `SELECT s.*, p.name AS plan_name, p.tier AS plan_tier
     FROM subscriptions s
     LEFT JOIN subscription_plans p ON p.id = s.plan_id
     WHERE s.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Suscripción no encontrada', 404, 'SUBSCRIPTION_NOT_FOUND');
  }

  const payments = await database.query(
    `SELECT id, payment_date, period_label, amount_millions, payment_method, status, reference, notes, created_at
     FROM subscription_payments
     WHERE subscription_id = $1
     ORDER BY payment_date DESC`,
    [id]
  );

  res.json({
    subscription: result.rows[0],
    payments: payments.rows
  });
});

export const createSubscription = asyncHandler(async (req, res) => {
  const {
    organization_name,
    organization_type,
    scope,
    plan_id,
    model_type,
    billing_cycle,
    amount_millions,
    setup_fee_millions,
    start_date,
    end_date,
    next_billing_date,
    users_limit,
    zones_limit,
    notes
  } = req.body;

  const planResult = await database.query('SELECT id, active FROM subscription_plans WHERE id = $1', [plan_id]);
  if (planResult.rows.length === 0) {
    throw new AppError('Plan de suscripción no encontrado', 404, 'PLAN_NOT_FOUND');
  }
  if (!planResult.rows[0].active) {
    throw new AppError('No se puede usar un plan inactivo', 400, 'PLAN_INACTIVE');
  }

  const result = await database.query(
    `INSERT INTO subscriptions (
      organization_name, organization_type, scope, plan_id, model_type, billing_cycle,
      amount_millions, setup_fee_millions, start_date, end_date, next_billing_date,
      users_limit, zones_limit, notes, status, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'active',$15)
    RETURNING *`,
    [
      organization_name,
      organization_type,
      scope,
      plan_id,
      model_type,
      billing_cycle,
      amount_millions,
      setup_fee_millions,
      start_date,
      end_date || null,
      next_billing_date || null,
      users_limit,
      zones_limit,
      notes || null,
      req.user?.id || null
    ]
  );

  await writeAuditLog(req, 'CREATE', 'SUBSCRIPTION', result.rows[0].id, {
    organization_name,
    plan_id,
    model_type,
    amount_millions
  });

  res.status(201).json({
    message: 'Suscripción creada correctamente',
    subscription: result.rows[0]
  });
});

export const updateSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const existing = await database.query('SELECT id FROM subscriptions WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    throw new AppError('Suscripción no encontrada', 404, 'SUBSCRIPTION_NOT_FOUND');
  }

  const {
    amount_millions,
    setup_fee_millions,
    billing_cycle,
    next_billing_date,
    renewal_date,
    users_limit,
    zones_limit,
    status,
    notes
  } = req.body;

  const updates = [];
  const values = [];
  let paramCount = 1;

  if (amount_millions !== undefined) {
    updates.push(`amount_millions = $${paramCount}`);
    values.push(amount_millions);
    paramCount++;
  }
  if (setup_fee_millions !== undefined) {
    updates.push(`setup_fee_millions = $${paramCount}`);
    values.push(setup_fee_millions);
    paramCount++;
  }
  if (billing_cycle !== undefined) {
    updates.push(`billing_cycle = $${paramCount}`);
    values.push(billing_cycle);
    paramCount++;
  }
  if (next_billing_date !== undefined) {
    updates.push(`next_billing_date = $${paramCount}`);
    values.push(next_billing_date);
    paramCount++;
  }
  if (renewal_date !== undefined) {
    updates.push(`renewal_date = $${paramCount}`);
    values.push(renewal_date);
    paramCount++;
  }
  if (users_limit !== undefined) {
    updates.push(`users_limit = $${paramCount}`);
    values.push(users_limit);
    paramCount++;
  }
  if (zones_limit !== undefined) {
    updates.push(`zones_limit = $${paramCount}`);
    values.push(zones_limit);
    paramCount++;
  }
  if (status !== undefined) {
    updates.push(`status = $${paramCount}`);
    values.push(status);
    paramCount++;
  }
  if (notes !== undefined) {
    updates.push(`notes = $${paramCount}`);
    values.push(notes);
    paramCount++;
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const result = await database.query(
    `UPDATE subscriptions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  await writeAuditLog(req, 'UPDATE', 'SUBSCRIPTION', id, { updated: Object.keys(req.body) });

  res.json({
    message: 'Suscripción actualizada correctamente',
    subscription: result.rows[0]
  });
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancellation_reason, cancelled_at } = req.body;

  const result = await database.query(
    `UPDATE subscriptions
     SET status = 'cancelled', cancellation_reason = $1, cancelled_at = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [cancellation_reason, cancelled_at, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Suscripción no encontrada', 404, 'SUBSCRIPTION_NOT_FOUND');
  }

  await writeAuditLog(req, 'UPDATE', 'SUBSCRIPTION', id, { status: 'cancelled', cancellation_reason });

  res.json({
    message: 'Suscripción cancelada correctamente',
    subscription: result.rows[0]
  });
});

export const renewSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { renewal_date, end_date, amount_millions, notes } = req.body;

  const result = await database.query(
    `UPDATE subscriptions
     SET status = 'active', renewal_date = $1, end_date = $2, amount_millions = $3,
         notes = COALESCE($4, notes), updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING *`,
    [renewal_date, end_date, amount_millions, notes || null, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Suscripción no encontrada', 404, 'SUBSCRIPTION_NOT_FOUND');
  }

  await writeAuditLog(req, 'UPDATE', 'SUBSCRIPTION', id, {
    renewal_date,
    end_date,
    amount_millions
  });

  res.json({
    message: 'Suscripción renovada correctamente',
    subscription: result.rows[0]
  });
});

export const recordPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    payment_date,
    period_label,
    amount_millions,
    payment_method,
    status,
    reference,
    notes
  } = req.body;

  const subscriptionExists = await database.query('SELECT id FROM subscriptions WHERE id = $1', [id]);
  if (subscriptionExists.rows.length === 0) {
    throw new AppError('Suscripción no encontrada', 404, 'SUBSCRIPTION_NOT_FOUND');
  }

  const result = await database.query(
    `INSERT INTO subscription_payments (
      subscription_id, payment_date, period_label, amount_millions,
      payment_method, status, reference, notes, created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      id,
      payment_date,
      period_label,
      amount_millions,
      payment_method,
      status,
      reference || null,
      notes || null,
      req.user?.id || null
    ]
  );

  await writeAuditLog(req, 'CREATE', 'SUBSCRIPTION_PAYMENT', result.rows[0].id, {
    subscription_id: id,
    amount_millions,
    status
  });

  res.status(201).json({
    message: 'Pago registrado correctamente',
    payment: result.rows[0]
  });
});

export const getRevenueMetrics = asyncHandler(async (req, res) => {
  const { period = 'monthly' } = req.query;

  const recurring = await database.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'active') AS active_subscriptions,
      COALESCE(SUM(amount_millions) FILTER (WHERE status = 'active' AND billing_cycle = 'monthly'), 0) AS mrr_millions,
      COALESCE(SUM(amount_millions) FILTER (WHERE status = 'active' AND billing_cycle = 'annual'), 0) AS arr_contracts_millions,
      COALESCE(SUM(amount_millions) FILTER (WHERE status = 'active' AND billing_cycle = 'campaign'), 0) AS campaign_pipeline_millions
    FROM subscriptions
  `);

  const payments = await database.query(`
    SELECT
      COALESCE(SUM(amount_millions), 0) AS paid_total_millions,
      COUNT(*) AS paid_operations
    FROM subscription_payments
    WHERE status = 'paid'
      AND payment_date >=
        CASE
          WHEN $1 = 'yearly' THEN CURRENT_DATE - INTERVAL '365 days'
          WHEN $1 = 'quarterly' THEN CURRENT_DATE - INTERVAL '90 days'
          ELSE CURRENT_DATE - INTERVAL '30 days'
        END
  `, [period]);

  const byModel = await database.query(`
    SELECT model_type, COUNT(*)::int AS subscriptions, COALESCE(SUM(amount_millions), 0) AS amount_millions
    FROM subscriptions
    WHERE status = 'active'
    GROUP BY model_type
    ORDER BY amount_millions DESC
  `);

  res.json({
    period,
    recurring: {
      activeSubscriptions: parseInt(recurring.rows[0].active_subscriptions, 10),
      mrrMillions: parseFloat(recurring.rows[0].mrr_millions),
      annualContractsMillions: parseFloat(recurring.rows[0].arr_contracts_millions),
      campaignPipelineMillions: parseFloat(recurring.rows[0].campaign_pipeline_millions)
    },
    cashIn: {
      paidTotalMillions: parseFloat(payments.rows[0].paid_total_millions),
      paidOperations: parseInt(payments.rows[0].paid_operations, 10)
    },
    byModel: byModel.rows
  });
});
