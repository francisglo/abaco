import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Paper, TextField, Button, Stack, Avatar, CircularProgress } from '@mui/material';
import { fetchGroupMessages, addMessage } from '../store/groupChatSlice';

export default function GroupChat({ groupId }) {
  const dispatch = useDispatch();
  const messages = useSelector(state => state.groupChat.messagesByGroup[groupId] || []);
  const loading = useSelector(state => state.groupChat.loading);
  const user = useSelector(state => state.auth.user);
  const [input, setInput] = useState('');
  const chatRef = useRef();

  useEffect(() => {
    dispatch(fetchGroupMessages(groupId));
  }, [dispatch, groupId]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const message = {
      id: Date.now().toString(),
      groupId,
      senderId: user?.id || 'anon',
      senderName: user?.name || 'Anónimo',
      content: input,
      createdAt: new Date().toISOString(),
    };
    dispatch(addMessage({ groupId, message }));
    setInput('');
  };

  return (
    <Paper sx={{ p: 2, maxWidth: 420, minHeight: 340, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" fontWeight={700} mb={1}>Chat del grupo</Typography>
      <Box ref={chatRef} sx={{ flex: 1, overflowY: 'auto', mb: 1, bgcolor: '#f7fafd', borderRadius: 1, p: 1, minHeight: 180 }}>
        {loading ? <CircularProgress size={22} sx={{ display: 'block', mx: 'auto', my: 2 }} /> :
          messages.map(msg => (
            <Stack key={msg.id} direction={msg.senderId === user?.id ? 'row-reverse' : 'row'} alignItems="flex-end" spacing={1} mb={0.5}>
              <Avatar sx={{ width: 28, height: 28 }}>{msg.senderName[0]}</Avatar>
              <Box sx={{ bgcolor: msg.senderId === user?.id ? 'primary.light' : 'grey.200', color: 'text.primary', borderRadius: 2, px: 1.5, py: 0.7, maxWidth: 220, fontSize: 15 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{msg.senderName}</Typography>
                <Typography variant="body2">{msg.content}</Typography>
                <Typography variant="caption" color="text.secondary">{new Date(msg.createdAt).toLocaleTimeString()}</Typography>
              </Box>
            </Stack>
          ))}
      </Box>
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          placeholder="Escribe un mensaje..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
        />
        <Button variant="contained" onClick={handleSend} disabled={!input.trim()}>Enviar</Button>
      </Stack>
    </Paper>
  );
}
