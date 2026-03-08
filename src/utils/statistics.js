export function mean(values = []) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length
}

export function median(values = []) {
  if (!values.length) return 0
  const sorted = [...values].map(Number).sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

export function variance(values = []) {
  if (!values.length) return 0
  const avg = mean(values)
  return mean(values.map(value => (Number(value || 0) - avg) ** 2))
}

export function standardDeviation(values = []) {
  return Math.sqrt(variance(values))
}

export function trend(values = []) {
  if (values.length < 2) return 0
  const first = Number(values[0] || 0)
  const last = Number(values[values.length - 1] || 0)
  if (first === 0) return 0
  return ((last - first) / first) * 100
}

export function movingAverage(values = [], windowSize = 3) {
  if (!values.length || windowSize <= 0) return []
  const result = []

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const subset = values.slice(start, i + 1)
    result.push(mean(subset))
  }

  return result
}
