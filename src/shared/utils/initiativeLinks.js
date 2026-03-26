export const INITIATIVE_LINKS_STORAGE_KEY = 'initiativeLinks'

export const getLinkedAssessmentResponseKey = (item) =>
  String(item?.responseId ?? item?.subcategoryId ?? item?.id ?? '')

export const syncStoredAssessmentLinksForInitiative = (
  initiativeId,
  nextLinkedItems = []
) => {
  if (!initiativeId) {
    return
  }

  try {
    const raw = localStorage.getItem(INITIATIVE_LINKS_STORAGE_KEY)
    const links = raw ? JSON.parse(raw) : {}
    const nextKeysByAssessment = new Map()

    ;(Array.isArray(nextLinkedItems) ? nextLinkedItems : []).forEach((item) => {
      const assessmentId = item?.assessmentId
      const responseKey = getLinkedAssessmentResponseKey(item)
      if (!assessmentId || !responseKey) {
        return
      }
      const assessmentKey = String(assessmentId)
      const knownKeys = nextKeysByAssessment.get(assessmentKey) || new Set()
      knownKeys.add(responseKey)
      nextKeysByAssessment.set(assessmentKey, knownKeys)
    })

    Object.entries(links).forEach(([assessmentId, assessmentLinks]) => {
      Object.keys(assessmentLinks || {}).forEach((responseKey) => {
        if (
          String(assessmentLinks[responseKey]) === String(initiativeId) &&
          !(nextKeysByAssessment.get(String(assessmentId)) || new Set()).has(String(responseKey))
        ) {
          delete assessmentLinks[responseKey]
        }
      })
      links[assessmentId] = assessmentLinks
    })

    nextKeysByAssessment.forEach((responseKeys, assessmentId) => {
      const assessmentLinks = links[assessmentId] || {}
      responseKeys.forEach((responseKey) => {
        assessmentLinks[responseKey] = initiativeId
      })
      links[assessmentId] = assessmentLinks
    })

    localStorage.setItem(INITIATIVE_LINKS_STORAGE_KEY, JSON.stringify(links))
  } catch {
    // ignore storage sync errors
  }
}
