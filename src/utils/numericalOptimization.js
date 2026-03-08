/**
 * ÁBACO - Optimización Numérica Avanzada
 * Algoritmos de optimización matemática aplicados a territorios y recursos
 */

// ============================================================================
// 1. OPTIMIZACIÓN LINEAR - ASIGNACIÓN DE RECURSOS ÓPTIMA
// ============================================================================

export function linearOptimization(resources, territories) {
  /**
   * Resuelve el problema de asignación linear:
   * Maximizar: Z = c1*x1 + c2*x2 + ... + cn*xn
   * Sujeto a: restricciones lineales
   * 
   * Usa Método Simplex simplificado
   */
  
  const n = territories.length
  const m = resources.length
  
  // Matriz de costos de asignación
  const costMatrix = Array(n).fill(0).map((_, i) => 
    Array(m).fill(0).map((_, j) => {
      const distance = Math.sqrt(
        Math.pow(territories[i].coords.lat - resources[j].coords.lat, 2) +
        Math.pow(territories[i].coords.lng - resources[j].coords.lng, 2)
      )
      return distance
    })
  )
  
  // Algoritmo Simplex básico - encontrar asignación óptima
  const assignment = Array(n).fill(-1)
  const usedResources = new Set()
  
  // Greedy con ajustes iterativos
  for (let iteration = 0; iteration < n; iteration++) {
    let bestScore = Infinity
    let bestT = -1
    let bestR = -1
    
    for (let i = 0; i < n; i++) {
      if (assignment[i] !== -1) continue
      
      for (let j = 0; j < m; j++) {
        if (usedResources.has(j)) continue
        
        const score = costMatrix[i][j] * (territories[i].priority || 1)
        if (score < bestScore) {
          bestScore = score
          bestT = i
          bestR = j
        }
      }
    }
    
    if (bestT !== -1) {
      assignment[bestT] = bestR
      usedResources.add(bestR)
    }
  }
  
  return {
    assignment,
    totalCost: assignment.reduce((sum, r, i) => 
      sum + (r !== -1 ? costMatrix[i][r] : 0), 0),
    efficiency: (n - Array.from(usedResources).length) / n
  }
}

// ============================================================================
// 2. PROGRAMACIÓN DINÁMICA - COBERTURA ÓPTIMA DE TERRITORIOS
// ============================================================================

export function dynamicCoverage(territories, maxBudget, costPerTerritory) {
  /**
   * Problema de mochila (Knapsack) aplicado a cobertura territorial
   * Maximizar cobertura con presupuesto limitado
   */
  
  const n = territories.length
  const dp = Array(maxBudget + 1).fill(0)
  const selected = Array(maxBudget + 1).fill(null).map(() => [])
  
  // Calcular valor de cada territorio (población * prioridad)
  const values = territories.map(t => ({
    id: t.id,
    value: (t.population || 1000) * (t.priority || 1),
    cost: costPerTerritory[t.id] || 100
  }))
  
  // DP: llenar tabla
  for (let i = 0; i < n; i++) {
    const { value, cost } = values[i]
    
    for (let w = maxBudget; w >= cost; w--) {
      const newValue = dp[w - cost] + value
      
      if (newValue > dp[w]) {
        dp[w] = newValue
        selected[w] = [...(selected[w - cost] || []), values[i].id]
      }
    }
  }
  
  // Encontrar presupuesto óptimo (máximo valor dentro del límite)
  let optimalBudget = 0
  let maxValue = 0
  
  for (let w = 0; w <= maxBudget; w++) {
    if (dp[w] > maxValue) {
      maxValue = dp[w]
      optimalBudget = w
    }
  }
  
  return {
    selectedTerritories: selected[optimalBudget],
    totalValue: maxValue,
    budgetUsed: optimalBudget,
    budgetRemaining: maxBudget - optimalBudget,
    coverage: (selected[optimalBudget].length / n * 100).toFixed(2) + '%'
  }
}

// ============================================================================
// 3. MÉTODO DE GRADIENT DESCENT - OPTIMIZACIÓN DE UBICACIONES
// ============================================================================

