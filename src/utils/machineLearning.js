/**
 * ÁBACO - Predicción y Machine Learning Simple
 * Modelos de predicción sin librerías externas
 */

// ============================================================================
// 1. REGRESIÓN LOGÍSTICA - PREDICCIÓN DE CONVERSIÓN
// ============================================================================

export function logisticRegression(data, labels, learningRate = 0.01, iterations = 1000) {
  /**
   * Predice probabilidad de conversión usando regresión logística
   * Para cada contacto: 0 = no convierte, 1 = convierte
   */
  
  const n = data.length
  const m = data[0].length
  
  // Inicializar pesos
  let weights = Array(m).fill(0)
  let bias = 0
  const costHistory = []
  
  for (let iter = 0; iter < iterations; iter++) {
    let predictions = []
    let error = 0
    let dw = Array(m).fill(0)
    let db = 0
    
    // Forward pass
    for (let i = 0; i < n; i++) {
      const z = bias + data[i].reduce((sum, x, j) => sum + weights[j] * x, 0)
      const y_pred = 1 / (1 + Math.exp(-z)) // Sigmoid
      predictions.push(y_pred)
      
      // Binary cross-entropy
      const y = labels[i]
      error += -(y * Math.log(y_pred + 1e-10) + (1 - y) * Math.log(1 - y_pred + 1e-10))
      
      // Gradientes
      const diff = y_pred - y
      db += diff
      for (let j = 0; j < m; j++) {
        dw[j] += diff * data[i][j]
      }
    }
    
    // Actualizar pesos
    bias -= (learningRate / n) * db
    for (let j = 0; j < m; j++) {
      weights[j] -= (learningRate / n) * dw[j]
    }
    
    costHistory.push(error / n)
  }
  
  return {
    weights,
    bias,
    costHistory,
    predict: (features) => {
      const z = bias + features.reduce((sum, x, i) => sum + weights[i] * x, 0)
      return 1 / (1 + Math.exp(-z))
    }
  }
}

// ============================================================================
// 2. K-NEAREST NEIGHBORS - CLASIFICACIÓN DE CONTACTOS
// ============================================================================

export function kNearestNeighbors(trainingData, testPoint, k = 5) {
  /**
   * Clasifica un punto basado en sus k vecinos más cercanos
   * Útil para segmentación de contactos
   */
  
  // Calcular distancias euclidianas
  const distances = trainingData.map((point, index) => {
    const dist = Math.sqrt(
      point.features.reduce((sum, x, i) => 
        sum + Math.pow(x - testPoint.features[i], 2), 0)
    )
    return { index, distance: dist, label: point.label }
  })
  
  // Ordenar y seleccionar k vecinos
  const neighbors = distances
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k)
  
  // Votación mayoritaria
  const votes = {}
  neighbors.forEach(n => {
    votes[n.label] = (votes[n.label] || 0) + 1
  })
  
  const prediction = Object.keys(votes).reduce((a, b) => 
    votes[a] > votes[b] ? a : b
  )
  
  return {
    prediction,
    confidence: votes[prediction] / k,
    neighbors: neighbors.map(n => ({
      ...n,
      distance: n.distance.toFixed(4)
    }))
  }
}

// ============================================================================
// 3. CLUSTERING JERÁRQUICO - AGRUPACIÓN DE TERRITORIOS
// ============================================================================

export function hierarchicalClustering(data, linkage = 'average') {
  /**
   * Agrupa elementos jerárquicamente
   * Linkage: 'single', 'complete', 'average'
   */
  
  const n = data.length
  
  // Inicializar clusters
  let clusters = data.map((d, i) => ({ id: i, points: [d], center: d }))
  const mergeHistory = []
  
  // Matriz de distancias
  const getDistance = (c1, c2) => {
    let distances = []
    
    for (const p1 of c1.points) {
      for (const p2 of c2.points) {
        const dist = Math.sqrt(
          p1.features.reduce((sum, x, i) => 
            sum + Math.pow(x - p2.features[i], 2), 0)
        )
        distances.push(dist)
      }
    }
    
    if (linkage === 'single') return Math.min(...distances)
    if (linkage === 'complete') return Math.max(...distances)
    if (linkage === 'average') return distances.reduce((a, b) => a + b) / distances.length
  }
  
  // Merge iterativo
  while (clusters.length > 1) {
    let minDist = Infinity
    let mergeI = 0
    let mergeJ = 1
    
    // Encontrar par más cercano
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const dist = getDistance(clusters[i], clusters[j])
        if (dist < minDist) {
          minDist = dist
          mergeI = i
          mergeJ = j
        }
      }
    }
    
    // Mergear clusters
    const newCluster = {
      id: clusters.length,
      points: [...clusters[mergeI].points, ...clusters[mergeJ].points],
      center: null
    }
    
    // Calcular nuevo centro
    const avgFeatures = Array(clusters[mergeI].points[0].features.length).fill(0)
    newCluster.points.forEach(p => {
      p.features.forEach((f, i) => {
        avgFeatures[i] += f
      })
    })
    newCluster.center = avgFeatures.map(f => f / newCluster.points.length)
    
    mergeHistory.push({
      iteration: n - clusters.length,
      mergedClusters: [mergeI, mergeJ],
      distance: minDist,
      newClusterSize: newCluster.points.length
    })
    
    clusters.splice(Math.max(mergeI, mergeJ), 1)
    clusters.splice(Math.min(mergeI, mergeJ), 1)
    clusters.push(newCluster)
  }
  
  return {
    finalCluster: clusters[0],
    mergeHistory,
    dendrogram: generateDendrogram(mergeHistory)
  }
}

