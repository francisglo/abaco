import database from '../config/database.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { decryptPayload, encryptPayload, hashBlock } from '../utils/ledgerCrypto.js';
import { anchorHash, getLatestAnchorOnChain, isBlockchainEnabled } from '../services/blockchainAnchorService.js';

function normalizeNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeBatchLimit(value, fallback = 10) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), 200);
}

function getRetryConfig() {
  const baseSeconds = Math.min(Math.max(Number(process.env.AUTO_ANCHOR_RETRY_BASE_SECONDS || 15), 1), 3600);
  const maxRetries = Math.min(Math.max(Number(process.env.AUTO_ANCHOR_MAX_RETRIES || 8), 1), 100);
  return { baseSeconds, maxRetries };
}

function computeBackoffSeconds(retryCount, baseSeconds) {
  const safeRetry = Math.max(Number(retryCount) || 1, 1);
  const exponential = baseSeconds * (2 ** (safeRetry - 1));
  return Math.min(exponential, 24 * 60 * 60);
}

function buildHashSource(row) {
  return {
    block_index: Number(row.block_index),
    previous_hash: String(row.previous_hash || ''),
    payload_ciphertext: String(row.payload_ciphertext || ''),
    payload_iv: String(row.payload_iv || ''),
    payload_auth_tag: String(row.payload_auth_tag || ''),
    resource_type: String(row.resource_type || ''),
    resource_id: row.resource_id || null,
    action: String(row.action || ''),
    metadata: row.metadata || {},
    decision_score: row.decision_score === null || row.decision_score === undefined
      ? null
      : Number(row.decision_score),
    created_by: row.created_by || null,
    created_at: new Date(row.created_at).toISOString()
  };
}

async function createGenesisIfNeeded(client) {
  const existing = await client.query('SELECT id FROM ledger_blocks WHERE block_index = 0 LIMIT 1');
  if (existing.rows.length) return;

  const createdAt = new Date();
  const encrypted = encryptPayload({
    type: 'genesis',
    message: 'Bloque génesis de integridad ÁBACO',
    created_at: createdAt.toISOString()
  });

  const source = {
    block_index: 0,
    previous_hash: 'GENESIS',
    payload_ciphertext: encrypted.ciphertext,
    payload_iv: encrypted.iv,
    payload_auth_tag: encrypted.authTag,
    resource_type: 'system',
    resource_id: 'genesis',
    action: 'GENESIS',
    metadata: { immutable: true },
    decision_score: null,
    created_by: null,
    created_at: createdAt.toISOString()
  };

  const hash = hashBlock(source);

  await client.query(
    `
      INSERT INTO ledger_blocks (
        block_index, previous_hash, current_hash,
        payload_ciphertext, payload_iv, payload_auth_tag, payload_algorithm,
        resource_type, resource_id, action, metadata, decision_score, created_by, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14)
    `,
    [
      0,
      'GENESIS',
      hash,
      encrypted.ciphertext,
      encrypted.iv,
      encrypted.authTag,
      encrypted.algorithm,
      'system',
      'genesis',
      'GENESIS',
      JSON.stringify({ immutable: true }),
      null,
      null,
      createdAt
    ]
  );
}

