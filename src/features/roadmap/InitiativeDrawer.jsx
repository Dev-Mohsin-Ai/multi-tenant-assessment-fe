import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiX,
  FiFlag,
  FiCalendar,
  FiExternalLink,
  FiDownload,
  FiTarget,
  FiUser,
  FiFileText,
  FiDollarSign,
  FiLink2,
  FiTrash2,
  FiCheck,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  QUARTERS,
  createId,
  getQuarterFromDate,
  getQuarterStartDate,
} from './initiativeConstants'
import { getGoals } from '../../shared/services/goalService'
import { getOrganizationUsers } from '../../shared/services/organizationService'
import {
  applyInitiativeTemplate,
  getInitiativeById,
  getInitiativeTemplateById,
  getInitiativeTemplates,
  saveInitiativeAsTemplate,
  updateInitiative,
} from '../../shared/services/initiativeService'
import { getAssessmentById } from '../../shared/services/assessmentService'
import { downloadInitiativePdf } from '../../shared/services/reportService'
import { useAppStore } from '../../shared/store/useAppStore'
import ToastMessage from '../../shared/components/ToastMessage'
import AppSelect from '../../shared/components/AppSelect'
import { mapInitiativeToApi } from './initiativeMapper'

const INITIATIVE_LINKS_KEY = 'initiativeLinks'
const INITIATIVE_TEMPLATE_KEY = 'initiativeTemplateById'

const formatResponseTypeLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const toArray = (value) => (Array.isArray(value) ? value : [])

const cleanLinkedText = (value) =>
  String(value ?? '')
    .replace(/\s*\(Copy\)\s*/gi, ' ')
    .trim()

const resolveTemplateId = (template) =>
  template?.id ?? template?.template_id ?? template?.templateId ?? null

const resolveTemplateTitle = (template) =>
  cleanLinkedText(template?.title || template?.name || template?.label || '')

const resolveTemplateEntity = (payload) => payload?.template || payload

const resolveTemplateSummary = (template) =>
  cleanLinkedText(
    template?.executive_summary ||
      template?.executiveSummary ||
      template?.summary ||
      template?.description ||
      ''
  )

const toSafeAmount = (value) => {
  const amount = Number(value ?? 0)
  return Number.isFinite(amount) ? amount : 0
}

const normalizeOneTimeFees = (fees) =>
  toArray(fees)
    .map((fee, index) => {
      if (!fee || typeof fee !== 'object') {
        return null
      }
      return {
        id: fee.id ?? createId(),
        title: cleanLinkedText(
          fee.title || fee.name || fee.label || fee.item || `Item ${index + 1}`
        ),
        amount: toSafeAmount(fee.amount ?? fee.cost ?? fee.value),
      }
    })
    .filter(Boolean)

const normalizeRecurringFees = (fees) =>
  toArray(fees)
    .map((fee, index) => {
      if (!fee || typeof fee !== 'object') {
        return null
      }
      const frequency = String(fee.frequency || fee.cadence || 'monthly').toLowerCase()
      return {
        id: fee.id ?? createId(),
        title: cleanLinkedText(
          fee.title || fee.name || fee.label || fee.item || `Item ${index + 1}`
        ),
        amount: toSafeAmount(fee.amount ?? fee.cost ?? fee.value),
        frequency: frequency === 'yearly' ? 'yearly' : 'monthly',
        peopleCount: Math.max(Number(fee.number_of_persons ?? fee.peopleCount ?? 1) || 1, 1),
      }
    })
    .filter(Boolean)

const resolveTemplateOneTimeFees = (template) =>
  normalizeOneTimeFees(
    template?.one_time_fees ||
      template?.oneTimeFees ||
      template?.one_time_budget ||
      template?.oneTimeBudget ||
      template?.budget?.one_time_fees ||
      template?.budget?.oneTimeFees ||
      []
  )

const resolveTemplateRecurringFees = (template) =>
  normalizeRecurringFees(
    template?.recurring_fees ||
      template?.recurringFees ||
      template?.recurring_budget ||
      template?.recurringBudget ||
      template?.budget?.recurring_fees ||
      template?.budget?.recurringFees ||
      []
  )

const resolveTemplateActionItems = (template) =>
  toArray(template?.action_items || template?.actionItems || template?.actions || [])
    .map((item, index) => {
      if (item && typeof item === 'object') {
        const title = cleanLinkedText(
          item.title || item.name || item.action || item.label || item.description || ''
        )
        if (!title) {
          return null
        }
        return {
          id: item.id ?? createId(),
          title,
        }
      }
      const title = cleanLinkedText(item || '')
      if (!title) {
        return null
      }
      return {
        id: createId(),
        title: title || `Action ${index + 1}`,
      }
    })
    .filter(Boolean)

const readInitiativeTemplateMap = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(INITIATIVE_TEMPLATE_KEY) || '{}')
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

const writeInitiativeTemplateMap = (value) => {
  try {
    localStorage.setItem(INITIATIVE_TEMPLATE_KEY, JSON.stringify(value || {}))
  } catch {
    // ignore
  }
}

const isNumericLike = (value) => /^-?\d+(\.\d+)?$/.test(String(value || '').trim())

const isPlaceholderLinkedTitle = (value) => {
  const normalized = cleanLinkedText(value)
  if (!normalized) {
    return true
  }
  return (
    /^untitled subcategory$/i.test(normalized) ||
    /^sub\s*category\s*\d+$/i.test(normalized) ||
    /^subcategory\s*\d+$/i.test(normalized) ||
    /^question\s*\d+$/i.test(normalized)
  )
}

const normalizeResponseLabel = (value) => {
  const normalized = cleanLinkedText(value)
  if (!normalized || isNumericLike(normalized)) {
    return ''
  }
  if (/^[a-z_]+$/.test(normalized)) {
    return formatResponseTypeLabel(normalized)
  }
  return normalized
}

const resolveLinkedSubcategoryId = (sub = {}) =>
  sub.subcategory_id ??
  sub.subcategoryId ??
  sub.subcategory?.id ??
  sub.sub_category?.id ??
  sub.template_subcategory_id ??
  sub.templateSubcategoryId ??
  sub.template_subcategory?.id ??
  sub.templateSubcategory?.id ??
  sub.response_subcategory_id ??
  sub.responseSubcategoryId ??
  sub.response?.subcategory_id ??
  sub.response?.subcategoryId ??
  sub.response?.subcategory?.id ??
  sub.response_id ??
  sub.responseId ??
  sub.response?.id ??
  sub.id