function generateDendrogram(mergeHistory) {
  return mergeHistory.map((merge, i) => ({
    step: i + 1,
    clusterSize: merge.newClusterSize,
    distance: merge.distance.toFixed(4),
    visualization: '█'.repeat(Math.min(50, merge.distance * 10))
  }))
}

// ============================================================================
// 4. ANÁLISIS DE COMPONENTES PRINCIPALES (PCA) - REDUCCIÓN DIMENSIONAL
// ============================================================================

export function principalComponentAnalysis(data, numComponents = 2) {
  /**
   * Reduce dimensionalidad manteniendo máxima varianza
   * Proyecta datos en espacios de menor dimensión
   */
  
  const n = data.length
  const d = data[0].length
  
  // 1. Estandarizar datos
  const means = Array(d).fill(0)
  data.forEach(point => {
    point.forEach((x, i) => {
      means[i] += x / n
    })
  })
  
  const standardized = data.map(point =>
    point.map((x, i) => x - means[i])
  )
  
  // 2. Calcular matriz de covarianza
  const cov = Array(d).fill(0).map(() => Array(d).fill(0))
  
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      for (let k = 0; k < n; k++) {
        cov[i][j] += standardized[k][i] * standardized[k][j] / n
      }
    }
  }
  
  // 3. Valores y vectores propios (Método de potencia simplificado)
  const eigenvalues = []
  const eigenvectors = []
  
  for (let comp = 0; comp < Math.min(numComponents, d); comp++) {
    let v = Array(d).fill(1).map(() => Math.random())
    
    for (let iter = 0; iter < 100; iter++) {
      // Multiplicar por matriz de covarianza
      const Av = Array(d).fill(0)
      for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) {
          Av[i] += cov[i][j] * v[j]
        }
      }
      
      // Normalizar
      const norm = Math.sqrt(Av.reduce((s, x) => s + x * x, 0))
      v = Av.map(x => x / norm)
    }
    
    // Calcular eigenvalue
    const Av = Array(d).fill(0)
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) {
        Av[i] += cov[i][j] * v[j]
      }
    }
    
    const lambda = v.reduce((s, x, i) => s + x * Av[i], 0)
    
    eigenvalues.push(lambda)
    eigenvectors.push(v)
  }
  
  // 4. Proyectar datos
  const projections = standardized.map(point => {
    return eigenvectors.map(ev =>
      point.reduce((s, x, i) => s + x * ev[i], 0)
    ).slice(0, numComponents)
  })
  
  // Varianza explicada
  const totalVariance = eigenvalues.reduce((a, b) => a + b, 0)
  const explainedVariance = eigenvalues.map(e => (e / totalVariance * 100).toFixed(2))
  
  return {
    projections,
    eigenvalues: eigenvalues.map(e => e.toFixed(4)),
    explainedVariance,
    totalExplained: (eigenvalues.reduce((a, b) => a + b, 0) / totalVariance * 100).toFixed(2) + '%',
    components: numComponents
  }
}

// ============================================================================
// 5. ANÁLISIS DE SENTIMIENTO - SCORING DE CONTACTOS
// ============================================================================

export function sentimentAnalysis(textData) {
  /**
   * Analiza sentimiento en interacciones
   * Retorna score de -1 (negativo) a +1 (positivo)
   */
  
  const positiveWords = [
    'excelente', 'bueno', 'feliz', 'satisfecho', 'interesado',
    'entusiasta', 'positivo', 'brillante', 'maravilloso', 'fantástico'
  ]
  
  const negativeWords = [
    'malo', 'horrible', 'triste', 'insatisfecho', 'enojado',
    'decepcionado', 'negativo', 'terrible', 'desastre', 'problemas'
  ]
  
  const results = []
  
  for (const text of textData) {
    const lower = text.toLowerCase()
    
    let positiveCount = 0
    let negativeCount = 0
    
    for (const word of positiveWords) {
      if (lower.includes(word)) positiveCount++
    }
    
    for (const word of negativeWords) {
      if (lower.includes(word)) negativeCount++
    }
    
    // Normalizar score
    const totalWords = positiveCount + negativeCount || 1
    const sentiment = (positiveCount - negativeCount) / totalWords
    
    results.push({
      text: text.substring(0, 50) + '...',
      sentiment: sentiment.toFixed(3),
      category: sentiment > 0.3 ? 'positive' : sentiment < -0.3 ? 'negative' : 'neutral',
      confidence: Math.abs(sentiment).toFixed(2)
    })
  }
  
  return results
}

