/**
 * ÁBACO v1.0 - EJEMPLOS DE CÓDIGO
 * 
 * Ejemplos prácticos de cómo usar todos los algoritmos
 */

// ============================================
// 📐 MÉTODOS NUMÉRICOS
// ============================================

import {
  linearOptimization,
  dynamicCoverage,
  gradientDescentLocationOptimization,
  newtonRaphsonDensityOptimization,
  monteCarloScenarioSimulation,
  bisectionMethodEquilibrium,
  polynomialInterpolation,
  fourierAnalysis
} from './utils/numericalOptimization'

// Ejemplo 1: Optimización Linear
// Asignar operadores a territorios minimizando costos
const ejemplo1_optimizacionLinear = () => {
  const recursos = [
    { id: 1, capacity: 100, costPerUnit: 50 },
    { id: 2, capacity: 150, costPerUnit: 45 },
    { id: 3, capacity: 120, costPerUnit: 55 }
  ]

  const territorios = [
    { id: 1, coords: { lat: -34.60, lng: -58.40 }, priority: 1, population: 5000 },
    { id: 2, coords: { lat: -34.62, lng: -58.42 }, priority: 2, population: 8000 },
    { id: 3, coords: { lat: -34.64, lng: -58.44 }, priority: 3, population: 3000 }
  ]

  const result = linearOptimization(recursos, territorios)
  // Retorna: { totalCost, efficiency, assignments: [...] }
  console.log('✅ Linear Optimization:', result)
}

// Ejemplo 2: Programación Dinámica
// Seleccionar territorios con presupuesto limitado
const ejemplo2_dinamicCoverage = () => {
  const territories = [
    { id: 1, coverage: 1000, cost: 500 },
    { id: 2, coverage: 1500, cost: 700 },
    { id: 3, coverage: 800, cost: 400 },
    { id: 4, coverage: 1200, cost: 600 }
  ]

  const maxBudget = 1500
  const result = dynamicCoverage(territories, maxBudget)
  // Retorna: { selectedTerritories, totalCoverage, budgetUsed }
  console.log('✅ Dynamic Coverage:', result)
}

// Ejemplo 3: Gradient Descent
// Encontrar ubicación óptima para un centro de operaciones
const ejemplo3_gradientDescent = () => {
  const contacts = [
    { id: 1, coords: { lat: -34.60, lng: -58.40 } },
    { id: 2, coords: { lat: -34.61, lng: -58.41 } },
    { id: 3, coords: { lat: -34.62, lng: -58.42 } },
    { id: 4, coords: { lat: -34.63, lng: -58.43 } },
  ]

  const result = gradientDescentLocationOptimization(contacts, iterations = 100)
  // Retorna: { optimalLat, optimalLng, costHistory: [...] }
  console.log('✅ Gradient Descent:', result)
}

// Ejemplo 4: Newton-Raphson
// Optimizar densidad de contactos en una región
const ejemplo4_newtonRaphson = () => {
  const contacts = [
    { density: 10, engagement: 0.8 },
    { density: 12, engagement: 0.85 },
    { density: 8, engagement: 0.75 },
  ]

  const result = newtonRaphsonDensityOptimization(contacts)
  // Retorna: { optimalDensity, convergence: [...] }
  console.log('✅ Newton-Raphson:', result)
}

// Ejemplo 5: Monte Carlo
// Simular 1000 escenarios para análisis de riesgo
const ejemplo5_monteCarlo = () => {
  const baselineMetrics = {
    contacts: 100,
    conversionRate: 0.65,
    coverage: 45
  }

  const variability = 0.15 // 15% variabilidad
  const simulations = 1000

  const result = monteCarloScenarioSimulation(baselineMetrics, variability, simulations)
  // Retorna: { mean, stddev, p5, p25, p50, p75, p95, simulations: [...] }
  console.log('✅ Monte Carlo:', result)
}

// Ejemplo 6: Bisección
// Encontrar punto de equilibrio entre recursos y demanda
const ejemplo6_biseccion = () => {
  const resources = [
    { capacity: 100, efficiency: 0.8 },
    { capacity: 150, efficiency: 0.9 }
  ]

  const demand = [
    { amount: 80, priority: 1 },
    { amount: 120, priority: 2 }
  ]

  const result = bisectionMethodEquilibrium(resources, demand)
  // Retorna: { equilibriumPoint, iterations, tolerance }
  console.log('✅ Bisección:', result)
}

