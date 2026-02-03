import React, { useEffect, useMemo, useState } from 'react'
import {
  FiX,
  FiFlag,
  FiCalendar,
  FiUser,
  FiFileText,
  FiDollarSign,
  FiLink2,
  FiTrash2,
} from 'react-icons/fi'
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  CONTACTS,
  QUARTERS,
  createId,
  getQuarterFromDate,
  getQuarterStartDate,
} from './initiativeConstants'

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
  const [form, setForm] = useState(() => {
    if (initiative) {
      return { ...initiative, peopleCount: initiative.peopleCount ?? 1 }
    }
    const startDate = new Date().toISOString().slice(0, 10)
    const defaultQuarter = presetQuarter || getQuarterFromDate(startDate)
    const defaultYear = presetYear || new Date().getFullYear()
    return {
      id: createId(),
      title: '',
      summary: '',
      startDate,
      endDate: startDate,
      status: 'Open',
      priority: 'Medium',
      contact: CONTACTS[0],
      peopleCount: 1,
      isScheduled: true,
      year: defaultYear,
      quarter: defaultQuarter,
      budget: '',
      actionItems: [],
      goals: [],
      assets: [],
      oneTimeFees: [],
      recurringFees: [],
      linkedItems: [],
    }
  })

  useEffect(() => {
    if (!open) {
      return
    }
    if (initiative) {
      setForm({ ...initiative, peopleCount: initiative.peopleCount ?? 1 })
      return
    }
    const startDate = new Date().toISOString().slice(0, 10)
    const defaultQuarter = presetQuarter || getQuarterFromDate(startDate)
    const defaultYear = presetYear || new Date().getFullYear()
    setForm({
      id: createId(),
      title: '',
      summary: '',
      startDate,
      endDate: startDate,
      status: 'Open',
      priority: 'Medium',
      contact: CONTACTS[0],
      peopleCount: 1,
      isScheduled: true,
      year: defaultYear,
      quarter: defaultQuarter,
      budget: '',
      actionItems: [],
      goals: [],
      assets: [],
      oneTimeFees: [],
      recurringFees: [],
      linkedItems: [],
    })
  }, [initiative, open, presetQuarter, presetYear])

  const yearOptions = useMemo(() => {
    if (years?.length) {
      return years
    }
    const current = new Date().getFullYear()
    return Array.from({ length: 5 }, (_, index) => current + index)
  }, [years])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
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
    const resolvedQuarter = QUARTERS.includes(form.quarter)
      ? form.quarter
      : getQuarterFromDate(form.startDate)
    onSave({
      ...form,
      year: resolvedYear,
      quarter: resolvedQuarter,
      isScheduled: form.isScheduled || Boolean(resolvedQuarter),
      budget: form.budget ? Number(form.budget) : '',
    })
  }

  const totalOneTime = form.oneTimeFees.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )
  const totalRecurringMonthlyBase = form.recurringFees.reduce(
    (sum, item) => sum + Number(item.monthly || 0),
    0
  )
  const totalRecurringMonthly = totalRecurringMonthlyBase * Number(form.peopleCount || 1)
  const totalRecurringAnnual = totalRecurringMonthly * 12
  const totalAssets = 0

  if (!open) {
    return null
  }

  return (
    <div className="fixed top-24 left-0 right-0 bottom-0 z-50 flex justify-end bg-black/40">
      <form
        className="flex h-[calc(100vh-6rem)] w-full max-w-2xl flex-col bg-white shadow-xl"
        onSubmit={handleSubmit}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white">
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
          <div className="space-y-6">
            <section className="mt-2 grid gap-6 lg:grid-cols-[140px_1fr]">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                  <FiFlag /> STATUS
                </label>
                <select
                  value={form.status}
                  onChange={(event) => handleChange('status', event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-200 px-3 pr-8 text-sm"
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
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {priority.display}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                  <FiCalendar /> SCHEDULE
                </label>
                {!form.isScheduled ? (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => handleChange('isScheduled', true)}
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-600"
                    >
                      Not Scheduled
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 p-3 w-full">
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={form.year}
                          onChange={(event) =>
                            handleScheduleSelect(event.target.value, form.quarter)
                          }
                          className="h-9 w-full rounded-md border border-gray-200 px-3 pr-8 text-sm"
                        >
                          {yearOptions.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                        <select
                          value={form.quarter}
                          onChange={(event) =>
                            handleScheduleSelect(form.year, event.target.value)
                          }
                          className="h-9 w-full rounded-md border border-gray-200 px-3 pr-8 text-sm"
                        >
                          {QUARTERS.map((quarter) => (
                            <option key={quarter} value={quarter}>
                              {quarter}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChange('isScheduled', false)}
                        className="text-xs text-gray-500"
                      >
                        Clear schedule
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                  <FiUser /> CONTACT
                </label>
                <select
                  value={form.contact}
                  onChange={(event) => handleChange('contact', event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-200 px-3 pr-8 text-sm"
                >
                  {CONTACTS.map((contact) => (
                    <option key={contact}>{contact}</option>
                  ))}
                </select>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                  <FiFileText /> TITLE
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => handleChange('title', event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm"
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                  <FiUser /> NUMBER OF PERSONS
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.peopleCount}
                  onChange={(event) =>
                    handleChange('peopleCount', Number(event.target.value || 1))
                  }
                  className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm"
                />
              </div>
            </section>

            <section className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                <FiFileText /> EXECUTIVE SUMMARY
              </label>
              <textarea
                rows="4"
                value={form.summary}
                onChange={(event) => handleChange('summary', event.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                placeholder="Write an executive summary for your client..."
              />
            </section>

            <section className="space-y-4">
              <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                <FiDollarSign /> BUDGET
              </label>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>One-time fees</span>
                    <button
                      type="button"
                      className="text-xs text-[rgb(5,117,204)]"
                      onClick={() =>
                        handleChange('oneTimeFees', [
                          ...form.oneTimeFees,
                          { id: createId(), name: 'New item', amount: 0, type: 'flat' },
                        ])
                      }
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {form.oneTimeFees.map((fee) => (
                      <div key={fee.id} className="rounded-md border border-gray-200 p-3">
                        <div className="text-xs font-medium text-gray-500">New item</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <select
                            value={fee.type || 'flat'}
                            onChange={(event) =>
                              handleChange(
                                'oneTimeFees',
                                form.oneTimeFees.map((item) =>
                                  item.id === fee.id
                                    ? { ...item, type: event.target.value }
                                    : item
                                )
                              )
                            }
                            className="h-9 rounded-md border border-gray-200 px-2 pr-8 text-sm"
                          >
                            <option value="flat">Flat fee</option>
                            <option value="asset">Per asset</option>
                          </select>
                          <div className="flex items-center gap-1 rounded-md border border-gray-200 px-2 h-9">
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
                              className="w-20 text-sm focus:outline-none"
                            />
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          {fee.type === 'asset' ? 'Per asset' : 'Flat fee'}
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-gray-500">
                      Total one-time fee ${totalOneTime.toFixed(2)} - {totalAssets} assets
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                    <span>Recurring fees</span>
                    <button
                      type="button"
                      className="text-xs text-[rgb(5,117,204)]"
                      onClick={() =>
                        handleChange('recurringFees', [
                          ...form.recurringFees,
                          { id: createId(), name: 'New item', monthly: 0, type: 'flat' },
                        ])
                      }
                    >
                      Add
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {form.recurringFees.map((fee) => (
                      <div key={fee.id} className="rounded-md border border-gray-200 p-3">
                        <div className="text-xs font-medium text-gray-500">New item</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <select
                            value={fee.type || 'flat'}
                            onChange={(event) =>
                              handleChange(
                                'recurringFees',
                                form.recurringFees.map((item) =>
                                  item.id === fee.id
                                    ? { ...item, type: event.target.value }
                                    : item
                                )
                              )
                            }
                            className="h-9 rounded-md border border-gray-200 px-2 pr-8 text-sm"
                          >
                            <option value="flat">Flat fee</option>
                            <option value="asset">Per asset</option>
                          </select>
                          <div className="flex items-center gap-1 rounded-md border border-gray-200 px-2 h-9">
                            <span className="text-sm text-gray-500">$</span>
                            <input
                              type="number"
                              value={fee.monthly}
                              onChange={(event) =>
                                handleChange(
                                  'recurringFees',
                                  form.recurringFees.map((item) =>
                                    item.id === fee.id
                                      ? { ...item, monthly: event.target.value }
                                      : item
                                  )
                                )
                              }
                              className="w-20 text-sm focus:outline-none"
                            />
                          </div>
                          <span className="text-xs text-gray-400">Recurring monthly</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          {fee.type === 'asset' ? 'Per asset' : 'Flat fee'}
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-gray-500">
                      Per person ${totalRecurringMonthlyBase.toFixed(2)}/month - People{' '}
                      {Number(form.peopleCount || 1)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Monthly fee ${totalRecurringMonthly.toFixed(2)} - Annual fee $
                      {totalRecurringAnnual.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 inline-flex items-center gap-2">
                <FiLink2 /> LINKED ASSESSMENTS
              </label>
              {form.linkedItems && form.linkedItems.length > 0 ? (
                <div className="space-y-2">
                  {form.linkedItems.map((item, index) => (
                    <div
                      key={`${item.assessmentId}-${item.responseId}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
                    >
                      <button
                        type="button"
                        onClick={() => onLinkedAssessmentClick(item)}
                        className="text-left hover:text-[rgb(5,117,204)]"
                      >
                        <div className="font-semibold">
                          {item.categoryTitle ? `${item.categoryTitle} - ` : ''}
                          {item.title}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          Response: {item.responseLabel || 'Unknown'}
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
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <div className="text-xs text-gray-500">
            {form.isScheduled
              ? `Scheduled for ${form.quarter} ${form.year}`
              : 'Not scheduled'}
          </div>
          <div className="flex items-center gap-3">
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
              className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
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
      </form>
    </div>
  )
}

export default InitiativeDrawer
