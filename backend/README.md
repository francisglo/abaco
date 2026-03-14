# Backend ÁBACO - Documentación API

## 📌 Versión 2.0.0 - Plataforma Integral

ÁBACO se ha transformado de un sistema únicamente electoral a una **plataforma integral de gestión territorial, social y política**. Ahora soporta:

- ✅ Gestión de solicitudes ciudadanas y quejas (citizen services)
- ✅ Comunicación y coordinación territorial (community engagement)
- ✅ Indicadores y seguimiento de proyectos (management & metrics)
- ✅ Inteligencia estratégica y análisis de riesgos (strategic intelligence)
- ✅ Sistema electoral base (electoral core)

**Documentación completa**: Ver [MODULES.md](./MODULES.md) para detalles técnicos de cada módulo.

## 🚀 Instalación y Deploy


### Requisitos locales
- Node.js >= 18
- PostgreSQL 12+
- npm >= 9

### Deploy en Vercel
El backend se expone como API serverless en `/api` (raíz del repo, enlaza a `/backend/src/app.js`).
Configura las variables de entorno en el dashboard de Vercel (ver README principal).

### Pasos


1. **Instalar dependencias locales**
```bash
cd backend
npm install
```


2. **Configurar variables de entorno locales**
```bash
cp .env.example .env
# Editar .env con tu configuración
```

3. **Inicializar base de datos**
```bash
node scripts/init-db.js
```


4. **Iniciar servidor local**
```bash
npm run dev     # Desarrollo con hot reload
npm start       # Producción
```

---

## 📚 API Endpoints

### Autenticación

#### Registro
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "SecurePass123",
  "role": "operator",
  "phone": "555-1234"
}

Response 201:
{
  "message": "Usuario registrado correctamente",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "operator"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "SecurePass123"
}

Response 200:
{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "operator"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Obtener Perfil
```http
GET /api/auth/me
Authorization: Bearer {token}

Response 200:
{
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "role": "operator",
    "phone": "555-1234",
    "zone_id": 1,
    "active": true,
    "created_at": "2026-02-24T10:30:00Z"
  }
}
```

### Votantes

#### Listar Votantes
```http
GET /api/voters?page=1&limit=20&status=pending&search=juan
Authorization: Bearer {token}

Response 200:
{
  "data": [
    {
      "id": 1,
      "name": "Juan Pérez",
      "dni": "12345678",
      "email": "juan@example.com",
      "phone": "555-1234",
      "status": "pending",
      "priority": "high",
      "zone_id": 1,
      "latitude": -34.60,
      "longitude": -58.40
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### Crear Votante
```http
POST /api/voters
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "María López",
  "dni": "87654321",
  "phone": "555-5678",
  "email": "maria@example.com",
  "address": "Calle Principal 123",
  "zoneId": 1,
  "status": "pending",
  "priority": "medium",
  "latitude": -34.61,
  "longitude": -58.41
}

Response 201:
{
  "message": "Votante creado correctamente",
  "data": {
    "id": 2,
    "name": "María López",
    ...
  }
}
```

#### Actualizar Votante
```http
PUT /api/voters/2
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "confirmed",
  "priority": "high"
}

Response 200:
{
  "message": "Votante actualizado correctamente",
  "data": { ... }
}
```

#### Eliminar Votante
```http
DELETE /api/voters/2
Authorization: Bearer {token}

Response 200:
{
  "message": "Votante eliminado correctamente"
}
```

#### Estadísticas
```http
GET /api/voters/stats
Authorization: Bearer {token}

Response 200:
{
  "stats": {
    "total": 1250,
    "confirmed": 850,
    "pending": 300,
    "active": 950,
    "highPriority": 425
  }
}
```

---

## 🔐 Autenticación

### Sistema JWT
- Token se obtiene al registrarse o hacer login
- Válido por **7 días** (configurable)
- Se envía en el header: `Authorization: Bearer {token}`

### Roles
- **admin**: Acceso total
- **operator**: Gestión de votantes y tareas
- **auditor**: Solo lectura
- **viewer**: Acceso limitado

---

## ⚠️ Códigos de Error

| Status | Code | Mensaje |
|--------|------|---------|
| 400 | VALIDATION_ERROR | Error en validación de datos |
| 401 | INVALID_CREDENTIALS | Email o contraseña incorrectos |
| 401 | TOKEN_EXPIRED | Token expirado |
| 403 | INSUFFICIENT_PERMISSIONS | Permisos insuficientes |
| 404 | NOT_FOUND | Recurso no encontrado |
| 409 | EMAIL_EXISTS | Email ya registrado |
| 500 | INTERNAL_ERROR | Error interno del servidor |

---

## 📦 Estructura de Carpetas

```
backend/
├── src/
│   ├── config/          # Configuración (BD, etc)
│   ├── controllers/     # Lógica de negocio
│   ├── middleware/      # Auth, validación, errores
│   ├── models/          # Esquemas de datos
│   ├── routes/          # Definición de endpoints
│   ├── utils/           # Funciones auxiliares
│   └── app.js           # Configuración de Express
├── scripts/             # Scripts de utilidad
├── package.json
├── .env.example
└── server.js            # Punto de entrada
```

---

## 🛠️ Desarrollo

### Hot Reload
```bash
npm run dev
# Usa nodemon para reiniciar automáticamente
```

### Ejecutar Tests
```bash
npm test
```

### Inicializar DB
```bash
node scripts/init-db.js
```

---

## 📋 Siguientes Pasos

- [ ] Implementar controladores de Zonas, Tareas, Usuarios
- [ ] Agregar validaciones adicionales
- [ ] Implementar paginación en todas las rutas
- [ ] Agregar tests unitarios
- [ ] Documentación con Swagger
- [ ] Caché con Redis
- [ ] WebSockets para tiempo real

---

## 📞 Soporte

Para problemas, crea un issue en el repositorio.
