// Notificaciones demo para coworking
import React, { useState } from 'react';
import { Box, IconButton, Badge, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { MdNotifications, MdPersonAdd, MdThumbUp, MdComment } from 'react-icons/md';

const mockNotifications = [
  { id: 1, type: 'follow', text: 'Luis Pérez te ha seguido', icon: <MdPersonAdd size={20} /> },
  { id: 2, type: 'like', text: 'Ana Torres reaccionó a tu post', icon: <MdThumbUp size={20} /> },
  { id: 3, type: 'comment', text: 'María López comentó tu publicación', icon: <MdComment size={20} /> },
];

export default function CoworkingNotifications() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState(mockNotifications);

  const handleOpen = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleClear = () => setNotifications([]);

  return (
    <Box>
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={notifications.length} color="error">
          <MdNotifications size={24} />
        </Badge>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {notifications.length === 0 ? (
          <MenuItem disabled>Sin notificaciones</MenuItem>
        ) : (
          notifications.map((n) => (
            <MenuItem key={n.id} onClick={handleClose}>
              <ListItemIcon>{n.icon}</ListItemIcon>
              <ListItemText primary={n.text} />
            </MenuItem>
          ))
        )}
        {notifications.length > 0 && (
          <MenuItem onClick={handleClear} sx={{ color: 'error.main' }}>Limpiar notificaciones</MenuItem>
        )}
      </Menu>
    </Box>
  );
}
