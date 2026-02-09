import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiCheck,
  FiCalendar,
  FiChevronDown,
  FiChevronRight,
  FiChevronUp,
  FiClock,
  FiMoreVertical,
  FiPlus,
  FiTarget,
  FiX,
} from 'react-icons/fi'
import { createInitiative, getInitiatives } from '../../shared/services/initiativeService'
import { mapInitiativeFromApi, mapInitiativeToApi } from '../roadmap/initiativeMapper'
import { CONTACTS, PRIORITY_OPTIONS, QUARTERS, STATUS_OPTIONS } from '../roadmap/initiativeConstants'

const TAB_OPTIONS = [
  { id: 'ongoing', label: 'Ongoing', icon: <FiTarget /> },
  { id: 'overdue', label: 'Overdue', icon: <FiClock /> },
  { id: 'completed', label: 'Completed', icon: <FiCheck /> },
]

const getQuarterIndex = (quarter) => Math.max(0, QUARTERS.indexOf(quarter))

const getQuarterEnd = (year, quarter) => {
  const quarterIndex = getQuarterIndex(quarter)
  const endMonth = quarterIndex * 3 + 3
  return new Date(Number(year), endMonth, 0, 23, 59, 59, 999)
}

const getTabForGoal = (goal) => {
  if (goal.completed) {
    return 'completed'
  }
  const due = getQuarterEnd(goal.targetYear, goal.targetQuarter)
  return due.getTime() < Date.now() ? 'overdue' : 'ongoing'
}

const buildScheduleOptions = (years) =>
  years.flatMap((year) => QUARTERS.map((quarter) => `${quarter}, ${year}`))

