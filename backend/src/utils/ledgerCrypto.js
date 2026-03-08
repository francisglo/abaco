import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function deriveLedgerKey() {
  const secret = process.env.LEDGER_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('LEDGER_ENCRYPTION_KEY o JWT_SECRET es requerido para cifrado de ledger');
  }
  return crypto.createHash('sha256').update(String(secret)).digest();
}

export function encryptPayload(payload) {
  const key = deriveLedgerKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
  const encrypted = Buffer.concat([cipher.update(raw, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: ALGORITHM,
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export function decryptPayload({ ciphertext, iv, authTag, algorithm = ALGORITHM }) {
  const key = deriveLedgerKey();
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final()
  ]).toString('utf8');

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}

export function hashBlock(blockData) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(blockData))
    .digest('hex');
}