// Ejemplo 7: Interpolación Polinomial
// Predecir tendencias de contactos
const ejemplo7_interpolacion = () => {
  const dataPoints = [
    { x: 1, y: 100 },   // Mes 1: 100 contactos
    { x: 2, y: 120 },   // Mes 2: 120 contactos
    { x: 3, y: 115 },   // Mes 3: 115 contactos
    { x: 4, y: 140 },   // Mes 4: 140 contactos
  ]

  const degree = 2 // Polinomio cuadrático

  const result = polynomialInterpolation(dataPoints, degree)
  // Retorna: { predictions: [...], rSquared, polynomial }
  console.log('✅ Interpolación Polinomial:', result)
}

// Ejemplo 8: Análisis de Fourier
// Detectar ciclos en datos de campaña
const ejemplo8_fourier = () => {
  const timeSeries = [
    100, 120, 115, 140, 135, 150, 145, 160, 155, 170
  ]

  const numTerms = 3 // Top 3 frecuencias

  const result = fourierAnalysis(timeSeries, numTerms)
  // Retorna: { frequencies: [...], magnitudes: [...], periods: [...] }
  console.log('✅ Análisis de Fourier:', result)
}

// ============================================
// 🤖 MACHINE LEARNING
// ============================================

import {
  logisticRegression,
  kNearestNeighbors,
  hierarchicalClustering,
  principalComponentAnalysis,
  sentimentAnalysis,
  anomalyDetection,
  evaluateClassifier,
  temporalClustering
} from './utils/machineLearning'

// Ejemplo 1: Regresión Logística
// Predecir probabilidad de conversión de contacto
const ejemplo_lr = () => {
  const X = [
    [1, 0.8],      // [interaction, engagement]
    [2, 0.9],
    [1, 0.7],
    [3, 0.85],
    [2, 0.75]
  ]

  const y = [0, 1, 0, 1, 1]  // 0: no convierte, 1: convierte

  const result = logisticRegression(X, y, learningRate = 0.01, iterations = 1000)
  // Retorna: { weights, bias, lossHistory, predictions, accuracy }
  console.log('✅ Regresión Logística:', result)
}

// Ejemplo 2: K-Nearest Neighbors
// Clasificar contacto como Similar/Diferente
const ejemplo_knn = () => {
  const trainingData = [
    { features: [1, 0.8], label: 'VIP' },
    { features: [2, 0.9], label: 'VIP' },
    { features: [1, 0.3], label: 'Regular' },
    { features: [3, 0.7], label: 'VIP' },
    { features: [1, 0.2], label: 'Regular' }
  ]

  const testPoint = [1.5, 0.85]
  const k = 3

  const result = kNearestNeighbors(trainingData, testPoint, k)
  // Retorna: { prediction, confidence, neighbors: [...] }
  console.log('✅ K-Nearest Neighbors:', result)
}

// Ejemplo 3: Clustering Jerárquico
// Agrupar territorios por similitud
const ejemplo_hc = () => {
  const data = [
    [100, 5000],   // [operators, population]
    [120, 5200],
    [50, 2000],
    [55, 2100],
    [150, 8000]
  ]

  const result = hierarchicalClustering(data, linkage = 'average')
  // Retorna: { clusters, dendrogram, distances: [...] }
  console.log('✅ Clustering Jerárquico:', result)
}

// Ejemplo 4: PCA
// Reducir dimensionalidad de datos de contacto
const ejemplo_pca = () => {
  const data = [
    [100, 0.8, 45, 1200],  // [engagement, score, time, value]
    [120, 0.9, 50, 1500],
    [85, 0.7, 40, 900],
  ]

  const numComponents = 2

  const result = principalComponentAnalysis(data, numComponents)
  // Retorna: { components, variances, projections }
  console.log('✅ PCA:', result)
}

// Ejemplo 5: Análisis de Sentimiento
// Analizar feedback de contactos
const ejemplo_sentiment = () => {
  const feedbackTexts = [
    "Excelente servicio, muy satisfecho",
    "Terrible experiencia, no recomiendo",
    "Bien pero podría mejorar"
  ]

  const result = sentimentAnalysis(feedbackTexts)
  // Retorna: { scores, categories, confidence }
  console.log('✅ Análisis de Sentimiento:', result)
}

// Ejemplo 6: Detección de Anomalías
// Identificar comportamientos anómalos
const ejemplo_anomaly = () => {
  const data = [100, 105, 102, 500, 103, 101, 98, 102] // 500 es outlier

  const threshold = 2.5 // Z-score threshold

  const result = anomalyDetection(data, threshold)
  // Retorna: { anomalies, scores, severity }
  console.log('✅ Detección de Anomalías:', result)
}