const Goals = () => {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => currentYear - 1 + index),
    [currentYear]
  )
  const scheduleOptions = useMemo(() => buildScheduleOptions(yearOptions), [yearOptions])

  const [activeTab, setActiveTab] = useState('ongoing')
  const [filters, setFilters] = useState({
    status: 'All status',
    year: 'All year',
    period: 'All period',
  })

  const [availableInitiatives, setAvailableInitiatives] = useState([])
  const [loadingInitiatives, setLoadingInitiatives] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [goals, setGoals] = useState(() => [])

  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [dialogState, setDialogState] = useState(() => ({
    open: false,
    context: 'create', // 'create' | 'link'
    goalId: null,
    mode: 'existing', // 'existing' | 'new'
    goalTitle: '',
    goalStatus: 'On Track',
    targetYear: currentYear,
    targetQuarter: 'Q1',
    existingInitiativeId: '',
    newInitiativeTitle: '',
    newInitiativePocId: CONTACTS[0]?.id || 1,
    error: '',
    saving: false,
  }))
  const [rowMenu, setRowMenu] = useState(null)
  const [goalMenuId, setGoalMenuId] = useState(null)

  const loadInitiatives = useCallback(async () => {
    const organizationId = Number(localStorage.getItem('activeOrganizationId'))
    if (!organizationId) {
      setAvailableInitiatives([])
      return
    }
    setLoadingInitiatives(true)
    setLoadError('')
    try {
      const data = await getInitiatives({ organization_id: organizationId })
      const list = Array.isArray(data) ? data : data?.initiatives || []
      setAvailableInitiatives(list.map((item) => mapInitiativeFromApi(item)))
    } catch {
      setLoadError('Unable to load initiatives')
    } finally {
      setLoadingInitiatives(false)
    }
  }, [])

  useEffect(() => {
    loadInitiatives()
  }, [loadInitiatives])

  useEffect(() => {
    if (!rowMenu && !goalMenuId) {
      return
    }
    const handleWindowClick = () => {
      setRowMenu(null)
      setGoalMenuId(null)
    }
    window.addEventListener('click', handleWindowClick)
    return () => window.removeEventListener('click', handleWindowClick)
  }, [goalMenuId, rowMenu])

  const filteredGoals = useMemo(() => {
    const tabFiltered = goals.filter((goal) => getTabForGoal(goal) === activeTab)
    return tabFiltered.filter((goal) => {
      const matchesStatus =
        filters.status === 'All status' ||
        String(goal.statusLabel || '').toLowerCase() === String(filters.status).toLowerCase()
      const matchesYear =
        filters.year === 'All year' || String(goal.targetYear) === String(filters.year)
      const matchesPeriod =
        filters.period === 'All period' || String(goal.targetQuarter) === String(filters.period)
      return matchesStatus && matchesYear && matchesPeriod
    })
  }, [activeTab, filters.period, filters.status, filters.year, goals])

  const isAllExpanded = useMemo(() => {
    if (filteredGoals.length === 0) {
      return false
    }
    return filteredGoals.every((goal) => expandedIds.has(goal.id))
  }, [expandedIds, filteredGoals])

  const handleToggleExpandAll = () => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (isAllExpanded) {
        filteredGoals.forEach((goal) => next.delete(goal.id))
      } else {
        filteredGoals.forEach((goal) => next.add(goal.id))
      }
      return next
    })
  }

  const handleClearAll = () => {
    setFilters({ status: 'All status', year: 'All year', period: 'All period' })
  }

  const handleToggleExpanded = (goalId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(goalId)) {
        next.delete(goalId)
      } else {
        next.add(goalId)
      }
      return next
    })
  }

  const openGoalDialog = (nextState) => {
    setDialogState((prev) => ({
      ...prev,
      open: true,
      error: '',
      saving: false,
      ...nextState,
    }))
  }

  const closeGoalDialog = () => {
    setDialogState((prev) => ({ ...prev, open: false, saving: false, error: '' }))
  }

  const handleOpenNewGoal = () => {
    openGoalDialog({
      context: 'create',
      goalId: null,
      mode: 'existing',
      goalTitle: '',
      goalStatus: 'On Track',
      targetYear: currentYear,
      targetQuarter: 'Q1',
      existingInitiativeId: '',
      newInitiativeTitle: '',
      newInitiativePocId: CONTACTS[0]?.id || 1,
    })
  }

  const handleOpenLinkGoal = (goal) => {
    openGoalDialog({
      context: 'link',
      goalId: goal.id,
      mode: 'existing',
      goalTitle: goal.title || '',
      goalStatus: goal.statusLabel || 'On Track',
      targetYear: goal.targetYear || currentYear,
      targetQuarter: goal.targetQuarter || 'Q1',
      existingInitiativeId: '',
      newInitiativeTitle: '',
      newInitiativePocId: CONTACTS[0]?.id || 1,
    })
  }

  const linkInitiativeToGoal = useCallback((goalId, initiative) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) {
          return goal
        }
        const existing = goal.initiatives || []
        const alreadyLinked = existing.some(
          (item) => String(item.id) === String(initiative.id)
        )
        if (alreadyLinked) {
          return goal
        }
        return { ...goal, initiatives: [...existing, initiative] }
      })
    )
  }, [])

  const upsertGoalFromDialog = useCallback(
    (draftGoal, linkedInitiative) => {
      const tab = getTabForGoal(draftGoal)
      const completed = tab === 'completed' || draftGoal.completed
      const resolvedGoal = { ...draftGoal, completed }

      if (dialogState.context === 'create') {
        const id = `goal-${Date.now()}`
        const created = {
          ...resolvedGoal,
          id,
          initiatives: linkedInitiative ? [linkedInitiative] : [],
        }
        setGoals((prev) => [created, ...prev])
        setExpandedIds((prev) => new Set([...prev, id]))
        setActiveTab(getTabForGoal(created))
        return { goalId: id }
      }

      if (dialogState.goalId) {
        setGoals((prev) =>
          prev.map((goal) =>
            goal.id === dialogState.goalId ? { ...goal, ...resolvedGoal } : goal
          )
        )
        if (linkedInitiative) {
          linkInitiativeToGoal(dialogState.goalId, linkedInitiative)
        }
        setExpandedIds((prev) => new Set([...prev, dialogState.goalId]))
        return { goalId: dialogState.goalId }
      }

      return { goalId: null }
    },
    [dialogState.context, dialogState.goalId, linkInitiativeToGoal]
  )

  const handleSaveDialog = async ({ viewAfterSave }) => {
    const title = dialogState.goalTitle.trim()
    if (!title) {
      setDialogState((prev) => ({ ...prev, error: 'Goal title is required.' }))
      return
    }

    setDialogState((prev) => ({ ...prev, saving: true, error: '' }))

    try {
      let linkedInitiative = null

      if (dialogState.mode === 'existing') {
        if (!dialogState.existingInitiativeId) {
          setDialogState((prev) => ({
            ...prev,
            saving: false,
            error: 'Select an initiative to continue.',
          }))
          return
        }
        linkedInitiative =
          availableInitiatives.find(
            (item) => String(item.id) === String(dialogState.existingInitiativeId)
          ) || null
        if (!linkedInitiative) {
          setDialogState((prev) => ({
            ...prev,
            saving: false,
            error: 'Selected initiative was not found.',
          }))
          return
        }
      } else {
        const organizationId = Number(localStorage.getItem('activeOrganizationId'))
        if (!organizationId) {
          setDialogState((prev) => ({
            ...prev,
            saving: false,
            error: 'Select a client before creating initiatives.',
          }))
          return
        }
        const initiativeTitle = dialogState.newInitiativeTitle.trim()
        if (!initiativeTitle) {
          setDialogState((prev) => ({
            ...prev,
            saving: false,
            error: 'Initiative title is required.',
          }))
          return
        }
        const payload = mapInitiativeToApi(
          {
            title: initiativeTitle,
            summary: '',
            status: 'Open',
            priority: 'Medium',
            isScheduled: true,
            year: dialogState.targetYear,
            quarter: dialogState.targetQuarter,
            contactId: dialogState.newInitiativePocId,
            oneTimeFees: [],
            recurringFees: [],
            linkedSubcategoryIds: [],
          },
          organizationId
        )
        const created = await createInitiative(payload)
        linkedInitiative = mapInitiativeFromApi(created)
        setAvailableInitiatives((prev) => [linkedInitiative, ...prev])
      }

      const draftGoal = {
        title,
        targetYear: dialogState.targetYear,
        targetQuarter: dialogState.targetQuarter,
        statusLabel: dialogState.goalStatus,
        completed: dialogState.goalStatus === 'Completed',
        initiatives: [],
      }

      const { goalId } = upsertGoalFromDialog(draftGoal, linkedInitiative)

      closeGoalDialog()

      if (viewAfterSave && linkedInitiative?.id) {
        localStorage.setItem('openInitiativeId', String(linkedInitiative.id))
        navigate('/roadmap')
      } else if (goalId && dialogState.context === 'create') {
        // keep the new goal expanded in place
      }
    } catch {
      setDialogState((prev) => ({
        ...prev,
        saving: false,
        error: 'Unable to save. Please try again.',
      }))
    } finally {
      setDialogState((prev) => ({ ...prev, saving: false }))
    }
  }

  const handleUnlinkInitiative = (goalId, initiativeId) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) {
          return goal
        }
        return {
          ...goal,
          initiatives: (goal.initiatives || []).filter(
            (item) => String(item.id) !== String(initiativeId)
          ),
        }
      })
    )
  }

  const handleRemoveGoal = (goalId) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId))
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.delete(goalId)
      return next
    })
    setRowMenu((prev) => (prev?.goalId === goalId ? null : prev))
    setGoalMenuId((prev) => (prev === goalId ? null : prev))
    setDialogState((prev) => (prev.goalId === goalId ? { ...prev, open: false } : prev))
  }

  const handleUpdateInitiativeField = (goalId, initiativeId, field, value) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) {
          return goal
        }
        return {
          ...goal,
          initiatives: (goal.initiatives || []).map((initiative) =>
            String(initiative.id) === String(initiativeId)
              ? { ...initiative, [field]: value }
              : initiative
          ),
        }
      })
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-6 border-b border-gray-200">
        {TAB_OPTIONS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 px-2 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'border-[rgb(5,117,204)] text-[rgb(5,117,204)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="rounded-xl border border-gray-200 bg-[rgb(248,248,250)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">Status</div>
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, status: event.target.value }))
                }
                className="h-10 w-80 max-w-full rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700"
              >
                <option>All status</option>
                <option>On Track</option>
                <option>At Risk</option>
                <option>Off Track</option>
                <option>Completed</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">Target Period</div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filters.year}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, year: event.target.value }))
                  }
                  className="h-10 w-48 rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700"
                >
                  <option>All year</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.period}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, period: event.target.value }))
                  }
                  className="h-10 w-48 rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700"
                >
                  <option>All period</option>
                  {QUARTERS.map((quarter) => (
                    <option key={quarter} value={quarter}>
                      {quarter}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-sm font-semibold text-[rgb(5,117,204)] hover:underline"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleExpandAll}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200">
                <span className="h-2 w-4 rounded-sm bg-gray-700" />
              </span>
              {isAllExpanded ? 'Collapse all' : 'Expand all'}
            </button>
            <button
              type="button"
              onClick={handleOpenNewGoal}
              className="inline-flex items-center gap-2 rounded-md bg-[rgb(5,117,204)] px-4 py-2 text-sm font-semibold text-white hover:bg-[rgb(0,97,170)]"
            >
              <FiPlus className="text-lg" /> New Goal
            </button>
          </div>
        </div>
      </div>

      {(loadError || loadingInitiatives) && (
        <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          {loadingInitiatives ? 'Loading initiatives...' : loadError}
        </div>
      )}

      {filteredGoals.map((goal) => {
        const isExpanded = expandedIds.has(goal.id)
        const linkedInitiatives = goal.initiatives || []
        return (
          <div key={goal.id} className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between px-6 py-5">
              <button
                type="button"
                onClick={() => handleToggleExpanded(goal.id)}
                className="inline-flex items-center gap-4 text-left"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-700">
                  {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                </span>
                <div className="text-2xl font-semibold text-gray-900">{goal.title}</div>
              </button>

              {isExpanded && (
              <div className="flex items-center gap-4">
                <span className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
                  <FiChevronRight />
                  {goal.statusLabel || 'On Track'}
                  <FiChevronDown className="text-green-700" />
                </span>

                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <FiCalendar />
                  {goal.targetYear}
                </span>

                <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                    {Math.min(linkedInitiatives.length, 9)}
                  </span>
                </span>

                <div className="relative">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setGoalMenuId((prev) => (prev === goal.id ? null : goal.id))
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50"
                    aria-label="Goal actions"
                  >
                    <FiMoreVertical className="text-xl" />
                  </button>
                  {goalMenuId === goal.id && (
                    <div
                      className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveGoal(goal.id)}
                        className="w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove goal
                      </button>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>

            {isExpanded && (
              <div className="border-t border-gray-200 px-6 py-6">
                <div className="overflow-visible rounded-lg border border-gray-200 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white">
                      <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-semibold [&>th]:text-gray-900 border-b border-gray-200">
                        <th className="w-[44%]">Initiative</th>
                        <th>Status</th>
                        <th>Scheduled</th>
                        <th>POC</th>
                        <th>Priority</th>
                        <th className="w-[10%]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedInitiatives.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-6 text-sm text-gray-500 bg-[rgb(248,248,250)]"
                          >
                            No initiatives linked yet.
                          </td>
                        </tr>
                      ) : (
                        linkedInitiatives.map((initiative) => {
                          const statusValue = initiative.status || STATUS_OPTIONS[0]
                          const scheduleValue = initiative.isScheduled
                            ? `${initiative.quarter}, ${initiative.year}`
                            : scheduleOptions[0]
                          const contactName =
                            initiative.contactName ||
                            CONTACTS.find((contact) => Number(contact.id) === Number(initiative.contactId))
                              ?.full_name ||
                            '—'
                          const priorityValue = initiative.priority || PRIORITY_OPTIONS[0]?.value

                          return (
                            <tr
                              key={initiative.id}
                              className="border-b border-gray-200 bg-[rgb(248,248,250)]"
                            >
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  className="text-[rgb(5,117,204)] hover:underline"
                                >
                                  {initiative.title || 'Untitled initiative'}
                                </button>
                              </td>
                              <td className="px-4 py-4">
                                <select
                                  value={statusValue}
                                  onChange={(event) =>
                                    handleUpdateInitiativeField(
                                      goal.id,
                                      initiative.id,
                                      'status',
                                      event.target.value
                                    )
                                  }
                                  className="h-10 w-44 rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700"
                                >
                                  {STATUS_OPTIONS.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-4">
                                <select
                                  value={scheduleValue}
                                  onChange={(event) => {
                                    const [quarterRaw, yearRaw] = String(event.target.value).split(',')
                                    const quarter = quarterRaw?.trim()
                                    const year = Number(String(yearRaw || '').trim())
                                    handleUpdateInitiativeField(goal.id, initiative.id, 'quarter', quarter)
                                    handleUpdateInitiativeField(goal.id, initiative.id, 'year', year)
                                    handleUpdateInitiativeField(goal.id, initiative.id, 'isScheduled', true)
                                  }}
                                  className="h-10 w-40 rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700"
                                >
                                  {scheduleOptions.map((label) => (
                                    <option key={label} value={label}>
                                      {label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-900">{contactName}</td>
                              <td className="px-4 py-4">
                                <select
                                  value={priorityValue}
                                  onChange={(event) =>
                                    handleUpdateInitiativeField(
                                      goal.id,
                                      initiative.id,
                                      'priority',
                                      event.target.value
                                    )
                                  }
                                  className="h-10 w-20 rounded-md border border-gray-200 bg-white px-3 pr-8 text-sm text-gray-700"
                                >
                                  {PRIORITY_OPTIONS.map((priority) => (
                                    <option key={priority.value} value={priority.value}>
                                      {priority.display}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-4">
                                <div className="relative flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      setRowMenu({
                                        goalId: goal.id,
                                        initiativeId: initiative.id,
                                      })
                                    }}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                                    aria-label="Row actions"
                                  >
                                    <FiMoreVertical className="text-xl" />
                                  </button>
                                  {rowMenu?.goalId === goal.id &&
                                    rowMenu?.initiativeId === initiative.id && (
                                      <div
                                        className="absolute right-0 top-10 z-50 w-44 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
                                        onClick={(event) => event.stopPropagation()}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            localStorage.setItem(
                                              'openInitiativeId',
                                              String(initiative.id)
                                            )
                                            setRowMenu(null)
                                            navigate('/roadmap')
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                          View on Roadmap
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUnlinkInitiative(goal.id, initiative.id)
                                            setRowMenu(null)
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                                        >
                                          Unlink Initiative
                                        </button>
                                      </div>
                                    )}
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => handleOpenLinkGoal(goal)}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <FiPlus className="text-lg" /> New link
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {filteredGoals.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center text-sm text-gray-500">
          No goals found.
        </div>
      )}

      {dialogState.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeGoalDialog()
            }
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
              <div className="pr-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Add this Goal to an Initiative
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  You can either add this Goal to an existing Initiative for this client or create a new one.
                </p>
              </div>
              <button
                type="button"
                onClick={closeGoalDialog}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:bg-gray-50"
                aria-label="Close dialog"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {dialogState.error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {dialogState.error}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-900">Goal title</div>
                  <input
                    value={dialogState.goalTitle}
                    onChange={(event) =>
                      setDialogState((prev) => ({ ...prev, goalTitle: event.target.value }))
                    }
                    className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700"
                    placeholder="e.g. SOC2 Compliance"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-900">Goal status</div>
                  <select
                    value={dialogState.goalStatus}
                    onChange={(event) =>
                      setDialogState((prev) => ({ ...prev, goalStatus: event.target.value }))
                    }
                    className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700"
                  >
                    <option>On Track</option>
                    <option>At Risk</option>
                    <option>Off Track</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-900">Target year</div>
                  <select
                    value={dialogState.targetYear}
                    onChange={(event) =>
                      setDialogState((prev) => ({ ...prev, targetYear: Number(event.target.value) }))
                    }
                    className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-900">Target period</div>
                  <select
                    value={dialogState.targetQuarter}
                    onChange={(event) =>
                      setDialogState((prev) => ({ ...prev, targetQuarter: event.target.value }))
                    }
                    className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700"
                  >
                    {QUARTERS.map((quarter) => (
                      <option key={quarter} value={quarter}>
                        {quarter}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900">Add to</div>
                <div className="inline-flex overflow-hidden rounded-md border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setDialogState((prev) => ({ ...prev, mode: 'existing' }))}
                    className={`px-4 py-2 text-sm font-semibold ${
                      dialogState.mode === 'existing'
                        ? 'bg-[rgb(236,245,255)] text-[rgb(5,117,204)]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Existing Initiative
                  </button>
                  <button
                    type="button"
                    onClick={() => setDialogState((prev) => ({ ...prev, mode: 'new' }))}
                    className={`px-4 py-2 text-sm font-semibold ${
                      dialogState.mode === 'new'
                        ? 'bg-[rgb(236,245,255)] text-[rgb(5,117,204)]'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    New Initiative
                  </button>
                </div>
              </div>

              {dialogState.mode === 'existing' ? (
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-900">Existing Initiative</div>
                  <select
                    value={dialogState.existingInitiativeId}
                    onChange={(event) =>
                      setDialogState((prev) => ({
                        ...prev,
                        existingInitiativeId: event.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700"
                  >
                    <option value="">Select initiative</option>
                    {availableInitiatives.map((initiative) => (
                      <option key={initiative.id} value={initiative.id}>
                        {initiative.title || `Initiative #${initiative.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-900">Initiative title</div>
                      <input
                        value={dialogState.newInitiativeTitle}
                        onChange={(event) =>
                          setDialogState((prev) => ({
                            ...prev,
                            newInitiativeTitle: event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700"
                        placeholder="e.g. Secure AI Platform Rollout"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-900">POC</div>
                      <select
                        value={dialogState.newInitiativePocId}
                        onChange={(event) =>
                          setDialogState((prev) => ({
                            ...prev,
                            newInitiativePocId: Number(event.target.value),
                          }))
                        }
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700"
                      >
                        {CONTACTS.map((contact) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-900">Scheduled</div>
                      <select
                        value={`${dialogState.targetQuarter}, ${dialogState.targetYear}`}
                        onChange={(event) => {
                          const [quarterRaw, yearRaw] = String(event.target.value).split(',')
                          const quarter = quarterRaw?.trim()
                          const year = Number(String(yearRaw || '').trim())
                          setDialogState((prev) => ({
                            ...prev,
                            targetQuarter: quarter,
                            targetYear: year,
                          }))
                        }}
                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-700"
                      >
                        {scheduleOptions.map((label) => (
                          <option key={label} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={closeGoalDialog}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                disabled={dialogState.saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveDialog({ viewAfterSave: true })}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                disabled={dialogState.saving}
              >
                Save and View
              </button>
              <button
                type="button"
                onClick={() => handleSaveDialog({ viewAfterSave: false })}
                className="rounded-md bg-[rgb(5,117,204)] px-4 py-2 text-sm font-semibold text-white hover:bg-[rgb(0,97,170)] disabled:opacity-60"
                disabled={dialogState.saving}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Goals
