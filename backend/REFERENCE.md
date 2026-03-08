# 🎯 ÁBACO Backend - Complete Reference Guide

## 📑 Índice de Documentación

### 🚀 Getting Started
1. **[QUICKSTART.md](./QUICKSTART.md)** - Inicio en 5 minutos
2. **[README.md](./README.md)** - Documentación API completa

### 📚 Development
3. **[TESTING.md](./TESTING.md)** - Testing con Jest
4. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumen técnico

### 🚢 Deployment
5. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Producción (PM2, Docker, Heroku)

---

## 📊 Estructura del Proyecto

```
ABACO Backend/
│
├── 📁 src/                         # Código fuente
│   ├── app.js                      # Express app (80 líneas)
│   ├── 📁 config/
│   │   ├── database.js             # PostgreSQL ORM (200 líneas)
│   │   └── constants.js            # Constantes (180 líneas)
│   ├── 📁 controllers/             # Lógica de negocio
│   │   ├── authController.js       # Auth + password (200 líneas)
│   │   ├── votersController.js     # CRUD votantes (250 líneas)
│   │   ├── usersController.js      # CRUD usuarios (180 líneas)
│   │   ├── zonesController.js      # CRUD zonas (180 líneas)
│   │   └── tasksController.js      # CRUD tareas (180 líneas)
│   ├── 📁 middleware/              # Middleware Express
│   │   ├── auth.js                 # JWT + roles (80 líneas)
│   │   ├── validation.js           # Joi schemas (200 líneas)
│   │   ├── errorHandler.js         # Error handling (80 líneas)
│   │   └── logging.js              # Request logging (30 líneas)
│   ├── 📁 routes/                  # API endpoints
│   │   ├── auth.js                 # Auth routes (30 líneas)
│   │   ├── voters.js               # Voters CRUD (40 líneas)
│   │   ├── users.js                # Users CRUD (32 líneas)
│   │   ├── zones.js                # Zones CRUD (32 líneas)
│   │   └── tasks.js                # Tasks CRUD (32 líneas)
│   ├── 📁 models/
│   │   └── index.js                # Data models (120 líneas)
│   └── 📁 utils/
│       └── helpers.js              # Utilidades (100 líneas)
│
├── 📁 scripts/                     # Utilidades
│   ├── init-db.js                  # Crear BD (150 líneas)
│   └── seed.js                     # Datos iniciales (170 líneas)
│
├── 📄 server.js                    # Entry point (60 líneas)
├── 📄 package.json                 # Dependencies (40 líneas)
├── 📄 .env.example                 # Configuración (20 variables)
├── 📄 .gitignore                   # Git ignore
│
├── 📖 QUICKSTART.md                # Inicio rápido
├── 📖 README.md                    # API full docs
├── 📖 TESTING.md                   # Testing guide
├── 📖 DEPLOYMENT.md                # Production guide
├── 📖 IMPLEMENTATION_SUMMARY.md      # Tech summary
└── 📖 REFERENCE.md                 # Este archivo
```

---

## 🔌 API Endpoints Reference

### 🔐 Authentication (5 endpoints)
```
POST   /api/auth/register          → Crear usuario
POST   /api/auth/login             → Iniciar sesión
GET    /api/auth/me                → Perfil actual
POST   /api/auth/change-password   → Cambiar contraseña
POST   /api/auth/logout            → Cerrar sesión
```

### 🗳️ Voters (7 endpoints)
```
GET    /api/voters                 → Listar (paginado)
GET    /api/voters/:id             → Obtener uno
POST   /api/voters                 → Crear votante
PUT    /api/voters/:id             → Actualizar votante
DELETE /api/voters/:id             → Eliminar votante
GET    /api/voters/stats           → Estadísticas
POST   /api/voters/batch/import    → Importar lote
```

### 👥 Users (6 endpoints)
```
GET    /api/users                  → Listar (admin only)
GET    /api/users/:id              → Obtener uno
POST   /api/users                  → Crear (admin only)
PUT    /api/users/:id              → Actualizar (admin only)
DELETE /api/users/:id              → Eliminar (admin only)
GET    /api/users/stats            → Estadísticas
```

### 📍 Zones (6 endpoints)
```
GET    /api/zones                  → Listar
GET    /api/zones/:id              → Obtener uno
POST   /api/zones                  → Crear (admin only)
PUT    /api/zones/:id              → Actualizar (admin only)
DELETE /api/zones/:id              → Eliminar (admin only)
GET    /api/zones/stats            → Estadísticas
```

