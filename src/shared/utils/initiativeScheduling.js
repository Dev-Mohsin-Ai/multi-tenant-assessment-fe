export const UNSCHEDULED_PLACEMENTS_KEY = 'unscheduledPlacements'
export const NOT_SCHEDULED_LABEL = 'Not Scheduled'
const DEFAULT_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

export const buildInitiativeYears = (currentYear = new Date().getFullYear(), options = {}) => {
  const pastYears = Math.max(Number(options.pastYears ?? 1) || 0, 0)
  const futureYears = Math.max(Number(options.futureYears ?? 5) || 0, 0)
  const startYear = Number(currentYear) - pastYears
  const totalYears = pastYears + futureYears + 1

  return Array.from({ length: totalYears }, (_, index) => startYear + index)
}

export const buildScheduleOptions = (years = [], quarters = DEFAULT_QUARTERS) =>
  (Array.isArray(years) ? years : []).flatMap((year) =>
    (Array.isArray(quarters) ? quarters : []).map((quarter) => `${quarter}, ${year}`)
  )

export const isQuarterSlotKey = (value) => /^\d{4}-Q[1-4]$/.test(String(value || ''))

export const parseQuarterSlotKey = (value) => {
  const match = /^(\d{4})-(Q[1-4])$/.exec(String(value || ''))
  if (!match) {
    return null
  }
  return { year: Number(match[1]), quarter: match[2] }
}

export const toQuarterSlotKey = (year, quarter) => {
  const numericYear = Number(year)
  const normalizedQuarter = String(quarter || '').trim().toUpperCase()

  if (!Number.isFinite(numericYear) || !/^Q[1-4]$/.test(normalizedQuarter)) {
    return null
  }

  return `${numericYear}-${normalizedQuarter}`
}

export const buildPlacementStorageKey = (organizationId) => {
  const numericOrganizationId = Number(organizationId)
  if (!numericOrganizationId) {
    return UNSCHEDULED_PLACEMENTS_KEY
  }
  return `${UNSCHEDULED_PLACEMENTS_KEY}:${numericOrganizationId}`
}

export const readPlacementOverrides = (storageKey) => {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    }

    if (storageKey !== UNSCHEDULED_PLACEMENTS_KEY) {
      const legacyRaw = localStorage.getItem(UNSCHEDULED_PLACEMENTS_KEY)
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      }
    }
  } catch {
    return {}
  }

  return {}
}

export const writePlacementOverrides = (storageKey, placements) => {
  try {
    const serialized = JSON.stringify(placements || {})
    localStorage.setItem(storageKey, serialized)
    if (storageKey !== UNSCHEDULED_PLACEMENTS_KEY) {
      localStorage.setItem(UNSCHEDULED_PLACEMENTS_KEY, serialized)
    }
  } catch {
    // ignore storage failures
  }
}

export const applyPlacementOverride = (placements, initiativeId, options = {}) => {
  const key = String(initiativeId || '').trim()
  if (!key) {
    return { ...(placements || {}) }
  }

  const nextPlacements = { ...(placements || {}) }
  const slotKey = toQuarterSlotKey(options.year, options.quarter)

  if (options.isScheduled === false) {
    nextPlacements[key] = 'unscheduled'
    return nextPlacements
  }

  if (options.isScheduled === true && slotKey) {
    nextPlacements[key] = slotKey
    return nextPlacements
  }

  if (options.clearWhenScheduledWithoutSlot) {
    delete nextPlacements[key]
    return nextPlacements
  }

  if (options.fallbackToUnscheduled) {
    nextPlacements[key] = 'unscheduled'
    return nextPlacements
  }

  return nextPlacements
}
