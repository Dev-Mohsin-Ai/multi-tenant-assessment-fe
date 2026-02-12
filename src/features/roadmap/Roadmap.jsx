import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiDownload,
  FiPlus,
  FiFlag,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
} from 'react-icons/fi'
import { TbDragDrop2 } from 'react-icons/tb'
import InitiativeDrawer from './InitiativeDrawer'
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  CONTACTS,
  QUARTERS,
  getQuarterStartDate,
} from './initiativeConstants'
import {
  createInitiative,
  deleteInitiative,
  getInitiativeById,
  getInitiatives,
  linkSubcategories,
  updateInitiative,
} from '../../shared/services/initiativeService'
import { mapInitiativeFromApi, mapInitiativeToApi } from './initiativeMapper'
import { useAppStore } from '../../shared/store/useAppStore'

const INITIATIVE_LINKS_KEY = 'initiativeLinks'
const PENDING_LINK_KEY = 'pendingInitiativeLink'
const OPEN_INITIATIVE_KEY = 'openInitiativeId'

const Roadmap = () => {
  const navigate = useNavigate()
  const activeOrganizationId = useAppStore((state) => state.activeOrganizationId)
  const currentYear = new Date().getFullYear()
  const currentQuarter = `Q${Math.floor(new Date().getMonth() / 3) + 1}`
  const currentQuarterIndex = Math.max(0, QUARTERS.indexOf(currentQuarter))
  const years = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear + index),
    [currentYear]
  )

  const shiftQuarter = (start, delta) => {
    const quarterCount = QUARTERS.length
    let year = Number(start.year)
    let quarterIndex = Number(start.quarterIndex) + Number(delta)

    while (quarterIndex < 0) {
      quarterIndex += quarterCount
      year -= 1
    }

    while (quarterIndex >= quarterCount) {
      quarterIndex -= quarterCount
      year += 1
    }

    return { year, quarterIndex }
  }

  const [windowStart, setWindowStart] = useState(() => ({
    year: currentYear,
    quarterIndex: currentQuarterIndex,
  }))

  const windowSlots = useMemo(() => {
    return Array.from({ length: 4 }, (_, offset) => {
      const slot = shiftQuarter(windowStart, offset)
      return { year: slot.year, quarter: QUARTERS[slot.quarterIndex] }
    })
  }, [windowStart])

  const prevUpcoming = useMemo(() => shiftQuarter(windowStart, -1), [windowStart])
  const nextUpcoming = useMemo(() => shiftQuarter(windowStart, 4), [windowStart])

  const [initiatives, setInitiatives] = useState([])
  const [loadingInitiatives, setLoadingInitiatives] = useState(false)
  const [loadError, setLoadError] = useState('')
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
  const [openInitiativeId, setOpenInitiativeId] = useState(() => {
    const openId = localStorage.getItem(OPEN_INITIATIVE_KEY)
    if (!openId) {
      return null
    }
    localStorage.removeItem(OPEN_INITIATIVE_KEY)
    return openId
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

    return {
      open: false,
      mode: 'create',
      initiative: null,
      presetYear: null,
      presetQuarter: null,
    }
  })

  const loadInitiatives = useCallback(async () => {
    const organizationId = Number(activeOrganizationId)
    if (!organizationId) {
      setInitiatives([])
      return
    }
    setLoadingInitiatives(true)
    setLoadError('')
    try {
      const data = await getInitiatives({ organization_id: organizationId })
      const list = Array.isArray(data) ? data : data?.initiatives || []
      const detailed = await Promise.all(
        list.map(async (item) => {
          try {
            return await getInitiativeById(item.id)
          } catch {
            return item
          }
        })
      )
      setInitiatives(detailed.map((item) => mapInitiativeFromApi(item)))
    } catch {
      setLoadError('Unable to load initiatives')
    } finally {
      setLoadingInitiatives(false)
    }
  }, [activeOrganizationId])

  useEffect(() => {
    loadInitiatives()
  }, [loadInitiatives])

  useEffect(() => {
    if (!openInitiativeId) {
      return
    }
    if (drawerState.open) {
      return
    }
    const found = initiatives.find(
      (initiative) => String(initiative.id) === String(openInitiativeId)
    )
    if (!found) {
      return
    }
    setDrawerState({
      open: true,
      mode: 'edit',
      initiative: found,
      presetYear: null,
      presetQuarter: null,
    })
    setOpenInitiativeId(null)
  }, [drawerState.open, initiatives, openInitiativeId])

  const filteredInitiatives = useMemo(() => {
    return initiatives.filter((initiative) => {
      const matchesSearch =
        filters.search.trim().length === 0 ||
        String(initiative.title || '')
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        String(initiative.summary || '')
          .toLowerCase()
          .includes(filters.search.toLowerCase())
      const matchesStatus =
        filters.status === 'All' || initiative.status === filters.status
      const matchesPriority =
        filters.priority === 'All' || initiative.priority === filters.priority
      const matchesYear =
        filters.year === 'All' || String(initiative.year) === String(filters.year)
      const matchesPoc =
        filters.poc === 'All' ||
        String(initiative.contactId || '') === String(filters.poc)
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

  const unscheduledSlotIndex = useMemo(() => {
    if (unscheduledInitiatives.length === 0) {
      return -1
    }

    const slotIndexWithNoItems = windowSlots.findIndex((slot) => {
      const key = `${slot.year}-${slot.quarter}`
      const items = initiativesBySlot.get(key) || []
      return items.length === 0
    })

    return slotIndexWithNoItems >= 0 ? slotIndexWithNoItems : 0
  }, [initiativesBySlot, unscheduledInitiatives.length, windowSlots])

  const displaySlots = useMemo(() => {
    if (unscheduledSlotIndex < 0) {
      return windowSlots.map((slot) => ({ type: 'scheduled', ...slot }))
    }

    return windowSlots.map((slot, index) => {
      if (index === unscheduledSlotIndex) {
        return { type: 'unscheduled', key: 'unscheduled' }
      }
      return { type: 'scheduled', ...slot }
    })
  }, [unscheduledSlotIndex, windowSlots])

  const handleCurrentQuarter = () => {
    setWindowStart({ year: currentYear, quarterIndex: currentQuarterIndex })
  }

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

  const handleSaveInitiative = async (payload) => {
    const organizationId = Number(activeOrganizationId)
    if (!organizationId) {
      setLoadError('Select a client before creating initiatives.')
      return
    }
    if (drawerState.mode === 'edit' && drawerState.initiative) {
      try {
        const previousLinkedItems = Array.isArray(drawerState.initiative.linkedItems)
          ? drawerState.initiative.linkedItems
          : []
        const nextLinkedItems = Array.isArray(payload.linkedItems) ? payload.linkedItems : []
        const getResponseKey = (item) =>
          String(item?.responseId ?? item?.subcategoryId ?? item?.id ?? '')

        const updated = await updateInitiative(
          drawerState.initiative.id,
          mapInitiativeToApi(payload, organizationId, { goalId: payload?.goalId })
        )
        const mapped = mapInitiativeFromApi(updated, {
          linkedItemsById: { [payload.id]: payload.linkedItems || [] },
        })

        try {
          const linksRaw = localStorage.getItem(INITIATIVE_LINKS_KEY)
          const links = linksRaw ? JSON.parse(linksRaw) : {}

          const nextResponseKeys = new Set(
            nextLinkedItems.map(getResponseKey).filter(Boolean)
          )

          previousLinkedItems.forEach((item) => {
            const assessmentId = item?.assessmentId
            const responseKey = getResponseKey(item)
            if (!assessmentId || !responseKey || nextResponseKeys.has(responseKey)) {
              return
            }
            const assessmentLinks = links?.[assessmentId]
            if (!assessmentLinks) {
              return
            }
            if (
              String(assessmentLinks[responseKey]) === String(drawerState.initiative.id)
            ) {
              delete assessmentLinks[responseKey]
            }
            links[assessmentId] = assessmentLinks
          })

          nextLinkedItems.forEach((item) => {
            const assessmentId = item?.assessmentId
            const responseKey = getResponseKey(item)
            if (!assessmentId || !responseKey) {
              return
            }
            const assessmentLinks = links?.[assessmentId] || {}
            assessmentLinks[responseKey] = drawerState.initiative.id
            links[assessmentId] = assessmentLinks
          })

          localStorage.setItem(INITIATIVE_LINKS_KEY, JSON.stringify(links))
        } catch (error) {
          void error
        }

        setInitiatives((prev) =>
          prev.map((item) => (item.id === drawerState.initiative.id ? mapped : item))
        )
        handleCloseDrawer()
      } catch {
        setLoadError('Unable to update initiative')
      }
      return
    }

    try {
      const created = await createInitiative(
        mapInitiativeToApi(payload, organizationId, { goalId: payload?.goalId })
      )
      const mapped = mapInitiativeFromApi(created, {
        linkedItemsById: { [created.id]: payload.linkedItems || [] },
      })
      if (pendingLink?.subcategoryId && created?.id) {
        try {
          await linkSubcategories(created.id, [pendingLink.subcategoryId])
        } catch {
          // keep local link even if API link fails
        }
      }
      if (pendingLink) {
        const linkEntry = {
          assessmentId: pendingLink.assessmentId,
          responseId: pendingLink.responseId,
          title: pendingLink.title,
          responseLabel: pendingLink.responseLabel,
          categoryTitle: pendingLink.categoryTitle,
        }
        mapped.linkedItems = [...(mapped.linkedItems || []), linkEntry]
        if (pendingLink.subcategoryId) {
          mapped.linkedSubcategoryIds = Array.from(
            new Set([
              ...(mapped.linkedSubcategoryIds || []),
              pendingLink.subcategoryId,
            ])
          )
        }
        const linksRaw = localStorage.getItem(INITIATIVE_LINKS_KEY)
        const links = linksRaw ? JSON.parse(linksRaw) : {}
        const assessmentLinks = links[pendingLink.assessmentId] || {}
        assessmentLinks[pendingLink.responseId] = mapped.id
        links[pendingLink.assessmentId] = assessmentLinks
        localStorage.setItem(INITIATIVE_LINKS_KEY, JSON.stringify(links))
        localStorage.removeItem(PENDING_LINK_KEY)
        setPendingLink(null)
      }
      setInitiatives((prev) => [mapped, ...prev])
      handleCloseDrawer()
    } catch {
      setLoadError('Unable to create initiative')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteInitiative(id)
      setInitiatives((prev) => prev.filter((item) => item.id !== id))
    } catch {
      setLoadError('Unable to delete initiative')
    }
    if (drawerState.initiative?.id === id) {
      handleCloseDrawer()
    }
  }

  const handleLinkedAssessmentClick = (item) => {
    navigate(`/assessments/${item.assessmentId}/read-only`, {
      state: { responseId: item.responseId, backTo: '/roadmap' },
    })
  }

  const handleStatusUpdate = async (initiative, status) => {
    const updated = { ...initiative, status }
    setInitiatives((prev) =>
      prev.map((item) => (item.id === initiative.id ? updated : item))
    )
    const organizationId = Number(activeOrganizationId)
    if (!organizationId) {
      return
    }
    try {
      await updateInitiative(
        initiative.id,
        mapInitiativeToApi(updated, organizationId, { goalId: updated?.goalId })
      )
    } catch {
      setLoadError('Unable to update initiative status')
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
        return {
          ...item,
          isScheduled: true,
          year,
          quarter,
          startDate,
        }
      })
    )
    const organizationId = Number(activeOrganizationId)
    const moved = initiatives.find((item) => String(item.id) === String(id))
    if (organizationId && moved) {
      const startDate = getQuarterStartDate(year, quarter)
      const updated = {
        ...moved,
        isScheduled: true,
        year,
        quarter,
        startDate,
      }
      updateInitiative(id, mapInitiativeToApi(updated, organizationId, { goalId: updated?.goalId })).catch(() => {
        setLoadError('Unable to update schedule')
      })
    }
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
          year: null,
          quarter: null,
          startDate: null,
        }
      })
    )
    const organizationId = Number(activeOrganizationId)
    const moved = initiatives.find((item) => String(item.id) === String(id))
    if (organizationId && moved) {
      const updated = {
        ...moved,
        isScheduled: false,
        year: null,
        quarter: null,
        startDate: null,
      }
      updateInitiative(id, mapInitiativeToApi(updated, organizationId, { goalId: updated?.goalId })).catch(() => {
        setLoadError('Unable to update schedule')
      })
    }
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setWindowStart(shiftQuarter(windowStart, -1))}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              aria-label="Previous quarter"
            >
              <FiChevronLeft />
              {QUARTERS[prevUpcoming.quarterIndex]} {prevUpcoming.year}
            </button>

            <button
              type="button"
              onClick={() => setWindowStart(shiftQuarter(windowStart, 1))}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              aria-label="Next quarter"
            >
              {QUARTERS[nextUpcoming.quarterIndex]} {nextUpcoming.year}
              <FiChevronRight />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCurrentQuarter}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-[rgb(5,117,204)] hover:bg-gray-50"
          >
            <FiCalendar /> Current quarter
          </button>

          <div className="text-sm font-semibold text-[rgb(5,117,204)]">
            Showing {windowSlots[0].quarter} {windowSlots[0].year} –{' '}
            {windowSlots[windowSlots.length - 1].quarter}{' '}
            {windowSlots[windowSlots.length - 1].year}
          </div>
        </div>
        <div className="flex items-center gap-3">
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
              <option key={contact.id} value={contact.id}>
                {contact.full_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loadError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {loadError}
        </div>
      )}
      {loadingInitiatives && (
        <div className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
          Loading initiatives...
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="text-lg font-semibold text-gray-900">
            {windowSlots[0].quarter} {windowSlots[0].year} –{' '}
            {windowSlots[windowSlots.length - 1].quarter}{' '}
            {windowSlots[windowSlots.length - 1].year}
          </div>
        </div>
        <div className="min-w-0 grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-4">
          {displaySlots.map((slot) => {
            if (slot.type === 'unscheduled') {
              const totalOneTime = unscheduledInitiatives.reduce(
                (sum, item) =>
                  sum +
                  (item.oneTimeFees || []).reduce(
                    (inner, fee) => inner + Number(fee.amount || 0),
                    0
                  ),
                0
              )
              const totalRecurringMonthly = unscheduledInitiatives.reduce(
                (sum, item) =>
                  sum +
                  (item.recurringFees || []).reduce((inner, fee) => {
                    const amount = Number(fee.amount || 0)
                    const peopleCount = Math.max(Number(fee.peopleCount || 1), 1)
                    const perPersonAmount = amount * peopleCount
                    if (fee.frequency === 'yearly') {
                      return inner + perPersonAmount / 12
                    }
                    return inner + perPersonAmount
                  }, 0),
                0
              )

              return (
                <div
                  key={slot.key}
                  className="min-w-0 w-full rounded-lg border border-dashed border-gray-200 bg-gray-50/70 p-3"
                  onDrop={handleDropUnscheduled}
                  onDragOver={handleDragOver}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">
                      Not Scheduled
                    </span>
                    <button
                      type="button"
                      className="text-lg text-blue-600"
                      onClick={handleOpenCreate}
                      aria-label="Add initiative"
                    >
                      +
                    </button>
                  </div>
                  <div className="mb-3 text-xs text-gray-500">
                    ${totalOneTime.toFixed(2)} | ${totalRecurringMonthly.toFixed(2)}/M | $
                    {(totalRecurringMonthly * 12).toFixed(2)}/Y
                  </div>
                  <div className="space-y-3 max-h-105 overflow-y-auto pr-1">
                    {unscheduledInitiatives.map((initiative) => (
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
                          handleStatusUpdate(initiative, status)
                        }
                      />
                    ))}
                  </div>
                </div>
              )
            }

            const key = `${slot.year}-${slot.quarter}`
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
                (item.recurringFees || []).reduce((inner, fee) => {
                  const amount = Number(fee.amount || 0)
                  const peopleCount = Math.max(Number(fee.peopleCount || 1), 1)
                  const perPersonAmount = amount * peopleCount
                  if (fee.frequency === 'yearly') {
                    return inner + perPersonAmount / 12
                  }
                  return inner + perPersonAmount
                }, 0),
              0
            )

            return (
              <div
                key={key}
                className="min-w-0 w-full rounded-lg border border-dashed border-gray-200 bg-gray-50/70 p-3"
                onDrop={(event) => handleDrop(event, slot.year, slot.quarter)}
                onDragOver={handleDragOver}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">
                    {slot.quarter} {slot.year}
                  </span>
                  <button
                    type="button"
                    className="text-lg text-blue-600"
                    onClick={() => handleOpenCreateForQuarter(slot.year, slot.quarter)}
                    aria-label={`Add initiative to ${slot.quarter} ${slot.year}`}
                  >
                    +
                  </button>
                </div>
                <div className="mb-3 text-xs text-gray-500">
                  ${totalOneTime.toFixed(2)} | ${totalRecurringMonthly.toFixed(2)}/M | $
                  {(totalRecurringMonthly * 12).toFixed(2)}/Y
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
                        onStatusChange={(status) => handleStatusUpdate(initiative, status)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
  const totalRecurringMonthly = (initiative.recurringFees || []).reduce((sum, item) => {
    const amount = Number(item.amount || 0)
    const peopleCount = Math.max(Number(item.peopleCount || 1), 1)
    const perPersonAmount = amount * peopleCount
    if (item.frequency === 'yearly') {
      return sum + perPersonAmount / 12
    }
    return sum + perPersonAmount
  }, 0)
  const totalRecurringAnnual = totalRecurringMonthly * 12
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
          <span className="font-semibold text-gray-700">Total one-time fee:</span>
          <span>${totalOneTime.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold text-gray-700">Monthly recurring fees:</span>
          <span>${totalRecurringMonthly.toFixed(2)}/month</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-semibold text-gray-700">Annual recurring fees:</span>
          <span>${totalRecurringAnnual.toFixed(2)}/year</span>
        </div>
      </div>
    </div>
  )
}

export default Roadmap