const isMeaningfulLinkedItem = (item) => {
  const title = cleanLinkedText(item?.title)
  const categoryTitle = cleanLinkedText(item?.categoryTitle)
  const responseLabel = normalizeResponseLabel(item?.responseLabel)
  const hasOnlyUnknownLabel =
    !title && !categoryTitle && /^unknown$/i.test(responseLabel)
  return Boolean(title || categoryTitle || (responseLabel && !hasOnlyUnknownLabel))
}

const getLinkedItemKey = (item, fallbackKey = '') => {
  const primary = item?.responseId ?? item?.subcategoryId ?? item?.id
  if (primary !== null && primary !== undefined && String(primary).trim()) {
    return String(primary)
  }
  return fallbackKey
}

const mergeLinkedItem = (existing = {}, candidate = {}) => {
  const existingTitle = cleanLinkedText(existing.title)
  const candidateTitle = cleanLinkedText(candidate.title)
  const existingCategory = cleanLinkedText(existing.categoryTitle)
  const candidateCategory = cleanLinkedText(candidate.categoryTitle)
  const existingResponseLabel = normalizeResponseLabel(existing.responseLabel)
  const candidateResponseLabel = normalizeResponseLabel(candidate.responseLabel)

  return {
    ...existing,
    ...candidate,
    assessmentId: existing.assessmentId || candidate.assessmentId || null,
    responseId: existing.responseId || candidate.responseId || existing.subcategoryId || candidate.subcategoryId,
    subcategoryId:
      existing.subcategoryId || candidate.subcategoryId || existing.responseId || candidate.responseId,
    title:
      existingTitle && !isPlaceholderLinkedTitle(existingTitle)
        ? existingTitle
        : candidateTitle,
    categoryTitle: existingCategory || candidateCategory,
    description: cleanLinkedText(existing.description) || cleanLinkedText(candidate.description),
    responseLabel: existingResponseLabel || candidateResponseLabel,
  }
}

const mapLinkedSubcategoriesToItems = (initiativeData) => {
  const linked = Array.isArray(initiativeData?.linked_subcategories)
    ? initiativeData.linked_subcategories
    : []

  return linked.map((sub) => {
    if (!sub || typeof sub !== 'object') {
      const responseId =
        sub !== null && sub !== undefined && String(sub).trim() ? sub : null
      return {
        assessmentId: null,
        responseId,
        subcategoryId: responseId,
        title: '',
        categoryTitle: '',
        description: '',
        responseLabel: '',
      }
    }

    const responseId = resolveLinkedSubcategoryId(sub)

    const responseLabelCandidates = [
      sub.response_label,
      sub.responseLabel,
      sub.selected_response_label,
      sub.selectedResponseLabel,
      sub.selected_response?.label,
      sub.selectedResponse?.label,
      sub.response?.label,
      sub.response?.title,
      sub.selected_response_type ? formatResponseTypeLabel(sub.selected_response_type) : '',
      sub.selectedResponseType ? formatResponseTypeLabel(sub.selectedResponseType) : '',
      sub.selected_response?.response_type
        ? formatResponseTypeLabel(sub.selected_response.response_type)
        : '',
      sub.response_type ? formatResponseTypeLabel(sub.response_type) : '',
    ]

    const responseLabel =
      responseLabelCandidates.map((value) => normalizeResponseLabel(value)).find(Boolean) || ''

    return {
      assessmentId:
        sub.assessment_id ??
        sub.assessmentId ??
        sub.assessment?.id ??
        sub.assessment?.assessment_id ??
        null,
      responseId,
      subcategoryId: responseId,
      title: cleanLinkedText(
        sub.subcategory_title ||
          sub.subcategoryTitle ||
          sub.subcategory?.title ||
          sub.response?.subcategory?.title ||
          sub.title ||
          sub.name ||
          sub.question ||
          sub.label ||
          ''
      ),
      categoryTitle: cleanLinkedText(
        sub.category_title ||
          sub.categoryTitle ||
          sub.category_name ||
          sub.categoryName ||
          sub.subcategory?.category?.title ||
          sub.subcategory?.category?.name ||
          sub.response?.subcategory?.category?.title ||
          sub.response?.subcategory?.category?.name ||
          sub.category?.title ||
          sub.category?.name ||
          ''
      ),
      description: cleanLinkedText(sub.description || ''),
      responseLabel,
    }
  })
}

const getLinkedResponsesFromStorage = (initiativeId, assessmentScopeId = null) => {
  if (!initiativeId) {
    return []
  }
  const scopeKey =
    assessmentScopeId === null || assessmentScopeId === undefined
      ? null
      : String(assessmentScopeId)
  try {
    const stored = JSON.parse(localStorage.getItem(INITIATIVE_LINKS_KEY) || '{}')
    return Object.entries(stored).flatMap(([assessmentId, links]) =>
      scopeKey !== null && String(assessmentId) !== scopeKey
        ? []
        : Object.entries(links || {})
            .filter(
              ([, linkedInitiativeId]) => String(linkedInitiativeId) === String(initiativeId)
            )
            .map(([responseId]) => ({ assessmentId, responseId }))
    )
  } catch {
    return []
  }
}

const shouldKeepByAssessmentScope = (
  item,
  assessmentScopeId = null,
  scopedResponseKeys = null
) => {
  if (assessmentScopeId === null || assessmentScopeId === undefined) {
    return true
  }
  const responseKey = getLinkedItemKey(item)
  if (!responseKey) {
    return false
  }
  if (scopedResponseKeys && !scopedResponseKeys.has(responseKey)) {
    return false
  }
  if (!item?.assessmentId) {
    return true
  }
  return String(item.assessmentId) === String(assessmentScopeId)
}

