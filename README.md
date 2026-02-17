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
