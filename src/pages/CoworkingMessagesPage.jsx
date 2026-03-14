import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, TextField, Button, Paper } from '@mui/material';
import { useGetMessagesQuery } from '../api/coworkingApi';

// Mensajería directa simple (demo)
const mockUsers = [
  { id: '1', name: 'Ana Torres', avatar: '' },
  { id: '2', name: 'Luis Pérez', avatar: '' },
  { id: '3', name: 'María López', avatar: '' },
];

export default function CoworkingMessagesPage() {
  const [selectedUser, setSelectedUser] = useState(mockUsers[0]);
  const { data: messages = {} } = useGetMessagesQuery(selectedUser.id);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => ({
      ...prev,
      [selectedUser.id]: [...(prev[selectedUser.id] || []), { from: 'me', text: input }],
    }));
    setInput('');
  };

  return (
    <Box sx={{ display: 'flex', height: '70vh', bgcolor: '#181818', borderRadius: 2, overflow: 'hidden' }}>
      <Paper sx={{ width: 220, bgcolor: '#23272f', p: 1 }}>
        <Typography fontWeight={700} mb={1}>Chats</Typography>
        <List>
          {mockUsers.map((user) => (
            <ListItem button key={user.id} selected={selectedUser.id === user.id} onClick={() => setSelectedUser(user)}>
              <ListItemAvatar><Avatar src={user.avatar} /></ListItemAvatar>
              <ListItemText primary={user.name} />
            </ListItem>
          ))}
        </List>
      </Paper>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Typography fontWeight={700} mb={1}>Conversación con {selectedUser.name}</Typography>
        <Divider />
        <Box sx={{ flex: 1, overflowY: 'auto', my: 2 }}>
          {(messages || []).map((msg, idx) => (
            <Box key={idx} sx={{ mb: 1, textAlign: msg.from === 'me' ? 'right' : 'left' }}>
              <Typography variant="body2" sx={{ display: 'inline-block', bgcolor: msg.from === 'me' ? '#1976d2' : '#333', color: '#fff', px: 1.5, py: 0.7, borderRadius: 2 }}>{msg.text}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField size="small" fullWidth value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe un mensaje..." />
          <Button variant="contained" onClick={handleSend}>Enviar</Button>
        </Box>
      </Box>
    </Box>
  );
}