### 📋 Tasks (6 endpoints)
```
GET    /api/tasks                  → Listar
GET    /api/tasks/:id              → Obtener uno
POST   /api/tasks                  → Crear
PUT    /api/tasks/:id              → Actualizar
DELETE /api/tasks/:id              → Eliminar
GET    /api/tasks/stats            → Estadísticas
```

### 🔧 System (2 endpoints)
```
GET    /health                     → Health check
GET    /api                        → API info
```

**Total: 32 endpoints**

---

## 🗝️ Authentication Flow

```
1. Cliente registra cuenta
   POST /api/auth/register
   → Backend bcrypt hash password
   → Inserta en BD
   → Retorna JWT token

2. Cliente hace login
   POST /api/auth/login
   → Backend verifica email
   → bcrypt compara password
   → Genera JWT token
   → Retorna token

3. Cliente usa token en requests
   GET /api/voters
   Header: Authorization: Bearer {token}
   → JWT middleware verifica token
   → Extrae user data
   → Permite acceso

4. Token expira en 7 días → Cliente debe hacer login nuevamente
```

---

## 📦 Database Schema (8 tables)

### `users`
```
id (PK) | name | email (UNIQUE) | password_hash | role | phone | zone_id (FK) | active | created_at | updated_at
```

### `voters`
```
id (PK) | name | dni (UNIQUE) | phone | email | address | zone_id (FK) | status | priority | latitude | longitude | encrypted | created_at | updated_at
```

### `zones`
```
id (PK) | name (UNIQUE) | priority | manager | description | created_at | updated_at
```

### `tasks`
```
id (PK) | title | description | assigned_to (FK) | status | priority | due_date | completed | type | created_at | updated_at
```

### `audit_logs`
```
id (PK) | user_id (FK) | action | resource_type | resource_id | details (JSONB) | ip_address | user_agent | created_at
```

### `categories`, `variables`, `validation_rules`, `backups`
```
See init-db.js for full schema
```

---

## 🔐 Roles & Permissions

| Acción | admin | operator | auditor | viewer |
|--------|:-----:|:--------:|:-------:|:------:|
| Crear usuarios | ✅ | ❌ | ❌ | ❌ |
| Eliminar usuarios | ✅ | ❌ | ❌ | ❌ |
| Crear votantes | ✅ | ✅ | ❌ | ❌ |
| Actualizar votantes | ✅ | ✅ | ❌ | ❌ |
| Eliminar votantes | ✅ | ✅ | ❌ | ❌ |
| Ver reportes | ✅ | ✅ | ✅ | ✅ |
| Crear tareas | ✅ | ✅ | ❌ | ❌ |
| Exportar datos | ✅ | ✅ | ✅ | ❌ |

---

## 🛠️ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.18 |
| Database | PostgreSQL | 12+ |
| Auth | JWT (jsonwebtoken) | 9.1 |
| Password | bcryptjs | 2.4 |
| Validation | Joi | 17.11 |
| HTTP | CORS, Helmet | Latest |
| Logging | Morgan | 1.10 |
| Testing | Jest, Supertest | 29.7, 6.3 |

---

## 🚀 Quick Commands

```bash
# Setup
npm install
node scripts/init-db.js
node scripts/seed.js

# Development
npm run dev          # Con hot-reload

# Testing
npm test             # Ejecutar tests
npm test -- --watch # Watch mode

# Production
npm start            # Iniciar
NODE_ENV=production npm start

# Database
node scripts/init-db.js  # Crear schema
node scripts/seed.js     # Cargar datos
```

---

## 🔍 Configuration Variables

```bash
# Server
NODE_ENV              # development | production
PORT                  # 3000 (default)

# Database
DB_HOST               # localhost
DB_PORT               # 5432
DB_NAME               # abaco
DB_USER               # user
DB_PASSWORD           # password
DB_SSL                # false en dev, true en prod

# Security
JWT_SECRET            # Min 32 chars
JWT_EXPIRES_IN        # 7d (default)
BCRYPT_ROUNDS         # 10 (default)
MAX_LOGIN_ATTEMPTS    # 5
LOCK_TIME             # 900000 (15 min)

# CORS
CORS_ORIGIN           # http://localhost:5173

# Logging
LOG_LEVEL             # info | debug | error

# Rate Limiting
RATE_LIMIT_WINDOW     # 900000 (15 min)
RATE_LIMIT_MAX        # 100 requests
```

