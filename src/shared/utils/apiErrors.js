export const formatApiError = (error, fallback) => {
  const status = error?.response?.status
  const data = error?.response?.data
  const detail =
    typeof data === 'string'
      ? data
      : typeof data?.detail === 'string'
        ? data.detail
        : Array.isArray(data?.detail)
          ? data.detail
              .map((item) => item?.msg || item?.message || '')
              .filter(Boolean)
              .join(', ')
          : ''

  const statusLabel = status ? ` (HTTP ${status})` : ''
  const detailLabel = detail ? `: ${detail}` : ''

  return `${fallback}${statusLabel}${detailLabel}`
}

export const isGoalNotFoundError = (error) => {
  const status = error?.response?.status
  const data = error?.response?.data
  const detail =
    typeof data === 'string'
      ? data
      : typeof data?.detail === 'string'
        ? data.detail
        : ''

  return Number(status) === 404 && /goal not found/i.test(detail)
}