export function gradientDescentLocationOptimization(points, iterations = 100, learningRate = 0.01) {
  /**
   * Encuentra la ubicación óptima para un centro de distribución
   * Minimiza la distancia total ponderada a todos los puntos
   */
  
  if (points.length === 0) return null
  
  // Iniciar en el centroide
  let center = {
    lat: points.reduce((s, p) => s + p.coords.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.coords.lng, 0) / points.length
  }
  
  const costHistory = []
  
  for (let iter = 0; iter < iterations; iter++) {
    // Calcular gradiente
    let gradLat = 0
    let gradLng = 0
    let totalCost = 0
    
    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(center.lat - point.coords.lat, 2) +
        Math.pow(center.lng - point.coords.lng, 2)
      )
      
      const weight = point.weight || 1
      totalCost += distance * weight
      
      if (distance > 0) {
        gradLat += ((center.lat - point.coords.lat) / distance) * weight
        gradLng += ((center.lng - point.coords.lng) / distance) * weight
      }
    }
    
    // Normalizar gradiente
    const gradMagnitude = Math.sqrt(gradLat ** 2 + gradLng ** 2)
    if (gradMagnitude > 0) {
      gradLat /= gradMagnitude
      gradLng /= gradMagnitude
    }
    
    // Actualizar centro
    center.lat -= learningRate * gradLat
    center.lng -= learningRate * gradLng
    
    costHistory.push(totalCost)
  }
  
  return {
    optimalCenter: center,
    finalCost: costHistory[costHistory.length - 1],
    costHistory,
    convergence: costHistory[0] - costHistory[costHistory.length - 1]
  }
}

// ============================================================================
// 4. MÉTODO DE NEWTON-RAPHSON MULTIVARIABLE - DENSIDAD ÓPTIMA
// ============================================================================

export function newtonRaphsonDensityOptimization(contacts, maxIterations = 20) {
  /**
   * Encuentra la densidad óptima de contactos por territorio
   * Optimiza: f(x,y) = población*influencia - costo*distancia
   */
  
  // Iniciar con densidad uniforme
  const territories = new Map()
  
  for (const contact of contacts) {
    if (!territories.has(contact.territoryId)) {
      territories.set(contact.territoryId, {
        id: contact.territoryId,
        contacts: [],
        x: 0, // Variable de optimización
        y: 0  // Gradiente
      })
    }
    territories.get(contact.territoryId).contacts.push(contact)
  }
  
  const results = []
  
  for (const [, territory] of territories) {
    let x = 0.5 // Densidad inicial
    let iteration = 0
    
    while (iteration < maxIterations) {
      // f(x) = suma de impacto - costo
      const f = territory.contacts.reduce((sum, contact) => {
        const impact = contact.engagement || 0.5
        return sum + impact * x - Math.abs(contact.coords.lat) * (1 - x) * 0.01
      }, 0)
      
      // f'(x) - derivada numérica
      const delta = 1e-8
      const fPlus = territory.contacts.reduce((sum, contact) => {
        const impact = contact.engagement || 0.5
        return sum + impact * (x + delta) - Math.abs(contact.coords.lat) * (1 - (x + delta)) * 0.01
      }, 0)
      
      const fPrime = (fPlus - f) / delta
      
      // f''(x) - segunda derivada
      const fMinus = territory.contacts.reduce((sum, contact) => {
        const impact = contact.engagement || 0.5
        return sum + impact * (x - delta) - Math.abs(contact.coords.lat) * (1 - (x - delta)) * 0.01
      }, 0)
      
      const fDoublePrime = (fPlus - 2 * f + fMinus) / (delta ** 2)
      
      // Newton-Raphson: x_new = x - f'(x)/f''(x)
      if (Math.abs(fDoublePrime) > 1e-10) {
        const xNew = x - fPrime / fDoublePrime
        
        if (Math.abs(xNew - x) < 1e-6) {
          x = Math.max(0, Math.min(1, xNew))
          break
        }
        
        x = Math.max(0, Math.min(1, xNew))
      }
      
      iteration++
    }
    
    results.push({
      territoryId: territory.id,
      optimalDensity: x,
      recommendedContacts: Math.round(territory.contacts.length * x),
      totalContacts: territory.contacts.length,
      optimizationIterations: iteration
    })
  }
  
  return results
}

