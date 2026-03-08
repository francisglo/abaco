import express from 'express'
import cors from 'cors'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.LITE_API_PORT || process.env.PORT || 4100
const DB_FILE = path.resolve(__dirname, '../mock/db.json')
const JWT_SECRET = process.env.LITE_JWT_SECRET || 'abaco-lite-secret-change-me'
const TOKEN_TTL = process.env.LITE_TOKEN_TTL || '7d'
const DEFAULT_DEV_PASSWORD = process.env.LITE_DEFAULT_PASSWORD || 'abaco123'
const DATA_KEY_SOURCE = process.env.LITE_DATA_KEY || `${JWT_SECRET}-data-key`
const DATA_KEY = crypto.createHash('sha256').update(DATA_KEY_SOURCE).digest()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

const ARRAY_RESOURCES = new Set([
  'users',
  'zones',
  'voters',
  'tasks',
  'logs',
  'notifications',
  'accessLogs',
  'activeSessions',
  'rolePermissions',
  'backups',
  'verticals',
  'categories',
  'variables',
  'validationRules',
  'ascend_movements',
  'ascend_campaigns',
  'ascend_opinions',
  'ascend_faculty_agreements',
  'ascend_budgets',
  'ascend_representatives',
  'ascend_strategic_plans',
  'ascend_achievements'
])

const ASCEND_ROLE_RULES = {
  director: { view: [0, 1, 2, 3, 4, 5, 6, 7], edit: [0, 1, 2, 3, 4, 5, 6, 7] },
  coordinador: { view: [0, 1, 2, 3, 5, 6, 7], edit: [0, 1, 2, 3, 5, 6] },
  representante: { view: [0, 1, 2, 3, 5, 7], edit: [0, 1, 2, 3, 5] },
  personero: { view: [0, 1, 2, 3, 5, 6, 7], edit: [0, 1, 2, 3, 5, 6] },
  contralor: { view: [2, 3, 4, 5, 6, 7], edit: [2, 3, 4, 7] },
  tesorero: { view: [3, 4, 6, 7], edit: [4] },
  maestro: { view: [2, 3, 5, 6, 7], edit: [2, 6] },
  alumno: { view: [0, 1, 2, 7], edit: [2] },
  votante: { view: [1, 2], edit: [] }
}

const ASCEND_RESOURCE_TO_MODULE = {
  ascend_movements: 0,
  ascend_campaigns: 1,
  ascend_opinions: 2,
  ascend_faculty_agreements: 3,
  ascend_budgets: 4,
  ascend_representatives: 5,
  ascend_strategic_plans: 6,
  ascend_achievements: 7
}

let writeQueue = Promise.resolve()

async function readDb() {
  const raw = await fs.readFile(DB_FILE, 'utf8')
  return JSON.parse(raw)
}

async function writeDb(data) {
  writeQueue = writeQueue.then(() => fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8'))
  return writeQueue
}

function sanitizeUser(user) {
  if (!user) return null
  const { passwordHash, encryptedProfile, ...safe } = user

  const decryptedProfile = decryptProfile(encryptedProfile)
  if (decryptedProfile) {
    safe.profile = {
      bio: decryptedProfile.bio || '',
      phone: decryptedProfile.phone || '',
      avatar: decryptedProfile.avatar || '',
      headline: decryptedProfile.headline || '',
      location: decryptedProfile.location || '',
      website: decryptedProfile.website || '',
      skills: Array.isArray(decryptedProfile.skills) ? decryptedProfile.skills : [],
      experience: decryptedProfile.experience || '',
      timeline: Array.isArray(decryptedProfile.timeline) ? decryptedProfile.timeline : [],
      achievements: Array.isArray(decryptedProfile.achievements) ? decryptedProfile.achievements : []
    }
    if (!safe.phone && decryptedProfile.phone) {
      safe.phone = decryptedProfile.phone
    }
  }

  return safe
}

function encryptProfile(profile = {}) {
  const normalized = {
    bio: String(profile.bio || ''),
    phone: String(profile.phone || ''),
    avatar: String(profile.avatar || ''),
    headline: String(profile.headline || ''),
    location: String(profile.location || ''),
    website: String(profile.website || ''),
    skills: Array.isArray(profile.skills)
      ? profile.skills.map((item) => String(item).trim()).filter(Boolean)
      : [],
    experience: String(profile.experience || ''),
    timeline: Array.isArray(profile.timeline)
      ? profile.timeline.map((item) => String(item).trim()).filter(Boolean)
      : [],
    achievements: Array.isArray(profile.achievements)
      ? profile.achievements.map((item) => String(item).trim()).filter(Boolean)
      : []
  }

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', DATA_KEY, iv)
  const payload = JSON.stringify(normalized)
  const encrypted = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    iv: iv.toString('base64'),
    tag: authTag.toString('base64'),
    data: encrypted.toString('base64')
  }
}

