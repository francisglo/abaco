import React from 'react'
import { AppBar, Toolbar, Typography, Drawer, List, ListItemButton, ListItemText, Box } from '@mui/material'
import { Link } from 'react-router-dom'

const drawerWidth = 220

export default function Layout({ children }) {
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">ABACO</Typography>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ width: drawerWidth, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', mt: 8 } }}>
        <List>
          <ListItemButton component={Link} to="/">
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton component={Link} to="/zones">
            <ListItemText primary="Zonas" />
          </ListItemButton>
          <ListItemButton component={Link} to="/voters">
            <ListItemText primary="Votantes" />
          </ListItemButton>
          <ListItemButton component={Link} to="/users">
            <ListItemText primary="Usuarios" />
          </ListItemButton>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, ml: `${drawerWidth}px` }}>
        {children}
      </Box>
    </Box>
  )
}
