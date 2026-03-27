import {
  PRIORITY_FROM_API,
  PRIORITY_TO_API,
  QUARTERS,
  STATUS_FROM_API,
  STATUS_TO_API,
  getQuarterStartDate,
  createId,
} from './initiativeConstants'
import {
  getLinkedItemKey,
  mapLinkedSubcategoriesFromApi,
  mapLinkedSubcategoryFromApi,
  mergeLinkedItem,
  resolveLinkedSubcategoryId,
} from '../../shared/utils/linkedAssessments'

const DEFAULT_CONTACT = { id: null, full_name: 'Unassigned contact' }

const cleanText = (value) =>
  String(value ?? '')
    .replace(/\s*\(Copy\)\s*/gi, ' ')
    .trim()

const toArray = (value) => (Array.isArray(value) ? value : [])

const firstDefined = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      return value
    }
  }
  return undefined
}

export const resolveInitiativeEntity = (initiative = {}) =>
  initiative && typeof initiative === 'object' && initiative.initiative
    ? initiative.initiative
    : initiative
export { mapLinkedSubcategoryFromApi, mapLinkedSubcategoriesFromApi }

export const mapInitiativeFromApi = (initiative = {}, options = {}) => {
  const source = resolveInitiativeEntity(initiative)
  const goalId = source.goal_id ?? source.goalId ?? source.goal?.id ?? null
  const scheduleYear = source.schedule_year ?? source.scheduleYear ?? null
  const scheduleQuarter =
    source.schedule_quarter ?? source.scheduleQuarter ?? null
  const isScheduled = Boolean(scheduleYear && scheduleQuarter)
  const resolvedYear = isScheduled ? scheduleYear : null
  const resolvedQuarter = isScheduled && QUARTERS.includes(scheduleQuarter)
    ? scheduleQuarter
    : null
  const contactId =
    source.contact_id ??
    source.contactId ??
    source.contact_user?.id ??
    DEFAULT_CONTACT.id
  const contactUser =
    source.contact_user ||
    source.contactUser ||
    DEFAULT_CONTACT

  const resolvedSummary = cleanText(
    firstDefined(
      source.executive_summary,
      source.executiveSummary,
      source.summary,
      source.description,
      ''
    )
  )

  const resolvedOneTimeFees = toArray(
    source.one_time_fees ||
      source.oneTimeFees ||
      source.one_time_budget ||
      source.oneTimeBudget ||
      source.budget?.one_time_fees ||
      source.budget?.oneTimeFees
  )

  const resolvedRecurringFees = toArray(
    source.recurring_fees ||
      source.recurringFees ||
      source.recurring_budget ||
      source.recurringBudget ||
      source.budget?.recurring_fees ||
      source.budget?.recurringFees
  )

  const linkedItemsFromApi = mapLinkedSubcategoriesFromApi(source.linked_subcategories)

  const optionLinkedItems = Array.isArray(options.linkedItemsById?.[source.id])
    ? options.linkedItemsById[source.id]
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
    id: source.id ?? createId(),
    title: source.title || '',
    summary: resolvedSummary,
    goalId,
    status: STATUS_FROM_API[source.status] || 'Open',
    priority: PRIORITY_FROM_API[source.priority] || 'Medium',
    contactId,
    contactName: contactUser?.full_name || DEFAULT_CONTACT.full_name,
    isScheduled,
    year: resolvedYear,
    quarter: resolvedQuarter,
    startDate:
      isScheduled && resolvedYear && resolvedQuarter
        ? getQuarterStartDate(resolvedYear, resolvedQuarter)
        : null,
    oneTimeFees: resolvedOneTimeFees.map((fee) => ({
      id: fee.id ?? createId(),
      title: fee.title || '',
      amount: fee.amount ?? 0,
    })),
    recurringFees: resolvedRecurringFees.map((fee) => ({
      id: fee.id ?? createId(),
      title: fee.title || '',
      amount: fee.amount ?? 0,
      frequency: fee.frequency || 'monthly',
      peopleCount: fee.number_of_persons ?? 1,
    })),
    linkedItems,
    linkedSubcategoryIds: Array.isArray(source.linked_subcategories)
      ? source.linked_subcategories
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
