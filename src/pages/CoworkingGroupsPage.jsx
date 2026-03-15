import React, { useState } from 'react';
import { Box, Typography, Grid, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetGroupsQuery, useCreateGroupMutation, useJoinGroupMutation } from '../api/coworkingApi';
import GroupChat from '../components/GroupChat';
import { GroupCard } from '../components/coworkingBaseComponents';

export default function CoworkingGroupsPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { data: groups = [], refetch } = useGetGroupsQuery();
  const [createGroup, { isLoading: creating }] = useCreateGroupMutation();
  const [joinGroup] = useJoinGroupMutation();
  const [activeChatGroup, setActiveChatGroup] = useState(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    await createGroup({ name, description });
    setName('');
    setDescription('');
    setOpen(false);
    refetch();
  };

  const handleJoin = async (groupId) => {
    await joinGroup(groupId);
    refetch();
    setActiveChatGroup(groupId);
  };

  // Acciones rápidas contextuales para grupos
  const groupActions = [
    { label: 'Crear grupo', onClick: () => setOpen(true) },
    { label: 'Ver mis grupos', onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { label: 'Invitar miembros', onClick: () => alert('Funcionalidad próximamente disponible') },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.08 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" fontWeight={800}>Grupos temáticos</Typography>
          <Stack direction="row" spacing={1}>
            {groupActions.map((action, idx) => (
              <motion.div
                key={action.label}
                whileHover={{ scale: 1.08, boxShadow: '0 0 8px #00fff7' }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.12 + idx * 0.04 }}
                style={{ display: 'inline-block' }}
              >
                <Button variant="outlined" onClick={action.onClick}>{action.label}</Button>
              </motion.div>
            ))}
          </Stack>
        </Box>
      </motion.div>
      <Grid container spacing={2}>
        <AnimatePresence>
          {groups.map((group, idx) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 32 }}
                transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.18 + idx * 0.06 }}
                whileHover={{
                  scale: 1.025,
                  boxShadow: '0 0 16px 2px #00fff7, 0 4px 24px 0 rgba(0,0,0,0.18)',
                  filter: 'brightness(1.08) saturate(1.2) drop-shadow(0 0 8px #00fff7cc)'
                }}
                whileTap={{ scale: 0.98 }}
              >
                <GroupCard group={group} onJoin={handleJoin} />
                {activeChatGroup === group.id && (
                  <Box mt={2}><GroupChat groupId={group.id} /></Box>
                )}
              </motion.div>
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>
      <AnimatePresence>
        {open && (
          <Dialog open={open} onClose={() => setOpen(false)} TransitionComponent={motion.div} TransitionProps={{
            initial: { scale: 0.85, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            exit: { scale: 0.85, opacity: 0 },
            transition: { type: 'spring', stiffness: 120, damping: 18, delay: 0.12 }
          }}>
            <DialogTitle>Crear nuevo grupo</DialogTitle>
            <DialogContent>
              <TextField label="Nombre del grupo" fullWidth value={name} onChange={e => setName(e.target.value)} sx={{ mb: 2 }} />
              <TextField label="Descripción" fullWidth multiline minRows={2} value={description} onChange={e => setDescription(e.target.value)} />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancelar</Button>
              <Button variant="contained" onClick={handleCreate} disabled={creating}>Crear</Button>
            </DialogActions>
          </Dialog>
        )}
      </AnimatePresence>
    </Box>
  );
}
