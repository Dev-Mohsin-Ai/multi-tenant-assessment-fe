import {
  CONTACTS,
  PRIORITY_FROM_API,
  PRIORITY_TO_API,
  QUARTERS,
  STATUS_FROM_API,
  STATUS_TO_API,
  getQuarterStartDate,
  createId,
} from './initiativeConstants'

const DEFAULT_CONTACT = CONTACTS[0] || { id: 1, full_name: 'Contact' }

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
    CONTACTS.find((contact) => Number(contact.id) === Number(contactId)) ||
    DEFAULT_CONTACT

  const linkedItemsFromApi = Array.isArray(initiative.linked_subcategories)
    ? initiative.linked_subcategories.map((sub) => ({
        subcategoryId: sub.id,
        title: sub.title,
        description: sub.description,
        responseLabel: sub.score ? String(sub.score) : '',
      }))
    : []

  const linkedItems =
    options.linkedItemsById?.[initiative.id] || linkedItemsFromApi

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
      ? initiative.linked_subcategories.map((sub) => sub.id)
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
    contact_id: initiative.contactId ?? DEFAULT_CONTACT.id,
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
