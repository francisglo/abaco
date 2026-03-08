import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorHandler.js';

const DB_UNAVAILABLE_CODES = new Set([
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ECONNRESET',
  '57P01',
  '57P02',
  '57P03',
  '53300'
]);

const fallbackFilePath = path.join(os.tmpdir(), 'abaco-auth-fallback.json');
let writeQueue = Promise.resolve();

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeIsoDate(value) {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || null,
    zone_id: user.zone_id || null,
    active: user.active !== false,
    created_at: safeIsoDate(user.created_at)
  };
}

async function loadStore() {
  try {
    const raw = await fs.readFile(fallbackFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return { users: asArray(parsed?.users) };
  } catch {
    return { users: [] };
  }
}

async function saveStore(store) {
  writeQueue = writeQueue.then(() => fs.writeFile(fallbackFilePath, JSON.stringify(store, null, 2), 'utf8'));
  return writeQueue;
}

function createFallbackUserId(users) {
  const maxId = users.reduce((acc, item) => {
    const numeric = Number(item?.id);
    return Number.isFinite(numeric) ? Math.max(acc, numeric) : acc;
  }, 0);
  return maxId + 1;
}

export function isDbUnavailableError(error) {
  if (!error) return false;
  const code = String(error.code || '').toUpperCase();
  if (DB_UNAVAILABLE_CODES.has(code)) return true;

  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('econnrefused') ||
    message.includes('timeout') ||
    message.includes('connection terminated unexpectedly') ||
    message.includes('db_unavailable')
  );
}

export async function registerFallbackUser({ name, email, password, role = 'operator', phone = null, zoneId = null }) {
  const normalizedEmail = normalizeEmail(email);
  const store = await loadStore();

  const existing = store.users.find((item) => normalizeEmail(item.email) === normalizedEmail);
  if (existing) {
    throw new AppError('Email ya registrado', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS, 10) || 10);
  const user = {
    id: createFallbackUserId(store.users),
    name,
    email: normalizedEmail,
    role,
    phone,
    zone_id: zoneId,
    active: true,
    password_hash: passwordHash,
    created_at: new Date().toISOString()
  };

  store.users.push(user);
  await saveStore(store);
  return toPublicUser(user);
}

export async function loginFallbackUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const store = await loadStore();
  const user = store.users.find((item) => normalizeEmail(item.email) === normalizedEmail);

  if (!user) {
    throw new AppError('Email o contraseña incorrectos', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.active) {
    throw new AppError('Usuario desactivado', 403, 'USER_INACTIVE');
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    throw new AppError('Email o contraseña incorrectos', 401, 'INVALID_CREDENTIALS');
  }

  return toPublicUser(user);
}

export async function getFallbackProfileById(userId) {
  const store = await loadStore();
  const user = store.users.find((item) => Number(item.id) === Number(userId));
  return user ? toPublicUser(user) : null;
}

export async function changeFallbackPassword({ userId, currentPassword, newPassword }) {
  const store = await loadStore();
  const idx = store.users.findIndex((item) => Number(item.id) === Number(userId));

  if (idx < 0) {
    throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
  }

  const user = store.users[idx];
  const isValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValid) {
    throw new AppError('Contraseña actual incorrecta', 401, 'INVALID_PASSWORD');
  }

  user.password_hash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS, 10) || 10);
  store.users[idx] = user;
  await saveStore(store);
}
