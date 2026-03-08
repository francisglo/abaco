/**
 * ÁBACO - Gestión de Archivos
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import {
  MdUploadFile,
  MdDownload,
  MdDelete,
  MdFolder,
  MdInsertDriveFile,
  MdImage,
  MdPictureAsPdf
} from 'react-icons/md'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default function FilesPage() {
  const [files, setFiles] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [newFile, setNewFile] = useState({
    name: '',
    type: 'document',
    category: 'general',
    description: ''
  })

  useEffect(() => {
    // Cargar archivos (simulado)
    const mockFiles = [
      {
        id: 1,
        name: 'Reporte_Q1_2024.pdf',
        type: 'pdf',
        category: 'reports',
        size: 2.5 * 1024 * 1024,
        uploadedBy: 'Juan Pérez',
        uploadedAt: new Date(Date.now() - 86400000 * 2),
        url: '#'
      },
      {
        id: 2,
        name: 'Plan_Territorial.docx',
        type: 'document',
        category: 'planning',
        size: 1.2 * 1024 * 1024,
        uploadedBy: 'Ana López',
        uploadedAt: new Date(Date.now() - 86400000 * 5),
        url: '#'
      },
      {
        id: 3,
        name: 'Mapa_Zona_Norte.jpg',
        type: 'image',
        category: 'maps',
        size: 3.8 * 1024 * 1024,
        uploadedBy: 'Carlos Ruiz',
        uploadedAt: new Date(Date.now() - 86400000 * 7),
        url: '#'
      },
      {
        id: 4,
        name: 'Contactos_Febrero.xlsx',
        type: 'spreadsheet',
        category: 'data',
        size: 0.5 * 1024 * 1024,
        uploadedBy: 'Juan Pérez',
        uploadedAt: new Date(Date.now() - 86400000 * 10),
        url: '#'
      }
    ]
    setFiles(mockFiles)
  }, [])

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return <MdPictureAsPdf style={{ color: '#d32f2f' }} />
      case 'image':
        return <MdImage style={{ color: '#1976d2' }} />
      case 'folder':
        return <MdFolder style={{ color: '#ff9800' }} />
      default:
        return <MdInsertDriveFile style={{ color: '#757575' }} />
    }
  }

  const getCategoryLabel = (category) => {
    const labels = {
      general: 'General',
      reports: 'Reportes',
      planning: 'Planificación',
      maps: 'Mapas',
      data: 'Datos'
    }
    return labels[category] || category
  }

  const handleUpload = () => {
    // Simular subida de archivo
    const file = {
      ...newFile,
      id: Date.now(),
      size: Math.random() * 5 * 1024 * 1024,
      uploadedBy: 'Usuario Actual',
      uploadedAt: new Date(),
      url: '#'
    }
    setFiles([file, ...files])
    setOpenDialog(false)
    setNewFile({ name: '', type: 'document', category: 'general', description: '' })
  }

  const handleDelete = (id) => {
    if (confirm('¿Está seguro de eliminar este archivo?')) {
      setFiles(files.filter(f => f.id !== id))
    }
  }

  const handleDownload = (file) => {
    alert(`Descargando: ${file.name}`)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Gestión de Archivos
        </Typography>
        <Button
          variant="contained"
          startIcon={<MdUploadFile />}
          onClick={() => setOpenDialog(true)}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          Subir Archivo
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(102, 126, 234, 0.05)' }}>
              <TableCell sx={{ fontWeight: 600 }}>Archivo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tamaño</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Subido Por</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getFileIcon(file.type)}
                    <Typography variant="body2">{file.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={getCategoryLabel(file.category)} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                </TableCell>
                <TableCell>{file.uploadedBy}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {file.uploadedAt.toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(file.uploadedAt, { addSuffix: true, locale: es })}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleDownload(file)}>
                    <MdDownload />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(file.id)}>
                    <MdDelete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Subir Archivo</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre del Archivo"
            value={newFile.name}
            onChange={(e) => setNewFile({ ...newFile, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={newFile.category}
              label="Categoría"
              onChange={(e) => setNewFile({ ...newFile, category: e.target.value })}
            >
              <MenuItem value="general">General</MenuItem>
              <MenuItem value="reports">Reportes</MenuItem>
              <MenuItem value="planning">Planificación</MenuItem>
              <MenuItem value="maps">Mapas</MenuItem>
              <MenuItem value="data">Datos</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Descripción"
            multiline
            rows={3}
            value={newFile.description}
            onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!newFile.name}
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Subir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
