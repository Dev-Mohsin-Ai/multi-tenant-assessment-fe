import React, { useMemo, useState } from 'react'
import {
  FiDownload,
  FiFilter,
  FiPlus,
  FiTrash2,
  FiX,
  FiLink2,
  FiFolderPlus,
  FiCalendar,
  FiFlag,
  FiUser,
  FiFileText,
  FiTarget,
  FiDollarSign,
  FiLayers,
} from 'react-icons/fi'
import { TbDragDrop2 } from 'react-icons/tb'

const STATUS_OPTIONS = [
  'Open',
  'Proposed',
  'Approved',
  'In Progress',
  'Completed',
  'On Hold',
  'Declined',
]
const PRIORITY_OPTIONS = [
  { label: 'Minimal', value: 'Minimal', display: '.' },
  { label: 'Low', value: 'Low', display: '!' },
  { label: 'Medium', value: 'Medium', display: '!!' },
  { label: 'High', value: 'High', display: '!!!' },
]

const CONTACTS = ['Hamza Abid', 'Sara Ahmed', 'Ali Khan', 'Usman Raza']
const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const getQuarterFromDate = (dateString) => {
  const date = new Date(dateString)
  const month = date.getMonth()
  return QUARTERS[Math.floor(month / 3)]
}

const getQuarterStartDate = (year, quarter) => {
  const index = QUARTERS.indexOf(quarter)
  const month = index === -1 ? 0 : index * 3
  return new Date(year, month, 1).toISOString().slice(0, 10)
}