function decryptProfile(encryptedProfile) {
  if (!encryptedProfile?.iv || !encryptedProfile?.tag || !encryptedProfile?.data) {
    return null
  }

  try {
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      DATA_KEY,
      Buffer.from(encryptedProfile.iv, 'base64')
    )
    decipher.setAuthTag(Buffer.from(encryptedProfile.tag, 'base64'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedProfile.data, 'base64')),
      decipher.final()
    ])
    return JSON.parse(decrypted.toString('utf8'))
  } catch {
    return null
  }
}

function sanitizeCollection(resource, data) {
  if (resource !== 'users') return data
  if (Array.isArray(data)) return data.map((entry) => sanitizeUser(entry))
  return sanitizeUser(data)
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role || 'viewer'
    },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  )
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const [, token] = authHeader.split(' ')

  if (!token) {
    return res.status(401).json({ message: 'Missing Bearer token' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.auth = payload
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

function actionFromMethod(method) {
  const normalized = String(method || '').toUpperCase()
  if (normalized === 'GET') return 'read'
  if (normalized === 'POST') return 'create'
  if (normalized === 'DELETE') return 'delete'
  return 'update'
}

function getRolePermissionsFromDb(db, role) {
  const entries = Array.isArray(db?.rolePermissions) ? db.rolePermissions : []
  const found = entries.find((entry) => String(entry.role).toLowerCase() === String(role).toLowerCase())
  return found?.permissions || null
}

function canAccessAscend(role, resource, action) {
  const moduleIndex = ASCEND_RESOURCE_TO_MODULE[resource]
  if (moduleIndex === undefined) return null
  const rules = ASCEND_ROLE_RULES[String(role || '').toLowerCase()]
  if (!rules) return false
  if (action === 'read') return rules.view.includes(moduleIndex)
  return rules.edit.includes(moduleIndex)
}

async function requireResourcePermission(req, res, next) {
  const resource = req.params.resource
  const action = actionFromMethod(req.method)
  const role = String(req.auth?.role || '').toLowerCase()

  if (!resource || !action) return next()
  if (role === 'admin') return next()

  const db = await readDb()

  const ascendAccess = canAccessAscend(role, resource, action)
  if (ascendAccess !== null) {
    if (!ascendAccess) {
      return res.status(403).json({ message: `Role '${role}' cannot ${action} resource '${resource}'` })
    }
    return next()
  }

  const permissions = getRolePermissionsFromDb(db, role)
  const resourcePolicy = permissions?.[resource]

  if (!resourcePolicy) {
    return next()
  }

  if (!resourcePolicy[action]) {
    return res.status(403).json({ message: `Role '${role}' cannot ${action} resource '${resource}'` })
  }

  return next()
}

async function getAuthPermissions(req, res) {
  const role = String(req.auth?.role || '').toLowerCase()
  const db = await readDb()
  const staticPermissions = getRolePermissionsFromDb(db, role) || {}
  const ascendRules = role === 'admin'
    ? { view: [0, 1, 2, 3, 4, 5, 6, 7], edit: [0, 1, 2, 3, 4, 5, 6, 7] }
    : (ASCEND_ROLE_RULES[role] || { view: [], edit: [] })

  return res.json({
    role,
    staticPermissions,
    ascendPermissions: {
      viewModules: ascendRules.view,
      editModules: ascendRules.edit,
      resources: Object.entries(ASCEND_RESOURCE_TO_MODULE).map(([resource, index]) => ({
        resource,
        moduleIndex: index,
        canRead: ascendRules.view.includes(index),
        canWrite: ascendRules.edit.includes(index)
      }))
    }
  })
}

function applyFilters(items, query) {
  const reserved = new Set(['_sort', '_order', '_page', '_limit', 'page', 'limit'])
  let result = [...items]

  for (const [key, value] of Object.entries(query)) {
    if (reserved.has(key)) continue

    result = result.filter((item) => {
      const itemValue = item?.[key]
      if (itemValue === undefined || itemValue === null) return false
      return String(itemValue).toLowerCase().includes(String(value).toLowerCase())
    })
  }

  const sortField = query._sort
  const sortOrder = String(query._order || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc'
  if (sortField) {
    result.sort((a, b) => {
      const av = a?.[sortField]
      const bv = b?.[sortField]
      if (av === bv) return 0
      if (av === undefined) return 1
      if (bv === undefined) return -1
      if (av > bv) return sortOrder === 'asc' ? 1 : -1
      return sortOrder === 'asc' ? -1 : 1
    })
  }

  const page = Number(query._page || query.page || 0)
  const limit = Number(query._limit || query.limit || 0)
  if (page > 0 && limit > 0) {
    const start = (page - 1) * limit
    result = result.slice(start, start + limit)
  } else if (limit > 0) {
    result = result.slice(0, limit)
  }

  return result
}

function ensureArrayResource(db, resource) {
  if (!ARRAY_RESOURCES.has(resource)) return false
  if (!Array.isArray(db[resource])) db[resource] = []
  return true
}

async function listResource(req, res) {
  const { resource } = req.params
  const db = await readDb()

  if (ensureArrayResource(db, resource)) {
    const result = applyFilters(db[resource], req.query || {})
    return res.json(sanitizeCollection(resource, result))
  }

  if (db[resource] === undefined) {
    return res.status(404).json({ message: `Resource '${resource}' not found` })
  }

  return res.json(sanitizeCollection(resource, db[resource]))
}

async function getResourceById(req, res) {
  const { resource, id } = req.params
  const db = await readDb()

  if (!ensureArrayResource(db, resource)) {
    return res.status(404).json({ message: `Resource '${resource}' is not a collection` })
  }

  const numericId = Number(id)
  const item = db[resource].find((entry) => Number(entry.id) === numericId)
  if (!item) return res.status(404).json({ message: 'Not found' })

  return res.json(sanitizeCollection(resource, item))
}

async function createResource(req, res) {
  const { resource } = req.params
  const db = await readDb()

  if (!ensureArrayResource(db, resource)) {
    return res.status(400).json({ message: `Resource '${resource}' does not support POST` })
  }

  const collection = db[resource]
  const nextId = collection.length ? Math.max(...collection.map((entry) => Number(entry.id) || 0)) + 1 : 1

  const entity = {
    ...req.body,
    id: req.body?.id ?? nextId
  }

  collection.push(entity)
  await writeDb(db)
  return res.status(201).json(sanitizeCollection(resource, entity))
}

async function putResource(req, res) {
  const { resource, id } = req.params
  const db = await readDb()

  if (ensureArrayResource(db, resource)) {
    const numericId = Number(id)
    const index = db[resource].findIndex((entry) => Number(entry.id) === numericId)
    if (index === -1) return res.status(404).json({ message: 'Not found' })

    db[resource][index] = { ...req.body, id: numericId }
    await writeDb(db)
    return res.json(sanitizeCollection(resource, db[resource][index]))
  }

  if (db[resource] === undefined) {
    return res.status(404).json({ message: `Resource '${resource}' not found` })
  }

  db[resource] = req.body
  await writeDb(db)
  return res.json(sanitizeCollection(resource, db[resource]))
}

async function patchResource(req, res) {
  const { resource, id } = req.params
  const db = await readDb()

  if (ensureArrayResource(db, resource)) {
    const numericId = Number(id)
    const index = db[resource].findIndex((entry) => Number(entry.id) === numericId)
    if (index === -1) return res.status(404).json({ message: 'Not found' })

    db[resource][index] = { ...db[resource][index], ...req.body, id: numericId }
    await writeDb(db)
    return res.json(sanitizeCollection(resource, db[resource][index]))
  }

  if (db[resource] === undefined) {
    return res.status(404).json({ message: `Resource '${resource}' not found` })
  }

  if (typeof db[resource] !== 'object' || db[resource] === null || Array.isArray(db[resource])) {
    return res.status(400).json({ message: `Resource '${resource}' is not patchable` })
  }

  db[resource] = { ...db[resource], ...req.body }
  await writeDb(db)
  return res.json(sanitizeCollection(resource, db[resource]))
}

async function deleteResource(req, res) {
  const { resource, id } = req.params
  const db = await readDb()

  if (!ensureArrayResource(db, resource)) {
    return res.status(400).json({ message: `Resource '${resource}' does not support DELETE` })
  }

  const numericId = Number(id)
  const previousLength = db[resource].length
  db[resource] = db[resource].filter((entry) => Number(entry.id) !== numericId)

  if (db[resource].length === previousLength) {
    return res.status(404).json({ message: 'Not found' })
  }

  await writeDb(db)
  return res.status(204).send()
}

app.get('/health', async (_req, res) => {
  res.json({ ok: true, service: 'abaco-lite-api', port: Number(PORT) })
})

app.get('/api/docs', (_req, res) => {
  res.json({
    service: 'abaco-lite-api',
    version: 'v1',
    basePath: '/api/v1',
    endpoints: {
      health: 'GET /api/v1/health',
      register: 'POST /api/v1/auth/register',
      login: 'POST /api/v1/auth/login',
      me: 'GET /api/v1/auth/me',
      permissions: 'GET /api/v1/auth/permissions',
      resources: 'GET|POST /api/v1/:resource',
      resourceById: 'GET|PUT|PATCH|DELETE /api/v1/:resource/:id'
    }
  })
})

const apiV1 = express.Router()

apiV1.get('/health', (_req, res) => {
  res.json({ ok: true, version: 'v1' })
})

apiV1.post('/auth/register', async (req, res) => {
  const {
    name,
    email,
    password,
    role = 'operator',
    phone = '',
    bio = '',
    avatar = '',
    headline = '',
    location = '',
    website = '',
    skills = [],
    experience = '',
    timeline = [],
    achievements = [],
    zoneId = null
  } = req.body || {}

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' })
  }

  const db = await readDb()
  ensureArrayResource(db, 'users')

  const exists = db.users.find((user) => String(user.email).toLowerCase() === String(email).toLowerCase())
  if (exists) {
    return res.status(409).json({ message: 'Email already exists' })
  }

  const nextId = db.users.length ? Math.max(...db.users.map((entry) => Number(entry.id) || 0)) + 1 : 1
  const passwordHash = await bcrypt.hash(password, 10)

  const user = {
    id: nextId,
    name,
    email,
    role,
    phone,
    active: true,
    zoneId,
    encryptedProfile: encryptProfile({
      bio,
      phone,
      avatar,
      headline,
      location,
      website,
      skills,
      experience,
      timeline,
      achievements
    }),
    passwordHash
  }

  db.users.push(user)
  await writeDb(db)

  const token = signToken(user)
  return res.status(201).json({ user: sanitizeUser(user), token })
})

apiV1.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' })
  }

  const db = await readDb()
  ensureArrayResource(db, 'users')

  const user = db.users.find((item) => String(item.email).toLowerCase() === String(email).toLowerCase())
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  let valid = false
  if (user.passwordHash) {
    valid = await bcrypt.compare(password, user.passwordHash)
  } else {
    valid = password === DEFAULT_DEV_PASSWORD
    if (valid) {
      user.passwordHash = await bcrypt.hash(password, 10)
      await writeDb(db)
    }
  }

  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  const token = signToken(user)
  return res.json({ user: sanitizeUser(user), token })
})