const getAssessmentResponseMap = (data) => {
  const assessment = data?.assessment || data
  const categories = toArray(
    assessment?.categories ||
      assessment?.template?.categories ||
      assessment?.template_categories ||
      assessment?.templateCategories
  )
  const result = new Map()

  categories.forEach((category) => {
    const categoryTitle =
      category?.title || category?.name || category?.label || ''
    const subcategories = toArray(
      category?.subcategories ||
        category?.sub_categories ||
        category?.items ||
        category?.questions ||
        category?.subcategory
    )

    subcategories.forEach((subcategory) => {
      const responseId = subcategory?.id
      if (!responseId) {
        return
      }
      const rawOptions = toArray(
        subcategory?.response_options ||
          subcategory?.responseOptions ||
          subcategory?.responses ||
          subcategory?.options
      )
      const selectedResponseId =
        subcategory?.selected_response_id ||
        subcategory?.selectedResponseId ||
        subcategory?.selected_response?.id ||
        subcategory?.selectedResponse?.id ||
        null

      const selectedOption = rawOptions.find(
        (option) =>
          String(option?.id) === String(selectedResponseId) ||
          String(option?.response_id) === String(selectedResponseId)
      )

      const selectedLabel = normalizeResponseLabel(
        subcategory?.selected_response?.label ||
          subcategory?.selectedResponse?.label ||
          (subcategory?.selected_response?.response_type
            ? formatResponseTypeLabel(subcategory.selected_response.response_type)
            : '') ||
          (selectedOption?.label ||
            selectedOption?.title ||
            selectedOption?.name ||
            (selectedOption?.response_type
              ? formatResponseTypeLabel(selectedOption.response_type)
              : '')) ||
          ''
      )

      const title = cleanLinkedText(
        subcategory?.title ||
          subcategory?.subcategory_title ||
          subcategory?.subcategoryTitle ||
          subcategory?.sub_category_title ||
          subcategory?.subCategoryTitle ||
          subcategory?.question_title ||
          subcategory?.questionTitle ||
          subcategory?.question_text ||
          subcategory?.questionText ||
          subcategory?.template_subcategory?.title ||
          subcategory?.templateSubcategory?.title ||
          subcategory?.template_sub_category?.title ||
          subcategory?.templateSubCategory?.title ||
          subcategory?.template_question?.title ||
          subcategory?.templateQuestion?.title ||
          subcategory?.name ||
          subcategory?.question ||
          subcategory?.label ||
          ''
      )

      const setMatch = (key, responseLabelOverride = '') => {
        if (key === null || key === undefined || String(key).trim() === '') {
          return
        }
        const existing = result.get(String(key))
        result.set(String(key), {
          title: title || existing?.title || '',
          categoryTitle: categoryTitle || existing?.categoryTitle || '',
          responseLabel:
            normalizeResponseLabel(responseLabelOverride) ||
            selectedLabel ||
            existing?.responseLabel ||
            '',
        })
      }

      setMatch(responseId)
      setMatch(
        subcategory?.selected_response_id ??
          subcategory?.selectedResponseId ??
          subcategory?.selected_response?.id ??
          subcategory?.selectedResponse?.id
      )

      rawOptions.forEach((option) => {
        const optionId = option?.id ?? option?.response_id
        const optionLabel = normalizeResponseLabel(
          option?.label ||
            option?.title ||
            option?.name ||
            (option?.response_type ? formatResponseTypeLabel(option.response_type) : '')
        )
        setMatch(optionId, optionLabel)
      })
    })
  })

  return result
}