---

## 🐛 Common Issues

### Issue: "Connection refused" on DB
**Solution:** 
```bash
# Verify PostgreSQL is running
pg_isready -h localhost -p 5432
# Or use Docker
docker run -d -p 5432:5432 postgres:15
```

### Issue: "PORT 3000 already in use"
**Solution:**
```bash
# Kill process
lsof -ti:3000 | xargs kill -9
# Or change port in .env
PORT=3001
```

### Issue: JWT errors
**Solution:**
```bash
# Ensure JWT_SECRET has 32+ chars
echo $JWT_SECRET | wc -c  # Must be > 32
```

### Issue: Password verification fails
**Solution:**
```bash
# Check BCRYPT_ROUNDS (default 10)
# If changed, existing passwords won't work
# Re-hash with: bcrypt.hash(password, newRounds)
```

---

## 📈 Performance Tips

1. **Database Indexing**
   - Índices creados en email, dni, zone_id, status
   - Verifica EXPLAIN PLAN para queries lentas

2. **Connection Pooling**
   - 20 conexiones máximo (configurable)
   - Reutiliza conexiones automáticamente

3. **Query Optimization**
   - Usa paginación en listas (límite 100)
   - Selecciona solo columnas necesarias
   - Evita N+1 queries con JOIN

4. **Caching** (Future)
   - Redis para frecuent queries
   - Session caching

---

## 🔒 Security Checklist

- ✅ Passwords hashed con bcryptjs
- ✅ JWT tokens con expiración
- ✅ CORS configurado
- ✅ Helmet security headers
- ✅ SQL injection prevention (prepared statements)
- ✅ Input validation (Joi)
- ✅ Role-based access control
- ✅ Audit logging
- ✅ Error messages non-leaking
- ✅ Rate limiting ready

---

## 🧪 Testing Quick Guide

```javascript
// Install
npm install --save-dev jest supertest

// Write test
describe('Auth', () => {
  it('should register user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name, email, password, role });
    expect(res.status).toBe(201);
  });
});

// Run
npm test
npm test -- --watch
npm test -- --coverage
```

---

## 🚢 Deployment Options

| Option | Difficulty | Scalability | Cost |
|--------|-----------|-------------|------|
| PM2 | Easy | Medium | Low |
| Docker | Medium | High | Low |
| Heroku | Very Easy | Medium | Medium |
| AWS ECS | Hard | High | Variable |
| Digital Ocean | Easy | Medium | Low |

**Recommended for beginners:** PM2 or Heroku

---

## 📞 Getting Help

1. **Error en startup?**
   - Ver `.env` configurado correctamente
   - Verificar BD está corriendo
   - Check `npm install` completó

2. **Error en requests?**
   - Ver logs: `npm run dev`
   - Verificar token JWT válido
   - Check Content-Type: application/json

3. **BD problemas?**
   - Ver: `psql -l` (listage bases)
   - Reset: `node scripts/init-db.js`
   - Seed: `node scripts/seed.js`

4. **Version issues?**
   - `node --version` (must be 18+)
   - `npm --version` (must be 9+)

---

## 📚 Additional Resources

- [Express Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT.io](https://jwt.io/)
- [Joi Validation](https://joi.dev/)
- [Jest Testing](https://jestjs.io/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Docker Documentation](https://docs.docker.com/)

---

## ✅ Validation Rules Summary

| Field | Rule | Example |
|-------|------|---------|
| email | RFC 5322 | `user@example.com` |
| password | 8+ chars | `SecurePass123` |
| phone | 7-15 digits | `555-1234` |
| dni | 6-10 digits | `12345678` |
| name | 2-100 chars | `Juan Pérez` |
| role | Enum | `admin\|operator\|auditor\|viewer` |
| status | Enum | `pending\|confirmed\|contacted` |
| priority | Enum | `high\|medium\|low` |
| date | ISO 8601 | `2026-03-15` |
| coordinates | GPS bounds | latitude: -90 to 90, longitude: -180 to 180 |

---

## 🎓 Learning Path

1. **Day 1:** Instala backend, ejecuta QUICKSTART.md
2. **Day 2:** Lee README.md, prueba endpoints con curl
3. **Day 3:** Lee controllers para entender lógica
4. **Day 4:** Escribe tests con TESTING.md
5. **Day 5:** Deploy usando DEPLOYMENT.md

---

**Last Updated:** 2026-02-24  
**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Maintained by:** ÁBACO Team