apiV1.get('/auth/me', requireAuth, async (req, res) => {
  const db = await readDb()
  ensureArrayResource(db, 'users')
  const user = db.users.find((item) => Number(item.id) === Number(req.auth.sub))

  if (!user) return res.status(404).json({ message: 'User not found' })
  return res.json({ user: sanitizeUser(user) })
})

apiV1.get('/auth/permissions', requireAuth, getAuthPermissions)

apiV1.patch('/auth/me', requireAuth, async (req, res) => {
  const {
    name,
    phone,
    bio,
    avatar,
    headline,
    location,
    website,
    skills,
    experience,
    timeline,
    achievements
  } = req.body || {}
  const db = await readDb()
  ensureArrayResource(db, 'users')

  const index = db.users.findIndex((item) => Number(item.id) === Number(req.auth.sub))
  if (index === -1) return res.status(404).json({ message: 'User not found' })

  const current = db.users[index]
  const currentProfile = decryptProfile(current.encryptedProfile) || {
    bio: '',
    phone: current.phone || '',
    avatar: '',
    headline: '',
    location: '',
    website: '',
    skills: [],
    experience: '',
    timeline: [],
    achievements: []
  }

  if (typeof name === 'string' && name.trim()) {
    current.name = name.trim()
  }

  const nextProfile = {
    bio: typeof bio === 'string' ? bio : currentProfile.bio,
    phone: typeof phone === 'string' ? phone : currentProfile.phone,
    avatar: typeof avatar === 'string' ? avatar : currentProfile.avatar,
    headline: typeof headline === 'string' ? headline : currentProfile.headline,
    location: typeof location === 'string' ? location : currentProfile.location,
    website: typeof website === 'string' ? website : currentProfile.website,
    skills: Array.isArray(skills)
      ? skills.map((item) => String(item).trim()).filter(Boolean)
      : (Array.isArray(currentProfile.skills) ? currentProfile.skills : []),
    experience: typeof experience === 'string' ? experience : currentProfile.experience,
    timeline: Array.isArray(timeline)
      ? timeline.map((item) => String(item).trim()).filter(Boolean)
      : (Array.isArray(currentProfile.timeline) ? currentProfile.timeline : []),
    achievements: Array.isArray(achievements)
      ? achievements.map((item) => String(item).trim()).filter(Boolean)
      : (Array.isArray(currentProfile.achievements) ? currentProfile.achievements : [])
  }

  current.phone = nextProfile.phone
  current.encryptedProfile = encryptProfile(nextProfile)
  db.users[index] = current

  await writeDb(db)
  return res.json({ user: sanitizeUser(current) })
})

