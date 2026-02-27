import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiDownload } from 'react-icons/fi'
import {
  completeAssessment,
  getAssessmentById,
  updateSubcategoryResponse,
} from '../../../shared/services/assessmentService'
import {
  getInitiatives,
  getInitiativeById,
  linkSubcategories,
  updateInitiative,
  deleteInitiative,
} from '../../../shared/services/initiativeService'
import { downloadAssessmentPdf } from '../../../shared/services/reportService'
import AssessmentQuestions from './AssessmentQuestions'
import CompletedSummary from './CompletedSummary'
import InitiativeDrawer from '../../roadmap/InitiativeDrawer'
import { mapInitiativeFromApi, mapInitiativeToApi } from '../../roadmap/initiativeMapper'
import { useAppStore } from '../../../shared/store/useAppStore'
import ToastMessage from '../../../shared/components/ToastMessage'

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0) {
      return []
    }
    const looksLikeEntity = [
      'id',
      'title',
      'name',
      'label',
      'question',
      'question_text',
      'questionText',
      'subcategories',
      'sub_categories',
      'response_options',
      'responseOptions',
      'responses',
      'options',
      'selected_response_id',
      'selectedResponseId',
    ].some((key) => Object.prototype.hasOwnProperty.call(value, key))
    if (looksLikeEntity) {
      return [value]
    }
    return Object.values(value)
  }
  return []
}

const cleanText = (value) => String(value ?? '').trim()

const pickFirstText = (...values) => {
  for (const value of values) {
    const normalized = cleanText(value)
    if (normalized) {
      return normalized
    }
  }
  return ''
}

