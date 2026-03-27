const toArray = (value) => (Array.isArray(value) ? value : [])

const isNumericLike = (value) => /^-?\d+(\.\d+)?$/.test(String(value || '').trim())

export const formatResponseTypeLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

export const cleanLinkedText = (value) =>
  String(value ?? '')
    .replace(/\s*\(Copy\)\s*/gi, ' ')
    .trim()

export const isPlaceholderLinkedTitle = (value) => {
  const normalized = cleanLinkedText(value)
  if (!normalized) {
    return true
  }
  return (
    /^linked subcategory$/i.test(normalized) ||
    /^untitled subcategory$/i.test(normalized) ||
    /^sub\s*category\s*\d+$/i.test(normalized) ||
    /^subcategory\s*\d+$/i.test(normalized) ||
    /^question\s*\d+$/i.test(normalized)
  )
}

export const normalizeLinkedResponseLabel = (value) => {
  const normalized = cleanLinkedText(value)
  if (!normalized || isNumericLike(normalized)) {
    return ''
  }
  if (/^[a-z_]+$/.test(normalized)) {
    return formatResponseTypeLabel(normalized)
  }
  return normalized
}

export const isUnknownLinkedResponseLabel = (value) =>
  /^unknown$/i.test(normalizeLinkedResponseLabel(value))

export const resolveLinkedResponseLabel = (item = {}) => {
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
    const normalized = normalizeLinkedResponseLabel(candidate)
    if (normalized) {
      return normalized
    }
  }

  return ''
}

export const resolveLinkedSubcategoryId = (sub = {}) =>
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

export const mapLinkedSubcategoryFromApi = (sub = {}) => {
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
    responseLabel: resolveLinkedResponseLabel(sub),
  }
}

export const mapLinkedSubcategoriesFromApi = (linked = []) =>
  toArray(linked).map((sub) => mapLinkedSubcategoryFromApi(sub))

export const mapLinkedItemsFromSource = (source) => {
  const linked = Array.isArray(source)
    ? source
    : Array.isArray(source?.linked_subcategories)
      ? source.linked_subcategories
      : []

  return mapLinkedSubcategoriesFromApi(linked)
}

export const getLinkedItemKey = (item, fallbackKey = '') => {
  const primary = item?.responseId ?? item?.subcategoryId ?? item?.id
  if (primary !== null && primary !== undefined && String(primary).trim()) {
    return String(primary)
  }
  return fallbackKey
}

export const mergeLinkedItem = (existing = {}, candidate = {}) => {
  const existingTitle = cleanLinkedText(existing.title)
  const candidateTitle = cleanLinkedText(candidate.title)
  const existingCategory = cleanLinkedText(existing.categoryTitle)
  const candidateCategory = cleanLinkedText(candidate.categoryTitle)
  const existingResponseLabel = normalizeLinkedResponseLabel(existing.responseLabel)
  const candidateResponseLabel = normalizeLinkedResponseLabel(candidate.responseLabel)
  const preferredExistingResponseLabel = isUnknownLinkedResponseLabel(existingResponseLabel)
    ? ''
    : existingResponseLabel

  return {
    ...existing,
    ...candidate,
    assessmentId: existing.assessmentId || candidate.assessmentId || null,
    responseId:
      existing.responseId ||
      candidate.responseId ||
      existing.subcategoryId ||
      candidate.subcategoryId,
    subcategoryId:
      existing.subcategoryId ||
      candidate.subcategoryId ||
      existing.responseId ||
      candidate.responseId,
    title:
      existingTitle && !isPlaceholderLinkedTitle(existingTitle)
        ? existingTitle
        : candidateTitle,
    categoryTitle: existingCategory || candidateCategory,
    description: cleanLinkedText(existing.description) || cleanLinkedText(candidate.description),
    responseLabel: preferredExistingResponseLabel || candidateResponseLabel,
  }
}

export const isMeaningfulLinkedItem = (item) => {
  const title = cleanLinkedText(item?.title)
  const responseLabel = normalizeLinkedResponseLabel(item?.responseLabel)
  const hasOnlyUnknownLabel =
    (!title || isPlaceholderLinkedTitle(title)) &&
    /^unknown$/i.test(responseLabel)
  const hasMeaningfulTitle = title && !isPlaceholderLinkedTitle(title)
  return Boolean(hasMeaningfulTitle || (responseLabel && !hasOnlyUnknownLabel))
}

export const hasMeaningfulLinkedItems = (items = []) =>
  toArray(items).some((item) => isMeaningfulLinkedItem(item))
