import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BASE_URL = 'http://127.0.0.1:3001';
const qaBaseUrl = process.env.QA_BASE_URL || DEFAULT_BASE_URL;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

function runNodeScript(scriptPath, args = [], extraEnv = {}) {
  return runNodeCommand([scriptPath, ...args], extraEnv);
}

function runNodeCommand(args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
      cwd: backendRoot
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Falló comando node (${args.join(' ')}) con código ${code}`));
    });
  });
}

async function ensureQaBackendReachable(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health respondió ${response.status}`);
    }
  } catch (error) {
    throw new Error(
      `No se puede alcanzar QA_BASE_URL (${baseUrl}). Inicia backend y reintenta. Detalle: ${error.message}`
    );
  }
}

async function runAutonomousActivationLogsAssertion(baseUrl) {
  const email = `qa.full.logs.${Date.now()}@example.com`;
  const password = process.env.QA_PASSWORD || 'Clave123!';

  const registerResponse = await fetch(`${baseUrl}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'QA Full Logs',
      email,
      password,
      role: 'manager'
    })
  });

  const registerBody = await registerResponse.json().catch(() => null);
  if (!registerResponse.ok || !registerBody?.token || !registerBody?.user?.id) {
    throw new Error(
      `No se pudo registrar usuario QA para logs: ${registerResponse.status} ${JSON.stringify(registerBody)}`
    );
  }

  const headers = {
    Authorization: `Bearer ${registerBody.token}`,
    'Content-Type': 'application/json'
  };

  const runResponse = await fetch(
    `${baseUrl}/api/v1/operational-algorithms/advanced-suite/run?limit=5&auto=true&include_experimental=true`,
    { method: 'GET', headers }
  );
  const runBody = await runResponse.json().catch(() => null);
  if (!runResponse.ok) {
    throw new Error(
      `No se pudo ejecutar advanced-suite/run en full QA: ${runResponse.status} ${JSON.stringify(runBody)}`
    );
  }

  const logsResponse = await fetch(
    `${baseUrl}/api/v1/operational-algorithms/advanced-suite/activation-logs?limit=20`,
    { method: 'GET', headers }
  );
  const logsBody = await logsResponse.json().catch(() => null);

  if (!logsResponse.ok || !Array.isArray(logsBody?.data)) {
    throw new Error(
      `No se pudo consultar activation-logs en full QA: ${logsResponse.status} ${JSON.stringify(logsBody)}`
    );
  }

  const ownLogs = logsBody.data.filter(
    (entry) => Number(entry?.created_by) === Number(registerBody.user.id)
  );

  if (ownLogs.length < 1) {
    throw new Error(
      `Activation logs no devolvió registros del usuario QA ${registerBody.user.id}. Total devuelto: ${logsBody.data.length}`
    );
  }

  return {
    qaUserId: Number(registerBody.user.id),
    ownLogsCount: ownLogs.length,
    returnedLogsCount: logsBody.data.length,
    latestOwnLogId: ownLogs[0]?.id ?? null
  };
}

async function main() {
  console.log('\\n═══════════════════════════════════════════════════════');
  console.log('🧪 ÁBACO Full QA Check');
  console.log(`🌐 QA_BASE_URL: ${qaBaseUrl}`);
  console.log('═══════════════════════════════════════════════════════\\n');

  await runNodeScript('scripts/verify-db-postgis.js');
  await runNodeCommand(
    ['--experimental-vm-modules', 'node_modules/jest/bin/jest.js', '--detectOpenHandles']
  );
  await ensureQaBackendReachable(qaBaseUrl);
  await runNodeScript('scripts/qa-role-matrix.js', [], { QA_BASE_URL: qaBaseUrl });
  await runNodeScript('scripts/qa-connectivity-e2e.js', [], { QA_BASE_URL: qaBaseUrl });
  await runNodeScript('scripts/qa-operational-algorithms.js', [], { QA_BASE_URL: qaBaseUrl });
  const activationLogsMetrics = await runAutonomousActivationLogsAssertion(qaBaseUrl);

  console.log(
    `📊 Activation logs assertion: own_logs=${activationLogsMetrics.ownLogsCount} ` +
      `returned=${activationLogsMetrics.returnedLogsCount} qa_user_id=${activationLogsMetrics.qaUserId} ` +
      `latest_own_log_id=${activationLogsMetrics.latestOwnLogId}`
  );

  console.log('\n✅ Full QA finalizado: DB real + PostGIS + tests + roles + e2e + algoritmos operativos + activation logs');
}

main().catch((error) => {
  console.error('\\n❌ Full QA falló');
  console.error(error.message);
  process.exit(1);
});
