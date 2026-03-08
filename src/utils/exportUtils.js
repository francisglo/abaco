/**
 * ÁBACO - Utilidades de Exportación
 * PDF, Excel, CSV con formato profesional
 */

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

/**
 * Exportar contactos a PDF
 */
export function exportContactsToPDF(contacts, filters = {}) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(102, 126, 234)
  doc.text('ÁBACO - Reporte de Contactos', 14, 22)
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 30)
  doc.text(`Total de contactos: ${contacts.length}`, 14, 36)
  
  // Filters applied
  if (Object.keys(filters).length > 0) {
    doc.setFontSize(9)
    doc.text('Filtros aplicados:', 14, 42)
    let yPos = 47
    Object.entries(filters).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 20, yPos)
      yPos += 5
    })
  }
  
  // Table
  const tableData = contacts.map(contact => [
    contact.name || '-',
    contact.dni || contact.documentNumber || '-',
    contact.phone || '-',
    contact.address || '-',
    contact.status || '-',
    contact.priority || '-'
  ])
  
  doc.autoTable({
    startY: filters.length > 0 ? 55 : 45,
    head: [['Nombre', 'DNI', 'Teléfono', 'Dirección', 'Estado', 'Prioridad']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [102, 126, 234],
      fontSize: 10,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [248, 249, 250]
    }
  })
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }
  
  doc.save(`contactos_${Date.now()}.pdf`)
}

/**
 * Exportar a Excel con múltiples hojas
 */
export function exportToExcel(data, filename = 'reporte') {
  const { contacts, territories, users, interactions } = data
  
  const wb = XLSX.utils.book_new()
  
  // Hoja 1: Contactos
  if (contacts && contacts.length > 0) {
    const contactsData = contacts.map(c => ({
      'Nombre': c.name,
      'Documento': c.dni || c.documentNumber,
      'Teléfono': c.phone,
      'Email': c.email,
      'Dirección': c.address,
      'Estado': c.status,
      'Prioridad': c.priority,
      'Territorio': c.territoryId,
      'Registrado por': c.registeredBy,
      'Fecha creación': c.createdAt
    }))
    const ws1 = XLSX.utils.json_to_sheet(contactsData)
    XLSX.utils.book_append_sheet(wb, ws1, 'Contactos')
  }
  
  // Hoja 2: Territorios
  if (territories && territories.length > 0) {
    const territoriesData = territories.map(t => ({
      'ID': t.id,
      'Nombre': t.name,
      'Tipo': t.type,
      'Prioridad': t.priority,
      'Padre': t.parentId || '-'
    }))
    const ws2 = XLSX.utils.json_to_sheet(territoriesData)
    XLSX.utils.book_append_sheet(wb, ws2, 'Territorios')
  }
  
  // Hoja 3: Interacciones
  if (interactions && interactions.length > 0) {
    const interactionsData = interactions.map(i => ({
      'Fecha': new Date(i.timestamp).toLocaleString('es-ES'),
      'Contacto': i.contactId,
      'Usuario': i.userId,
      'Tipo': i.type,
      'Canal': i.channel,
      'Resultado': i.result,
      'Notas': i.notes
    }))
    const ws3 = XLSX.utils.json_to_sheet(interactionsData)
    XLSX.utils.book_append_sheet(wb, ws3, 'Interacciones')
  }
  
  // Hoja 4: Resumen
  const summary = [
    ['Métrica', 'Valor'],
    ['Total Contactos', contacts?.length || 0],
    ['Contactos Confirmados', contacts?.filter(c => c.status === 'confirmed').length || 0],
    ['Contactos Pendientes', contacts?.filter(c => c.status === 'pending').length || 0],
    ['Total Territorios', territories?.length || 0],
    ['Total Usuarios', users?.length || 0],
    ['Total Interacciones', interactions?.length || 0],
    ['Fecha de reporte', new Date().toLocaleString('es-ES')]
  ]
  const ws4 = XLSX.utils.aoa_to_sheet(summary)
  XLSX.utils.book_append_sheet(wb, ws4, 'Resumen')
  
  XLSX.writeFile(wb, `${filename}_${Date.now()}.xlsx`)
}

/**
 * Exportar a CSV
 */
export function exportToCSV(data, filename = 'datos') {
  const ws = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, `${filename}_${Date.now()}.csv`)
}

/**
 * Generar reporte ejecutivo en PDF
 */