const normalizeAssessment = (data) => {
  const assessment = data?.assessment || data
  const rawCategories = toArray(
    assessment?.categories ||
      assessment?.template?.categories ||
      assessment?.template_categories ||
      assessment?.templateCategories
  )

  const categories = rawCategories.map((category, categoryIndex) => {
    const categoryId = category.id ?? `category-${categoryIndex}`
    const rawSubcategories = toArray(
      category.subcategories ||
        category.sub_categories ||
        category.items ||
        category.questions ||
        category.subcategory
    )
    const subcategories = rawSubcategories.map((subcategory, subIndex) => {
      const subcategoryId = subcategory.id ?? `${categoryId}-sub-${subIndex}`
      const rawOptions = toArray(
        subcategory.response_options ||
          subcategory.responseOptions ||
          subcategory.responses ||
          subcategory.options
      )
      const formatLabel = (value) =>
        String(value || '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())

      const responseOptions = rawOptions.map((option, optionIndex) => {
        const responseType =
          option.response_type || option.responseType || option.type || option.value
        return {
          id: option.id ?? `${subcategoryId}-option-${optionIndex}`,
          label: pickFirstText(
            option.label,
            option.title,
            option.name,
            option.option_label,
            option.optionLabel,
            responseType ? formatLabel(responseType) : '',
            `Option ${optionIndex + 1}`
          ),
          description: pickFirstText(
            option.description,
            option.text,
            option.details,
            option.help_text,
            option.helpText
          ),
        }
      })

      return {
        id: subcategoryId,
        title: pickFirstText(
          subcategory.title,
          subcategory.subcategory_title,
          subcategory.subcategoryTitle,
          subcategory.sub_category_title,
          subcategory.subCategoryTitle,
          subcategory.question_title,
          subcategory.questionTitle,
          subcategory.question_text,
          subcategory.questionText,
          subcategory.name,
          subcategory.question,
          subcategory.question?.title,
          subcategory.question?.text,
          subcategory.question?.label,
          subcategory.label,
          subcategory.prompt,
          subcategory.item_title,
          subcategory.itemTitle,
          subcategory.subcategory?.title,
          subcategory.sub_category?.title,
          subcategory.template_subcategory?.title,
          subcategory.template_sub_category?.title,
          subcategory.template_question?.title,
          subcategory.templateItem?.title,
          `Question ${subIndex + 1}`
        ),
        description: pickFirstText(
          subcategory.description,
          subcategory.help_text,
          subcategory.helpText,
          subcategory.summary,
          subcategory.details,
          subcategory.instructions
        ),
        responseOptions,
        selectedResponseId:
          subcategory.selected_response_id ||
          subcategory.selectedResponseId ||
          subcategory.selected_response?.id ||
          subcategory.selectedResponse?.id ||
          null,
      }
    })

    return {
      id: categoryId,
      title: pickFirstText(
        category.title,
        category.category_title,
        category.categoryTitle,
        category.category?.title,
        category.template_category?.title,
        category.name,
        category.label,
        `Category ${categoryIndex + 1}`
      ),
      description: pickFirstText(
        category.description,
        category.summary,
        category.details,
        category.help_text,
        category.helpText
      ),
      subcategories,
    }
  })

  return {
    ...assessment,
    id: assessment?.id || assessment?.assessment_id,
    title: pickFirstText(
      assessment?.title,
      assessment?.assessment_title,
      assessment?.assessmentTitle,
      assessment?.name,
      'Assessment'
    ),
    status: assessment?.status,
    organizationId: assessment?.organization_id || assessment?.organizationId,
    categories,
  }
}

const formatDateLabel = (value) => {
  if (!value) {
    return ''
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const INITIATIVE_LINKS_KEY = 'initiativeLinks'
const PENDING_LINK_KEY = 'pendingInitiativeLink'
const AUTO_SAVE_INTERVAL_MS = 30000

const loadLinksForAssessment = (assessmentId) => {
  if (!assessmentId) {
    return {}
  }
  try {
    const stored = JSON.parse(localStorage.getItem(INITIATIVE_LINKS_KEY) || '{}')
    return stored?.[assessmentId] || {}
  } catch {
    return {}
  }
}

const saveLinksForAssessment = (assessmentId, nextLinks) => {
  if (!assessmentId) {
    return
  }
  try {
    const stored = JSON.parse(localStorage.getItem(INITIATIVE_LINKS_KEY) || '{}')
    stored[assessmentId] = nextLinks
    localStorage.setItem(INITIATIVE_LINKS_KEY, JSON.stringify(stored))
  } catch {
    localStorage.setItem(
      INITIATIVE_LINKS_KEY,
      JSON.stringify({ [assessmentId]: nextLinks })
    )
  }
}

const PerformAssessment = ({
  onBack,
  assessmentId,
  onProgress,
  onComplete,
  onLoaded,
  readOnly = false,
  focusResponseId = null,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const activeOrganizationId = useAppStore((state) => state.activeOrganizationId)
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedSections, setExpandedSections] = useState(() => new Set())
  const [expandedItems, setExpandedItems] = useState(() => new Set())
  const [selections, setSelections] = useState({})
  const [pendingResponses, setPendingResponses] = useState({})
  const [savingItems, setSavingItems] = useState(() => new Set())
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [responseFilter, setResponseFilter] = useState('all')
  const [initiatives, setInitiatives] = useState([])
  const [initiativeLinks, setInitiativeLinks] = useState(() =>
    loadLinksForAssessment(assessmentId)
  )
  const [initiativePicker, setInitiativePicker] = useState({
    responseId: null,
    mode: 'existing',
    isOpen: false,
  })
  const [initiativeEditor, setInitiativeEditor] = useState({
    open: false,
    initiative: null,
  })
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)
  const [toast, setToast] = useState(null)
  const pendingResponsesRef = useRef({})
  const isFlushingResponsesRef = useRef(false)

  useEffect(() => {
    let isMounted = true
    if (!assessmentId) {
      setLoading(false)
      return () => {
        isMounted = false
      }
    }

    const loadAssessment = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getAssessmentById(assessmentId)
        const normalized = normalizeAssessment(data)
        if (!isMounted) {
          return
        }
        setAssessment(normalized)
        if (onLoaded) {
          onLoaded(normalized)
        }
        const initialSelections = {}
        normalized.categories.forEach((category) => {
          category.subcategories.forEach((subcategory) => {
            if (subcategory.selectedResponseId) {
              initialSelections[subcategory.id] = subcategory.selectedResponseId
            }
          })
        })
        setSelections(initialSelections)
        setPendingResponses({})
        setSavingItems(new Set())
        setLastAutoSavedAt(null)
      } catch (loadError) {
        console.error('Unable to load assessment:', loadError)
        if (isMounted) {
          setError('Unable to load assessment')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadAssessment()

    return () => {
      isMounted = false
    }
  }, [assessmentId, onLoaded])

  useEffect(() => {
    setInitiativeLinks(loadLinksForAssessment(assessmentId))
  }, [assessmentId])

  useEffect(() => {
    let isMounted = true
    const organizationId =
      assessment?.organizationId || Number(activeOrganizationId)
    if (!organizationId) {
      setInitiatives([])
      return () => {
        isMounted = false
      }
    }
    const loadInitiatives = async () => {
      try {
        const data = await getInitiatives({ organization_id: organizationId })
        const list = Array.isArray(data) ? data : data?.initiatives || []
        if (!isMounted) {
          return
        }
        const detailed = await Promise.all(
          list.map(async (item) => {
            try {
              return await getInitiativeById(item.id)
            } catch {
              return item
            }
          })
        )
        setInitiatives(detailed.map((item) => mapInitiativeFromApi(item)))
      } catch {
        if (isMounted) {
          setInitiatives([])
        }
      }
    }
    loadInitiatives()
    return () => {
      isMounted = false
    }
  }, [assessment?.organizationId, activeOrganizationId])

  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    pendingResponsesRef.current = pendingResponses
  }, [pendingResponses])

  const categories = useMemo(() => assessment?.categories || [], [assessment])
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, index) => currentYear + index)
  }, [])
  const templateTitle =
    assessment?.template_title ||
    assessment?.templateTitle ||
    assessment?.template?.title ||
    ''
  const performedBy =
    assessment?.performed_by ||
    assessment?.performedBy ||
    assessment?.performed_by_name ||
    ''
  const assessmentDate =
    assessment?.assessment_date ||
    assessment?.assessmentDate ||
    assessment?.date ||
    ''
  const formattedAssessmentDate = formatDateLabel(assessmentDate)

  const allSectionsExpanded =
    categories.length > 0 &&
    categories.every((section) => expandedSections.has(section.id))
  const allItemsExpanded =
    categories.length > 0 &&
    categories.every((section) =>
      section.subcategories.every((item) => expandedItems.has(item.id))
    )

  const totalItems = useMemo(
    () => categories.reduce((count, category) => count + category.subcategories.length, 0),
    [categories]
  )

  const answeredCount = useMemo(
    () => Object.values(selections).filter(Boolean).length,
    [selections]
  )

  const isCompleted = assessment?.status === 'completed'
  const progressPercent = totalItems
    ? Math.round((answeredCount / totalItems) * 100)
    : 0

  const scoreCandidate = Number(
    assessment?.total_score ?? assessment?.totalScore ?? assessment?.score ?? ''
  )
  const overallScoreValue = Number.isFinite(scoreCandidate)
    ? scoreCandidate > 0 && scoreCandidate <= 1
      ? scoreCandidate * 100
      : scoreCandidate
    : null

  const responseGroups = useMemo(() => {
    const groups = {}
    const normalizeKey = (label) =>
      String(label || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
    categories.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        const selectedId = selections[subcategory.id] || subcategory.selectedResponseId
        if (!selectedId) {
          return
        }
        const selectedOption = subcategory.responseOptions.find(
          (option) => option.id === selectedId
        )
        if (!selectedOption) {
          return
        }
        const key = normalizeKey(selectedOption.label)
        if (!groups[key]) {
          groups[key] = []
        }
        groups[key].push({
          id: `${subcategory.id}-${selectedOption.id}`,
          responseId: subcategory.id,
          categoryTitle: category.title,
          title: subcategory.title,
          description: subcategory.description,
          responseLabel: selectedOption.label,
          responseDescription: selectedOption.description,
        })
      })
    })
    return groups
  }, [categories, selections])

  const responseItemById = useMemo(() => {
    const map = new Map()
    Object.values(responseGroups).forEach((items) => {
      items.forEach((item) => {
        map.set(String(item.responseId || item.id), item)
      })
    })
    return map
  }, [responseGroups])

  const responseGroupOrder = [
    { key: 'at_risk', label: 'At Risk', header: 'bg-red-100 text-red-800', badge: 'bg-red-500 text-white' },
    { key: 'needs_attention', label: 'Needs Attention', header: 'bg-orange-100 text-orange-800', badge: 'bg-orange-500 text-white' },
    { key: 'acceptable_risk', label: 'Acceptable Risk', header: 'bg-blue-100 text-blue-800', badge: 'bg-blue-500 text-white' },
    { key: 'satisfactory', label: 'Satisfactory', header: 'bg-green-100 text-green-800', badge: 'bg-green-500 text-white' },
    { key: 'yes', label: 'Yes', header: 'bg-green-100 text-green-800', badge: 'bg-green-500 text-white' },
    { key: 'no', label: 'No', header: 'bg-red-100 text-red-800', badge: 'bg-red-500 text-white' },
    { key: 'not_applicable', label: 'Not Applicable', header: 'bg-purple-100 text-purple-800', badge: 'bg-purple-500 text-white' },
    { key: 'unknown', label: 'Unknown', header: 'bg-gray-100 text-gray-700', badge: 'bg-gray-500 text-white' },
  ]

  const visibleGroups = responseGroupOrder
    .filter((group) => responseGroups[group.key]?.length)
    .filter((group) => responseFilter === 'all' || responseFilter === group.key)

  const totalResponsesCount = Object.values(responseGroups).reduce(
    (total, items) => total + items.length,
    0
  )
  const pendingResponseCount = Object.keys(pendingResponses).length

  useEffect(() => {
    if (onProgress && assessmentId) {
      onProgress({ assessmentId, answered: answeredCount, total: totalItems })
    }
  }, [assessmentId, answeredCount, onProgress, totalItems])

  const toggleSection = (id) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedSections(new Set(categories.map((section) => section.id)))
  }

  const expandAllItems = () => {
    setExpandedSections(new Set(categories.map((section) => section.id)))
    const allItems = new Set()
    categories.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        allItems.add(subcategory.id)
      })
    })
    setExpandedItems(allItems)
  }

  const toggleAllSections = () => {
    if (allSectionsExpanded) {
      setExpandedSections(new Set())
      return
    }
    expandAll()
  }

  const toggleAllItems = () => {
    if (allItemsExpanded) {
      setExpandedItems(new Set())
      return
    }
    expandAllItems()
  }

  useEffect(() => {
    if (!focusResponseId || categories.length === 0) {
      return
    }
    let targetCategory = null
    let targetSubcategory = null
    categories.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        if (String(subcategory.id) === String(focusResponseId)) {
          targetCategory = category
          targetSubcategory = subcategory
        }
      })
    })
    if (!targetCategory || !targetSubcategory) {
      return
    }
    setExpandedSections((prev) => {
      const next = new Set(prev)
      next.add(targetCategory.id)
      return next
    })
    setExpandedItems((prev) => {
      const next = new Set(prev)
      next.add(targetSubcategory.id)
      return next
    })
    const timer = setTimeout(() => {
      const node = document.querySelector(
        `[data-response-id="${String(focusResponseId)}"]`
      )
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [categories, focusResponseId])

  const flushPendingResponses = useCallback(async () => {
    if (!assessmentId || readOnly || isCompleted) {
      return true
    }
    if (isFlushingResponsesRef.current) {
      let attempts = 0
      while (isFlushingResponsesRef.current && attempts < 40) {
        await new Promise((resolve) => setTimeout(resolve, 50))
        attempts += 1
      }
      if (isFlushingResponsesRef.current) {
        return false
      }
    }

    const pendingSnapshot = { ...pendingResponsesRef.current }
    const entries = Object.entries(pendingSnapshot)
    if (entries.length === 0) {
      return true
    }

    isFlushingResponsesRef.current = true
    let hasErrors = false

    for (const [subcategoryId, responseId] of entries) {
      setSavingItems((prev) => {
        const next = new Set(prev)
        next.add(subcategoryId)
        return next
      })
      try {
        await updateSubcategoryResponse({
          assessmentId,
          subcategoryId,
          selectedResponseId: responseId,
        })
        if (String(pendingSnapshot[subcategoryId]) === String(responseId)) {
          delete pendingSnapshot[subcategoryId]
        }
        setPendingResponses((prev) => {
          if (prev[subcategoryId] !== responseId) {
            return prev
          }
          const next = { ...prev }
          delete next[subcategoryId]
          return next
        })
      } catch (saveError) {
        hasErrors = true
        console.error('Unable to auto-save response:', saveError)
      } finally {
        setSavingItems((prev) => {
          const next = new Set(prev)
          next.delete(subcategoryId)
          return next
        })
      }
    }

    if (hasErrors) {
      setToast({
        type: 'error',
        message: 'Unable to auto-save some responses. Retrying...',
      })
    } else {
      setLastAutoSavedAt(new Date())
    }
    pendingResponsesRef.current = pendingSnapshot
    isFlushingResponsesRef.current = false
    return !hasErrors
  }, [assessmentId, isCompleted, readOnly])

  useEffect(() => {
    if (!assessmentId || readOnly || isCompleted) {
      return
    }
    const intervalId = setInterval(() => {
      void flushPendingResponses()
    }, AUTO_SAVE_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [assessmentId, flushPendingResponses, isCompleted, readOnly])

  const handleSelect = (subcategoryId, responseId) => {
    if (isCompleted || readOnly || isCompleting) {
      return
    }
    setSelections((prev) => ({
      ...prev,
      [subcategoryId]: responseId,
    }))
    if (!assessmentId) {
      return
    }
    setPendingResponses((prev) => ({
      ...prev,
      [subcategoryId]: responseId,
    }))
  }

  const handleComplete = async () => {
    if (!assessmentId) {
      return
    }
    setIsCompleting(true)
    setError('')
    try {
      const saved = await flushPendingResponses()
      if (!saved) {
        setToast({
          type: 'error',
          message: 'Unable to save latest responses. Please try again.',
        })
        return
      }
      await completeAssessment(assessmentId)
      const completedAt = new Date().toISOString()
      setAssessment((prev) =>
        prev ? { ...prev, status: 'completed', completed_at: completedAt } : prev
      )
      if (onComplete) {
        onComplete(assessmentId, {
          ...assessment,
          status: 'completed',
          completed_at: completedAt,
        })
      }
    } catch (completeError) {
      console.error('Unable to complete assessment:', completeError)
      setError('Unable to complete assessment')
    } finally {
      setIsCompleting(false)
    }
  }

  const handleDownloadAssessmentReport = async () => {
    if (!assessmentId) {
      return
    }
    if (!isCompleted) {
      setError('Complete the assessment before downloading the report')
      return
    }

    setIsDownloadingReport(true)
    setError('')
    try {
      await downloadAssessmentPdf(assessmentId)
      setToast({ type: 'success', message: 'Assessment report download started.' })
    } catch (downloadError) {
      console.error('Unable to download assessment report:', downloadError)
      setError('Unable to download report')
      setToast({ type: 'error', message: 'Unable to download report' })
    } finally {
      setIsDownloadingReport(false)
    }
  }

  const sortedInitiatives = useMemo(() => {
    return initiatives
      .slice()
      .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
  }, [initiatives])

  const handleOpenInitiative = (initiativeId) => {
    if (!initiativeId) {
      return
    }
    const found = initiatives.find(
      (initiative) => String(initiative.id) === String(initiativeId)
    )
    if (found) {
      const linkedItems = Object.entries(initiativeLinks)
        .filter(([, linkedId]) => String(linkedId) === String(initiativeId))
        .map(([responseId]) => {
          const item = responseItemById.get(String(responseId))
          return item
            ? {
                assessmentId,
                responseId: item.responseId || item.id,
                subcategoryId: item.responseId || item.id,
                title: item.title,
                categoryTitle: item.categoryTitle,
                responseLabel: item.responseLabel,
              }
            : null
        })
        .filter(Boolean)
      setInitiativeEditor({
        open: true,
        initiative: {
          ...found,
          linkedItems,
          linkedSubcategoryIds: linkedItems.map((item) => item.subcategoryId),
        },
      })
    }
  }

  const handleCreateInitiative = (item) => {
    if (!assessmentId) {
      return
    }
    const linkPayload = {
      assessmentId,
      responseId: item.responseId || item.id,
      subcategoryId: item.responseId || item.id,
      title: item.title,
      categoryTitle: item.categoryTitle,
      responseLabel: item.responseLabel,
    }
    localStorage.setItem(PENDING_LINK_KEY, JSON.stringify(linkPayload))
    navigate('/roadmap')
  }

  const handleSelectExistingInitiative = (item, initiativeId) => {
    if (!assessmentId || !initiativeId) {
      return
    }
    const responseId = item.responseId || item.id
    const nextLinks = { ...initiativeLinks, [responseId]: initiativeId }
    setInitiativeLinks(nextLinks)
    saveLinksForAssessment(assessmentId, nextLinks)
    linkSubcategories(initiativeId, [responseId]).catch(() => {})
    setInitiatives((prev) =>
      prev.map((initiative) => {
        if (String(initiative.id) !== String(initiativeId)) {
          return initiative
        }
        const linkEntry = {
          assessmentId,
          responseId,
          subcategoryId: responseId,
          title: item.title,
          categoryTitle: item.categoryTitle,
          responseLabel: item.responseLabel,
        }
        const existing = initiative.linkedItems || []
        const alreadyLinked = existing.some(
          (entry) =>
            String(entry.assessmentId) === String(assessmentId) &&
            String(entry.responseId) === String(responseId)
        )
        if (alreadyLinked) {
          return initiative
        }
        return {
          ...initiative,
          linkedItems: [...existing, linkEntry],
          linkedSubcategoryIds: Array.from(
            new Set([...(initiative.linkedSubcategoryIds || []), responseId])
          ),
        }
      })
    )
    setInitiativePicker({ responseId: null, mode: 'existing', isOpen: false })
  }

  const handleSaveInitiativeFromAssessment = (updated) => {
    const previous = initiativeEditor.initiative
    const previousItems = Array.isArray(previous?.linkedItems) ? previous.linkedItems : []
    const nextItems = Array.isArray(updated?.linkedItems) ? updated.linkedItems : []

    const getResponseKey = (item) =>
      String(item?.responseId ?? item?.subcategoryId ?? item?.id ?? '')

    const nextResponseKeys = new Set(nextItems.map(getResponseKey).filter(Boolean))
    const removedResponseKeys = previousItems
      .map(getResponseKey)
      .filter((key) => key && !nextResponseKeys.has(key))

    const organizationId =
      assessment?.organizationId || Number(activeOrganizationId)
    if (organizationId) {
      updateInitiative(updated.id, mapInitiativeToApi(updated, organizationId)).catch(
        () => {}
      )
    }

    if (assessmentId) {
      const resolvedInitiativeId = updated?.id
      const nextLinks = { ...initiativeLinks }

      removedResponseKeys.forEach((responseKey) => {
        if (String(nextLinks[responseKey]) === String(resolvedInitiativeId)) {
          delete nextLinks[responseKey]
        }
      })

      nextResponseKeys.forEach((responseKey) => {
        nextLinks[responseKey] = resolvedInitiativeId
      })

      setInitiativeLinks(nextLinks)
      saveLinksForAssessment(assessmentId, nextLinks)
    }

    setInitiatives((prev) =>
      prev.map((item) =>
        String(item.id) === String(updated.id) ? updated : item
      )
    )
    setInitiativeEditor({ open: false, initiative: null })
  }

  const handleDeleteInitiativeFromAssessment = (initiativeId) => {
    deleteInitiative(initiativeId).catch(() => {})
    setInitiatives((prev) =>
      prev.filter((item) => String(item.id) !== String(initiativeId))
    )
    if (assessmentId) {
      const nextLinks = { ...initiativeLinks }
      Object.keys(nextLinks).forEach((key) => {
        if (String(nextLinks[key]) === String(initiativeId)) {
          delete nextLinks[key]
        }
      })
      setInitiativeLinks(nextLinks)
      saveLinksForAssessment(assessmentId, nextLinks)
    }
    setInitiativeEditor({ open: false, initiative: null })
  }

  const handleLinkedAssessmentClick = (item) => {
    if (!item?.assessmentId) {
      return
    }
    const targetResponseId = item.responseId || item.id
    navigate(`/assessments/${item.assessmentId}/read-only`, {
      state: {
        responseId: targetResponseId,
        backTo: location?.pathname || '/clients/select',
      },
    })
  }

  const getBadgeClasses = (label) => {
    const normalized = String(label || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')

    if (normalized.includes('satisfactory') || normalized.includes('good')) {
      return 'bg-green-100 text-green-700'
    }
    if (normalized.includes('acceptable')) {
      return 'bg-blue-100 text-blue-700'
    }
    if (normalized.includes('needs') || normalized.includes('attention')) {
      return 'bg-orange-100 text-orange-700'
    }
    if (normalized.includes('at_risk')) {
      return 'bg-red-100 text-red-700'
    }
    if (normalized.includes('not_applicable')) {
      return 'bg-purple-100 text-purple-700'
    }
    if (normalized.includes('unknown')) {
      return 'bg-gray-100 text-gray-700'
    }
    if (normalized === 'yes') {
      return 'bg-green-100 text-green-700'
    }
    if (normalized === 'no') {
      return 'bg-red-100 text-red-700'
    }
    if (normalized.includes('partial')) {
      return 'bg-orange-100 text-orange-700'
    }
    return 'bg-gray-100 text-gray-700'
  }

  const getStatusBadgeClasses = (status) => {
    if (status === 'completed') {
      return 'bg-green-100 text-green-700'
    }
    return 'bg-amber-100 text-amber-700'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
        Loading assessment...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6 text-sm text-red-600">
        {error}
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
        No assessment data found.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-4 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-black">{assessment.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              {assessment.status && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClasses(
                    assessment.status
                  )}`}
                >
                  {assessment.status.replace(/_/g, ' ')}
                </span>
              )}
              {overallScoreValue !== null && overallScoreValue !== undefined && (
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-900">
                  Overall Score: {Number(overallScoreValue).toFixed(2)}%
                </span>
              )}
              {!isCompleted && (
                <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 border border-gray-200">
                  Progress: {progressPercent}%
                </span>
              )}
              {!isCompleted && (
                <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 border border-gray-200">
                  Answers: {answeredCount}/{totalItems || 0}
                </span>
              )}
            </div>
            {templateTitle && (
              <p className="mt-2 text-xs text-gray-500">Template: {templateTitle}</p>
            )}
            {(performedBy || formattedAssessmentDate) && (
              <p className="mt-1 text-xs text-gray-500">
                Performed by: {performedBy || 'Unknown'} {formattedAssessmentDate}
              </p>
            )}
            {!readOnly && !isCompleted && (
              <p className="mt-1 text-xs text-gray-500">
                {pendingResponseCount > 0
                  ? `Unsaved changes: ${pendingResponseCount}. Auto-save runs every 30 seconds.`
                  : lastAutoSavedAt
                  ? `Auto-saved at ${lastAutoSavedAt.toLocaleTimeString('en-US')}`
                  : 'Auto-save runs every 30 seconds.'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!readOnly && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isCompleting || isCompleted}
                className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2 text-sm font-medium disabled:opacity-60"
              >
                {isCompleted
                  ? 'Assessment completed'
                  : isCompleting
                  ? 'Completing...'
                  : 'Complete assessment'}
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadAssessmentReport}
              disabled={!isCompleted || isDownloadingReport}
              className="px-4 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 inline-flex items-center gap-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiDownload className="text-base" />
              {isDownloadingReport ? 'Downloading...' : 'Download report'}
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer inline-flex items-center gap-2"
              >
                <FiArrowLeft className="text-base" />
                Back to assessments
              </button>
            )}
          </div>
        </div>
      </div>

      {isCompleted && !readOnly ? (
        <CompletedSummary
          responseFilter={responseFilter}
          onFilterChange={setResponseFilter}
          responseGroupOrder={responseGroupOrder}
          responseGroups={responseGroups}
          visibleGroups={visibleGroups}
          totalResponsesCount={totalResponsesCount}
          renderGroupRow={(item) => (
            <tr key={item.id} className="border-b border-gray-200 last:border-b-0">
              <td className="px-4 py-3">
                <input type="checkbox" className="h-4 w-4" />
              </td>
              <td className="px-4 py-3 w-[55%]">
                <div className="font-semibold text-gray-900">{item.title}</div>
                {item.description && (
                  <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                )}
              </td>
              <td className="px-4 py-3 w-[25%]">
                <div className="font-semibold text-gray-900">{item.responseLabel}</div>
                <p className="text-xs text-gray-600 mt-1">
                  {item.responseDescription || 'No description provided.'}
                </p>
              </td>
              <td className="px-4 py-3 w-[20%] text-center">
                {(() => {
                  const responseId = item.responseId || item.id
                  const linkedInitiativeId = initiativeLinks[responseId]
                  const linkedInitiative = sortedInitiatives.find(
                    (initiative) => String(initiative.id) === String(linkedInitiativeId)
                  )
                  const isPickerOpen =
                    initiativePicker.isOpen && initiativePicker.responseId === responseId
                  const pickerMode = initiativePicker.mode

                  if (linkedInitiative) {
                    return (
                      <button
                        type="button"
                        onClick={() => handleOpenInitiative(linkedInitiative.id)}
                        className="text-sm font-semibold text-blue-700 hover:text-blue-900"
                      >
                        {linkedInitiative.title || 'Untitled initiative'}
                      </button>
                    )
                  }

                  return (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setInitiativePicker({
                            responseId,
                            mode: 'existing',
                            isOpen: true,
                          })
                        }
                        className="h-8 w-8 rounded-md border border-gray-300 bg-white text-blue-700 hover:bg-blue-50"
                      >
                        +
                      </button>
                      {isPickerOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
                          <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-gray-900">
                                Link initiative
                              </h4>
                              <button
                                type="button"
                                onClick={() =>
                                  setInitiativePicker({
                                    responseId: null,
                                    mode: 'existing',
                                    isOpen: false,
                                  })
                                }
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Close
                              </button>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setInitiativePicker({
                                    responseId,
                                    mode: 'existing',
                                    isOpen: true,
                                  })
                                }
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${
                                  pickerMode === 'existing'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 text-gray-600'
                                }`}
                              >
                                Existing
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setInitiativePicker({
                                    responseId,
                                    mode: 'create',
                                    isOpen: true,
                                  })
                                }
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${
                                  pickerMode === 'create'
                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 text-gray-600'
                                }`}
                              >
                                Create new
                              </button>
                            </div>
                            {pickerMode === 'existing' ? (
                              <div className="mt-4 space-y-2 max-h-64 overflow-auto">
                                {sortedInitiatives.length === 0 ? (
                                  <p className="text-xs text-gray-500">
                                    No initiatives yet. Create a new one.
                                  </p>
                                ) : (
                                  sortedInitiatives.map((initiative) => (
                                    <button
                                      key={initiative.id}
                                      type="button"
                                      onClick={() =>
                                        handleSelectExistingInitiative(item, initiative.id)
                                      }
                                      className="w-full text-left rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                      {initiative.title || 'Untitled initiative'}
                                    </button>
                                  ))
                                )}
                              </div>
                            ) : (
                              <div className="mt-4">
                                <button
                                  type="button"
                                  onClick={() => handleCreateInitiative(item)}
                                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                  Create initiative
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </td>
            </tr>
          )}
        />
      ) : (
        <AssessmentQuestions
          categories={categories}
          expandedSections={expandedSections}
          expandedItems={expandedItems}
          toggleSection={toggleSection}
          toggleAllSections={toggleAllSections}
          toggleAllItems={toggleAllItems}
          allSectionsExpanded={allSectionsExpanded}
          allItemsExpanded={allItemsExpanded}
          setExpandedItems={setExpandedItems}
          selections={selections}
          handleSelect={handleSelect}
          savingItems={savingItems}
          isCompleted={isCompleted}
          isReadOnly={readOnly}
          getBadgeClasses={getBadgeClasses}
        />
      )}

      <InitiativeDrawer
        key={initiativeEditor.initiative?.id ?? 'new'}
        open={initiativeEditor.open}
        mode="edit"
        initiative={initiativeEditor.initiative}
        years={years}
        onClose={() => setInitiativeEditor({ open: false, initiative: null })}
        onSave={handleSaveInitiativeFromAssessment}
        onDelete={handleDeleteInitiativeFromAssessment}
        onLinkedAssessmentClick={handleLinkedAssessmentClick}
        linkedAssessmentId={assessmentId}
      />
      <ToastMessage toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}

export default PerformAssessment
