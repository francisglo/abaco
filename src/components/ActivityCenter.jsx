import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Paper, Typography, Stack, Chip, Divider, Badge } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { MdNotifications, MdCheckCircle, MdTask } from 'react-icons/md';

export default function ActivityCenter() {
  const { notifications } = useSelector(s => s.notifications);
  const { tasks } = useSelector(s => s.tasks);

  const pendingTasks = (tasks || []).filter(t => !t.completed);
  const completedTasks = (tasks || []).filter(t => t.completed);
  const unreadNotifications = (notifications || []).filter(n => !n.read);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.08 }}
    >
      <Paper sx={{ p: 3, borderRadius: 2, maxWidth: 480, mx: 'auto', mt: 4 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Centro de Actividad
        </Typography>
        <Stack direction="row" spacing={2} mb={2}>
          <motion.div whileHover={{ scale: 1.12, boxShadow: '0 0 8px #00fff7' }} whileTap={{ scale: 0.96 }}>
            <Badge badgeContent={unreadNotifications.length} color="error">
              <MdNotifications size={28} />
            </Badge>
          </motion.div>
          <motion.div whileHover={{ scale: 1.12, boxShadow: '0 0 8px #00fff7' }} whileTap={{ scale: 0.96 }}>
            <Badge badgeContent={pendingTasks.length} color="warning">
              <MdTask size={28} />
            </Badge>
          </motion.div>
          <motion.div whileHover={{ scale: 1.12, boxShadow: '0 0 8px #00fff7' }} whileTap={{ scale: 0.96 }}>
            <Badge badgeContent={completedTasks.length} color="success">
              <MdCheckCircle size={28} />
            </Badge>
          </motion.div>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle1" fontWeight={600} mb={1}>Tareas pendientes</Typography>
        <Stack spacing={1} mb={2}>
          <AnimatePresence>
            {pendingTasks.slice(0, 4).map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.12 + idx * 0.04 }}
              >
                <Chip label={task.title} color="warning" variant="outlined" />
              </motion.div>
            ))}
          </AnimatePresence>
          {pendingTasks.length === 0 && <Typography variant="body2" color="text.secondary">Sin tareas pendientes</Typography>}
        </Stack>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>Notificaciones recientes</Typography>
        <Stack spacing={1}>
          <AnimatePresence>
            {notifications.slice(0, 4).map((n, idx) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.18 + idx * 0.04 }}
              >
                <Chip label={n.title} color={n.read ? 'default' : 'primary'} variant="outlined" />
              </motion.div>
            ))}
          </AnimatePresence>
          {notifications.length === 0 && <Typography variant="body2" color="text.secondary">Sin notificaciones</Typography>}
        </Stack>
      </Paper>
    </motion.div>
  );
}
