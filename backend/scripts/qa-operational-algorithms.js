const QA_BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:3001';
const QA_PASSWORD = process.env.QA_PASSWORD || 'Clave123!';

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => null);
  return { response, body };
}

async function getToken() {
  const email = `qa.ops.${Date.now()}@example.com`;
  const register = await request(`${QA_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'QA Ops Algorithms',
      email,
      password: QA_PASSWORD,
      role: 'manager'
    })
  });

  if (!register.response.ok || !register.body?.token) {
    throw new Error(`No se pudo crear usuario QA: ${register.response.status} ${JSON.stringify(register.body)}`);
  }

  return register.body.token;
}

async function main() {
  const token = await getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const checks = [
    {
      name: 'zone_prioritization',
      method: 'GET',
      path: '/api/v1/operational-algorithms/zone-prioritization?limit=5',
      expectedStatus: 200,
      requiredField: 'data'
    },
    {
      name: 'brigade_assignment',
      method: 'POST',
      path: '/api/v1/operational-algorithms/brigade-assignment',
      expectedStatus: 200,
      body: { limit: 40, default_capacity: 6, max_distance_km: 25, apply: false },
      requiredField: 'data'
    },
    {
      name: 'territorial_routing',
      method: 'GET',
      path: '/api/v1/operational-algorithms/territorial-routing?limit=40&speed_kmh=30',
      expectedStatus: 200,
      requiredField: 'data'
    },
    {
      name: 'semaphore_alerts',
      method: 'GET',
      path: '/api/v1/operational-algorithms/semaphore-alerts',
      expectedStatus: 200,
      requiredField: 'data'
    },
    {
      name: 'load_balance',
      method: 'GET',
      path: '/api/v1/operational-algorithms/load-balance?apply=false',
      expectedStatus: 200,
      requiredField: 'transfer_plan'
    },
    {
      name: 'advanced_catalog',
      method: 'GET',
      path: '/api/v1/operational-algorithms/advanced-suite/catalog?include_experimental=true',
      expectedStatus: 200,
      requiredField: 'data'
    },
    {
      name: 'advanced_run',
      method: 'GET',
      path: '/api/v1/operational-algorithms/advanced-suite/run?limit=5&include_experimental=true',
      expectedStatus: 200,
      requiredField: 'integrated_ranking'
    },
    {
      name: 'advanced_activation_logs',
      method: 'GET',
      path: '/api/v1/operational-algorithms/advanced-suite/activation-logs?limit=5',
      expectedStatus: 200,
      requiredField: 'data'
    },
    {
      name: 'predictive_catalog',
      method: 'GET',
      path: '/api/v1/operational-algorithms/predictive-models/catalog',
      expectedStatus: 200,
      requiredField: 'data'
    },
    {
      name: 'predictive_run',
      method: 'GET',
      path: '/api/v1/operational-algorithms/predictive-models/run?limit=5&horizon_days=45',
      expectedStatus: 200,
      requiredField: 'integrated_ranking'
    },
    {
      name: 'optimization_catalog',
      method: 'GET',
      path: '/api/v1/operational-algorithms/optimization-models/catalog',
      expectedStatus: 200,
      requiredField: 'data'
    },
    {
      name: 'optimization_run',
      method: 'GET',
      path: '/api/v1/operational-algorithms/optimization-models/run?limit=5&brigades=12&budget=120000',
      expectedStatus: 200,
      requiredField: 'plans'
    },
    {
      name: 'what_if_simulation',
      method: 'GET',
      path: '/api/v1/operational-algorithms/what-if/simulate?limit=5&budget=150000&brigades=14&expected_turnout_delta=8',
      expectedStatus: 200,
      requiredField: 'scenario'
    },
    {
      name: 'action_center',
      method: 'GET',
      path: '/api/v1/operational-algorithms/action-center/recommendations?limit=5',
      expectedStatus: 200,
      requiredField: 'data'
    },
    {
      name: 'early_alerts',
      method: 'GET',
      path: '/api/v1/operational-algorithms/early-alerts?risk_threshold=65&coverage_threshold=55',
      expectedStatus: 200,
      requiredField: 'data'
    },
    {
      name: 'early_alerts_notify_status',
      method: 'GET',
      path: '/api/v1/operational-algorithms/early-alerts/notify/status',
      expectedStatus: 200,
      requiredField: 'channels'
    },
    {
      name: 'early_alerts_notify',
      method: 'POST',
      path: '/api/v1/operational-algorithms/early-alerts/notify',
      expectedStatus: 200,
      body: {
        risk_threshold: 65,
        coverage_threshold: 55,
        dispatch: false
      },
      requiredField: 'notifications'
    },
    {
      name: 'decision_log_get',
      method: 'GET',
      path: '/api/v1/operational-algorithms/decision-log?limit=5',
      expectedStatus: 200,
      requiredField: 'data'
    },
    {
      name: 'temporal_comparison',
      method: 'GET',
      path: '/api/v1/operational-algorithms/temporal-comparison?period=weekly&buckets=6',
      expectedStatus: 200,
      requiredField: 'trend'
    },
    {
      name: 'daily_operations_board',
      method: 'GET',
      path: '/api/v1/operational-algorithms/daily-operations/board',
      expectedStatus: 200,
      requiredField: 'top_actions'
    },
    {
      name: 'data_quality_report',
      method: 'GET',
      path: '/api/v1/operational-algorithms/data-quality/report',
      expectedStatus: 200,
      requiredField: 'data'
    },
    {
      name: 'rules_catalog',
      method: 'GET',
      path: '/api/v1/operational-algorithms/rules-engine/catalog',
      expectedStatus: 200,
      requiredField: 'sample_evaluations'
    },
    {
      name: 'rules_evaluate',
      method: 'POST',
      path: '/api/v1/operational-algorithms/rules-engine/evaluate',
      expectedStatus: 200,
      body: {
        role: 'operator',
        case_status: 'in_progress',
        context: { sensitivity: 'high', owns_case: false, channel: 'internal' }
      },
      requiredField: 'data'
    }
  ];

  const failures = [];
  const results = [];

  for (const item of checks) {
    const current = await request(`${QA_BASE_URL}${item.path}`, {
      method: item.method,
      headers,
      ...(item.body ? { body: JSON.stringify(item.body) } : {})
    });

    const hasField = item.requiredField ? Object.prototype.hasOwnProperty.call(current.body || {}, item.requiredField) : true;
    const ok = current.response.status === item.expectedStatus && hasField;

    results.push({
      name: item.name,
      status: current.response.status,
      expected: item.expectedStatus,
      has_required_field: hasField,
      ok
    });

    if (!ok) {
      failures.push({
        name: item.name,
        status: current.response.status,
        expected: item.expectedStatus,
        body: current.body
      });
    }
  }

  const decisionCreate = await request(`${QA_BASE_URL}/api/v1/operational-algorithms/decision-log`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      zone_id: 1,
      action_title: 'QA Decision Log Entry',
      rationale: 'Validación automatizada del flujo de bitácora',
      priority: 'high',
      owner_role: 'manager',
      estimated_cost: 15000,
      source_module: 'qa_ops',
      expected_impact_score: 72
    })
  });

  const createdDecisionId = Number(decisionCreate.body?.data?.id || 0) || null;
  const decisionCreateOk = decisionCreate.response.status === 201 && createdDecisionId !== null;
  results.push({
    name: 'decision_log_create',
    status: decisionCreate.response.status,
    expected: 201,
    has_required_field: createdDecisionId !== null,
    ok: decisionCreateOk
  });
  if (!decisionCreateOk) {
    failures.push({
      name: 'decision_log_create',
      status: decisionCreate.response.status,
      expected: 201,
      body: decisionCreate.body
    });
  }

  if (createdDecisionId !== null) {
    const decisionUpdate = await request(`${QA_BASE_URL}/api/v1/operational-algorithms/decision-log/${createdDecisionId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status: 'completed',
        outcome_note: 'QA completado',
        effectiveness_score: 81
      })
    });

    const decisionUpdateOk = decisionUpdate.response.status === 200
      && Number(decisionUpdate.body?.data?.id || 0) === createdDecisionId;

    results.push({
      name: 'decision_log_update',
      status: decisionUpdate.response.status,
      expected: 200,
      has_required_field: Number(decisionUpdate.body?.data?.id || 0) === createdDecisionId,
      ok: decisionUpdateOk
    });

    if (!decisionUpdateOk) {
      failures.push({
        name: 'decision_log_update',
        status: decisionUpdate.response.status,
        expected: 200,
        body: decisionUpdate.body
      });
    }
  }

  const report = {
    ok: failures.length === 0,
    baseUrl: QA_BASE_URL,
    checks: results,
    failures
  };

  console.log(JSON.stringify(report, null, 2));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
