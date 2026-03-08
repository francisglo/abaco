export function roundTo(value, decimals = 2) {
  if (!Number.isFinite(Number(value))) return 0;
  const factor = 10 ** decimals;
  return Math.round(Number(value) * factor) / factor;
}

export function computeDescriptiveStats(values = []) {
  const clean = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!clean.length) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      variance: 0,
      stddev: 0,
      cv_percent: 0
    };
  }

  const sorted = [...clean].sort((a, b) => a - b);
  const count = sorted.length;
  const mean = sorted.reduce((acc, cur) => acc + cur, 0) / count;
  const middle = Math.floor(count / 2);
  const median = count % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];

  const min = sorted[0];
  const max = sorted[count - 1];
  const variance = sorted.reduce((acc, cur) => acc + ((cur - mean) ** 2), 0) / count;
  const stddev = Math.sqrt(variance);
  const cvPercent = mean !== 0 ? (stddev / Math.abs(mean)) * 100 : 0;

  return {
    count,
    mean: roundTo(mean, 4),
    median: roundTo(median, 4),
    min: roundTo(min, 4),
    max: roundTo(max, 4),
    variance: roundTo(variance, 4),
    stddev: roundTo(stddev, 4),
    cv_percent: roundTo(cvPercent, 2)
  };
}

export function computeDataQualityScore({
  totalRecords = 0,
  missingCoordinates = 0,
  invalidCoordinates = 0,
  duplicatedCoordinates = 0
}) {
  const total = Number(totalRecords) || 0;
  if (total <= 0) {
    return {
      completeness_percent: 100,
      validity_percent: 100,
      uniqueness_percent: 100,
      global_quality_percent: 100
    };
  }

  const missingRatio = Math.min(Math.max((Number(missingCoordinates) || 0) / total, 0), 1);
  const invalidRatio = Math.min(Math.max((Number(invalidCoordinates) || 0) / total, 0), 1);
  const duplicatedRatio = Math.min(Math.max((Number(duplicatedCoordinates) || 0) / total, 0), 1);

  const completeness = (1 - missingRatio) * 100;
  const validity = (1 - invalidRatio) * 100;
  const uniqueness = (1 - duplicatedRatio) * 100;

  const weightedGlobal = (completeness * 0.45) + (validity * 0.35) + (uniqueness * 0.20);

  return {
    completeness_percent: roundTo(completeness, 2),
    validity_percent: roundTo(validity, 2),
    uniqueness_percent: roundTo(uniqueness, 2),
    global_quality_percent: roundTo(weightedGlobal, 2)
  };
}
