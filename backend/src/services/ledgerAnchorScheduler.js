import { isBlockchainEnabled } from './blockchainAnchorService.js';
import { processPendingLedgerAnchors } from '../controllers/ledgerController.js';

let schedulerTimer = null;
let schedulerRunning = false;
let schedulerMetrics = {
  enabled: false,
  running: false,
  startAt: null,
  lastRunAt: null,
  lastSuccessAt: null,
  lastErrorAt: null,
  lastErrorMessage: null,
  totalCycles: 0,
  totalAnchored: 0,
  totalFailed: 0,
  lastResult: null,
  config: null
};

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}

function parseIntWithBounds(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), min), max);
}

async function runSchedulerCycle(config) {
  if (schedulerRunning) return;
  schedulerRunning = true;
  schedulerMetrics.running = true;
  schedulerMetrics.lastRunAt = new Date().toISOString();
  schedulerMetrics.totalCycles += 1;

  try {
    const result = await processPendingLedgerAnchors({
      limit: config.batchLimit,
      source: config.source
    });

    schedulerMetrics.lastSuccessAt = new Date().toISOString();
    schedulerMetrics.lastResult = result;
    schedulerMetrics.totalAnchored += Number(result.anchored_count || 0);
    schedulerMetrics.totalFailed += Number(result.failed_count || 0);

    if (result.anchored_count > 0 || result.failed_count > 0) {
      console.log('⛓️ [LedgerScheduler] ciclo ejecutado:', {
        anchored: result.anchored_count,
        failed: result.failed_count,
        totalCandidates: result.total_candidates
      });
    }
  } catch (error) {
    schedulerMetrics.lastErrorAt = new Date().toISOString();
    schedulerMetrics.lastErrorMessage = error.message;
    console.error('❌ [LedgerScheduler] error en ciclo de anclaje:', error.message);
  } finally {
    schedulerRunning = false;
    schedulerMetrics.running = false;
  }
}

export function startLedgerAnchorScheduler() {
  const enabled = parseBoolean(process.env.AUTO_ANCHOR_ENABLED, false);
  const blockchainEnabled = isBlockchainEnabled();

  schedulerMetrics = {
    enabled: false,
    running: false,
    startAt: null,
    lastRunAt: null,
    lastSuccessAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
    totalCycles: 0,
    totalAnchored: 0,
    totalFailed: 0,
    lastResult: null,
    config: null
  };

  if (!enabled) {
    console.log('ℹ️ [LedgerScheduler] deshabilitado (AUTO_ANCHOR_ENABLED=false)');
    schedulerMetrics.config = { reason: 'AUTO_ANCHOR_ENABLED=false' };
    return null;
  }

  if (!blockchainEnabled) {
    console.log('ℹ️ [LedgerScheduler] blockchain deshabilitado, no se inicia scheduler');
    schedulerMetrics.config = { reason: 'BLOCKCHAIN_ENABLED=false' };
    return null;
  }

  const config = {
    intervalSeconds: parseIntWithBounds(process.env.AUTO_ANCHOR_INTERVAL_SECONDS, 60, 10, 86400),
    batchLimit: parseIntWithBounds(process.env.AUTO_ANCHOR_BATCH_LIMIT, 10, 1, 200),
    source: process.env.AUTO_ANCHOR_SOURCE || 'abaco-auto-scheduler'
  };

  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  console.log('✅ [LedgerScheduler] iniciado', config);

  schedulerMetrics.enabled = true;
  schedulerMetrics.startAt = new Date().toISOString();
  schedulerMetrics.config = config;

  runSchedulerCycle(config);
  schedulerTimer = setInterval(() => runSchedulerCycle(config), config.intervalSeconds * 1000);

  return schedulerTimer;
}

export function stopLedgerAnchorScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('🛑 [LedgerScheduler] detenido');
  }

  schedulerMetrics.running = false;
}

export function getLedgerAnchorSchedulerMetrics() {
  return {
    ...schedulerMetrics,
    running: schedulerRunning || schedulerMetrics.running
  };
}