// ============================================================================
// 6. DETECCIÓN DE ANOMALÍAS - IDENTIFICAR CONTACTOS ATÍPICOS
// ============================================================================

export function anomalyDetection(data, threshold = 2.5) {
  /**
   * Detecta puntos anómalos usando Z-score
   * Valores > threshold se consideran anomalías
   */
  
  const n = data.length
  
  // Calcular media y desviación estándar
  const mean = data.reduce((a, b) => a + b, 0) / n
  const variance = data.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance)
  
  // Calcular Z-scores
  const zscores = data.map(x => {
    const z = (x - mean) / stdDev
    return {
      value: x,
      zscore: z,
      isAnomaly: Math.abs(z) > threshold,
      severity: Math.abs(z)
    }
  })
  
  const anomalies = zscores.filter(z => z.isAnomaly)
  const anomalyPercentage = (anomalies.length / n * 100).toFixed(2)
  
  return {
    mean: mean.toFixed(4),
    stdDev: stdDev.toFixed(4),
    threshold,
    totalAnomalies: anomalies.length,
    anomalyPercentage: anomalyPercentage + '%',
    zscores: zscores.map(z => ({
      value: z.value.toFixed(2),
      zscore: z.zscore.toFixed(3),
      isAnomaly: z.isAnomaly,
      severity: z.severity.toFixed(3)
    }))
  }
}

// ============================================================================
// 7. MATRIZ DE CONFUSIÓN Y MÉTRICAS - EVALUACIÓN DE MODELOS
// ============================================================================

export function evaluateClassifier(predictions, actual) {
  /**
   * Calcula métricas de clasificación
   * TP, FP, TN, FN, Precision, Recall, F1
   */
  
  let tp = 0, fp = 0, tn = 0, fn = 0
  
  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i]
    const act = actual[i]
    
    if (pred === 1 && act === 1) tp++
    else if (pred === 1 && act === 0) fp++
    else if (pred === 0 && act === 0) tn++
    else if (pred === 0 && act === 1) fn++
  }
  
  const accuracy = (tp + tn) / (tp + fp + tn + fn)
  const precision = tp / (tp + fp || 1)
  const recall = tp / (tp + fn || 1)
  const f1 = 2 * (precision * recall) / (precision + recall || 1)
  const specificity = tn / (tn + fp || 1)
  
  return {
    confusionMatrix: { tp, fp, tn, fn },
    accuracy: (accuracy * 100).toFixed(2) + '%',
    precision: (precision * 100).toFixed(2) + '%',
    recall: (recall * 100).toFixed(2) + '%',
    f1Score: (f1 * 100).toFixed(2) + '%',
    specificity: (specificity * 100).toFixed(2) + '%',
    roc: calculateROC(predictions, actual)
  }
}

function calculateROC(predictions, actual) {
  const sorted = predictions.map((p, i) => ({ pred: p, actual: actual[i] }))
    .sort((a, b) => b.pred - a.pred)
  
  const tpr = []
  const fpr = []
  
  for (let threshold = 0; threshold <= 1; threshold += 0.1) {
    let tp = 0, fp = 0, tn = 0, fn = 0
    
    for (const item of sorted) {
      const pred = item.pred > threshold ? 1 : 0
      const act = item.actual
      
      if (pred === 1 && act === 1) tp++
      else if (pred === 1 && act === 0) fp++
      else if (pred === 0 && act === 0) tn++
      else if (pred === 0 && act === 1) fn++
    }
    
    tpr.push((tp / (tp + fn || 1)).toFixed(3))
    fpr.push((fp / (fp + tn || 1)).toFixed(3))
  }
  
  return { tpr, fpr }
}

// ============================================================================
// 8. CLUSTERING TEMPORAL - DETECCIÓN DE PATRONES EN TIEMPO
// ============================================================================

export function temporalClustering(timeSeriesData, windowSize = 5) {
  /**
   * Detecta patrones similares en series de tiempo
   * Agrupa períodos con comportamiento similar
   */
  
  const patterns = []
  
  // Crear ventanas deslizantes
  for (let i = 0; i <= timeSeriesData.length - windowSize; i++) {
    const window = timeSeriesData.slice(i, i + windowSize)
    
    // Normalizar ventana
    const mean = window.reduce((a, b) => a + b) / windowSize
    const std = Math.sqrt(
      window.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / windowSize
    )
    
    const normalized = window.map(x => (x - mean) / (std || 1))
    
    patterns.push({
      startIndex: i,
      pattern: normalized,
      mean: mean.toFixed(2),
      volatility: std.toFixed(2),
      trend: normalized[normalized.length - 1] - normalized[0]
    })
  }
  
  return {
    totalPatterns: patterns.length,
    patterns: patterns.map((p, i) => ({
      id: i,
      mean: p.mean,
      volatility: p.volatility,
      trend: p.trend > 0 ? 'uptrend' : p.trend < 0 ? 'downtrend' : 'stable'
    }))
  }
}