export function exportExecutiveReport(analytics) {
  const doc = new jsPDF()
  
  // Portada
  doc.setFillColor(102, 126, 234)
  doc.rect(0, 0, 210, 60, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.text('ÁBACO', 14, 30)
  
  doc.setFontSize(16)
  doc.text('Reporte Ejecutivo', 14, 42)
  
  doc.setFontSize(11)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, 14, 52)
  
  // Métricas principales
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(18)
  doc.text('Métricas Clave', 14, 80)
  
  const metrics = [
    { label: 'Total de Contactos', value: analytics.totalContacts || 0, icon: '👥' },
    { label: 'Tasa de Conversión', value: `${analytics.conversionRate || 0}%`, icon: '📈' },
    { label: 'Contactos Activos', value: analytics.activeContacts || 0, icon: '✓' },
    { label: 'Territorios Cubiertos', value: analytics.territories || 0, icon: '🗺️' }
  ]
  
  let yPos = 95
  metrics.forEach(metric => {
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`${metric.icon} ${metric.label}`, 14, yPos)
    
    doc.setFontSize(20)
    doc.setTextColor(102, 126, 234)
    doc.text(String(metric.value), 14, yPos + 10)
    
    yPos += 30
  })
  
  // Tendencias
  doc.addPage()
  doc.setFontSize(18)
  doc.setTextColor(0, 0, 0)
  doc.text('Análisis de Tendencias', 14, 20)
  
  if (analytics.trends) {
    doc.setFontSize(11)
    doc.setTextColor(60)
    let trendY = 35
    
    doc.text(`📊 Crecimiento: ${analytics.trends.growth > 0 ? '+' : ''}${analytics.trends.growth}%`, 14, trendY)
    trendY += 10
    doc.text(`🎯 Engagement Score: ${analytics.trends.engagement}/100`, 14, trendY)
    trendY += 10
    doc.text(`⏱️ Tiempo Promedio de Respuesta: ${analytics.trends.avgResponseTime}`, 14, trendY)
  }
  
  // Recomendaciones
  doc.addPage()
  doc.setFontSize(18)
  doc.text('Recomendaciones Estratégicas', 14, 20)
  
  const recommendations = analytics.recommendations || [
    '• Incrementar actividades de campo en territorios de alta densidad',
    '• Implementar seguimiento automático para contactos pendientes',
    '• Optimizar rutas de operadores para reducir tiempos de traslado',
    '• Reforzar equipo en territorios con mayor tasa de conversión'
  ]
  
  doc.setFontSize(11)
  doc.setTextColor(60)
  let recY = 35
  recommendations.forEach(rec => {
    doc.text(rec, 14, recY)
    recY += 10
  })
  
  doc.save(`reporte_ejecutivo_${Date.now()}.pdf`)
}

/**
 * Exportar datos de análisis avanzado
 */
export function exportAnalytics(analyticsData) {
  const doc = new jsPDF()
  
  doc.setFontSize(20)
  doc.setTextColor(102, 126, 234)
  doc.text('Análisis Avanzado - ÁBACO', 14, 22)
  
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Fecha: ${new Date().toLocaleString('es-ES')}`, 14, 30)
  
  let yPos = 45
  
  // Predicción de Engagement
  if (analyticsData.engagement) {
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Optimización de Engagement', 14, yPos)
    yPos += 10
    
    doc.setFontSize(10)
    doc.text(`Tasa Óptima: ${Math.round(analyticsData.engagement.optimalRate * 100)}%`, 20, yPos)
    yPos += 7
    doc.text(`Conversiones Esperadas: ${analyticsData.engagement.expectedConversions}`, 20, yPos)
    yPos += 7
    doc.text(`Confianza: ${Math.round(analyticsData.engagement.confidence * 100)}%`, 20, yPos)
    yPos += 15
  }
  
  // Clusters Territoriales
  if (analyticsData.clusters && analyticsData.clusters.length > 0) {
    doc.setFontSize(14)
    doc.text('Segmentación Territorial (K-Means)', 14, yPos)
    yPos += 10
    
    const clusterData = analyticsData.clusters.map(c => [
      `Cluster ${c.clusterId}`,
      c.size.toString(),
      c.density.toFixed(2)
    ])
    
    doc.autoTable({
      startY: yPos,
      head: [['Cluster', 'Contactos', 'Densidad']],
      body: clusterData,
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] }
    })
    
    yPos = doc.lastAutoTable.finalY + 15
  }
  
  // Balance de Carga
  if (analyticsData.workloadBalance) {
    doc.setFontSize(14)
    doc.text('Balance de Carga', 14, yPos)
    yPos += 10
    
    doc.setFontSize(10)
    doc.text(`Score: ${Math.round(analyticsData.workloadBalance.balanceScore)}/100`, 20, yPos)
    yPos += 7
    doc.text(`Carga Promedio: ${analyticsData.workloadBalance.avgLoad} contactos/operador`, 20, yPos)
    yPos += 7
    doc.text(`Varianza: ${analyticsData.workloadBalance.variance}`, 20, yPos)
  }
  
  doc.save(`analytics_${Date.now()}.pdf`)
}
