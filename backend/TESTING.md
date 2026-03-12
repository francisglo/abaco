# Testing Guide - ÁBACO Backend

## ✅ Regresión rápida por roles (producción/staging)

Ejecuta una matriz automática de permisos para `admin`, `manager`, `operator` y `viewer`.

```bash
npm run qa:roles
```

Variables opcionales:

- `QA_BASE_URL`: URL base del backend (default: `https://backend-two-xi-81.vercel.app`)
- `QA_PASSWORD`: contraseña usada al crear usuarios de prueba (default: `Clave123!`)

Ejemplo apuntando a otro entorno:

```bash
QA_BASE_URL=https://tu-backend.vercel.app npm run qa:roles
```

Notas:

- El script crea usuarios de prueba nuevos en cada ejecución.
- Devuelve código de salida `1` si encuentra cualquier `FAIL` en la matriz.

## 📋 Configuración del Testing

### Instalar dependencias
```bash
npm install --save-dev jest supertest
```

### Configurar Jest
El proyecto utiliza Jest para testing. Los tests deben colocarse con el patrón `*.test.js`.

---

## 🧪 Ejemplos de Tests

### Test de Autenticación (auth.test.js)

```javascript
import request from 'supertest';
import app from '../src/app';
import database from '../src/config/database';

describe('Authentication', () => {
  beforeAll(async () => {
    // Setup inicial
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo usuario', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123',
          role: 'operator'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.token).toBeDefined();
    });

    it('debe rechazar email duplicado', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'test@example.com', // Email ya existe
          password: 'SecurePass123',
          role: 'operator'
        });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('EMAIL_EXISTS');
    });

    it('debe validar contraseña mínima', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test2@example.com',
          password: 'short', // Muy corta
          role: 'operator'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe hacer login con credenciales correctas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
    });

    it('debe rechazar credenciales inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });
  });
});
```

### Test de Votantes (voters.test.js)

```javascript
import request from 'supertest';
import app from '../src/app';

describe('Voters', () => {
  let token;
  let voterId;

  beforeAll(async () => {
    // Login y obtener token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'carlos@abaco.com',
        password: 'Operator123!'
      });
    
    token = loginResponse.body.token;
  });

  describe('GET /api/voters', () => {
    it('debe listar votantes con paginación', async () => {
      const response = await request(app)
        .get('/api/voters?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });

    it('debe filtrar por estado', async () => {
      const response = await request(app)
        .get('/api/voters?status=confirmed')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      response.body.data.forEach(voter => {
        expect(voter.status).toBe('confirmed');
      });
    });

    it('debe rechazar sin token', async () => {
      const response = await request(app).get('/api/voters');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/voters', () => {
    it('debe crear un nuevo votante', async () => {
      const response = await request(app)
        .post('/api/voters')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Voter',
          dni: '99999999',
          phone: '555-9999',
          email: 'voter@test.com',
          address: 'Calle Test 123',
          zoneId: 1,
          status: 'pending',
          priority: 'high'
        });

      expect(response.status).toBe(201);
      expect(response.body.data.dni).toBe('99999999');
      voterId = response.body.data.id;
    });

    it('debe rechazar DNI duplicado', async () => {
      const response = await request(app)
        .post('/api/voters')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Another Voter',
          dni: '99999999', // Duplicado
          phone: '555-8888',
          email: 'another@test.com',
          address: 'Calle Test 456',
          zoneId: 1
        });

      expect(response.status).toBe(409);
    });
  });

  describe('PUT /api/voters/:id', () => {
    it('debe actualizar un votante', async () => {
      const response = await request(app)
        .put(`/api/voters/${voterId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          status: 'confirmed',
          priority: 'low'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('confirmed');
    });
  });

  describe('DELETE /api/voters/:id', () => {
    it('debe eliminar un votante', async () => {
      const response = await request(app)
        .delete(`/api/voters/${voterId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/voters/stats', () => {
    it('debe obtener estadísticas', async () => {
      const response = await request(app)
        .get('/api/voters/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.stats).toBeDefined();
      expect(response.body.stats.total).toBeGreaterThanOrEqual(0);
    });
  });
});
```

---

## 🚀 Ejecutar Tests

### Todos los tests
```bash
npm test
```

### Tests específicos
```bash
npm test -- auth.test.js
npm test -- voters.test.js
```

### Modo watch
```bash
npm test -- --watch
```

### Con cobertura
```bash
npm test -- --coverage
```

---

## ✅ Testing Checklist

### Auth Controller
- [ ] Registro con datos válidos
- [ ] Registro con email duplicado
- [ ] Registro con contraseña corta
- [ ] Login exitoso
- [ ] Login con credenciales incorrectas
- [ ] Obtener perfil autenticado
- [ ] Cambiar contraseña
- [ ] Logout

### Voters Controller
- [ ] Listar votantes con paginación
- [ ] Filtrar por estado/prioridad
- [ ] Buscar votante
- [ ] Crear votante
- [ ] Actualizar votante
- [ ] Eliminar votante
- [ ] Importar lote de votantes
- [ ] Estadísticas de votantes

### Users Controller
- [ ] Listar usuarios (admin only)
- [ ] Crear usuario (admin only)
- [ ] Actualizar usuario
- [ ] Eliminar usuario (admin only)
- [ ] Estadísticas de usuarios

### Zones Controller
- [ ] Listar zonas
- [ ] Crear zona
- [ ] Actualizar zona
- [ ] Eliminar zona (sin votantes)
- [ ] No permitir eliminar zona con votantes

### Tasks Controller
- [ ] Listar tareas
- [ ] Crear tarea
- [ ] Asignar tarea a usuario
- [ ] Actualizar estado de tarea
- [ ] Completar tarea
- [ ] Eliminar tarea

---

## 🔒 Security Testing

### Autenticación
- [ ] Token inválido es rechazado
- [ ] Token expirado es rechazado
- [ ] Rutas protegidas requieren autenticación
- [ ] Usuarios solo pueden ver sus datos

### Autorización
- [ ] Solo admins pueden crear usuarios
- [ ] Solo admins pueden eliminar datos
- [ ] Los auditors no pueden modificar datos
- [ ] Los viewers solo pueden leer

### Data Validation
- [ ] Campos requeridos son validados
- [ ] Longitudes máximas se respetan
- [ ] Formatos de email son validados
- [ ] DNI tiene formato correcto

---

## 📊 Coverage Goals
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

---

## 🐛 Debugging Tests

### Logs durante testing
```bash
LOG_LEVEL=debug npm test
```

### Test único
```bash
npm test -- --testNamePattern="debe registrar un nuevo usuario"
```

### Stop en primer error
```bash
npm test -- --bail
```

---

## 📝 Notas

- Los tests usan una base de datos de prueba
- Cada test debe limpiar sus datos después
- Mock las llamadas externas si es necesario
- Usa fixtures para datos de prueba comunes
