/**
 * ÁBACO - Módulo de Optimización y Métodos Numéricos
 * 
 * Algoritmos avanzados para asignación territorial, rutas óptimas,
 * balanceo de carga de trabajo y predicciones basadas en datos
 */

/**
 * Algoritmo de Asignación Óptima de Territorios
 * Usa el método húngaro (Hungarian Algorithm) simplificado
 * para asignar operadores a territorios minimizando distancia/carga
 */
export function optimizeTerritoriesAssignment(operators, territories, contacts) {
  // Matriz de costos: [operador][territorio] = costo
  const costMatrix = operators.map(operator => {
    return territories.map(territory => {
      // Calcular costo basado en:
      // 1. Distancia del operador al territorio
      // 2. Carga de trabajo actual del operador
      // 3. Número de contactos en el territorio
      const contactsInTerritory = contacts.filter(c => c.territoryId === territory.id).length
      const operatorLoad = contacts.filter(c => c.registeredBy === operator.id).length
      
      // Costo = distancia + factor de carga + densidad de contactos
      const distance = calculateDistance(operator.lastKnownLocation, territory.centerPoint)
      const loadFactor = operatorLoad / 10 // Normalizar carga
      const densityFactor = contactsInTerritory / 20 // Normalizar densidad
      
      return distance + loadFactor + densityFactor
    })
  })

  // Método húngaro simplificado (greedy approximation)
  const assignment = hungarianAlgorithmSimplified(costMatrix)
  
  return assignment.map((territoryIndex, operatorIndex) => ({
    operatorId: operators[operatorIndex].id,
    territoryId: territories[territoryIndex].id,
    estimatedCost: costMatrix[operatorIndex][territoryIndex],
    confidence: calculateAssignmentConfidence(costMatrix[operatorIndex][territoryIndex])
  }))
}

/**
 * Algoritmo Greedy para el Problema de Asignación
 * O(n²) - Aproximación rápida al método húngaro
 */
function hungarianAlgorithmSimplified(costMatrix) {
  const n = costMatrix.length
  const m = costMatrix[0].length
  const assignment = new Array(n).fill(-1)
  const usedColumns = new Set()

  // Para cada fila (operador), encontrar la columna (territorio) con menor costo
  for (let i = 0; i < n; i++) {
    let minCost = Infinity
    let minCol = -1
    
    for (let j = 0; j < m; j++) {
      if (!usedColumns.has(j) && costMatrix[i][j] < minCost) {
        minCost = costMatrix[i][j]
        minCol = j
      }
    }
    
    if (minCol !== -1) {
      assignment[i] = minCol
      usedColumns.add(minCol)
    }
  }

  return assignment
}

/**
 * Algoritmo de Ruta Óptima (Traveling Salesman Problem - TSP)
 * Usa heurística del vecino más cercano + 2-opt para mejorar
 */
export function optimizeFieldRoute(startPoint, contacts) {
  if (!contacts || contacts.length === 0) return []
  
  // Vecino más cercano
  const route = [startPoint]
  const remaining = [...contacts]
  let current = startPoint

  while (remaining.length > 0) {
    let nearest = null
    let minDistance = Infinity
    let nearestIndex = -1

    remaining.forEach((contact, index) => {
      if (contact.coords) {
        const distance = calculateDistance(current, contact.coords)
        if (distance < minDistance) {
          minDistance = distance
          nearest = contact
          nearestIndex = index
        }
      }
    })

    if (nearest) {
      route.push(nearest)
      current = nearest.coords
      remaining.splice(nearestIndex, 1)
    } else {
      break
    }
  }

  // Mejorar con 2-opt
  const improvedRoute = twoOptImprovement(route)
  
  return improvedRoute.map((point, index) => ({
    ...point,
    order: index,
    estimatedArrival: calculateArrivalTime(route, index)
  }))
}

/**
 * Optimización 2-opt para TSP
 * Invierte segmentos de la ruta para reducir cruces
 */
