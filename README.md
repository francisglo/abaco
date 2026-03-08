# ABACO - Frontend (Scaffold)

Proyecto inicial de frontend para ABACO usando Vite + React (JSX, JavaScript).

Cómo arrancar:

1. Instalar dependencias:

```powershell
npm install
```

2. Ejecutar servidor de desarrollo:

```powershell
npm run dev
```

Estructura básica:

- `src/` - código fuente
- `index.html` - punto de entrada
- `package.json` - scripts y dependencias

Mock backend (JSON Server):

1. Instalar dependencias (si no lo hiciste antes):

```powershell
npm install
```

2. Levantar el mock server:

```powershell
npm run mock:server
```

El mock correrá en `http://localhost:4000` y expone recursos como `/zones`, `/neighborhoods`, `/voters`, `/actions`, etc.

## API propia (Express)

También puedes usar una API propia sin `json-server`, persistiendo en `mock/db.json`:

```powershell
npm run api:server
```

Por defecto corre en `http://localhost:4100`.

Para que el frontend use esta API, crea un archivo `.env` en la raíz basado en `.env.example`:

```powershell
copy .env.example .env
```

Luego inicia frontend normal:

```powershell
npm run dev
```

### API versionada + JWT

La API propia incluye versión `v1` y autenticación JWT:

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me` (requiere `Authorization: Bearer <token>`)
- `GET|POST|PUT|PATCH|DELETE /api/v1/:resource` (protegido)

Compatibilidad: también se mantienen rutas legacy sin prefijo (`/voters`, `/tasks`, etc.) para no romper el frontend actual.

Login de desarrollo para usuarios existentes de `mock/db.json` (si aún no tienen hash):

- password por defecto: `abaco123`

## Documentación de negocio

- Modelo comercial y monetización: [MODELO_NEGOCIO_ABACO.md](MODELO_NEGOCIO_ABACO.md)
