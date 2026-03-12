const QA_BASE_URL = process.env.QA_BASE_URL || 'https://backend-two-xi-81.vercel.app'
const QA_PASSWORD = process.env.QA_PASSWORD || 'Clave123!'

const roles = ['admin', 'manager', 'operator', 'auditor', 'viewer', 'visitor']

const endpoints = [
  {
    name: 'auth_me',
    method: 'GET',
    path: '/api/v1/auth/me',
    expected: { admin: 200, manager: 200, operator: 200, auditor: 200, viewer: 200, visitor: 200 }
  },
  {
    name: 'auth_me_patch_role',
    method: 'PATCH',
    path: '/api/v1/auth/me',
    body: { role: 'viewer' },
    expected: { admin: 200, manager: 200, operator: 200, auditor: 200, viewer: 200, visitor: 200 }
  },
  {
    name: 'geo_sync_status',
    method: 'GET',
    path: '/api/v1/geo/sync-status',
    expected: { admin: 200, manager: 200, operator: 200, auditor: 200, viewer: 200, visitor: 403 }
  },
  {
    name: 'geo_features',
    method: 'GET',
    path: '/api/v1/geo/features?limit=10&types=all',
    expected: { admin: 200, manager: 200, operator: 200, auditor: 200, viewer: 200, visitor: 403 }
  },
  {
    name: 'geo_3d_gltf',
    method: 'GET',
    path: '/api/v1/geo/export/3d/model.gltf?limit=10',
    expected: { admin: 200, manager: 200, operator: 200, auditor: 200, viewer: 200, visitor: 403 }
  },
  {
    name: 'users_list',
    method: 'GET',
    path: '/api/v1/users?page=1&limit=5',
    expected: { admin: 200, manager: 403, operator: 403, auditor: 403, viewer: 403, visitor: 403 }
  },
  {
    name: 'voters_list',
    method: 'GET',
    path: '/api/v1/voters?page=1&limit=5',
    expected: { admin: 200, manager: 200, operator: 200, auditor: 403, viewer: 403, visitor: 403 }
  },
  {
    name: 'zones_list',
    method: 'GET',
    path: '/api/v1/zones?page=1&limit=5',
    expected: { admin: 200, manager: 200, operator: 200, auditor: 403, viewer: 403, visitor: 403 }
  },
  {
    name: 'financial_summary',
    method: 'GET',
    path: '/api/v1/financial-intelligence/summary?limit=3',
    expected: { admin: 200, manager: 200, operator: 200, auditor: 200, viewer: 200, visitor: 403 },
    optional: true
  },
  {
    name: 'management_indicators',
    method: 'GET',
    path: '/api/v1/management-indicators/indicators',
    expected: { admin: 200, manager: 200, operator: 200, auditor: 200, viewer: 200, visitor: 403 }
  },
  {
    name: 'citizen_requests',
    method: 'GET',
    path: '/api/v1/citizen-requests?page=1&limit=5',
    expected: { admin: 200, manager: 200, operator: 200, auditor: 200, viewer: 200, visitor: 200 }
  },
  {
    name: 'strategic_trends',
    method: 'GET',
    path: '/api/v1/strategic-intelligence/trends?page=1&limit=5',
    expected: { admin: 200, manager: 200, operator: 403, auditor: 200, viewer: 200, visitor: 403 }
  }
]

async function createToken(role) {
  const email = `qa.role.${role}.${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`
  const response = await fetch(`${QA_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `QA ${role}`,
      email,
      password: QA_PASSWORD,
      role
    })
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok || !body?.token) {
    throw new Error(`Registro falló para ${role}: ${response.status} ${JSON.stringify(body)}`)
  }

  return body.token
}

async function checkEndpoint(token, endpoint) {
  const response = await fetch(`${QA_BASE_URL}${endpoint.path}`, {
    method: endpoint.method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    ...(endpoint.body ? { body: JSON.stringify(endpoint.body) } : {})
  })

  const data = await response.json().catch(() => null)

  return {
    status: response.status,
    data
  }
}

async function main() {
  const tokens = {}

  for (const role of roles) {
    tokens[role] = await createToken(role)
  }

  const rows = []
  const failures = []
  const skipped = []

  for (const endpoint of endpoints) {
    const row = { endpoint: endpoint.name }
    const endpointResults = {}

    for (const role of roles) {
      endpointResults[role] = await checkEndpoint(tokens[role], endpoint)
    }

    const allNotFound = roles.every((role) => endpointResults[role].status === 404)
    if (endpoint.optional && allNotFound) {
      for (const role of roles) {
        row[role] = 'SKIP'
        row[`${role}_status`] = 404
        row[`${role}_expected`] = endpoint.expected[role]
      }

      row._skipped = true
      row._skip_reason = 'endpoint_not_deployed'
      rows.push(row)
      skipped.push({ endpoint: endpoint.name, reason: 'endpoint_not_deployed' })
      continue
    }

    for (const role of roles) {
      const result = endpointResults[role]
      const expected = endpoint.expected[role]
      const passed = result.status === expected

      row[role] = passed ? 'PASS' : 'FAIL'
      row[`${role}_status`] = result.status
      row[`${role}_expected`] = expected

      if (!passed) {
        failures.push({
          endpoint: endpoint.name,
          role,
          expected,
          got: result.status,
          body: result.data
        })
      }
    }

    rows.push(row)
  }

  const passedCount = rows.reduce(
    (acc, row) => acc + roles.filter((role) => row[role] === 'PASS').length,
    0
  )

  const skippedCount = rows.reduce(
    (acc, row) => acc + roles.filter((role) => row[role] === 'SKIP').length,
    0
  )

  const failedCount = rows.length * roles.length - passedCount - skippedCount

  const report = {
    ok: failedCount === 0,
    baseUrl: QA_BASE_URL,
    summary: {
      totalChecks: rows.length * roles.length,
      passed: passedCount,
      failed: failedCount,
      skipped: skippedCount
    },
    rows,
    failures,
    skipped
  }

  console.log(JSON.stringify(report, null, 2))

  if (!report.ok) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
