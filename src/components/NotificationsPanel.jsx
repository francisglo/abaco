/**
 * ÁBACO - Componente de Notificaciones
 */

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchNotifications, markAsRead, clearAll } from '../store/notificationsSlice'
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Divider,
  Button,
  Chip
} from '@mui/material'
import { MdNotifications, MdDelete, MdCheckCircle, MdWarning, MdInfo } from 'react-icons/md'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default function NotificationsPanel() {
  const dispatch = useDispatch()
  const { notifications, unreadCount } = useSelector(s => s.notifications)
  const { user } = useSelector(s => s.auth)
  const [anchorEl, setAnchorEl] = useState(null)

  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications(user.id))
    }
  }, [user, dispatch])

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id))
  }

  const getNotificationIcon = (type) => {
    const icons = {
      success: <MdCheckCircle size={24} style={{ color: '#00b37e' }} />,
      warning: <MdWarning size={24} style={{ color: '#f59e0b' }} />,
      error: <MdWarning size={24} style={{ color: '#dc2626' }} />,
      info: <MdInfo size={24} style={{ color: '#667eea' }} />
    }
    return icons[type] || icons.info
  }

  const open = Boolean(anchorEl)

  return (
    <>
      <IconButton onClick={handleClick} color="inherit">
        <Badge badgeContent={unreadCount} color="error">
          <MdNotifications size={24} />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 380, maxHeight: 500 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notificaciones
          </Typography>
          {notifications.length > 0 && (
            <Button size="small" onClick={() => dispatch(clearAll())}>
              Limpiar
            </Button>
          )}
        </Box>
        <Divider />
        
        <List sx={{ p: 0, maxHeight: 400, overflowY: 'auto' }}>
          {notifications.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No hay notificaciones
              </Typography>
            </Box>
          )}
          
          {notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'rgba(102, 126, 234, 0.05)',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                }}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'transparent' }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notification.createdAt && formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es
                        })}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Popover>
    </>
  )
}
