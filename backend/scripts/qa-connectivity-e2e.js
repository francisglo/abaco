const QA_BASE_URL = process.env.QA_BASE_URL || 'http://127.0.0.1:3001'
const QA_PASSWORD = process.env.QA_PASSWORD || 'Clave123!'

async function request(url, options = {}) {
  const response = await fetch(url, options)
  const body = await response.json().catch(() => null)
  return { response, body }
}

async function main() {
  const startedAt = Date.now()
  const failures = []

  const health = await request(`${QA_BASE_URL}/health`)
  if (!health.response.ok) {
    throw new Error(`Health check falló: ${health.response.status}`)
  }

  const email = `qa.e2e.${Date.now()}@example.com`
  const register = await request(`${QA_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'QA E2E User',
      email,
      password: QA_PASSWORD,
      role: 'operator'
    })
  })

  if (!register.response.ok || !register.body?.token) {
    throw new Error(`No se pudo registrar usuario E2E: ${register.response.status} ${JSON.stringify(register.body)}`)
  }

  const token = register.body.token
  const headers = { Authorization: `Bearer ${token}` }

  const checks = [
    { name: 'auth_me', path: '/api/v1/auth/me', expectedStatus: 200, required: true },
    { name: 'zones', path: '/api/v1/zones?page=1&limit=10', expectedStatus: 200, required: true },
    { name: 'geo_sync', path: '/api/v1/geo/sync-status', expectedStatus: 200, required: true },
    { name: 'geo_features', path: '/api/v1/geo/features?limit=5', expectedStatus: 200, required: true },
    { name: 'decision_engine', path: '/api/v1/geo-analytics/decision-engine?horizon_days=45&limit=4&role=manager', expectedStatus: 200, required: true },
    { name: 'financial_summary', path: '/api/v1/financial-intelligence/summary?limit=3', expectedStatus: 200, required: true },
    { name: 'demographic_summary', path: '/api/v1/demographic-social/summary?limit=8', expectedStatus: 200, required: true }
  ]

  const results = []

  for (const item of checks) {
    const current = await request(`${QA_BASE_URL}${item.path}`, { headers })
    const ok = current.response.status === item.expectedStatus

    results.push({
      name: item.name,
      status: current.response.status,
      expected: item.expectedStatus,
      ok
    })

    if (!ok && item.required) {
      failures.push({ endpoint: item.name, expected: item.expectedStatus, got: current.response.status, body: current.body })
    }
  }

  const zonesRes = await request(`${QA_BASE_URL}/api/v1/zones?page=1&limit=3&sortBy=name&order=ASC`, { headers })
  const firstZone = Array.isArray(zonesRes.body?.data) ? zonesRes.body.data[0] : null
  if (firstZone?.id) {
    const scopedChecks = [
      { name: 'financial_summary_scoped', path: `/api/v1/financial-intelligence/summary?limit=3&zone_id=${firstZone.id}` },
      { name: 'demographic_summary_scoped', path: `/api/v1/demographic-social/summary?limit=5&zone_id=${firstZone.id}` }
    ]

    for (const item of scopedChecks) {
      const scoped = await request(`${QA_BASE_URL}${item.path}`, { headers })
      const ok = scoped.response.status === 200
      results.push({ name: item.name, status: scoped.response.status, expected: 200, ok })
      if (!ok) {
        failures.push({ endpoint: item.name, expected: 200, got: scoped.response.status, body: scoped.body })
      }
    }
  }

  const durationMs = Date.now() - startedAt
  const report = {
    ok: failures.length === 0,
    baseUrl: QA_BASE_URL,
    duration_ms: durationMs,
    checks: results,
    failures
  }

  console.log(JSON.stringify(report, null, 2))

  if (failures.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