apiV1.delete('/auth/me', requireAuth, async (req, res) => {
  const { password } = req.body || {}
  if (!password) {
    return res.status(400).json({ message: 'password is required to delete account' })
  }

  const db = await readDb()
  ensureArrayResource(db, 'users')

  const index = db.users.findIndex((item) => Number(item.id) === Number(req.auth.sub))
  if (index === -1) return res.status(404).json({ message: 'User not found' })

  const user = db.users[index]

  let valid = false
  if (user.passwordHash) {
    valid = await bcrypt.compare(password, user.passwordHash)
  } else {
    valid = password === DEFAULT_DEV_PASSWORD
  }

  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' })
  }

  db.users.splice(index, 1)
  await writeDb(db)
  return res.status(204).send()
})

apiV1.use(requireAuth)
apiV1.use('/:resource', requireResourcePermission)

apiV1.get('/:resource', listResource)
apiV1.get('/:resource/:id', getResourceById)
apiV1.post('/:resource', createResource)
apiV1.put('/:resource/:id', putResource)
apiV1.patch('/:resource/:id', patchResource)
apiV1.delete('/:resource/:id', deleteResource)

app.use('/api/v1', apiV1)

app.get('/:resource', listResource)
app.get('/:resource/:id', getResourceById)
app.post('/:resource', createResource)
app.put('/:resource/:id', putResource)
app.patch('/:resource/:id', patchResource)
app.delete('/:resource/:id', deleteResource)

app.use((error, _req, res, _next) => {
  console.error('API error:', error)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`✅ ÁBACO Lite API ejecutándose en http://localhost:${PORT}`)
  console.log(`📁 Fuente de datos: ${DB_FILE}`)
  console.log('🔐 API v1 con JWT disponible en /api/v1')
  console.log('📘 Docs rápidas en /api/docs')
})
