import { api, BASE_URL } from './api'

const getFilenameFromDisposition = (disposition = '') => {
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1])
  }

  const basicMatch = disposition.match(/filename="?([^";]+)"?/i)
  return basicMatch?.[1] || null
}

const downloadBlobFile = (blob, filename) => {
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename || 'report.pdf'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

const resolveReportUrl = (value) => {
  const raw = String(value || '').trim()
  if (!raw) {
    return ''
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw
  }

  const baseUrl = String(BASE_URL || '').replace(/\/$/, '')
  const normalizedPath = raw.startsWith('/') ? raw : `/${raw}`

  if (baseUrl === '/api') {
    return `${window.location.origin}${baseUrl}${normalizedPath}`
  }

  return `${baseUrl}${normalizedPath}`
}

const triggerUrlDownload = (url, filename) => {
  const link = document.createElement('a')
  link.href = url
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  if (filename) {
    link.download = filename
  }
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const extractReportUrl = (rawValue) => {
  if (typeof rawValue !== 'string') {
    return null
  }

  const trimmed = rawValue.trim()
  if (!trimmed) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (typeof parsed === 'string') {
      return parsed
    }
    if (typeof parsed?.url === 'string') {
      return parsed.url
    }
    if (typeof parsed?.download_url === 'string') {
      return parsed.download_url
    }
  } catch {
    // keep raw fallback below
  }

  return trimmed
}

const handleReportResponse = async (response, fallbackFilename) => {
  const contentType = String(response?.headers?.['content-type'] || '').toLowerCase()
  const disposition = String(response?.headers?.['content-disposition'] || '')
  const filename = getFilenameFromDisposition(disposition) || fallbackFilename
  const blob = response?.data

  if (!(blob instanceof Blob)) {
    throw new Error('Invalid report response')
  }

  if (
    contentType.includes('application/pdf') ||
    contentType.includes('application/octet-stream')
  ) {
    downloadBlobFile(blob, filename)
    return
  }

  const payloadText = await blob.text()
  const rawUrl = extractReportUrl(payloadText)
  const resolvedUrl = resolveReportUrl(rawUrl)
  if (resolvedUrl) {
    triggerUrlDownload(resolvedUrl, filename)
    return
  }

  downloadBlobFile(blob, filename)
}

const requestPdfReport = async (path, params, fallbackFilename) => {
  const response = await api.get(path, {
    params,
    responseType: 'blob',
  })
  await handleReportResponse(response, fallbackFilename)
}

export const downloadInitiativesRoadmapPdf = async ({
  organizationId,
  fromYear,
  fromQuarter,
  toYear,
  toQuarter,
  includeUnscheduled = true,
}) => {
  await requestPdfReport(
    '/reports/initiatives-roadmap-pdf',
    {
      organization_id: Number(organizationId),
      from_year: Number(fromYear),
      from_quarter: fromQuarter,
      to_year: Number(toYear),
      to_quarter: toQuarter,
      include_unscheduled: Boolean(includeUnscheduled),
    },
    `initiatives-roadmap-${fromQuarter}-${fromYear}-to-${toQuarter}-${toYear}.pdf`
  )
}

export const downloadAssessmentPdf = async (assessmentId) => {
  await requestPdfReport(
    `/reports/assessment-pdf/${assessmentId}`,
    undefined,
    `assessment-${assessmentId}.pdf`
  )
}

export const downloadInitiativePdf = async (initiativeId) => {
  await requestPdfReport(
    `/reports/initiative-pdf/${initiativeId}`,
    undefined,
    `initiative-${initiativeId}.pdf`
  )
}