export const appendLedgerBlock = asyncHandler(async (req, res) => {
  const {
    resource_type,
    resource_id = null,
    action,
    payload,
    metadata = {},
    decision_score = null
  } = req.body || {};

  if (!resource_type || !action) {
    throw new AppError('resource_type y action son requeridos', 400, 'VALIDATION_ERROR');
  }

  if (payload === undefined || payload === null) {
    throw new AppError('payload es requerido', 400, 'VALIDATION_ERROR');
  }

  const pool = database.getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await createGenesisIfNeeded(client);

    const lastResult = await client.query(
      'SELECT block_index, current_hash FROM ledger_blocks ORDER BY block_index DESC LIMIT 1 FOR UPDATE'
    );

    const lastBlock = lastResult.rows[0];
    const nextIndex = Number(lastBlock.block_index) + 1;
    const previousHash = String(lastBlock.current_hash);
    const createdAt = new Date();
    const encrypted = encryptPayload(payload);

    const source = {
      block_index: nextIndex,
      previous_hash: previousHash,
      payload_ciphertext: encrypted.ciphertext,
      payload_iv: encrypted.iv,
      payload_auth_tag: encrypted.authTag,
      resource_type,
      resource_id,
      action,
      metadata,
      decision_score: normalizeNumber(decision_score, null),
      created_by: req.user?.id || null,
      created_at: createdAt.toISOString()
    };

    const currentHash = hashBlock(source);

    const insertResult = await client.query(
      `
        INSERT INTO ledger_blocks (
          block_index, previous_hash, current_hash,
          payload_ciphertext, payload_iv, payload_auth_tag, payload_algorithm,
          resource_type, resource_id, action, metadata, decision_score, created_by, created_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14)
        RETURNING id, block_index, previous_hash, current_hash, resource_type, resource_id, action, metadata, decision_score, created_by, created_at
      `,
      [
        nextIndex,
        previousHash,
        currentHash,
        encrypted.ciphertext,
        encrypted.iv,
        encrypted.authTag,
        encrypted.algorithm,
        resource_type,
        resource_id,
        action,
        JSON.stringify(metadata || {}),
        normalizeNumber(decision_score, null),
        req.user?.id || null,
        createdAt
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Bloque ledger registrado',
      block: insertResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

export const getLedgerBlocks = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 500);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const offset = (page - 1) * limit;
  const resourceType = req.query.resource_type ? String(req.query.resource_type) : null;

  const whereClause = resourceType ? 'WHERE resource_type = $1' : '';
  const values = resourceType ? [resourceType, limit, offset] : [limit, offset];

  const query = `
    SELECT id, block_index, previous_hash, current_hash,
           resource_type, resource_id, action, metadata,
          decision_score, created_by, created_at,
          anchor_status, anchor_tx_hash, anchor_network, anchor_contract, anchored_at
    FROM ledger_blocks
    ${whereClause}
    ORDER BY block_index DESC
    LIMIT $${resourceType ? 2 : 1}
    OFFSET $${resourceType ? 3 : 2}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM ledger_blocks
    ${whereClause}
  `;

  const [rowsResult, totalResult] = await Promise.all([
    database.query(query, values),
    resourceType ? database.queryOne(countQuery, [resourceType]) : database.queryOne(countQuery)
  ]);

  res.json({
    page,
    limit,
    total: Number(totalResult?.total || 0),
    data: rowsResult.rows
  });
});

export const getLedgerBlockDecrypted = asyncHandler(async (req, res) => {
  const blockId = Number(req.params.blockId);
  if (!Number.isFinite(blockId)) {
    throw new AppError('blockId inválido', 400, 'VALIDATION_ERROR');
  }

  const row = await database.queryOne(
    `
      SELECT id, block_index, previous_hash, current_hash,
             payload_ciphertext, payload_iv, payload_auth_tag, payload_algorithm,
             resource_type, resource_id, action, metadata,
              decision_score, created_by, created_at,
              anchor_status, anchor_tx_hash, anchor_network, anchor_contract, anchored_at
      FROM ledger_blocks
      WHERE id = $1
    `,
    [blockId]
  );

  if (!row) {
    throw new AppError('Bloque no encontrado', 404, 'LEDGER_BLOCK_NOT_FOUND');
  }

  const decryptedPayload = decryptPayload({
    ciphertext: row.payload_ciphertext,
    iv: row.payload_iv,
    authTag: row.payload_auth_tag,
    algorithm: row.payload_algorithm
  });

  res.json({
    block: {
      id: row.id,
      block_index: row.block_index,
      previous_hash: row.previous_hash,
      current_hash: row.current_hash,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      action: row.action,
      metadata: row.metadata,
      decision_score: row.decision_score,
      created_by: row.created_by,
      created_at: row.created_at,
      anchor_status: row.anchor_status,
      anchor_tx_hash: row.anchor_tx_hash,
      anchor_network: row.anchor_network,
      anchor_contract: row.anchor_contract,
      anchored_at: row.anchored_at,
      payload: decryptedPayload
    }
  });
});

export const verifyLedgerIntegrity = asyncHandler(async (_req, res) => {
  const { rows } = await database.query(
    `
      SELECT id, block_index, previous_hash, current_hash,
             payload_ciphertext, payload_iv, payload_auth_tag,
             resource_type, resource_id, action, metadata,
              decision_score, created_by, created_at,
              anchor_status, anchor_tx_hash, anchor_network, anchor_contract, anchored_at
      FROM ledger_blocks
      ORDER BY block_index ASC
    `
  );

  if (!rows.length) {
    return res.json({
      valid: true,
      total_blocks: 0,
      broken_blocks: []
    });
  }

  const broken = [];

  for (let index = 0; index < rows.length; index += 1) {
    const current = rows[index];

    if (index === 0) {
      if (current.block_index !== '0' && current.block_index !== 0) {
        broken.push({ id: current.id, reason: 'GENESIS_INDEX_INVALID' });
      }
      if (String(current.previous_hash) !== 'GENESIS') {
        broken.push({ id: current.id, reason: 'GENESIS_PREVIOUS_HASH_INVALID' });
      }
    } else {
      const previous = rows[index - 1];
      if (String(current.previous_hash) !== String(previous.current_hash)) {
        broken.push({ id: current.id, reason: 'CHAIN_LINK_BROKEN' });
      }
      if (Number(current.block_index) !== Number(previous.block_index) + 1) {
        broken.push({ id: current.id, reason: 'BLOCK_INDEX_SEQUENCE_BROKEN' });
      }
    }

    const recalculated = hashBlock(buildHashSource(current));
    if (String(recalculated) !== String(current.current_hash)) {
      broken.push({ id: current.id, reason: 'HASH_MISMATCH' });
    }
  }

  res.json({
    valid: broken.length === 0,
    total_blocks: rows.length,
    broken_blocks: broken
  });
});

export const anchorLatestLedgerBlock = asyncHandler(async (req, res) => {
  const source = req.body?.source || 'abaco-ledger';

  const latest = await database.queryOne(
    `
      SELECT id, block_index, current_hash, anchor_status
      FROM ledger_blocks
      ORDER BY block_index DESC
      LIMIT 1
    `
  );

  if (!latest) {
    throw new AppError('No hay bloques para anclar', 404, 'LEDGER_EMPTY');
  }

  if (String(latest.anchor_status || '') === 'anchored') {
    return res.json({
      message: 'El último bloque ya está anclado en blockchain',
      block: latest
    });
  }

  const anchor = await anchorHash({
    rootHash: latest.current_hash,
    blockIndex: latest.block_index,
    source
  });

  await database.query(
    `
      UPDATE ledger_blocks
      SET anchor_status = 'anchored',
          anchor_tx_hash = $1,
          anchor_network = $2,
          anchor_contract = $3,
          anchored_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `,
    [anchor.txHash, anchor.network, anchor.contractAddress, latest.id]
  );

  res.status(201).json({
    message: 'Bloque anclado en blockchain',
    anchored: {
      ledger_block_id: latest.id,
      ledger_block_index: Number(latest.block_index),
      ledger_hash: latest.current_hash,
      tx_hash: anchor.txHash,
      block_number: anchor.blockNumber,
      network: anchor.network,
      contract: anchor.contractAddress
    }
  });
});

export async function processPendingLedgerAnchors({
  limit = 10,
  source = 'abaco-ledger-batch'
} = {}) {
  const safeLimit = normalizeBatchLimit(limit, 10);
  const { baseSeconds, maxRetries } = getRetryConfig();

  const { rows: pendingBlocks } = await database.query(
    `
      SELECT id, block_index, current_hash, anchor_status,
             anchor_retry_count, next_anchor_retry_at
      FROM ledger_blocks
      WHERE COALESCE(anchor_status, 'pending') IN ('pending', 'failed')
        AND COALESCE(anchor_retry_count, 0) < $2
        AND (next_anchor_retry_at IS NULL OR next_anchor_retry_at <= CURRENT_TIMESTAMP)
      ORDER BY block_index ASC
      LIMIT $1
    `,
    [safeLimit, maxRetries]
  );

  if (!pendingBlocks.length) {
    return {
      requested_limit: safeLimit,
      total_candidates: 0,
      anchored_count: 0,
      failed_count: 0,
      anchored: [],
      failed: []
    };
  }

  const anchored = [];
  const failed = [];

  for (const item of pendingBlocks) {
    try {
      const anchor = await anchorHash({
        rootHash: item.current_hash,
        blockIndex: item.block_index,
        source
      });

      await database.query(
        `
          UPDATE ledger_blocks
          SET anchor_status = 'anchored',
              anchor_tx_hash = $1,
              anchor_network = $2,
              anchor_contract = $3,
              anchored_at = CURRENT_TIMESTAMP,
              anchor_retry_count = 0,
              anchor_last_error = NULL,
              anchor_last_attempt_at = CURRENT_TIMESTAMP,
              next_anchor_retry_at = NULL
          WHERE id = $4
        `,
        [anchor.txHash, anchor.network, anchor.contractAddress, item.id]
      );

      anchored.push({
        ledger_block_id: item.id,
        ledger_block_index: Number(item.block_index),
        ledger_hash: item.current_hash,
        tx_hash: anchor.txHash,
        block_number: anchor.blockNumber,
        network: anchor.network,
        contract: anchor.contractAddress
      });
    } catch (error) {
      await database.query(
        `
          UPDATE ledger_blocks
          SET anchor_status = 'failed',
              anchor_retry_count = COALESCE(anchor_retry_count, 0) + 1,
              anchor_last_error = $1,
              anchor_last_attempt_at = CURRENT_TIMESTAMP,
              next_anchor_retry_at = CURRENT_TIMESTAMP + (($2::text || ' seconds')::interval)
          WHERE id = $3
        `,
        [String(error.message || 'Anchor failed').slice(0, 1500), computeBackoffSeconds((Number(item.anchor_retry_count || 0) + 1), baseSeconds), item.id]
      );

      failed.push({
        ledger_block_id: item.id,
        ledger_block_index: Number(item.block_index),
        ledger_hash: item.current_hash,
        error: error.message,
        retry_count: Number(item.anchor_retry_count || 0) + 1
      });
    }
  }

  return {
    requested_limit: safeLimit,
    total_candidates: pendingBlocks.length,
    anchored_count: anchored.length,
    failed_count: failed.length,
    max_retries: maxRetries,
    retry_base_seconds: baseSeconds,
    anchored,
    failed
  };
}

export const anchorPendingLedgerBlocks = asyncHandler(async (req, res) => {
  const limit = normalizeBatchLimit(req.body?.limit || req.query?.limit, 10);
  const source = req.body?.source || req.query?.source || 'abaco-ledger-batch';

  const result = await processPendingLedgerAnchors({ limit, source });

  res.status(201).json({
    message: 'Proceso de anclaje por lote ejecutado',
    batch: result
  });
});

export const getLedgerAnchorStatus = asyncHandler(async (_req, res) => {
  const dbStats = await database.queryOne(`
    SELECT
      COUNT(*)::int AS total_blocks,
      COUNT(*) FILTER (WHERE anchor_status = 'anchored')::int AS anchored_blocks,
      COUNT(*) FILTER (WHERE anchor_status = 'failed')::int AS failed_blocks,
      COUNT(*) FILTER (WHERE anchor_status IS NULL OR anchor_status <> 'anchored')::int AS pending_blocks,
      COUNT(*) FILTER (WHERE anchor_status = 'failed' AND next_anchor_retry_at > CURRENT_TIMESTAMP)::int AS scheduled_retry_blocks,
      COUNT(*) FILTER (WHERE anchor_status = 'failed' AND COALESCE(anchor_retry_count, 0) >= $1)::int AS exhausted_blocks
    FROM ledger_blocks
  `, [getRetryConfig().maxRetries]);

  const latestAnchored = await database.queryOne(`
    SELECT id, block_index, current_hash, anchor_tx_hash, anchor_network, anchor_contract, anchored_at
    FROM ledger_blocks
    WHERE anchor_status = 'anchored'
    ORDER BY block_index DESC
    LIMIT 1
  `);

  let chain = null;
  if (isBlockchainEnabled()) {
    try {
      chain = await getLatestAnchorOnChain();
    } catch (error) {
      chain = { error: error.message };
    }
  }

  res.json({
    blockchain_enabled: isBlockchainEnabled(),
    ledger: {
      total_blocks: Number(dbStats?.total_blocks || 0),
      anchored_blocks: Number(dbStats?.anchored_blocks || 0),
      failed_blocks: Number(dbStats?.failed_blocks || 0),
      pending_blocks: Number(dbStats?.pending_blocks || 0),
      scheduled_retry_blocks: Number(dbStats?.scheduled_retry_blocks || 0),
      exhausted_blocks: Number(dbStats?.exhausted_blocks || 0),
      latest_anchored: latestAnchored || null
    },
    chain
  });
});