const Roadmap = () => {
  const currentYear = new Date().getFullYear()
  const years = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear + index),
    [currentYear]
  )

  const [initiatives, setInitiatives] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    priority: 'All',
    year: 'All',
    poc: 'All',
    cardInfo: '',
  })
  const [showNotScheduled, setShowNotScheduled] = useState(true)
  const [draggingId, setDraggingId] = useState(null)
  const [drawerState, setDrawerState] = useState({
    open: false,
    mode: 'create',
    initiative: null,
    presetYear: null,
    presetQuarter: null,
  })

  const filteredInitiatives = useMemo(() => {
    return initiatives.filter((initiative) => {
      const matchesSearch =
        filters.search.trim().length === 0 ||
        initiative.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        initiative.summary.toLowerCase().includes(filters.search.toLowerCase())
      const matchesStatus =
        filters.status === 'All' || initiative.status === filters.status
      const matchesPriority =
        filters.priority === 'All' || initiative.priority === filters.priority
      const matchesYear =
        filters.year === 'All' || String(initiative.year) === String(filters.year)
      const matchesPoc =
        filters.poc === 'All' ||
        (initiative.contact || '').toLowerCase() === filters.poc.toLowerCase()
      return (
        matchesSearch && matchesStatus && matchesPriority && matchesYear && matchesPoc
      )
    })
  }, [filters, initiatives])

  const scheduledInitiatives = filteredInitiatives.filter(
    (initiative) => initiative.isScheduled
  )
  const unscheduledInitiatives = filteredInitiatives.filter(
    (initiative) => !initiative.isScheduled
  )
  const unscheduledColumns = useMemo(() => {
    const columns = [[], [], [], []]
    unscheduledInitiatives.forEach((initiative, index) => {
      columns[index % 4].push(initiative)
    })
    return columns
  }, [unscheduledInitiatives])

  const initiativesBySlot = useMemo(() => {
    const map = new Map()
    scheduledInitiatives.forEach((initiative) => {
      const key = `${initiative.year}-${initiative.quarter}`
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key).push(initiative)
    })
    map.forEach((items, key) => {
      map.set(
        key,
        items.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      )
    })
    return map
  }, [scheduledInitiatives])

  const initiativesByYear = useMemo(() => {
    const map = new Map()
    scheduledInitiatives.forEach((initiative) => {
      if (!map.has(initiative.year)) {
        map.set(initiative.year, [])
      }
      map.get(initiative.year).push(initiative)
    })
    return map
  }, [scheduledInitiatives])

  const visibleYears = useMemo(
    () => years.filter((year) => (initiativesByYear.get(year) || []).length > 0),
    [years, initiativesByYear]
  )

  const handleOpenCreate = () => {
    setDrawerState({
      open: true,
      mode: 'create',
      initiative: null,
      presetYear: null,
      presetQuarter: null,
    })
  }

  const handleOpenCreateForQuarter = (year, quarter) => {
    setDrawerState({
      open: true,
      mode: 'create',
      initiative: null,
      presetYear: Number(year),
      presetQuarter: quarter,
    })
  }

  const handleOpenEdit = (initiative) => {
    setDrawerState({ open: true, mode: 'edit', initiative })
  }

  const handleCloseDrawer = () => {
    setDrawerState({
      open: false,
      mode: 'create',
      initiative: null,
      presetYear: null,
      presetQuarter: null,
    })
  }

  const handleSaveInitiative = (payload) => {
    if (drawerState.mode === 'edit' && drawerState.initiative) {
      setInitiatives((prev) =>
        prev.map((item) => (item.id === drawerState.initiative.id ? payload : item))
      )
    } else {
      setInitiatives((prev) => {
        const existingIds = new Set(prev.map((item) => String(item.id)))
        const resolvedPayload = existingIds.has(String(payload.id))
          ? { ...payload, id: createId() }
          : payload
        return [{ ...resolvedPayload, order: resolvedPayload.order ?? Date.now() }, ...prev]
      })
    }
    handleCloseDrawer()
  }

  const handleDelete = (id) => {
    setInitiatives((prev) => prev.filter((item) => item.id !== id))
    if (drawerState.initiative?.id === id) {
      handleCloseDrawer()
    }
  }

  const handleDragStart = (event, initiative) => {
    event.stopPropagation()
    event.dataTransfer.setData('text/plain', initiative.id)
    event.dataTransfer.effectAllowed = 'move'
    setDraggingId(initiative.id)
  }

  const handleDragEnd = () => {
    setDraggingId(null)
  }

  const handleDrop = (event, year, quarter) => {
    event.preventDefault()
    const id = event.dataTransfer.getData('text/plain')
    if (!id) {
      return
    }
    setInitiatives((prev) =>
      prev.map((item) => {
        if (String(item.id) !== String(id)) {
          return item
        }
        const startDate = getQuarterStartDate(year, quarter)
        const updated = {
          ...item,
          isScheduled: true,
          year,
          quarter,
          startDate,
        }
        return updated
      })
    )
    if (drawerState.open && drawerState.initiative?.id === id) {
      const startDate = getQuarterStartDate(year, quarter)
      setDrawerState((prev) => ({
        ...prev,
        initiative: {
          ...prev.initiative,
          isScheduled: true,
          year,
          quarter,
          startDate,
        },
      }))
    }
    setDraggingId(null)
  }

  const handleDropUnscheduled = (event) => {
    event.preventDefault()
    const id = event.dataTransfer.getData('text/plain')
    if (!id) {
      return
    }
    setInitiatives((prev) =>
      prev.map((item) => {
        if (String(item.id) !== String(id)) {
          return item
        }
        return {
          ...item,
          isScheduled: false,
        }
      })
    )
    setDraggingId(null)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleReorderInQuarter = (sourceId, targetId) => {
    setInitiatives((prev) => {
      const source = prev.find((item) => String(item.id) === String(sourceId))
      const target = prev.find((item) => String(item.id) === String(targetId))
      if (!source || !target) {
        return prev
      }
      if (
        source.year !== target.year ||
        source.quarter !== target.quarter ||
        !source.isScheduled ||
        !target.isScheduled
      ) {
        return prev
      }
      const sameBucket = prev.filter(
        (item) =>
          item.isScheduled &&
          item.year === source.year &&
          item.quarter === source.quarter
      )
      const others = prev.filter(
        (item) =>
          !(
            item.isScheduled &&
            item.year === source.year &&
            item.quarter === source.quarter
          )
      )
      const ordered = sameBucket
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      const sourceIndex = ordered.findIndex((item) => item.id === source.id)
      const targetIndex = ordered.findIndex((item) => item.id === target.id)
      if (sourceIndex === -1 || targetIndex === -1) {
        return prev
      }
      const [moved] = ordered.splice(sourceIndex, 1)
      ordered.splice(targetIndex, 0, moved)
      const reordered = ordered.map((item, index) => ({
        ...item,
        order: index,
      }))
      return [...others, ...reordered]
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-[rgb(5,117,204)] px-4 py-2 text-sm font-medium text-white hover:bg-[rgb(0,97,170)]"
          onClick={handleOpenCreate}
        >
          <FiPlus /> Add Initiative
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => window.print()}
        >
          <FiDownload /> Export
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">Status</label>
              <select
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                className="h-10 w-full rounded-md border border-gray-200 px-3 pr-8 text-sm text-gray-700"
              >
                <option value="All">All status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">Priority</label>
              <select
                value={filters.priority}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, priority: event.target.value }))
                }
                className="h-10 w-full rounded-md border border-gray-200 px-3 pr-8 text-sm text-gray-700"
              >
                <option value="All">All priority</option>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-600">POC</label>
              <select
                value={filters.poc}
                onChange={(event) => setFilters((prev) => ({ ...prev, poc: event.target.value }))}
                className="h-10 w-full rounded-md border border-gray-200 px-3 pr-8 text-sm text-gray-700"
              >
                <option value="All">All poc</option>
                {CONTACTS.map((contact) => (
                  <option key={contact}>{contact}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-start gap-4 lg:w-auto lg:justify-self-end">
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold text-gray-600">Not scheduled</div>
              <button
                type="button"
                onClick={() => setShowNotScheduled((prev) => !prev)}
                className={`relative h-6 w-12 rounded-full transition ${
                  showNotScheduled ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
                    showNotScheduled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showNotScheduled && unscheduledInitiatives.length > 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {unscheduledColumns.map((column, index) => {
              const totalOneTime = column.reduce(
                (sum, item) =>
                  sum +
                  (item.oneTimeFees || []).reduce(
                    (inner, fee) => inner + Number(fee.amount || 0),
                    0
                  ),
                0
              )
              const totalRecurringMonthly = column.reduce(
                (sum, item) =>
                  sum +
                  (item.recurringFees || []).reduce(
                    (inner, fee) => inner + Number(fee.monthly || 0),
                    0
                  ),
                0
              )
              return (
                <div
                  key={`unscheduled-${index}`}
                  className="min-h-35 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3"
                  onDrop={handleDropUnscheduled}
                  onDragOver={handleDragOver}
                >
                  <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
                    <span className="text-base font-semibold text-gray-900">Not Scheduled</span>
                    <button
                      type="button"
                      onClick={handleOpenCreate}
                      className="text-lg text-blue-600"
                      aria-label="Add initiative"
                    >
                      +
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    ${totalOneTime.toFixed(2)} | ${totalRecurringMonthly.toFixed(2)}/M | $
                    {(totalRecurringMonthly * 12).toFixed(2)}/Y
                  </div>
                  <div className="mt-1 text-xs font-semibold text-gray-700">
                    Year-1 total ${(
                      totalOneTime +
                      totalRecurringMonthly * 12
                    ).toFixed(2)}
                  </div>
                  <div className="mt-3 space-y-3 max-h-80 overflow-y-auto pr-1">
                    {column.map((initiative) => (
                      <InitiativeCard
                        key={initiative.id}
                        initiative={initiative}
                        onClick={() => handleOpenEdit(initiative)}
                        onDragStart={(event) => handleDragStart(event, initiative)}
                        onDragEnd={handleDragEnd}
                        draggingId={draggingId}
                        onDropOnCard={(sourceId) =>
                          handleReorderInQuarter(sourceId, initiative.id)
                        }
                        onStatusChange={(status) =>
                          setInitiatives((prev) =>
                            prev.map((item) =>
                              item.id === initiative.id ? { ...item, status } : item
                            )
                          )
                        }
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {initiatives.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-500">
          No initiatives created yet.
        </div>
      ) : visibleYears.length > 0 ? (
        <div className="space-y-6">
          {visibleYears.map((year) => (
              <div key={year} className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div className="text-lg font-semibold text-gray-900">{year}</div>
                </div>
                <div className="min-w-0 grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
                  {QUARTERS.map((quarter) => {
                    const key = `${year}-${quarter}`
                    const items = initiativesBySlot.get(key) || []
                    const totalOneTime = items.reduce(
                      (sum, item) =>
                        sum +
                        (item.oneTimeFees || []).reduce(
                          (inner, fee) => inner + Number(fee.amount || 0),
                          0
                        ),
                      0
                    )
                    const totalRecurringMonthly = items.reduce(
                      (sum, item) =>
                        sum +
                        (item.recurringFees || []).reduce(
                          (inner, fee) => inner + Number(fee.monthly || 0),
                          0
                        ),
                      0
                    )
                    return (
                      <div
                        key={key}
                        className="min-w-0 w-full rounded-lg border border-dashed border-gray-200 bg-gray-50/70 p-3"
                        onDrop={(event) => handleDrop(event, year, quarter)}
                        onDragOver={handleDragOver}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-base font-semibold text-gray-900">
                            {quarter}
                          </span>
                      <button
                        type="button"
                        className="text-lg text-blue-600"
                        onClick={() => handleOpenCreateForQuarter(year, quarter)}
                      >
                        +
                      </button>
                        </div>
                        <div className="mb-3 text-xs text-gray-500">
                          ${totalOneTime.toFixed(2)} | ${totalRecurringMonthly.toFixed(2)}/M |
                          ${(totalRecurringMonthly * 12).toFixed(2)}/Y
                        </div>
                        <div className="mb-3 text-xs font-semibold text-gray-700">
                          Year-1 total ${(
                            totalOneTime +
                            totalRecurringMonthly * 12
                          ).toFixed(2)}
                        </div>
                        <div className="space-y-3 max-h-105 overflow-y-auto pr-1">
                          {items.length === 0 ? (
                            <div className="rounded-md border border-dashed border-gray-200 bg-white px-3 py-6 text-center text-xs text-gray-400">
                              No initiative added
                            </div>
                          ) : (
                            items.map((initiative) => (
                              <InitiativeCard
                                key={initiative.id}
                                initiative={initiative}
                                onClick={() => handleOpenEdit(initiative)}
                                onDragStart={(event) => handleDragStart(event, initiative)}
                                onDragEnd={handleDragEnd}
                                draggingId={draggingId}
                                onDropOnCard={(sourceId) =>
                                  handleReorderInQuarter(sourceId, initiative.id)
                                }
                                onStatusChange={(status) =>
                                  setInitiatives((prev) =>
                                    prev.map((item) =>
                                      item.id === initiative.id ? { ...item, status } : item
                                    )
                                  )
                                }
                              />
                            ))
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
          ))}
        </div>
      ) : null}

      {drawerState.open && (
        <InitiativeDrawer
          key={`${drawerState.mode}-${drawerState.initiative?.id ?? 'new'}-${drawerState.presetYear ?? 'na'}-${drawerState.presetQuarter ?? 'na'}`}
          mode={drawerState.mode}
          years={years}
          initiative={drawerState.initiative}
          presetYear={drawerState.presetYear}
          presetQuarter={drawerState.presetQuarter}
          onClose={handleCloseDrawer}
          onSave={handleSaveInitiative}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

const InitiativeCard = ({
  initiative,
  onClick,
  onDragStart,
  onDragEnd,
  onStatusChange,
  onDropOnCard,
  draggingId,
}) => {
  const priorityDisplay = PRIORITY_OPTIONS.find(
    (item) => item.value === initiative.priority
  )?.display
  const totalOneTime = (initiative.oneTimeFees || []).reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  )
  const totalRecurringMonthly = (initiative.recurringFees || []).reduce(
    (sum, item) => sum + Number(item.monthly || 0),
    0
  )
  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onDrop={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (onDropOnCard) {
          onDropOnCard(event.dataTransfer.getData('text/plain'))
        }
      }}
      onClick={() => {
        if (draggingId && String(draggingId) === String(initiative.id)) {
          return
        }
        onClick()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onClick()
        }
      }}
      className="min-w-0 w-full rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-gray-300 hover:shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{initiative.title}</h3>
          <div className="mt-1 text-xs text-gray-500">
            {initiative.isScheduled
              ? `${initiative.quarter} ${initiative.year}`
              : 'Not scheduled'}
          </div>
        </div>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            className="cursor-grab rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-500 hover:bg-gray-50"
            aria-label="Drag to reorder"
          >
            <TbDragDrop2 />
          </button>
          <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
            <FiFlag className="text-[11px]" />
            {priorityDisplay}
          </div>
        </div>
      </div>
      <div className="mt-3">
        <select
          value={initiative.status}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            event.stopPropagation()
            if (onStatusChange) {
              onStatusChange(event.target.value)
            }
          }}
          className="h-9 w-full rounded-md border border-gray-200 px-3 pr-8 text-sm text-gray-700"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>
      <div className="mt-3 border-t border-gray-200 pt-3 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-700">Total one-time fees:</span>
          <span>${totalOneTime.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold text-gray-700">Total recurring fees:</span>
          <span>${totalRecurringMonthly.toFixed(2)}/month</span>
        </div>
      </div>
    </div>
  )
}

const InitiativeDrawer = ({
  mode,
  initiative,
  onClose,
  onSave,
  onDelete,
  years,
  presetYear,
  presetQuarter,
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
    }
  })


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

  const totalOneTime = form.oneTimeFees.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const totalRecurringMonthlyBase = form.recurringFees.reduce(
    (sum, item) => sum + Number(item.monthly || 0),
    0
  )
  const totalRecurringMonthly = totalRecurringMonthlyBase * Number(form.peopleCount || 1)
  const totalRecurringAnnual = totalRecurringMonthly * 12
  const totalAssets = 0

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <form className="flex h-full w-full max-w-2xl flex-col bg-white shadow-xl" onSubmit={handleSubmit}>
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
              className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600"
            >
              Save template...
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600"
            >
              Apply template...
            </button>
            {mode === 'edit' && (
              <button
                type="button"
                className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600"
                onClick={() => onDelete(form.id)}
              >
                Delete
              </button>
            )}
            <button
              type="button"
              className="rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600"
            >
              Download PDF
            </button>
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
                          {years.map((year) => (
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
                      Per person ${totalRecurringMonthlyBase.toFixed(2)}/month · People{' '}
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
              <p className="text-xs text-gray-500">No linked assessments yet.</p>
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

export default Roadmap
