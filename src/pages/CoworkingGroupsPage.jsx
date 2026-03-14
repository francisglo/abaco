import React, { useState } from 'react';
import { Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { GroupCard } from '../components/coworkingBaseComponents';
import { useGetGroupsQuery } from '../api/coworkingApi';

const initialGroups = [
  { id: 'g1', name: 'Innovación Pública', description: 'Proyectos y retos de gobierno abierto.' },
  { id: 'g2', name: 'Educación Digital', description: 'Transformación educativa y tecnología.' },
];

export default function CoworkingGroupsPage() {
  const [groups, setGroups] = useState(initialGroups);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { data: groups = [] } = useGetGroupsQuery();

  const handleCreate = () => {
    if (!name.trim()) return;
    setGroups([...groups, { id: 'g' + (groups.length + 1), name, description }]);
    setName('');
    setDescription('');
    setOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight={800}>Grupos temáticos</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Crear grupo</Button>
      </Box>
      <Grid container spacing={2}>
        {groups.map(group => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <GroupCard group={group} onJoin={() => alert('Unirse a ' + group.name)} />
          </Grid>
        ))}
      </Grid>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Crear nuevo grupo</DialogTitle>
        <DialogContent>
          <TextField label="Nombre del grupo" fullWidth value={name} onChange={e => setName(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Descripción" fullWidth multiline minRows={2} value={description} onChange={e => setDescription(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}>Crear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
