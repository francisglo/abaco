# Especificación API REST Coworking ÁBACO

## Usuarios
- GET    /api/coworking/users                → Listar usuarios
- GET    /api/coworking/users/:id            → Detalle de usuario
- POST   /api/coworking/users                → Crear usuario (registro)
- PATCH  /api/coworking/users/:id            → Editar usuario
- POST   /api/coworking/users/:id/follow     → Seguir usuario
- DELETE /api/coworking/users/:id/follow     → Dejar de seguir

## Posts
- GET    /api/coworking/posts                → Listar posts (feed)
- GET    /api/coworking/posts/:id            → Detalle de post
- POST   /api/coworking/posts                → Crear post
- POST   /api/coworking/posts/:id/react      → Reaccionar a post
- POST   /api/coworking/posts/:id/comment    → Comentar post

## Grupos
- GET    /api/coworking/groups               → Listar grupos
- GET    /api/coworking/groups/:id           → Detalle de grupo
- POST   /api/coworking/groups               → Crear grupo
- POST   /api/coworking/groups/:id/join      → Unirse a grupo
- POST   /api/coworking/groups/:id/leave     → Salir de grupo

## Mensajes
- GET    /api/coworking/messages/:userId     → Mensajes con usuario
- POST   /api/coworking/messages/:userId     → Enviar mensaje

## Notificaciones
- GET    /api/coworking/notifications        → Listar notificaciones del usuario
- POST   /api/coworking/notifications/read   → Marcar como leídas

## Eventos
- GET    /api/coworking/events               → Listar eventos/retos
- POST   /api/coworking/events               → Crear evento/reto

---

Siguiente paso: modelos y controladores backend para cada entidad.