# Arquitectura Técnica - Módulo Coworking ÁBACO

## 1. Estructura General
- Frontend: React (Vite), Redux Toolkit, MUI, React Router
- Backend: Node.js (Express), PostgreSQL (con PostGIS), WebSocket para notificaciones en tiempo real
- API RESTful + endpoints para feed, perfiles, grupos, posts, conexiones
- Autenticación JWT (ya existente)

## 2. Módulos Principales
- /coworking (landing coworking, explorador de profesionales)
- /profile/:id (perfil de usuario)
- /feed (publicaciones globales y personalizadas)
- /groups (grupos temáticos, foros)
- /messages (mensajería directa)

## 3. Componentes Clave
- UserCard (tarjeta de usuario)
- ProfilePage (perfil completo)
- Feed (listado de posts)
- PostCard (post individual)
- GroupCard (grupo/foro)
- GroupPage (detalle de grupo)
- NewPostModal (crear publicación)
- ConnectButton (conectar/seguir)

## 4. Modelos de Datos (resumido)
- User: id, name, bio, experience, education, portfolio, avatar, followers, following, posts, groups
- Post: id, authorId, content, media, createdAt, reactions, comments
- Group: id, name, description, members, posts, admins
- Connection: userId, targetUserId, status

## 5. Flujos
- Explorar profesionales → ver perfil → conectar/seguir
- Crear post → aparece en feed global y de seguidores
- Unirse a grupo → participar en foros y eventos
- Mensajería directa entre usuarios conectados

## 6. Integraciones
- Notificaciones en tiempo real (WebSocket)
- Buscador avanzado (por skills, sector, ubicación)
- Moderación de contenido (admin)

---

Siguiente paso: wireframes y modelos de datos detallados.