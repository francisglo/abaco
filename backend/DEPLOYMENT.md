# Deployment Guide - ÁBACO Backend

## 📦 Preparación para Producción

### 1. Verificar Variables de Entorno

Crear archivo `.env` desde `.env.example`:

```bash
cp .env.example .env
```

### Variables Críticas en Producción

```
# Entorno
NODE_ENV=production
PORT=3000

# Base de datos
DB_HOST=your-db-host.com
DB_PORT=5432
DB_NAME=abaco_prod
DB_USER=db_user
DB_PASSWORD=strong_password_here
DB_SSL=true

# JWT
JWT_SECRET=your_very_long_secret_min_32_chars_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=info

# Seguridad
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=900000

# Rate limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### 2. Optimizaciones de Producción

#### Instalar dependencias de producción
```bash
npm install
npm ci  # Usar en CI/CD
```

#### Verificar build
```bash
npm test      # Ejecutar tests
npm run lint  # Ejecutar linter (si está configurado)
```

---

## 🚀 Opciones de Deployment

### Opción 1: PM2 (Recomendado)

#### Instalar PM2 globalmente
```bash
npm install -g pm2
```

#### Crear configuración PM2
Archivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'abaco-backend',
      script: './server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 'max',
      exec_mode: 'cluster',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.env'],
      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      key: '~/.ssh/id_rsa',
      ref: 'origin/main',
      repo: 'https://github.com/your-repo.git',
      path: '/var/www/abaco-backend',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
};
```

#### Comandos PM2
```bash
# Iniciar aplicación
pm2 start ecosystem.config.js --env production

# Monitorear
pm2 monit

# Logs
pm2 logs abaco-backend

# Reload (sin downtime)
pm2 reload abaco-backend

# Reiniciar en boot
pm2 startup
pm2 save
```

---

### Opción 2: Docker

#### Crear Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Iniciar
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: abaco_prod
      POSTGRES_USER: db_user
      POSTGRES_PASSWORD: strong_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  api:
    build: .
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://db_user:strong_password@postgres:5432/abaco_prod
      JWT_SECRET: your_secret_here
      CORS_ORIGIN: https://yourdomain.com
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Comandos Docker
```bash
# Build
docker build -t abaco-backend:latest .

# Run
docker run -d -p 3000:3000 --env-file .env abaco-backend:latest

# Docker Compose
docker-compose up -d
docker-compose logs -f api
```

---

### Opción 3: AWS ECS/Heroku

#### Heroku (Simplest)
```bash
# Instalar CLI
npm install -g heroku

# Login
heroku login

# Crear app
heroku create abaco-backend

# Configurar variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secret_here

# Agregar PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Deploy
git push heroku main

# Ver logs
heroku logs --tail
```

---

## 🔐 Seguridad en Producción

### 1. Certificados SSL/TLS
```javascript
// En src/app.js
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### 2. Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requests por ventana
});

app.use('/api/', limiter);
```

### 3. CORS Restringido
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN.split(','),
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### 4. Helmet Headers
```javascript
import helmet from 'helmet';
app.use(helmet()); // Ya incluido en app.js
```

---

## 📊 Monitoreo

### Health Check
```bash
curl https://yourdomain.com/health
```

### Metrics (con Prometheus)
```javascript
// Agregar a src/middleware/monitoring.js
import client from 'prom-client';

export const requestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});
```

### Logging
Los logs se guardan en:
- `logs/error.log` - Solo errores
- `logs/out.log` - Salida estándar
- STDOUT para Docker

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to server
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/id_rsa
          chmod 600 ~/.ssh/id_rsa
          ssh -o StrictHostKeyChecking=no user@server 'cd /app && git pull && npm install && pm2 reload all'
```

---

## 📋 Pre-Deploy Checklist

- [ ] Todas las variables de entorno configuradas
- [ ] BASE DE DATOS migrada y con backups
- [ ] Tests pasando (npm test)
- [ ] Linting correcto
- [ ] No hay secretos en el código (.env en .gitignore)
- [ ] SSL/TLS configurado
- [ ] CORS configurado correctamente
- [ ] Rate limiting habilitado
- [ ] Logs configurados
- [ ] Backups automatizados
- [ ] Monitoreo/alertas configurados
- [ ] Proceso de rollback documentado

---

## 🆘 Troubleshooting

### Conexión a BD falla
```bash
# Verificar conexión
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Ver logs de error
pm2 logs abaco-backend --err
```

### Alto uso de memoria
```bash
# Monitorear
pm2 plus

# O manualmente
node --max-old-space-size=1024 server.js
```

### Performance lenta
```javascript
// Agregar caching
import redis from 'redis';
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT
});
```

---

## 📞 Soporte

Para problemas de deployment, consulta:
- PM2 Docs: https://pm2.keymetrics.io/docs/usage/quick-start/
- Docker Docs: https://docs.docker.com/
- PostgreSQL Docs: https://www.postgresql.org/docs/
