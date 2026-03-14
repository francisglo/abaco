import React from 'react';
import { Avatar, Button, Card, CardContent, Typography, Stack } from '@mui/material';

// UserCard: Tarjeta de usuario para explorar profesionales
export function UserCard({ user, onConnect }) {
  return (
    <Card sx={{ minWidth: 220, m: 1, p: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Avatar src={user.avatar} sx={{ width: 64, height: 64, mb: 1 }} />
      <Typography fontWeight={700}>{user.name}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{user.bio}</Typography>
      <Button variant="contained" size="small" onClick={() => onConnect(user.id)}>Conectar</Button>
    </Card>
  );
}

// PostCard: Publicación individual
export function PostCard({ post, author }) {
  return (
    <Card sx={{ my: 2 }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={author.avatar} />
          <Typography fontWeight={600}>{author.name}</Typography>
          <Typography variant="caption" color="text.secondary">{new Date(post.createdAt).toLocaleString()}</Typography>
        </Stack>
        <Typography sx={{ mt: 1 }}>{post.content}</Typography>
        {/* Aquí irían media, reacciones, comentarios */}
      </CardContent>
    </Card>
  );
}

// GroupCard: Tarjeta de grupo
export function GroupCard({ group, onJoin }) {
  return (
    <Card sx={{ minWidth: 220, m: 1, p: 1 }}>
      <Typography fontWeight={700}>{group.name}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{group.description}</Typography>
      <Button variant="outlined" size="small" onClick={() => onJoin(group.id)}>Unirse</Button>
    </Card>
  );
}

// NewPostModal: Modal para crear publicación (borrador)
export function NewPostModal() {
  // ...lógica de modal y formulario...
  return null;
}
