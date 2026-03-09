const toNumericScore = (value) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const normalized = value.trim().replace('%', '')
    if (!normalized) {
      return null
    }
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export const normalizeScoreToPercent = (value) => {
  const numeric = toNumericScore(value)
  if (numeric === null) {
    return null
  }

  const absolute = Math.abs(numeric)

  if (absolute <= 1) {
    return numeric * 100
  }

  if (absolute <= 10) {
    return numeric * 10
  }

  return numeric
}

export const formatScorePercent = (value, { decimals = 2, fallback = '-' } = {}) => {
  const normalized = normalizeScoreToPercent(value)
  if (normalized === null) {
    return fallback
  }
  return `${Number(normalized).toFixed(decimals)}%`
}