// ============================================================================
// 5. MÉTODO DE MONTE CARLO - SIMULACIÓN DE ESCENARIOS
// ============================================================================

export function monteCarloScenarioSimulation(baselineMetrics, variabilityPercent = 0.15, simulations = 1000) {
  /**
   * Simula múltiples escenarios con variabilidad
   * Useful para análisis de riesgo
   */
  
  const results = {
    scenarios: [],
    statistics: {},
    riskAnalysis: {}
  }
  
  for (let sim = 0; sim < simulations; sim++) {
    const scenario = {}
    
    for (const [key, value] of Object.entries(baselineMetrics)) {
      if (typeof value === 'number') {
        // Variación normal alrededor del baseline
        const variation = (Math.random() - 0.5) * 2 * variabilityPercent * value
        scenario[key] = Math.max(0, value + variation)
      }
    }
    
    results.scenarios.push(scenario)
  }
  
  // Calcular estadísticas
  const keys = Object.keys(baselineMetrics)
  
  for (const key of keys) {
    if (typeof baselineMetrics[key] === 'number') {
      const values = results.scenarios.map(s => s[key])
      
      // Media
      const mean = values.reduce((a, b) => a + b) / values.length
      
      // Desviación estándar
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)
      
      // Percentiles
      const sorted = [...values].sort((a, b) => a - b)
      const p5 = sorted[Math.floor(values.length * 0.05)]
      const p25 = sorted[Math.floor(values.length * 0.25)]
      const p50 = sorted[Math.floor(values.length * 0.50)]
      const p75 = sorted[Math.floor(values.length * 0.75)]
      const p95 = sorted[Math.floor(values.length * 0.95)]
      
      results.statistics[key] = {
        mean: mean.toFixed(2),
        stdDev: stdDev.toFixed(2),
        min: Math.min(...values).toFixed(2),
        max: Math.max(...values).toFixed(2),
        p5: p5.toFixed(2),
        p25: p25.toFixed(2),
        median: p50.toFixed(2),
        p75: p75.toFixed(2),
        p95: p95.toFixed(2),
        cv: (stdDev / mean * 100).toFixed(2) + '%' // Coeficiente de variación
      }
      
      results.riskAnalysis[key] = {
        bestCase: p5,
        mostLikely: p50,
        worstCase: p95,
        riskLevel: stdDev / mean > 0.5 ? 'ALTO' : 'BAJO'
      }
    }
  }
  
  return results
}

// ============================================================================
// 6. MÉTODO DE BISECCIÓN - ENCONTRAR PUNTO DE EQUILIBRIO
// ============================================================================

export function bisectionMethodEquilibrium(resources, demand, tolerance = 1e-6) {
  /**
   * Encuentra el punto de equilibrio donde recursos = demanda
   * Usando método de bisección
   */
  
  let left = 0
  let right = Math.max(...resources.map(r => r.capacity || 100))
  let iterations = 0
  const maxIterations = 100
  
  while (iterations < maxIterations && (right - left) > tolerance) {
    const mid = (left + right) / 2
    
    // Evaluar función en mid
    const balance = resources.reduce((sum, r) => 
      sum + (r.efficiency || 0.8) * mid, 0) - demand.reduce((sum, d) => 
      sum + (d.priority || 1) * d.amount, 0)
    
    if (balance > 0) {
      right = mid
    } else {
      left = mid
    }
    
    iterations++
  }
  
  const equilibriumPoint = (left + right) / 2
  
  return {
    equilibriumAllocation: equilibriumPoint,
    convergence: (right - left).toFixed(8),
    iterations,
    totalResourcesAvailable: resources.reduce((s, r) => s + (r.capacity || 100), 0),
    totalDemand: demand.reduce((s, d) => s + d.amount, 0)
  }
}

// ============================================================================
// 7. INTERPOLACIÓN POLINOMIAL - PREDICCIÓN DE TENDENCIAS
// ============================================================================

