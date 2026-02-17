import React, { useEffect, useMemo, useState } from 'react'
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
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  CONTACTS,
  QUARTERS,
  createId,
  getQuarterFromDate,
  getQuarterStartDate,
} from './initiativeConstants'
import { getGoals } from '../../shared/services/goalService'
import { downloadInitiativePdf } from '../../shared/services/reportService'
import { useAppStore } from '../../shared/store/useAppStore'
import ToastMessage from '../../shared/components/ToastMessage'

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
  onLinkedAssessmentClick = () => {},
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
    const normalized = String(label || '').toLowerCase()
    if (normalized.includes('at risk')) {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    if (normalized.includes('needs attention')) {
      return 'bg-orange-100 text-orange-800 border-orange-200'
    }
    if (normalized.includes('acceptable')) {
      return 'bg-amber-100 text-amber-800 border-amber-200'
    }
    if (normalized.includes('satisfactory') || normalized === 'yes') {
      return 'bg-green-100 text-green-800 border-green-200'
    }
    if (normalized === 'no') {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    if (normalized.includes('unknown')) {
      return 'bg-gray-100 text-gray-700 border-gray-200'
    }
    if (normalized.includes('not applicable')) {
      return 'bg-purple-100 text-purple-800 border-purple-200'
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
      contactId: CONTACTS[0]?.id || 1,
      goalId: null,
      isScheduled: hasPresetSchedule,
      year: defaultYear,
      quarter: defaultQuarter,
      actionItems: [],
      goals: [],
      assets: [],
      oneTimeFees: [],
      recurringFees: [],
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
  const [loadingGoals, setLoadingGoals] = useState(false)
  const [goalError, setGoalError] = useState('')
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [toast, setToast] = useState(null)
  const [showGoalInitiativeLinks] = useState(false)
  const loadingGoalInitiatives = false
  const goalInitiatives = []
  const handleOpenInitiativeOnRoadmap = () => {}

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
      setGoalError('')
    })

    getGoals({ organization_id: organizationId })
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.goals || []
        if (!isActive) {
          return
        }
        setAvailableGoals(list)
      })
      .catch(() => {
        if (!isActive) {
          return
        }
        setGoalError('Unable to load goals')
      })
      .finally(() => {
        if (!isActive) {
          return
        }
        setLoadingGoals(false)
      })

    return () => {
      isActive = false
    }
  }, [activeOrganizationId, open])

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

  const handleScheduleSelect = (year, quarter) => {
    const resolvedYear = Number(year)
    const resolvedQuarter = quarter || QUARTERS[0]
    const startDate = getQuarterStartDate(resolvedYear, resolvedQuarter)
    setForm((prev) => ({
      ...prev,
      isScheduled: true,
      year: resolvedYear,
      quarter: resolvedQuarter,
      startDate,
    }))
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
                <select
                  value={form.status}
                  onChange={(event) => handleChange('status', event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 px-3 pr-8 text-sm"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
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
                      <select
                        value={form.year}
                        onChange={(event) => handleScheduleSelect(event.target.value, form.quarter)}
                        className="h-9 w-full rounded-md border border-gray-300 px-3 pr-8 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        disabled={!form.isScheduled}
                      >
                        {yearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                      <select
                        value={form.quarter}
                        onChange={(event) => handleScheduleSelect(form.year, event.target.value)}
                        className="h-9 w-full rounded-md border border-gray-300 px-3 pr-8 text-sm disabled:bg-gray-50 disabled:text-gray-500"
                        disabled={!form.isScheduled}
                      >
                        {QUARTERS.map((quarter) => (
                          <option key={quarter} value={quarter}>
                            {quarter}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                  <FiUser /> CONTACT
                </label>
                <select
                  value={form.contactId}
                  onChange={(event) => handleChange('contactId', Number(event.target.value))}
                  className="h-10 w-full rounded-md border border-gray-300 px-3 pr-8 text-sm"
                >
                  {CONTACTS.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name}
                    </option>
                  ))}
                </select>
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
                                <select
                                  value={fee.frequency || 'monthly'}
                                  onChange={(event) =>
                                    handleChange(
                                      'recurringFees',
                                      form.recurringFees.map((item) =>
                                        item.id === fee.id
                                          ? { ...item, frequency: event.target.value }
                                          : item
                                      )
                                    )
                                  }
                                  className="h-9 w-full rounded-md border border-gray-300 px-2 pr-10 text-sm"
                                >
                                  <option value="monthly">Monthly</option>
                                  <option value="yearly">Yearly</option>
                                </select>
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
                  {form.linkedItems.map((item, index) => (
                    <div
                      key={`${item.assessmentId}-${item.responseId}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700"
                    >
                      <button
                        type="button"
                        onClick={() => onLinkedAssessmentClick(item)}
                        className="text-left hover:text-[rgb(5,117,204)]"
                      >
                        <div className="font-semibold">
                          {item.categoryTitle
                            ? `${String(item.categoryTitle).replace(/\s*\(Copy\)\s*/gi, '').trim()} - `
                            : ''}
                          {String(item.title).replace(/\s*\(Copy\)\s*/gi, '').trim()}
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getResponseBadge(
                              item.responseLabel
                            )}`}
                          >
                            {item.responseLabel || 'Unknown'}
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
                                    (subcategoryId) =>
                                      subcategoryId !== item.subcategoryId
                                  ),
                                }))
                              }
                        className="text-red-600 hover:text-red-700"
                        aria-label="Remove linked assessment"
                      >
                        <FiTrash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
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
        <ToastMessage toast={toast} onClose={() => setToast(null)} />
      </form>
    </div>
  )
}

export default InitiativeDrawer