function twoOptImprovement(route) {
  let improved = true
  let currentRoute = [...route]
  
  while (improved) {
    improved = false
    
    for (let i = 1; i < currentRoute.length - 2; i++) {
      for (let j = i + 1; j < currentRoute.length - 1; j++) {
        const currentDistance = 
          calculateDistance(currentRoute[i].coords || currentRoute[i], currentRoute[i + 1].coords || currentRoute[i + 1]) +
          calculateDistance(currentRoute[j].coords || currentRoute[j], currentRoute[j + 1].coords || currentRoute[j + 1])
        
        const newDistance =
          calculateDistance(currentRoute[i].coords || currentRoute[i], currentRoute[j].coords || currentRoute[j]) +
          calculateDistance(currentRoute[i + 1].coords || currentRoute[i + 1], currentRoute[j + 1].coords || currentRoute[j + 1])
        
        if (newDistance < currentDistance) {
          // Invertir segmento
          currentRoute = [
            ...currentRoute.slice(0, i + 1),
            ...currentRoute.slice(i + 1, j + 1).reverse(),
            ...currentRoute.slice(j + 1)
          ]
          improved = true
        }
      }
    }
  }
  
  return currentRoute
}

/**
 * Método de Newton-Raphson para predicción de engagement
 * Predice tasa de conversión óptima basada en datos históricos
 */
export function predictOptimalEngagement(historicalData) {
  // f(x) = tasa de conversión esperada
  // f'(x) = derivada numérica
  
  const { interactions, conversions, timeSpent } = historicalData
  
  // Función objetivo: maximizar conversiones vs recursos
  const objective = (x) => {
    return conversions - (interactions * x) - (timeSpent * x * 0.1)
  }

  // Derivada numérica
  const derivative = (x, h = 0.001) => {
    return (objective(x + h) - objective(x - h)) / (2 * h)
  }

  // Newton-Raphson
  let x = 0.5 // valor inicial
  const maxIterations = 100
  const tolerance = 0.0001

  for (let i = 0; i < maxIterations; i++) {
    const fx = objective(x)
    const fpx = derivative(x)
    
    if (Math.abs(fpx) < tolerance) break
    
    const xNew = x - fx / fpx
    
    if (Math.abs(xNew - x) < tolerance) {
      x = xNew
      break
    }
    
    x = xNew
  }

  return {
    optimalRate: x,
    expectedConversions: Math.round(interactions * x),
    confidence: Math.min(0.95, 0.5 + (conversions / interactions))
  }
}

/**
 * Interpolación de Lagrange para predecir tendencias
 * Útil para predecir picos de actividad y planificar recursos
 */
export function interpolateTrend(dataPoints) {
  // dataPoints = [{ day, value }, ...]
  if (dataPoints.length < 2) return null

  return (x) => {
    let result = 0
    
    for (let i = 0; i < dataPoints.length; i++) {
      let term = dataPoints[i].value
      
      for (let j = 0; j < dataPoints.length; j++) {
        if (i !== j) {
          term *= (x - dataPoints[j].day) / (dataPoints[i].day - dataPoints[j].day)
        }
      }
      
      result += term
    }
    
    return result
  }
}

/**
 * Balanceo de Carga usando Min-Heap
 * Distribuye contactos equitativamente entre operadores
 */
export function balanceWorkload(operators, newContacts) {
  // Crear min-heap basado en carga actual
  const heap = operators.map(op => ({
    ...op,
    currentLoad: op.assignedContacts || 0
  })).sort((a, b) => a.currentLoad - b.currentLoad)

  const assignments = []

  newContacts.forEach(contact => {
    // Asignar al operador con menor carga
    const operator = heap[0]
    assignments.push({
      contactId: contact.id,
      operatorId: operator.id,
      estimatedLoad: operator.currentLoad + 1
    })

    // Actualizar carga y reordenar
    operator.currentLoad++
    heap.sort((a, b) => a.currentLoad - b.currentLoad)
  })

  return assignments
}

/**
 * Algoritmo de Clustering K-Means para segmentación territorial
 * Agrupa contactos en clusters para crear zonas balanceadas
 */