export function polynomialInterpolation(dataPoints, degree = 3) {
  /**
   * Ajusta un polinomio a los datos para predecir tendencias
   * Usa Método de Lagrange mejorado
   */
  
  if (dataPoints.length < degree + 1) {
    return { error: 'Insuficientes puntos de datos' }
  }
  
  // Construir matriz de Vandermonde
  const n = dataPoints.length
  const X = Array(n).fill(0).map((_, i) => 
    Array(degree + 1).fill(0).map((_, j) => Math.pow(dataPoints[i].x, j))
  )
  
  const y = dataPoints.map(p => p.y)
  
  // Resolver con Gauss-Jordan simplificado
  const coefficients = gaussianElimination(X, y)
  
  // Función polinomial
  const polyFunction = (x) => {
    return coefficients.reduce((sum, coef, i) => 
      sum + coef * Math.pow(x, i), 0)
  }
  
  // Generar predicciones
  const predictions = []
  const step = (dataPoints[n-1].x - dataPoints[0].x) / 10
  
  for (let x = dataPoints[0].x; x <= dataPoints[n-1].x; x += step) {
    predictions.push({
      x: parseFloat(x.toFixed(2)),
      y: parseFloat(polyFunction(x).toFixed(4))
    })
  }
  
  // Calcular R²
  const yMean = y.reduce((a, b) => a + b) / n
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
  const ssRes = dataPoints.reduce((sum, p, i) => 
    sum + Math.pow(p.y - polyFunction(p.x), 2), 0)
  const rSquared = 1 - (ssRes / ssTotal)
  
  return {
    coefficients,
    predictions,
    rSquared: rSquared.toFixed(4),
    degree,
    dataPoints: dataPoints.length
  }
}

// ============================================================================
// 8. MÉTODO DE FOURIER - ANÁLISIS DE CICLOS TERRITORIALES
// ============================================================================

export function fourierAnalysis(timeSeries, numTerms = 5) {
  /**
   * Analiza patrones periódicos en datos temporales
   * Detecta ciclos de actividad territorial
   */
  
  const n = timeSeries.length
  const frequencies = []
  
  // Calcular coeficientes de Fourier
  for (let k = 0; k < numTerms; k++) {
    let cosSum = 0
    let sinSum = 0
    
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * k * i) / n
      cosSum += timeSeries[i] * Math.cos(angle)
      sinSum += timeSeries[i] * Math.sin(angle)
    }
    
    const magnitude = Math.sqrt(cosSum ** 2 + sinSum ** 2) / n
    const phase = Math.atan2(sinSum, cosSum)
    const period = n / (k || 1)
    
    frequencies.push({
      frequency: k,
      magnitude: magnitude.toFixed(4),
      phase: (phase * 180 / Math.PI).toFixed(2) + '°',
      period: period.toFixed(2),
      strength: (magnitude / (timeSeries.reduce((a, b) => a + b) / n) * 100).toFixed(2) + '%'
    })
  }
  
  // Detectar ciclo dominante
  const dominantCycle = frequencies.reduce((prev, curr) => 
    parseFloat(curr.magnitude) > parseFloat(prev.magnitude) ? curr : prev
  )
  
  return {
    frequencies,
    dominantCycle,
    periodicity: parseFloat(dominantCycle.period),
    analysis: `El ciclo dominante tiene período de ${dominantCycle.period} días`
  }
}

// ============================================================================
// HELPER: Eliminación Gaussiana para sistemas lineales
// ============================================================================

function gaussianElimination(A, b) {
  const n = A.length
  const augmented = A.map((row, i) => [...row, b[i]])
  
  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Buscar pivot
    let maxRow = i
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k
      }
    }
    
    // Intercambiar filas
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]
    
    // Hacer ceros debajo
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i]
      for (let j = i; j <= n; j++) {
        augmented[k][j] -= factor * augmented[i][j]
      }
    }
  }
  
  // Back substitution
  const solution = Array(n)
  for (let i = n - 1; i >= 0; i--) {
    solution[i] = augmented[i][n]
    for (let j = i + 1; j < n; j++) {
      solution[i] -= augmented[i][j] * solution[j]
    }
    solution[i] /= augmented[i][i]
  }
  
  return solution
}

export { gaussianElimination }