// Ejemplo 7: Evaluación de Clasificador
// Evaluar precisión de modelo
const ejemplo_evaluation = () => {
  const predictions = [1, 0, 1, 1, 0, 1, 0, 0]
  const actual = [1, 0, 1, 0, 0, 1, 0, 1]

  const result = evaluateClassifier(predictions, actual)
  // Retorna: { confusionMatrix, accuracy, precision, recall, f1, roc }
  console.log('✅ Evaluación:', result)
}

// Ejemplo 8: Clustering Temporal
// Detectar patrones en series de tiempo
const ejemplo_temporal = () => {
  const timeSeriesData = [
    10, 12, 11, 15, 14, 18, 17, 20, 19, 22, 21, 25
  ]

  const windowSize = 3

  const result = temporalClustering(timeSeriesData, windowSize)
  // Retorna: { patterns, trends, anomalies, forecast }
  console.log('✅ Clustering Temporal:', result)
}

// ============================================
// 🎯 INTEGRACIÓN EN COMPONENTES REACT
// ============================================

import { useState } from 'react'

export const MiComponenteIntegrado = () => {
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)

  const ejecutarAlgoritmo = async (tipoAlgoritmo) => {
    setCargando(true)

    try {
      let resultado

      if (tipoAlgoritmo === 'lineal') {
        resultado = linearOptimization([], [])
      } else if (tipoAlgoritmo === 'montecarlo') {
        resultado = monteCarloScenarioSimulation({}, 0.15, 1000)
      } else if (tipoAlgoritmo === 'logisticregression') {
        resultado = logisticRegression([], [], 0.01, 1000)
      }

      setResultado(resultado)
    } catch (error) {
      console.error('Error:', error)
    }

    setCargando(false)
  }

  return (
    <div>
      <button onClick={() => ejecutarAlgoritmo('lineal')}>
        Ejecutar Lineal
      </button>
      
      {cargando && <p>Cargando...</p>}
      
      {resultado && (
        <pre>{JSON.stringify(resultado, null, 2)}</pre>
      )}
    </div>
  )
}

// ============================================
// 📊 DATOS DE EJEMPLO (Mock Data)
// ============================================

export const mockData = {
  contacts: [
    {
      id: 1,
      name: "Juan Pérez",
      documentNumber: "12345678",
      phone: "555-0001",
      email: "juan@example.com",
      coords: { lat: -34.60, lng: -58.40 },
      status: "active",
      priority: "high",
      engagement: 0.85,
      territory: 1
    },
    {
      id: 2,
      name: "María García",
      documentNumber: "87654321",
      phone: "555-0002",
      email: "maria@example.com",
      coords: { lat: -34.61, lng: -58.41 },
      status: "pending",
      priority: "medium",
      engagement: 0.65,
      territory: 1
    }
  ],

  territories: [
    {
      id: 1,
      name: "Región Norte",
      type: "region",
      priority: 1,
      population: 50000,
      coverage: 0.75,
      coords: { lat: -34.60, lng: -58.40 }
    },
    {
      id: 2,
      name: "Región Sur",
      type: "region",
      priority: 2,
      population: 30000,
      coverage: 0.60,
      coords: { lat: -34.80, lng: -58.50 }
    }
  ],

  timeSeries: [100, 120, 115, 140, 135, 150, 145, 160, 155, 170],

  metrics: {
    totalContacts: 1250,
    activeOperators: 45,
    coverage: 0.78,
    conversionRate: 0.68,
    avgEngagement: 0.72
  }
}

// ============================================
// 🔥 USO EN REDUX STORE
// ============================================

// En tu slice de Redux:
export const algorithmSlice = createSlice({
  name: 'algorithms',
  initialState: {
    results: {},
    loading: false,
    error: null
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setResult: (state, action) => {
      state.results[action.payload.name] = action.payload.data
    },
    setError: (state, action) => {
      state.error = action.payload
    }
  }
})

// Uso en componente:
const miComponente = () => {
  const dispatch = useDispatch()

  const handleExecute = () => {
    dispatch(setLoading(true))
    
    try {
      const result = linearOptimization([], [])
      dispatch(setResult({ name: 'linear', data: result }))
    } catch (error) {
      dispatch(setError(error.message))
    }
    
    dispatch(setLoading(false))
  }

  return <button onClick={handleExecute}>Ejecutar</button>
}

// ============================================
// ✅ FIN DE EJEMPLOS
// ============================================

/*
 * Para más información, consulta:
 * - GUIA_RAPIDA.md
 * - ALGORITMOS_COMPLETOS.md
 * - STATUS_COMPLETO.md
 * 
 * Documentación de APIs:
 * - src/utils/numericalOptimization.js
 * - src/utils/machineLearning.js
 */