export function clusterContacts(contacts, k = 5) {
  if (!contacts || contacts.length < k) return []

  // Filtrar contactos con coordenadas válidas
  const validContacts = contacts.filter(c => c.coords && c.coords.lat && c.coords.lng)
  if (validContacts.length < k) return []

  // Inicializar centroides aleatoriamente
  let centroids = []
  const usedIndices = new Set()
  while (centroids.length < k) {
    const randomIndex = Math.floor(Math.random() * validContacts.length)
    if (!usedIndices.has(randomIndex)) {
      centroids.push({ ...validContacts[randomIndex].coords })
      usedIndices.add(randomIndex)
    }
  }

  let clusters = new Array(k).fill(null).map(() => [])
  let converged = false
  let iterations = 0
  const maxIterations = 100

  while (!converged && iterations < maxIterations) {
    // Asignar cada contacto al centroide más cercano
    clusters = new Array(k).fill(null).map(() => [])
    
    validContacts.forEach(contact => {
      let minDistance = Infinity
      let closestCluster = 0

      centroids.forEach((centroid, i) => {
        const distance = calculateDistance(contact.coords, centroid)
        if (distance < minDistance) {
          minDistance = distance
          closestCluster = i
        }
      })

      clusters[closestCluster].push(contact)
    })

    // Recalcular centroides
    const newCentroids = clusters.map(cluster => {
      if (cluster.length === 0) return centroids[0] // Fallback

      const avgLat = cluster.reduce((sum, c) => sum + c.coords.lat, 0) / cluster.length
      const avgLng = cluster.reduce((sum, c) => sum + c.coords.lng, 0) / cluster.length

      return { lat: avgLat, lng: avgLng }
    })

    // Verificar convergencia
    converged = centroids.every((centroid, i) => {
      const distance = calculateDistance(centroid, newCentroids[i])
      return distance < 0.001
    })

    centroids = newCentroids
    iterations++
  }

  return clusters.map((cluster, index) => ({
    clusterId: index + 1,
    centroid: centroids[index],
    contacts: cluster,
    size: cluster.length,
    density: cluster.length / calculateClusterArea(cluster)
  }))
}

/**
 * Utilidades
 */

function calculateDistance(point1, point2) {
  if (!point1 || !point2) return Infinity
  
  const lat1 = point1.lat
  const lng1 = point1.lng
  const lat2 = point2.lat
  const lng2 = point2.lng

  // Fórmula de Haversine
  const R = 6371 // Radio de la Tierra en km
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180)
}

function calculateAssignmentConfidence(cost) {
  // Menor costo = mayor confianza
  return Math.max(0.1, Math.min(0.99, 1 / (1 + cost)))
}

function calculateArrivalTime(route, index) {
  // Asumiendo velocidad promedio de 30 km/h
  const avgSpeed = 30
  let totalDistance = 0

  for (let i = 0; i < index; i++) {
    const point1 = route[i].coords || route[i]
    const point2 = route[i + 1].coords || route[i + 1]
    totalDistance += calculateDistance(point1, point2)
  }

  const timeInHours = totalDistance / avgSpeed
  const now = new Date()
  now.setHours(now.getHours() + timeInHours)
  
  return now.toISOString()
}

function calculateClusterArea(cluster) {
  if (cluster.length < 3) return 1

  // Aproximación: área del rectángulo delimitador
  const lats = cluster.map(c => c.coords.lat)
  const lngs = cluster.map(c => c.coords.lng)
  
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  const height = calculateDistance({ lat: minLat, lng: minLng }, { lat: maxLat, lng: minLng })
  const width = calculateDistance({ lat: minLat, lng: minLng }, { lat: minLat, lng: maxLng })

  return height * width || 1
}

/**
 * Regresión Lineal Simple para predicciones
 */
export function linearRegression(dataPoints) {
  const n = dataPoints.length
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0

  dataPoints.forEach(point => {
    sumX += point.x
    sumY += point.y
    sumXY += point.x * point.y
    sumXX += point.x * point.x
  })

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return {
    slope,
    intercept,
    predict: (x) => slope * x + intercept,
    r2: calculateR2(dataPoints, slope, intercept)
  }
}

function calculateR2(dataPoints, slope, intercept) {
  const meanY = dataPoints.reduce((sum, p) => sum + p.y, 0) / dataPoints.length
  
  let ssTotal = 0
  let ssResidual = 0

  dataPoints.forEach(point => {
    const predicted = slope * point.x + intercept
    ssTotal += Math.pow(point.y - meanY, 2)
    ssResidual += Math.pow(point.y - predicted, 2)
  })

  return 1 - (ssResidual / ssTotal)
}
