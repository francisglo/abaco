import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Card, CardContent, Grid } from '@mui/material';
import { useGetEventsQuery } from '../api/coworkingApi';

const initialEvents = [
  { id: 'e1', title: 'Hackathon GovTech', description: 'Reto de innovación para soluciones públicas.', date: '2026-04-10' },
  { id: 'e2', title: 'Foro de Colaboración Social', description: 'Evento para conectar instituciones y ciudadanos.', date: '2026-05-02' },
];

export default function CoworkingEventsPage() {
	const [events, setEvents] = useState(initialEvents);
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [date, setDate] = useState('');

	const { data: fetchedEvents = [] } = useGetEventsQuery();

  const handleCreate = () => {
    if (!title.trim() || !date) return;
    setEvents([...events, { id: 'e' + (events.length + 1), title, description, date }]);
    setTitle('');
    setDescription('');
    setDate('');
    setOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight={800}>Eventos y retos colaborativos</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Publicar evento/reto</Button>
      </Box>
      <Grid container spacing={2}>
        {events.map(event => (
          <Grid item xs={12} sm={6} md={4} key={event.id}>
            <Card>
              <CardContent>
                <Typography fontWeight={700}>{event.title}</Typography>
                <Typography variant="body2" color="text.secondary">{event.description}</Typography>
                <Typography variant="caption" color="primary">{event.date}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Publicar evento o reto</DialogTitle>
        <DialogContent>
          <TextField label="Título" fullWidth value={title} onChange={e => setTitle(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Descripción" fullWidth multiline minRows={2} value={description} onChange={e => setDescription(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Fecha" type="date" fullWidth value={date} onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}>Publicar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
