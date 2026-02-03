import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import InitiativeDrawer from './InitiativeDrawer'
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  CONTACTS,
  QUARTERS,
  createId,
  getQuarterStartDate,
} from './initiativeConstants'

const INITIATIVE_STORAGE_KEY = 'roadmapInitiatives'
const INITIATIVE_LINKS_KEY = 'initiativeLinks'
const PENDING_LINK_KEY = 'pendingInitiativeLink'
const OPEN_INITIATIVE_KEY = 'openInitiativeId'

const Roadmap = () => {
  const navigate = useNavigate()
  const currentYear = new Date().getFullYear()
  const years = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear + index),
    [currentYear]
  )

  const [initiatives, setInitiatives] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(INITIATIVE_STORAGE_KEY) || '[]')
      return Array.isArray(stored) ? stored : []
    } catch {
      return []
    }
  })
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    priority: 'All',
    year: 'All',
    poc: 'All',
    
  })
  
  const [draggingId, setDraggingId] = useState(null)
  const [pendingLink, setPendingLink] = useState(() => {
    const pending = localStorage.getItem(PENDING_LINK_KEY)
    if (!pending) {
      return null
    }
    try {
      return JSON.parse(pending)
    } catch {
      localStorage.removeItem(PENDING_LINK_KEY)
      return null
    }
  })
  const [drawerState, setDrawerState] = useState(() => {
    const pending = localStorage.getItem(PENDING_LINK_KEY)
    if (pending) {
      try {
        const parsed = JSON.parse(pending)
        return {
          open: true,
          mode: 'create',
          initiative: null,
          presetYear: parsed?.presetYear ?? null,
          presetQuarter: parsed?.presetQuarter ?? null,
        }
      } catch {
        localStorage.removeItem(PENDING_LINK_KEY)
      }
    }

    const openId = localStorage.getItem(OPEN_INITIATIVE_KEY)
    if (openId) {
      try {
        const stored = JSON.parse(localStorage.getItem(INITIATIVE_STORAGE_KEY) || '[]')
        const found = Array.isArray(stored)
          ? stored.find((item) => String(item.id) === String(openId))
          : null
        if (found) {
          localStorage.removeItem(OPEN_INITIATIVE_KEY)
          return {
            open: true,
            mode: 'edit',
            initiative: found,
            presetYear: null,
            presetQuarter: null,
          }
        }
      } catch {
        localStorage.removeItem(OPEN_INITIATIVE_KEY)
      }
    }

    return {
      open: false,
      mode: 'create',
      initiative: null,
      presetYear: null,
      presetQuarter: null,
    }
  })

  useEffect(() => {
    localStorage.setItem(INITIATIVE_STORAGE_KEY, JSON.stringify(initiatives))
  }, [initiatives])

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
    localStorage.removeItem(PENDING_LINK_KEY)
    localStorage.removeItem(OPEN_INITIATIVE_KEY)
    setPendingLink(null)
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
        const withOrder = { ...resolvedPayload, order: resolvedPayload.order ?? Date.now() }
        if (pendingLink) {
          const linkEntry = {
            assessmentId: pendingLink.assessmentId,
            responseId: pendingLink.responseId,
            title: pendingLink.title,
            responseLabel: pendingLink.responseLabel,
            categoryTitle: pendingLink.categoryTitle,
          }
          withOrder.linkedItems = [...(withOrder.linkedItems || []), linkEntry]

          const linksRaw = localStorage.getItem(INITIATIVE_LINKS_KEY)
          const links = linksRaw ? JSON.parse(linksRaw) : {}
          const assessmentLinks = links[pendingLink.assessmentId] || {}
          assessmentLinks[pendingLink.responseId] = withOrder.id
          links[pendingLink.assessmentId] = assessmentLinks
          localStorage.setItem(INITIATIVE_LINKS_KEY, JSON.stringify(links))
          localStorage.removeItem(PENDING_LINK_KEY)
          setPendingLink(null)
        }
        return [withOrder, ...prev]
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

  const handleLinkedAssessmentClick = (item) => {
    navigate(`/assessments/${item.assessmentId}/read-only`, {
      state: { responseId: item.responseId, backTo: '/roadmap' },
    })
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Status</label>
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="h-10 w-full rounded-md border border-gray-200 px-3 pr-8 text-sm text-gray-700 bg-white"
          >
            <option value="All">All status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Priority</label>
          <select
            value={filters.priority}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, priority: event.target.value }))
            }
            className="h-10 w-full rounded-md border border-gray-200 px-3 pr-8 text-sm text-gray-700 bg-white"
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
          <label className="text-sm font-semibold text-gray-700">POC</label>
          <select
            value={filters.poc}
            onChange={(event) => setFilters((prev) => ({ ...prev, poc: event.target.value }))}
            className="h-10 w-full rounded-md border border-gray-200 px-3 pr-8 text-sm text-gray-700 bg-white"
          >
            <option value="All">All poc</option>
            {CONTACTS.map((contact) => (
              <option key={contact}>{contact}</option>
            ))}
          </select>
        </div>
      </div>

      {unscheduledInitiatives.length > 0 && (
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
          open={drawerState.open}
          mode={drawerState.mode}
          years={years}
          initiative={drawerState.initiative}
          presetYear={drawerState.presetYear}
          presetQuarter={drawerState.presetQuarter}
          onClose={handleCloseDrawer}
          onSave={handleSaveInitiative}
          onDelete={handleDelete}
          onLinkedAssessmentClick={handleLinkedAssessmentClick}
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
      }}
      onDrop={(event) => {
        event.preventDefault()
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

export default Roadmap
