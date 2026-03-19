import {
  PRIORITY_FROM_API,
  PRIORITY_TO_API,
  QUARTERS,
  STATUS_FROM_API,
  STATUS_TO_API,
  getQuarterStartDate,
  createId,
} from './initiativeConstants'

const DEFAULT_CONTACT = { id: null, full_name: 'Unassigned contact' }

const formatResponseTypeLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const cleanText = (value) =>
  String(value ?? '')
    .replace(/\s*\(Copy\)\s*/gi, ' ')
    .trim()

const isNumericLike = (value) => /^-?\d+(\.\d+)?$/.test(String(value || '').trim())

const isUsableTitle = (value) => {
  const normalized = cleanText(value)
  return (
    Boolean(normalized) &&
    !/^untitled subcategory$/i.test(normalized) &&
    !/^sub\s*category\s*\d+$/i.test(normalized) &&
    !/^subcategory\s*\d+$/i.test(normalized) &&
    !/^question\s*\d+$/i.test(normalized)
  )
}

const normalizeResponseLabel = (value) => {
  const normalized = cleanText(value)
  if (!normalized || isNumericLike(normalized)) {
    return ''
  }
  if (/^[a-z_]+$/.test(normalized)) {
    return formatResponseTypeLabel(normalized)
  }
  return normalized
}