const InitiativeDrawer = ({
  open = true,
  mode,
  initiative,
  onClose,
  onSave,
  onDelete,
  years,
  presetYear,
  presetQuarter,
  onLinkedAssessmentClick = null,
  linkedAssessmentId = null,
  showTemplateActions = true,
}) => {
  const navigate = useNavigate()
  const activeOrganizationId = useAppStore((state) => state.activeOrganizationId)
  const formatDownloadError = (error) => {
    const status = error?.response?.status
    const detail =
      typeof error?.response?.data?.detail === 'string'
        ? error.response.data.detail
        : ''
    return `Unable to download initiative report${status ? ` (HTTP ${status})` : ''}${detail ? `: ${detail}` : ''}`
  }
  const getResponseBadge = (label) => {
    const normalized = String(label || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
    if (normalized.includes('at_risk')) {
      return 'bg-red-100 text-red-700 border-red-200'
    }
    if (normalized.includes('needs_attention')) {
      return 'bg-orange-100 text-orange-700 border-orange-200'
    }
    if (normalized.includes('acceptable')) {
      return 'bg-blue-100 text-blue-700 border-blue-200'
    }
    if (normalized.includes('satisfactory') || normalized === 'yes') {
      return 'bg-green-100 text-green-700 border-green-200'
    }
    if (normalized === 'no') {
      return 'bg-red-100 text-red-700 border-red-200'
    }
    if (normalized.includes('unknown')) {
      return 'bg-gray-100 text-gray-700 border-gray-200'
    }
    if (normalized.includes('not_applicable')) {
      return 'bg-purple-100 text-purple-700 border-purple-200'
    }
    return 'bg-gray-50 text-gray-600 border-gray-200'
  }
  const [form, setForm] = useState(() => {
    if (initiative) {
      const derivedLinkedIds = Array.isArray(initiative.linkedItems)
        ? initiative.linkedItems
            .map((item) => item.subcategoryId)
            .filter(Boolean)
        : []
      return {
        ...initiative,
        templateId: initiative.templateId || null,
        templateTitle: initiative.templateTitle || '',
        linkedSubcategoryIds:
          initiative.linkedSubcategoryIds?.length
            ? initiative.linkedSubcategoryIds
            : derivedLinkedIds,
      }
    }
    const startDate = new Date().toISOString().slice(0, 10)
    const defaultQuarter = presetQuarter || getQuarterFromDate(startDate)
    const defaultYear = presetYear || new Date().getFullYear()
    const hasPresetSchedule = Boolean(presetQuarter && presetYear)
    return {
      id: createId(),
      title: '',
      summary: '',
      startDate,
      endDate: startDate,
      status: 'Open',
      priority: 'Medium',
      contactId: null,
      goalId: null,
      isScheduled: hasPresetSchedule,
      year: defaultYear,
      quarter: defaultQuarter,
      actionItems: [],
      goals: [],
      assets: [],
      oneTimeFees: [],
      recurringFees: [],
      templateId: null,
      templateTitle: '',
      linkedItems: [],
      linkedSubcategoryIds: [],
    }
  })

  const yearOptions = useMemo(() => {
    if (years?.length) {
      return years
    }
    const current = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, index) => current + index)
  }, [years])

  const [availableGoals, setAvailableGoals] = useState([])
  const [availableContacts, setAvailableContacts] = useState([])
  const [loadingGoals, setLoadingGoals] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [goalError, setGoalError] = useState('')
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [templateError, setTemplateError] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [templateOptions, setTemplateOptions] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [applyingTemplate, setApplyingTemplate] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [toast, setToast] = useState(null)
  const [showGoalInitiativeLinks] = useState(false)
  const loadingGoalInitiatives = false
  const goalInitiatives = []
  const handleOpenInitiativeOnRoadmap = () => {}
  const linkedItemsRef = useRef([])
  const filteredTemplateOptions = useMemo(() => {
    const query = String(templateSearch || '').trim().toLowerCase()
    if (!query) {
      return templateOptions
    }
    return templateOptions.filter((template) => {
      const title = resolveTemplateTitle(template).toLowerCase()
      const summary = resolveTemplateSummary(template).toLowerCase()
      return title.includes(query) || summary.includes(query)
    })
  }, [templateOptions, templateSearch])

  useEffect(() => {
    const organizationId = Number(activeOrganizationId)
    if (!open || !organizationId) {
      return
    }

    let isActive = true

    Promise.resolve().then(() => {
      if (!isActive) {
        return
      }
      setLoadingGoals(true)
      setLoadingContacts(true)
      setGoalError('')
    })

    Promise.all([
      getGoals({ organization_id: organizationId }),
      getOrganizationUsers(organizationId),
    ])
      .then(([goalsData, contactsData]) => {
        if (!isActive) {
          return
        }
        const goalList = Array.isArray(goalsData) ? goalsData : goalsData?.goals || []
        const contactList = (Array.isArray(contactsData) ? contactsData : contactsData?.users || [])
          .filter((item) => item && typeof item === 'object')
          .map((item) => ({
            id: item.id,
            full_name: item.full_name || item.email || `User ${item.id}`,
          }))

        setAvailableGoals(goalList)
        setAvailableContacts(contactList)
      })
      .catch(() => {
        if (!isActive) {
          return
        }
        setGoalError('Unable to load goals')
        setAvailableContacts([])
      })
      .finally(() => {
        if (!isActive) {
          return
        }
        setLoadingGoals(false)
        setLoadingContacts(false)
      })

    return () => {
      isActive = false
    }
  }, [activeOrganizationId, open])

  useEffect(() => {
    if (!open || availableContacts.length === 0) {
      return
    }

    setForm((prev) => {
      if (prev.contactId !== null && prev.contactId !== undefined && String(prev.contactId).trim()) {
        return prev
      }
      return {
        ...prev,
        contactId: availableContacts[0].id,
      }
    })
  }, [availableContacts, open])

  useEffect(() => {
    if (!open) {
      return
    }
    setIsDownloadingPdf(false)
    setToast(null)
  }, [form.id, open])

  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    linkedItemsRef.current = Array.isArray(form.linkedItems) ? form.linkedItems : []
  }, [form.linkedItems])

  useEffect(() => {
    if (!open || !form?.id) {
      return
    }
    const templateMap = readInitiativeTemplateMap()
    const mappedTemplate = templateMap?.[String(form.id)]
    if (!mappedTemplate) {
      return
    }
    const mappedTemplateId = mappedTemplate?.templateId ?? null
    const mappedTemplateTitle = cleanLinkedText(mappedTemplate?.templateTitle || '')
    if (
      String(form.templateId || '') === String(mappedTemplateId || '') &&
      cleanLinkedText(form.templateTitle || '') === mappedTemplateTitle
    ) {
      return
    }
    setForm((prev) => ({
      ...prev,
      templateId: mappedTemplateId,
      templateTitle: mappedTemplateTitle,
    }))
  }, [form?.id, form.templateId, form.templateTitle, open])

  useEffect(() => {
    if (!open || !templateDialogOpen) {
      return
    }

    let isActive = true
    setLoadingTemplates(true)
    setTemplateError('')

    const loadTemplatesForDialog = async () => {
      try {
        const data = await getInitiativeTemplates()
        const list = Array.isArray(data) ? data : data?.templates || data?.items || []
        if (!isActive) {
          return
        }
        setTemplateOptions(list)
      } catch {
        if (isActive) {
          setTemplateOptions([])
          setTemplateError('Unable to load initiative templates')
        }
      } finally {
        if (isActive) {
          setLoadingTemplates(false)
        }
      }
    }

    void loadTemplatesForDialog()
    return () => {
      isActive = false
    }
  }, [open, templateDialogOpen])

  useEffect(() => {
    if (!open || mode !== 'edit' || !form?.id) {
      return
    }

    let isActive = true

    const hydrateLinkedAssessments = async () => {
      try {
        const data = await getInitiativeById(form.id)
        if (!isActive) {
          return
        }

        const initiativeData = data?.initiative || data
        const apiLinkedItems = mapLinkedSubcategoriesToItems(initiativeData)
        const storedLinks = getLinkedResponsesFromStorage(form.id, linkedAssessmentId)
        const currentLinkedItems = linkedItemsRef.current
        const assessmentScopeKey =
          linkedAssessmentId === null || linkedAssessmentId === undefined
            ? null
            : String(linkedAssessmentId)

        const scopedResponseKeys =
          assessmentScopeKey === null
            ? null
            : new Set([
                ...storedLinks.map((link) => String(link.responseId)),
                ...currentLinkedItems
                  .filter(
                    (item) =>
                      item?.assessmentId &&
                      String(item.assessmentId) === assessmentScopeKey
                  )
                  .map((item) => getLinkedItemKey(item))
                  .filter(Boolean),
              ])

        const knownResponseKeys = new Set()
        const itemsByKey = new Map()

        currentLinkedItems.forEach((item, index) => {
          const responseKey = getLinkedItemKey(item)
          const key = responseKey || `current-${index}`
          if (key) {
            itemsByKey.set(key, mergeLinkedItem({}, item))
            if (responseKey) {
              knownResponseKeys.add(responseKey)
            }
          }
        })

        apiLinkedItems.forEach((item, index) => {
          const responseKey = getLinkedItemKey(item)
          const key = responseKey || `api-${index}`
          if (!key) {
            return
          }
          itemsByKey.set(key, mergeLinkedItem(itemsByKey.get(key), item))
          if (responseKey) {
            knownResponseKeys.add(responseKey)
          }
        })

        const scopedStoredLinksByKnownKey =
          knownResponseKeys.size > 0
            ? storedLinks.filter((link) => knownResponseKeys.has(String(link.responseId)))
            : storedLinks
        const effectiveStoredLinks =
          scopedStoredLinksByKnownKey.length > 0 ? scopedStoredLinksByKnownKey : storedLinks

        effectiveStoredLinks.forEach((link) => {
          const key = String(link.responseId)
          if (!key) {
            return
          }
          itemsByKey.set(
            key,
            mergeLinkedItem(itemsByKey.get(key), {
              assessmentId: link.assessmentId,
              responseId: link.responseId,
              subcategoryId: link.responseId,
            })
          )
        })

        const assessmentIds = Array.from(
          new Set(
            Array.from(itemsByKey.values())
              .map((item) => item.assessmentId)
              .filter(Boolean)
              .map(String)
          )
        )

        const assessmentResponseMaps = new Map()
        await Promise.all(
          assessmentIds.map(async (assessmentId) => {
            try {
              const assessmentData = await getAssessmentById(assessmentId)
              assessmentResponseMaps.set(
                String(assessmentId),
                getAssessmentResponseMap(assessmentData)
              )
            } catch {
              assessmentResponseMaps.set(String(assessmentId), new Map())
            }
          })
        )

        const nextLinkedItems = Array.from(itemsByKey.values())
          .map((item) => {
            const responseKey = String(item.responseId || item.subcategoryId || '')
            const assessmentMap = assessmentResponseMaps.get(String(item.assessmentId))
            const assessmentMatch = assessmentMap?.get(responseKey)
            if (!assessmentMatch) {
              return mergeLinkedItem({}, item)
            }
            return {
              ...mergeLinkedItem(item, assessmentMatch),
              title: cleanLinkedText(assessmentMatch.title) || cleanLinkedText(item.title),
              categoryTitle:
                cleanLinkedText(assessmentMatch.categoryTitle) ||
                cleanLinkedText(item.categoryTitle),
              responseLabel:
                normalizeResponseLabel(assessmentMatch.responseLabel) ||
                normalizeResponseLabel(item.responseLabel),
            }
          })
          .filter((item) =>
            shouldKeepByAssessmentScope(item, linkedAssessmentId, scopedResponseKeys)
          )

        const fallbackScopedItems = currentLinkedItems.filter((item) =>
          shouldKeepByAssessmentScope(item, linkedAssessmentId, scopedResponseKeys)
        )
        const resolvedLinkedItems =
          nextLinkedItems.length === 0 && fallbackScopedItems.length > 0
            ? fallbackScopedItems
            : nextLinkedItems

        const hasMeaningfulRows = resolvedLinkedItems.some((item) =>
          isMeaningfulLinkedItem(item)
        )
        const sanitizedLinkedItems = hasMeaningfulRows
          ? resolvedLinkedItems.filter((item) => isMeaningfulLinkedItem(item))
          : resolvedLinkedItems

        const nextLinkedSubcategoryIds = Array.from(
          new Set(
            sanitizedLinkedItems
              .map((item) => item.subcategoryId || item.responseId)
              .filter(Boolean)
          )
        )

        setForm((prev) => {
          if (!isActive || String(prev.id) !== String(form.id)) {
            return prev
          }
          return {
            ...prev,
            linkedItems: sanitizedLinkedItems,
            linkedSubcategoryIds: nextLinkedSubcategoryIds,
          }
        })
      } catch {
        // keep existing linked items if enrichment fails
      }
    }

    void hydrateLinkedAssessments()

    return () => {
      isActive = false
    }
  }, [form?.id, linkedAssessmentId, mode, open])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleViewGoal = () => {
    if (!form.goalId) {
      return
    }
    localStorage.setItem('openGoalId', String(form.goalId))
    onClose?.()
    navigate('/goals')
  }

  const handleOpenLinkedAssessment = (item) => {
    if (typeof onLinkedAssessmentClick === 'function') {
      onLinkedAssessmentClick(item)
      if (item?.assessmentId) {
        return
      }
    }

    if (!item?.assessmentId) {
      setToast({
        type: 'error',
        message: 'Linked assessment reference is unavailable for this item.',
      })
      return
    }

    const targetResponseId = item.responseId || item.subcategoryId || item.id || null
    navigate(`/assessments/${item.assessmentId}/read-only`, {
      state: {
        responseId: targetResponseId,
        backTo: '/goals',
      },
    })
  }

  const handleScheduleSelect = (year, quarter) => {
    const resolvedYear = Number(year) || new Date().getFullYear()
    const resolvedQuarter = QUARTERS.includes(quarter) ? quarter : QUARTERS[0]
    const startDate = getQuarterStartDate(resolvedYear, resolvedQuarter)
    setForm((prev) => ({
      ...prev,
      isScheduled: true,
      year: resolvedYear,
      quarter: resolvedQuarter,
      startDate,
    }))
  }

  const handleOpenTemplateDialog = () => {
    if (!showTemplateActions) {
      return
    }
    setTemplateDialogOpen(true)
    setTemplateError('')
    setTemplateSearch('')
    setSelectedTemplateId(form.templateId || null)
  }

  const handleCloseTemplateDialog = () => {
    setTemplateDialogOpen(false)
    setTemplateError('')
    setTemplateSearch('')
  }

  const handleSaveAsTemplate = async () => {
    if (mode !== 'edit' || !form?.id || !isNumericLike(form.id)) {
      setToast({
        type: 'error',
        message: 'Save the initiative first, then save it as a template.',
      })
      return
    }

    setSavingTemplate(true)
    try {
      const organizationId =
        Number(
          initiative?.organizationId ??
            initiative?.organization_id ??
            activeOrganizationId
        ) || null

      if (!organizationId) {
        throw new Error('Missing organization id')
      }

      // Save current drawer values first so the template snapshot uses the latest title,
      // executive summary, and budget instead of older server-side data.
      const persistedPayload = mapInitiativeToApi(form, organizationId, {
        goalId: form?.goalId ?? null,
      })
      await updateInitiative(Number(form.id), persistedPayload)

      const payload = await saveInitiativeAsTemplate(Number(form.id))
      const savedTemplate = resolveTemplateEntity(payload) || payload
      const savedTemplateId = resolveTemplateId(savedTemplate)
      const savedTemplateTitle =
        resolveTemplateTitle(savedTemplate) || cleanLinkedText(form.title) || 'Initiative Template'

      if (savedTemplateId) {
        setTemplateOptions((prev) => {
          const next = Array.isArray(prev) ? [...prev] : []
          const index = next.findIndex(
            (template) => String(resolveTemplateId(template)) === String(savedTemplateId)
          )
          if (index >= 0) {
            next[index] = savedTemplate
            return next
          }
          return [savedTemplate, ...next]
        })
      }

      setToast({
        type: 'success',
        message: `Template "${savedTemplateTitle}" saved.`,
      })
    } catch {
      setToast({
        type: 'error',
        message: 'Unable to save initiative as template. Please try again.',
      })
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) {
      setTemplateError('Select a template to apply.')
      return
    }

    const selectedTemplate = templateOptions.find(
      (template) => String(resolveTemplateId(template)) === String(selectedTemplateId)
    )
    if (!selectedTemplate) {
      setTemplateError('Selected template was not found.')
      return
    }

    setApplyingTemplate(true)
    setTemplateError('')
    try {
      const appliedTemplateId = resolveTemplateId(selectedTemplate)
      let templateEntity = selectedTemplate
      let appliedInitiativeEntity = null

      if (mode === 'edit' && form?.id && isNumericLike(form.id) && isNumericLike(appliedTemplateId)) {
        const appliedPayload = await applyInitiativeTemplate(
          Number(form.id),
          Number(appliedTemplateId)
        )
        appliedInitiativeEntity = appliedPayload?.initiative || appliedPayload
      }

      try {
        const detailPayload = await getInitiativeTemplateById(appliedTemplateId)
        templateEntity = resolveTemplateEntity(detailPayload) || selectedTemplate
      } catch {
        templateEntity = selectedTemplate
      }

      const appliedTemplateTitle =
        resolveTemplateTitle(templateEntity) ||
        resolveTemplateTitle(selectedTemplate) ||
        `Template ${appliedTemplateId}`
      const appliedSummary =
        resolveTemplateSummary(appliedInitiativeEntity) || resolveTemplateSummary(templateEntity)
      const appliedActionItems = resolveTemplateActionItems(templateEntity)
      const appliedOneTimeFees = resolveTemplateOneTimeFees(
        appliedInitiativeEntity || templateEntity
      )
      const appliedRecurringFees = resolveTemplateRecurringFees(
        appliedInitiativeEntity || templateEntity
      )
      const appliedTitle =
        cleanLinkedText(appliedInitiativeEntity?.title) || appliedTemplateTitle

      setForm((prev) => ({
        ...prev,
        templateId: appliedTemplateId,
        templateTitle: appliedTemplateTitle,
        title: appliedTitle,
        summary: appliedSummary,
        actionItems: appliedActionItems,
        oneTimeFees: appliedOneTimeFees,
        recurringFees: appliedRecurringFees,
      }))

      if (form?.id) {
        const templateMap = readInitiativeTemplateMap()
        templateMap[String(form.id)] = {
          templateId: appliedTemplateId,
          templateTitle: appliedTemplateTitle,
        }
        writeInitiativeTemplateMap(templateMap)
      }

      setToast({
        type: 'success',
        message: `Template "${appliedTemplateTitle}" applied.`,
      })
      handleCloseTemplateDialog()
    } catch {
      setTemplateError('Unable to apply template. Please try again.')
    } finally {
      setApplyingTemplate(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.title.trim()) {
      return
    }
    const resolvedYear = Number(form.year) || new Date().getFullYear()
    const resolvedQuarter = form.isScheduled
      ? QUARTERS.includes(form.quarter)
        ? form.quarter
        : getQuarterFromDate(form.startDate)
      : null

    if (form?.id && form.templateId) {
      const templateMap = readInitiativeTemplateMap()
      templateMap[String(form.id)] = {
        templateId: form.templateId,
        templateTitle: cleanLinkedText(form.templateTitle || ''),
      }
      writeInitiativeTemplateMap(templateMap)
    }

    onSave({
      ...form,
      year: resolvedYear,
      quarter: resolvedQuarter || form.quarter,
      isScheduled: Boolean(form.isScheduled && resolvedQuarter),
    })
  }

  const handleDownloadPdf = async () => {
    if (mode !== 'edit' || !form?.id) {
      return
    }
    setIsDownloadingPdf(true)
    setToast(null)
    try {
      await downloadInitiativePdf(form.id)
      setToast({ type: 'success', message: 'Initiative report download started.' })
    } catch (error) {
      setToast({ type: 'error', message: formatDownloadError(error) })
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  const totalOneTime = form.oneTimeFees.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )
  const totalRecurringMonthly = form.recurringFees.reduce((sum, item) => {
    const amount = Number(item.amount || 0)
    const peopleCount = Math.max(Number(item.peopleCount || 1), 1)
    const perPersonAmount = amount * peopleCount
    if (item.frequency === 'yearly') {
      return sum + perPersonAmount / 12
    }
    return sum + perPersonAmount
  }, 0)
  const totalRecurringAnnual = totalRecurringMonthly * 12

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-14 z-50 flex justify-end bg-black/40">
      <form
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between border-b border-gray-300 px-6 py-4 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {mode === 'edit' ? 'Initiative details' : 'New initiative'}
            </h2>
            <p className="text-xs text-gray-500">Manage roadmap initiatives in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'edit' && showTemplateActions && (
              <button
                type="button"
                onClick={handleSaveAsTemplate}
                disabled={savingTemplate}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingTemplate ? 'Saving...' : 'Save as Template'}
              </button>
            )}
            {showTemplateActions && (
              <button
                type="button"
                onClick={handleOpenTemplateDialog}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Apply Template
              </button>
            )}
            <button
              type="button"
              className="ml-2 text-gray-400 hover:text-gray-600"
              onClick={onClose}
              aria-label="Close"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 bg-[rgb(248,248,250)]">
          <div className="space-y-5">
            <section className="grid gap-6 lg:grid-cols-2 rounded-lg border border-gray-300 bg-white p-4">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                  <FiFlag /> STATUS
                </label>
                <AppSelect
                  options={STATUS_OPTIONS.map((status) => ({
                    value: status,
                    label: status,
                  }))}
                  value={form.status}
                  onChange={(nextValue) => handleChange('status', nextValue)}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                  <FiFlag /> PRIORITY
                </label>
                <div className="flex items-center gap-2">
                  {PRIORITY_OPTIONS.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => handleChange('priority', priority.value)}
                      className={`rounded-md border px-4 py-2 text-sm font-semibold ${
                        form.priority === priority.value
                          ? 'border-[rgb(5,117,204)] bg-[rgb(236,245,255)] text-[rgb(5,117,204)]'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {priority.display}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2 rounded-lg border border-gray-300 bg-white p-4">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                  <FiCalendar /> SCHEDULE
                </label>
                <div className="rounded-lg border border-gray-300 p-3 w-full">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className={`inline-flex h-9 items-center rounded-md border px-3 text-sm font-semibold ${
                          form.isScheduled
                            ? 'border-[rgb(5,117,204)] bg-[rgb(236,245,255)] text-[rgb(5,117,204)]'
                            : 'border-gray-300 bg-gray-50 text-gray-500'
                        }`}
                        aria-disabled={!form.isScheduled}
                      >
                        {form.isScheduled ? 'Scheduled' : 'Not Scheduled'}
                      </div>

                      {!form.isScheduled ? (
                        <button
                          type="button"
                          onClick={() => handleScheduleSelect(form.year, form.quarter)}
                          className="inline-flex h-9 items-center justify-center rounded-md bg-[rgb(5,117,204)] px-3 text-sm font-semibold text-white hover:bg-[rgb(0,97,170)]"
                        >
                          Schedule
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleChange('isScheduled', false)}
                          className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <AppSelect
                          options={yearOptions.map((year) => ({
                            value: year,
                            label: String(year),
                          }))}
                          value={form.year ?? ''}
                          onChange={(nextValue) => handleScheduleSelect(nextValue, form.quarter)}
                          isDisabled={!form.isScheduled}
                          className="w-full"
                          size="sm"
                        />
                        <AppSelect
                          options={QUARTERS.map((quarter) => ({
                            value: quarter,
                            label: quarter,
                          }))}
                          value={form.quarter ?? ''}
                          onChange={(nextValue) => handleScheduleSelect(form.year, nextValue)}
                          isDisabled={!form.isScheduled}
                          className="w-full"
                          size="sm"
                        />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                  <FiUser /> CONTACT
                </label>
                <AppSelect
                  options={availableContacts.map((contact) => ({
                    value: contact.id,
                    label: contact.full_name,
                  }))}
                  value={form.contactId ?? ''}
                  onChange={(nextValue) => handleChange('contactId', Number(nextValue))}
                  placeholder={loadingContacts ? 'Loading contacts...' : 'Select contact'}
                  isDisabled={loadingContacts || availableContacts.length === 0}
                  className="w-full"
                />
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-gray-300 bg-white p-4">
              <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                <FiFileText /> TITLE
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => handleChange('title', event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
                required
              />
            </section>

            <section className="space-y-3 rounded-lg border border-gray-300 bg-white p-4">
              <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                <FiFileText /> EXECUTIVE SUMMARY
              </label>
              <textarea
                rows="4"
                value={form.summary}
                onChange={(event) => handleChange('summary', event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Write an executive summary for your client..."
              />
            </section>

            <section className="space-y-4 rounded-lg border border-gray-300 bg-white p-4">
              <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                <FiDollarSign /> BUDGET
              </label>
              <div className="grid gap-4">
                <div className="rounded-lg border border-gray-300 bg-white p-4">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>One-time fees</span>
                    <button
                      type="button"
                      className="text-xs text-[rgb(5,117,204)]"
                      onClick={() =>
                        handleChange('oneTimeFees', [
                          ...form.oneTimeFees,
                          { id: createId(), title: 'New item', amount: 0 },
                        ])
                      }
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {form.oneTimeFees.map((fee) => (
                      <div key={fee.id} className="flex items-center gap-3">
                        <div className="grid w-full gap-2 sm:grid-cols-[1fr_140px]">
                          <input
                            type="text"
                            value={fee.title || ''}
                            onChange={(event) =>
                                handleChange(
                                  'oneTimeFees',
                                  form.oneTimeFees.map((item) =>
                                    item.id === fee.id
                                      ? { ...item, title: event.target.value }
                                      : item
                                  )
                                )
                              }
                              className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm"
                              placeholder="Title"
                            />
                            <div className="flex items-center gap-1 rounded-md border border-gray-300 px-2 h-9 w-full">
                              <span className="text-sm text-gray-500">$</span>
                              <input
                                type="number"
                                value={fee.amount}
                                onChange={(event) =>
                                  handleChange(
                                    'oneTimeFees',
                                    form.oneTimeFees.map((item) =>
                                      item.id === fee.id
                                        ? { ...item, amount: event.target.value }
                                        : item
                                    )
                                  )
                                }
                            className="w-full text-sm focus:outline-none"
                          />
                        </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleChange(
                              'oneTimeFees',
                              form.oneTimeFees.filter((item) => item.id !== fee.id)
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50"
                          aria-label="Remove fee"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="text-xs text-gray-500">
                      Total one-time fee ${totalOneTime.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-300 bg-white p-4">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>Recurring fees</span>
                    <button
                      type="button"
                      className="text-xs text-[rgb(5,117,204)]"
                      onClick={() =>
                        handleChange('recurringFees', [
                          ...form.recurringFees,
                          {
                            id: createId(),
                            title: 'New item',
                            amount: 0,
                            frequency: 'monthly',
                            peopleCount: 1,
                          },
                        ])
                      }
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {form.recurringFees.map((fee) => (
                      <div key={fee.id} className="flex items-start gap-3">
                        <div className="grid w-full gap-3">
                          <div className="grid gap-3 sm:grid-cols-[1fr_180px] items-start">
                            <input
                              type="text"
                                value={fee.title || ''}
                                onChange={(event) =>
                                  handleChange(
                                    'recurringFees',
                                    form.recurringFees.map((item) =>
                                      item.id === fee.id
                                        ? { ...item, title: event.target.value }
                                        : item
                                    )
                                  )
                                }
                                className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm"
                                placeholder="Title"
                              />
                              <div className="flex items-center gap-1 rounded-md border border-gray-300 px-2 h-9 w-full">
                                <span className="text-sm text-gray-500">$</span>
                                <input
                                  type="number"
                                  value={fee.amount}
                                  onChange={(event) =>
                                    handleChange(
                                      'recurringFees',
                                      form.recurringFees.map((item) =>
                                        item.id === fee.id
                                          ? { ...item, amount: event.target.value }
                                          : item
                                      )
                                    )
                                  }
                                  className="w-full text-sm focus:outline-none"
                                />
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 items-start">
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-medium text-gray-500">
                                  Frequency
                                </span>
                                <AppSelect
                                  options={[
                                    { value: 'monthly', label: 'Monthly' },
                                    { value: 'yearly', label: 'Yearly' },
                                  ]}
                                  value={fee.frequency || 'monthly'}
                                  onChange={(nextValue) =>
                                    handleChange(
                                      'recurringFees',
                                      form.recurringFees.map((item) =>
                                        item.id === fee.id
                                          ? { ...item, frequency: nextValue }
                                          : item
                                      )
                                    )
                                  }
                                  className="w-full"
                                  size="sm"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-medium text-gray-500">
                                  No. of persons
                                </span>
                                <input
                                  type="number"
                                  min="1"
                                  value={fee.peopleCount || 1}
                                  onChange={(event) =>
                                    handleChange(
                                      'recurringFees',
                                      form.recurringFees.map((item) =>
                                        item.id === fee.id
                                          ? {
                                              ...item,
                                              peopleCount: Number(event.target.value || 1),
                                            }
                                          : item
                                      )
                                    )
                                  }
                                  className="h-9 w-full rounded-md border border-gray-300 px-2 text-sm"
                                  placeholder="1"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleChange(
                              'recurringFees',
                              form.recurringFees.filter((item) => item.id !== fee.id)
                            )
                          }
                          className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50"
                          aria-label="Remove fee"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <div className="mt-1 text-xs text-gray-500">
                      Monthly fee ${totalRecurringMonthly.toFixed(2)} - Annual fee $
                      {totalRecurringAnnual.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-gray-300 bg-white p-4">
              <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                <FiLink2 /> LINKED ASSESSMENTS
              </label>
              {form.linkedItems && form.linkedItems.length > 0 ? (
                <div className="space-y-2">
                  {form.linkedItems.map((item, index) => {
                    const hasAssessmentLink = Boolean(item.assessmentId)
                    const cleanTitle = cleanLinkedText(item.title) || 'Linked subcategory'
                    const responseLabel = normalizeResponseLabel(item.responseLabel) || 'Unknown'

                    return (
                      <div
                        key={`${item.assessmentId}-${item.responseId}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700"
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenLinkedAssessment(item)}
                          className={`text-left ${
                            hasAssessmentLink
                              ? 'hover:text-[rgb(5,117,204)]'
                              : 'text-gray-600 hover:text-gray-700'
                          }`}
                        >
                          <div className="font-semibold">
                            {cleanTitle}
                          </div>
                          <div className="mt-1">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getResponseBadge(
                                responseLabel
                              )}`}
                            >
                              {responseLabel}
                            </span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              linkedItems: prev.linkedItems.filter(
                                (entry, entryIndex) => entryIndex !== index
                              ),
                              linkedSubcategoryIds: prev.linkedSubcategoryIds.filter(
                                (subcategoryId) => subcategoryId !== item.subcategoryId
                              ),
                            }))
                          }
                          className="text-red-600 hover:text-red-700"
                          aria-label="Remove linked assessment"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500">No linked assessments yet.</p>
              )}
            </section>

            <section className="rounded-lg border border-gray-300 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgb(236,245,255)] text-[rgb(5,117,204)]">
                        <FiTarget className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900">Goal</div>
                        <div
                          className={`truncate text-sm ${
                            form.goalId ? 'text-gray-700' : 'text-gray-500'
                          }`}
                        >
                          {loadingGoals
                            ? 'Loading goal...'
                            : form.goalId
                              ? availableGoals.find(
                                  (goal) => String(goal.id) === String(form.goalId)
                                )?.title || `Goal #${form.goalId}`
                              : 'No goal linked'}
                        </div>
                      </div>
                    </div>

                    {form.goalId && (
                      <button
                        type="button"
                        onClick={handleViewGoal}
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        disabled={loadingGoals}
                      >
                        <FiExternalLink /> View goal
                      </button>
                    )}
                  </div>

                  {showGoalInitiativeLinks && form.goalId && (
                    <div className="mt-4">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        All initiatives in this goal
                      </div>
                      <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white">
                        {loadingGoalInitiatives ? (
                          <div className="px-3 py-2 text-xs text-gray-500">Loading...</div>
                        ) : goalInitiatives.length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-500">
                            No initiatives linked to this goal yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {goalInitiatives.map((item) => {
                              const scheduleLabel = item.isScheduled
                                ? `${item.quarter} ${item.year}`
                                : 'Not Scheduled'
                              const isCurrent = String(item.id) === String(form.id)
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() =>
                                    isCurrent ? null : handleOpenInitiativeOnRoadmap(item.id)
                                  }
                                  disabled={isCurrent}
                                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${
                                    isCurrent
                                      ? 'cursor-default bg-[rgb(248,248,250)]'
                                      : 'hover:bg-gray-50'
                                  }`}
                                  title={item.title || ''}
                                >
                                  <div className="min-w-0">
                                    <div className="truncate font-semibold text-gray-900">
                                      {item.title || 'Untitled initiative'}
                                    </div>
                                    <div className="mt-0.5 text-xs text-gray-500">
                                      {scheduleLabel} • {item.status || 'Open'}
                                      {isCurrent ? ' • Currently open' : ''}
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {goalError && <div className="text-xs text-red-600">{goalError}</div>}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-300 px-6 py-4">
          <div className="text-xs text-gray-500">
            {form.isScheduled
              ? `Scheduled for ${form.quarter} ${form.year}`
              : 'Not scheduled'}
          </div>
          <div className="flex items-center gap-3">
            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiDownload />
                {isDownloadingPdf ? 'Downloading...' : 'Download PDF'}
              </button>
            )}
            {mode === 'edit' && (
              <button
                type="button"
                onClick={() => onDelete(form.id)}
                className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[rgb(5,117,204)] px-4 py-2 text-sm font-medium text-white hover:bg-[rgb(0,97,170)]"
            >
              Save changes
            </button>
          </div>
        </div>

        {showTemplateActions && templateDialogOpen && (
          <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Apply a new template</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    This initiative&apos;s action, title, executive summary, and budget will be
                    replaced by those in the template.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseTemplateDialog}
                  className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
                  aria-label="Close apply template dialog"
                >
                  <FiX />
                </button>
              </div>

              <div className="space-y-4 px-5 py-4">
                {templateError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {templateError}
                  </div>
                )}

                <input
                  type="text"
                  value={templateSearch}
                  onChange={(event) => setTemplateSearch(event.target.value)}
                  placeholder="Search templates..."
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 placeholder:text-gray-400"
                />

                <div className="max-h-72 overflow-auto rounded-md border border-gray-200">
                  {loadingTemplates ? (
                    <div className="px-3 py-3 text-sm text-gray-500">
                      Loading initiative templates...
                    </div>
                  ) : filteredTemplateOptions.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-gray-500">
                      No initiative templates found.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredTemplateOptions.map((template) => {
                        const templateId = resolveTemplateId(template)
                        const title = resolveTemplateTitle(template) || `Template ${templateId}`
                        const description = resolveTemplateSummary(template)
                        const isSelected =
                          String(selectedTemplateId || '') === String(templateId || '')
                        return (
                          <button
                            key={String(templateId)}
                            type="button"
                            onClick={() => setSelectedTemplateId(templateId)}
                            className={`w-full px-3 py-2 text-left border-l-2 transition-colors ${
                              isSelected
                                ? 'border-l-[rgb(5,117,204)] bg-[rgb(236,245,255)]'
                                : 'border-l-transparent bg-white hover:bg-gray-50'
                            }`}
                            aria-pressed={isSelected}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-sm font-semibold text-gray-900">{title}</div>
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[rgb(5,117,204)]/10 px-2 py-0.5 text-[11px] font-semibold text-[rgb(5,117,204)]">
                                  <FiCheck className="h-3 w-3" />
                                  Selected
                                </span>
                              ) : null}
                            </div>
                            {description ? (
                              <div className="mt-1 text-xs text-gray-500">{description}</div>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
                <button
                  type="button"
                  onClick={handleCloseTemplateDialog}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyTemplate}
                  disabled={!selectedTemplateId || applyingTemplate}
                  className="rounded-md bg-[rgb(5,117,204)] px-4 py-2 text-sm font-medium text-white hover:bg-[rgb(0,97,170)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {applyingTemplate ? 'Applying...' : 'Apply Template'}
                </button>
              </div>
            </div>
          </div>
        )}
        <ToastMessage toast={toast} onClose={() => setToast(null)} />
      </form>
    </div>
  )
}

export default InitiativeDrawer
