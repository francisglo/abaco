# 🚀 ÁBACO Backend - Quick Start Guide

## Inicio Rápido (5 minutos)

### 1️⃣ Instalar Dependencias
```bash
cd backend
npm install
```

### 2️⃣ Configurar Base de Datos

#### LocalStorage o PostgreSQL Docker
```bash
# Opción A: PostgreSQL localmente o en servidor
# Asegúrate que PostgreSQL esté corriendo en puerto 5432

# Opción B: PostgreSQL en Docker
docker run -d \
  --name abaco-postgres \
  -e POSTGRES_DB=abaco \
  -e POSTGRES_USER=abaco_user \
  -e POSTGRES_PASSWORD=abaco_pass \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3️⃣ Configurar Variables de Entorno
```bash
cp .env.example .env
```

Editar `.env` con tu configuración:
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=abaco
DB_USER=abaco_user
DB_PASSWORD=abaco_pass
JWT_SECRET=your_32_char_secret_here_minimum
LOG_LEVEL=debug
```

### 4️⃣ Inicializar Base de Datos
```bash
# Crear tablas
node scripts/init-db.js

# Cargar datos de prueba
node scripts/seed.js
```

### 5️⃣ Iniciar Servidor
```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

✅ Servidor corriendo en `http://localhost:3000`

---

## 🔐 Credenciales de Prueba

Después de ejecutar `seed.js`:

**Admin:**
- Email: `admin@abaco.com`
- Password: `Admin123!`

**Operador:**
- Email: `carlos@abaco.com`
- Password: `Operator123!`

**Auditor:**
- Email: `juan@abaco.com`
- Password: `Operator123!`

---

## 📚 Documentación Disponible

| Archivo | Propósito |
|---------|-----------|
| [README.md](./README.md) | Documentación API completa |
| [TESTING.md](./TESTING.md) | Guía de testing unitario e integración |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Guía de deployment a producción |

---

## 🔗 Endpoints Principales

### Autenticación
```bash
# Registrarse
POST /api/auth/register
Body: { name, email, password, role }

# Login
POST /api/auth/login
Body: { email, password }

# Mi perfil
GET /api/auth/me
Header: Authorization: Bearer {token}
```

### Votantes
```bash
# Listar
GET /api/voters?page=1&limit=20

# Crear
POST /api/voters
Body: { name, dni, phone, email, zoneId, ... }

# Estadísticas
GET /api/voters/stats
```

### Zonas
```bash
# Listar
GET /api/zones

# Crear
POST /api/zones
Body: { name, priority, manager, description }
```

### Tareas
```bash
# Listar
GET /api/tasks

# Crear
POST /api/tasks
Body: { title, description, assignedTo, priority, ... }
```

### Health Check
```bash
GET /health
# Response: { status: 'ok', uptime: 12345 }
```

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev             # Inicia con nodemon

# Testing
npm test                # Ejecutar todos los tests
npm test -- --watch    # Watch mode
npm test -- --coverage # Coverage report

# Production
npm start               # Inicia servidor

# Database
node scripts/init-db.js # Crear tablas
node scripts/seed.js    # Cargar datos iniciales

# Linting (cuando esté configurado)
npm run lint            # Ejecutar linter
npm run lint:fix        # Auto-fix issues
```

---

## 📊 Estructura del Proyecto

```
backend/
├── src/
│   ├── app.js                    # Express app
│   ├── config/
│   │   ├── database.js           # PostgreSQL ORM
│   │   └── constants.js          # Constantes
│   ├── controllers/              # Lógica de negocio
│   │   ├── authController.js
│   │   ├── votersController.js
│   │   ├── usersController.js
│   │   ├── zonesController.js
│   │   └── tasksController.js
│   ├── middleware/               # Express middleware
│   │   ├── auth.js              # JWT + roles
│   │   ├── validation.js        # Joi schemas
│   │   ├── errorHandler.js      # Error handling
│   │   └── logging.js           # Request logging
│   ├── routes/                  # API routes
│   │   ├── auth.js
│   │   ├── voters.js
│   │   ├── users.js
│   │   ├── zones.js
│   │   └── tasks.js
│   ├── models/                  # Data models
│   │   └── index.js
│   └── utils/                   # Helper functions
│       └── helpers.js
├── scripts/
│   ├── init-db.js               # Database init
│   └── seed.js                  # Load test data
├── server.js                    # Entry point
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── TESTING.md
└── DEPLOYMENT.md
```

---

## 🚨 Troubleshooting

### "Connection refused" on PostgreSQL
```bash
# Verificar que PostgreSQL está corriendo
pg_isready -h localhost -p 5432

# O usando Docker
docker ps | grep postgres
```

### "PORT 3000 already in use"
```bash
# Cambiar puerto en .env
PORT=3001

# O matar el proceso existente (Unix)
lsof -ti:3000 | xargs kill -9
```

### JWT errors
```bash
# Verificar JWT_SECRET tiene mínimo 32 caracteres
echo $JWT_SECRET | wc -c
# Debe mostrar > 32
```

---

## 📖 Próximos Pasos

1. ✅ Server corriendo
2. ✅ Base de datos inicializada
3. 🔜 Conectar frontend React
4. 🔜 Implementar tests
5. 🔜 Deploy a producción

---

## 🤝 Contribuir

1. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Hacer cambios y tests
3. Push: `git push origin feature/nueva-funcionalidad`
4. Crear Pull Request

---

## 📞 FAQ

**¿Cómo cambio la contraseña de una usuario?**
```javascript
// En authController
POST /api/auth/change-password
// Body: { currentPassword, newPassword }
```

**¿Cómo importo votantes en lote?**
```javascript
// En votersController
POST /api/voters/batch/import
// Body: { voters: [...] }
```

**¿Cómo sé qué versión de Node.js usar?**
- v18 o superior
- ```bash
  node --version
  ```

---

## 🎉 ¡Listo!

Tu backend ÁBACO está configurado y listo para desarrollo.

Para más información, consulta los archivos de documentación:
- API completa → [README.md](./README.md)
- Testing → [TESTING.md](./TESTING.md)  
- Deployment → [DEPLOYMENT.md](./DEPLOYMENT.md)