const resolveResponseLabel = (item) => {
  const candidates = [
    item?.response_label,
    item?.responseLabel,
    item?.selected_response_label,
    item?.selectedResponseLabel,
    item?.selected_response?.label,
    item?.selectedResponse?.label,
    item?.response?.label,
    item?.response?.title,
    item?.selected_response?.response_type
      ? formatResponseTypeLabel(item.selected_response.response_type)
      : '',
    item?.selectedResponse?.response_type
      ? formatResponseTypeLabel(item.selectedResponse.response_type)
      : '',
    item?.selected_response_type ? formatResponseTypeLabel(item.selected_response_type) : '',
    item?.selectedResponseType ? formatResponseTypeLabel(item.selectedResponseType) : '',
    item?.response_type ? formatResponseTypeLabel(item.response_type) : '',
  ]

  for (const candidate of candidates) {
    const normalized = normalizeResponseLabel(candidate)
    if (normalized) {
      return normalized
    }
  }

  return ''
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

const mapLinkedSubcategoryFromApi = (sub = {}) => {
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

  const title = cleanText(
    sub.subcategory_title ||
      sub.subcategoryTitle ||
      sub.subcategory?.title ||
      sub.response?.subcategory?.title ||
      sub.title ||
      sub.name ||
      sub.question ||
      sub.label ||
      ''
  )

  const categoryTitle = cleanText(
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
  )

  return {
    assessmentId:
      sub.assessment_id ??
      sub.assessmentId ??
      sub.assessment?.id ??
      sub.assessment?.assessment_id ??
      null,
    responseId,
    subcategoryId: responseId,
    title,
    categoryTitle,
    description: cleanText(sub.description || ''),
    responseLabel: resolveResponseLabel(sub),
  }
}

const getLinkedItemKey = (item, fallbackKey) => {
  const primary = item?.responseId ?? item?.subcategoryId ?? item?.id
  if (primary !== null && primary !== undefined && String(primary).trim()) {
    return String(primary)
  }
  return fallbackKey
}

const mergeLinkedItem = (existing = {}, candidate = {}) => {
  const existingTitle = cleanText(existing.title)
  const candidateTitle = cleanText(candidate.title)
  const existingCategory = cleanText(existing.categoryTitle)
  const candidateCategory = cleanText(candidate.categoryTitle)
  const existingResponseLabel = normalizeResponseLabel(existing.responseLabel)
  const candidateResponseLabel = normalizeResponseLabel(candidate.responseLabel)

  return {
    ...existing,
    ...candidate,
    assessmentId: existing.assessmentId || candidate.assessmentId || null,
    responseId: existing.responseId || candidate.responseId || existing.subcategoryId || candidate.subcategoryId,
    subcategoryId:
      existing.subcategoryId || candidate.subcategoryId || existing.responseId || candidate.responseId,
    title: isUsableTitle(existingTitle) ? existingTitle : candidateTitle,
    categoryTitle: existingCategory || candidateCategory,
    description: cleanText(existing.description) || cleanText(candidate.description),
    responseLabel: existingResponseLabel || candidateResponseLabel,
  }
}

export const mapInitiativeFromApi = (initiative = {}, options = {}) => {
  const goalId = initiative.goal_id ?? initiative.goalId ?? initiative.goal?.id ?? null
  const scheduleYear = initiative.schedule_year ?? initiative.scheduleYear ?? null
  const scheduleQuarter =
    initiative.schedule_quarter ?? initiative.scheduleQuarter ?? null
  const isScheduled = Boolean(scheduleYear && scheduleQuarter)
  const resolvedYear = isScheduled ? scheduleYear : null
  const resolvedQuarter = isScheduled && QUARTERS.includes(scheduleQuarter)
    ? scheduleQuarter
    : null
  const contactId =
    initiative.contact_id ??
    initiative.contactId ??
    initiative.contact_user?.id ??
    DEFAULT_CONTACT.id
  const contactUser =
    initiative.contact_user ||
    DEFAULT_CONTACT

  const linkedItemsFromApi = Array.isArray(initiative.linked_subcategories)
    ? initiative.linked_subcategories.map((sub) => mapLinkedSubcategoryFromApi(sub))
    : []

  const optionLinkedItems = Array.isArray(options.linkedItemsById?.[initiative.id])
    ? options.linkedItemsById[initiative.id]
    : []

  const linkedItemsMap = new Map()

  linkedItemsFromApi.forEach((item, index) => {
    const key = getLinkedItemKey(item, `api-${index}`)
    linkedItemsMap.set(key, mergeLinkedItem({}, item))
  })

  optionLinkedItems.forEach((item, index) => {
    const key = getLinkedItemKey(item, `fallback-${index}`)
    linkedItemsMap.set(key, mergeLinkedItem(linkedItemsMap.get(key), item))
  })

  const linkedItems = Array.from(linkedItemsMap.values())

  return {
    id: initiative.id ?? createId(),
    title: initiative.title || '',
    summary: initiative.executive_summary || '',
    goalId,
    status: STATUS_FROM_API[initiative.status] || 'Open',
    priority: PRIORITY_FROM_API[initiative.priority] || 'Medium',
    contactId,
    contactName: contactUser?.full_name || DEFAULT_CONTACT.full_name,
    isScheduled,
    year: resolvedYear,
    quarter: resolvedQuarter,
    startDate:
      isScheduled && resolvedYear && resolvedQuarter
        ? getQuarterStartDate(resolvedYear, resolvedQuarter)
        : null,
    oneTimeFees: (initiative.one_time_fees || []).map((fee) => ({
      id: fee.id ?? createId(),
      title: fee.title || '',
      amount: fee.amount ?? 0,
    })),
    recurringFees: (initiative.recurring_fees || []).map((fee) => ({
      id: fee.id ?? createId(),
      title: fee.title || '',
      amount: fee.amount ?? 0,
      frequency: fee.frequency || 'monthly',
      peopleCount: fee.number_of_persons ?? 1,
    })),
    linkedItems,
    linkedSubcategoryIds: Array.isArray(initiative.linked_subcategories)
      ? initiative.linked_subcategories
          .map(
            (sub) =>
              sub && typeof sub === 'object'
                ? resolveLinkedSubcategoryId(sub)
                : sub
          )
          .filter(Boolean)
      : [],
  }
}

export const mapInitiativeToApi = (initiative, organizationId, options = {}) => {
  const resolvedOrgId = Number(organizationId)
  const payload = {
    title: initiative.title || '',
    executive_summary: initiative.summary || '',
    status: STATUS_TO_API[initiative.status] || 'open',
    priority: PRIORITY_TO_API[initiative.priority] ?? 2,
    schedule_year: initiative.isScheduled ? Number(initiative.year) : null,
    schedule_quarter: initiative.isScheduled ? initiative.quarter : null,
    contact_id: initiative.contactId ?? null,
    organization_id: Number.isNaN(resolvedOrgId) ? null : resolvedOrgId,
    one_time_fees: (initiative.oneTimeFees || []).map((fee) => ({
      title: fee.title || '',
      amount: Number(fee.amount || 0),
    })),
    recurring_fees: (initiative.recurringFees || []).map((fee) => ({
      title: fee.title || '',
      amount: Number(fee.amount || 0),
      frequency: fee.frequency || 'monthly',
      number_of_persons: Math.max(Number(fee.peopleCount || 1), 1),
    })),
    linked_subcategory_ids: Array.isArray(initiative.linkedSubcategoryIds)
      ? initiative.linkedSubcategoryIds
      : [],
  }

  if (Object.prototype.hasOwnProperty.call(options, 'goalId')) {
    payload.goal_id = options.goalId ?? null
  }

  return payload
}
