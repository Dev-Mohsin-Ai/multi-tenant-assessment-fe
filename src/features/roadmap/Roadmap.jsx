import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiDownload,
  FiPlus,
  FiFlag,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiX,
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
  getLinkedSubcategories,
  updateInitiative,
} from '../../shared/services/initiativeService'
import { downloadInitiativesRoadmapPdf } from '../../shared/services/reportService'
import {
  mapInitiativeFromApi,
  mapInitiativeToApi,
  mapLinkedSubcategoriesFromApi,
} from './initiativeMapper'
import { useAppStore } from '../../shared/store/useAppStore'
import ToastMessage from '../../shared/components/ToastMessage'
import AppSelect from '../../shared/components/AppSelect'
import { syncStoredAssessmentLinksForInitiative } from '../../shared/utils/initiativeLinks'
import { hasMeaningfulLinkedItems } from '../../shared/utils/linkedAssessments'
import { formatApiError, isGoalNotFoundError } from '../../shared/utils/apiErrors'
import {
  applyPlacementOverride,
  buildInitiativeYears,
  buildPlacementStorageKey,
  isQuarterSlotKey,
  readPlacementOverrides,
  toQuarterSlotKey,
  UNSCHEDULED_PLACEMENTS_KEY,
  writePlacementOverrides,
} from '../../shared/utils/initiativeScheduling'

const INITIATIVE_LINKS_KEY = 'initiativeLinks'
const PENDING_LINK_KEY = 'pendingInitiativeLink'
const OPEN_INITIATIVE_KEY = 'openInitiativeId'

const getQuarterOrderValue = (year, quarter) => {
  const numericYear = Number(year)
  const quarterIndex = QUARTERS.indexOf(quarter)
  if (!Number.isFinite(numericYear) || quarterIndex < 0) {
    return null
  }
  return numericYear * QUARTERS.length + quarterIndex
}

const Roadmap = () => {
  const navigate = useNavigate()
  const activeOrganizationId = useAppStore((state) => state.activeOrganizationId)
  const currentYear = new Date().getFullYear()
  const currentQuarter = `Q${Math.floor(new Date().getMonth() / 3) + 1}`
  const years = useMemo(() => buildInitiativeYears(currentYear), [currentYear])

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
    quarterIndex: 0,
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
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportTenure, setExportTenure] = useState(() => ({
    fromYear: currentYear,
    fromQuarter: currentQuarter,
    toYear: currentYear,
    toQuarter: currentQuarter,
    includeUnscheduled: true,
  }))
  const [exportError, setExportError] = useState('')
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [toast, setToast] = useState(null)
  
  const [draggingId, setDraggingId] = useState(null)
  const topScrollRef = useRef(null)
  const mainScrollRef = useRef(null)
  const slotGridRef = useRef(null)
  const syncingScrollRef = useRef(null)
  const [topScrollWidth, setTopScrollWidth] = useState(0)

  const placementsStorageKey = useMemo(
    () => buildPlacementStorageKey(activeOrganizationId),
    [activeOrganizationId]
  )

  const [unscheduledPlacements, setUnscheduledPlacements] = useState(() =>
    readPlacementOverrides(UNSCHEDULED_PLACEMENTS_KEY)
  )
  const [placementsHydrated, setPlacementsHydrated] = useState(false)

  useEffect(() => {
    setPlacementsHydrated(false)
    try {
      setUnscheduledPlacements(readPlacementOverrides(placementsStorageKey))
    } finally {
      setPlacementsHydrated(true)
    }
  }, [placementsStorageKey])

  useEffect(() => {
    if (!placementsHydrated) {
      return
    }
    writePlacementOverrides(placementsStorageKey, unscheduledPlacements)
  }, [placementsHydrated, placementsStorageKey, unscheduledPlacements])
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

  const exportYearOptions = useMemo(() => {
    const scheduledYears = initiatives
      .map((item) => Number(item.year))
      .filter((year) => Number.isFinite(year))
    const minYear = Math.min(currentYear, ...(scheduledYears.length ? scheduledYears : [currentYear]))
    const maxYear = Math.max(
      currentYear + 4,
      ...(scheduledYears.length ? scheduledYears : [currentYear + 4])
    )
    return Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index)
  }, [currentYear, initiatives])
  const statusFilterOptions = [
    { value: 'All', label: 'All status' },
    ...STATUS_OPTIONS.map((status) => ({ value: status, label: status })),
  ]
  const priorityFilterOptions = [
    { value: 'All', label: 'All priority' },
    ...PRIORITY_OPTIONS.map((priority) => ({
      value: priority.value,
      label: priority.label,
    })),
  ]
  const pocFilterOptions = [
    { value: 'All', label: 'All poc' },
    ...CONTACTS.map((contact) => ({
      value: String(contact.id),
      label: contact.full_name,
    })),
  ]
  const exportYearSelectOptions = exportYearOptions.map((year) => ({
    value: year,
    label: String(year),
  }))
  const quarterSelectOptions = QUARTERS.map((quarter) => ({
    value: quarter,
    label: quarter,
  }))

  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

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
      const detailedList = await Promise.all(
        list.map(async (item) => {
          try {
            return await getInitiativeById(item.id)
          } catch {
            return item
          }
        })
      )
      setInitiatives(detailedList.map((item) => mapInitiativeFromApi(item)))
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

  const scheduledInitiatives = filteredInitiatives.filter((initiative) => {
    const placementKey = unscheduledPlacements?.[String(initiative.id)]
    if (placementKey === 'unscheduled') {
      return false
    }
    return initiative.isScheduled
  })
  const unscheduledInitiatives = filteredInitiatives.filter((initiative) => {
    const placementKey = unscheduledPlacements?.[String(initiative.id)]
    if (placementKey === 'unscheduled') {
      return true
    }
    return !initiative.isScheduled
  })

  const windowSlotKeys = useMemo(() => {
    return new Set(windowSlots.map((slot) => `${slot.year}-${slot.quarter}`))
  }, [windowSlots])

  const placedUnscheduledBySlot = useMemo(() => {
    const map = new Map()
    unscheduledInitiatives.forEach((initiative) => {
      const key = unscheduledPlacements?.[String(initiative.id)]
      if (!key || !windowSlotKeys.has(String(key))) {
        return
      }
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key).push(initiative)
    })
    return map
  }, [unscheduledInitiatives, unscheduledPlacements, windowSlotKeys])

  const unplacedUnscheduledInitiatives = useMemo(() => {
    const unscheduledIndexById = new Map(
      unscheduledInitiatives.map((initiative, index) => [String(initiative.id), index])
    )

    return unscheduledInitiatives
      .filter((initiative) => {
        const key = unscheduledPlacements?.[String(initiative.id)]
        if (!key) {
          return true
        }
        return !windowSlotKeys.has(String(key))
      })
      .sort((left, right) => {
        const leftOrder = Number(left.order)
        const rightOrder = Number(right.order)
        const resolvedLeftOrder = Number.isFinite(leftOrder) ? leftOrder : Number.MAX_SAFE_INTEGER
        const resolvedRightOrder = Number.isFinite(rightOrder) ? rightOrder : Number.MAX_SAFE_INTEGER
        if (resolvedLeftOrder !== resolvedRightOrder) {
          return resolvedLeftOrder - resolvedRightOrder
        }
        return (
          (unscheduledIndexById.get(String(left.id)) ?? Number.MAX_SAFE_INTEGER) -
          (unscheduledIndexById.get(String(right.id)) ?? Number.MAX_SAFE_INTEGER)
        )
      })
  }, [unscheduledInitiatives, unscheduledPlacements, windowSlotKeys])

  useEffect(() => {
    if (loadingInitiatives) {
      return
    }
    if (!unscheduledPlacements || Object.keys(unscheduledPlacements).length === 0) {
      return
    }
    const currentIds = new Set(initiatives.map((item) => String(item.id)))
    if (currentIds.size === 0) {
      return
    }
    const next = Object.entries(unscheduledPlacements).reduce((acc, [id, key]) => {
      if (!currentIds.has(String(id))) {
        return acc
      }
      acc[id] = key
      return acc
    }, {})
    if (Object.keys(next).length !== Object.keys(unscheduledPlacements).length) {
      setUnscheduledPlacements(next)
    }
  }, [initiatives, loadingInitiatives, unscheduledPlacements])

  const initiativesBySlot = useMemo(() => {
    const map = new Map()
    scheduledInitiatives.forEach((initiative) => {
      const placementKey = unscheduledPlacements?.[String(initiative.id)]
      const key =
        isQuarterSlotKey(placementKey) ? String(placementKey) : `${initiative.year}-${initiative.quarter}`
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
  }, [scheduledInitiatives, unscheduledPlacements])

  const displaySlots = useMemo(() => {
    const slots = windowSlots.map((slot) => ({
      type: 'scheduled',
      ...slot,
      key: `${slot.year}-${slot.quarter}`,
    }))

    if (unscheduledInitiatives.length > 0) {
      slots.unshift({ type: 'unscheduled', key: 'unscheduled' })
    }

    return slots
  }, [unscheduledInitiatives.length, windowSlots])

  useEffect(() => {
    const updateTopScrollWidth = () => {
      const width = slotGridRef.current?.scrollWidth || 0
      setTopScrollWidth(width)
    }

    updateTopScrollWidth()
    window.addEventListener('resize', updateTopScrollWidth)
    return () => window.removeEventListener('resize', updateTopScrollWidth)
  }, [displaySlots.length])

  const syncScroll = (sourceRef, targetRef, sourceKey) => {
    const source = sourceRef.current
    const target = targetRef.current
    if (!source || !target) {
      return
    }

    if (syncingScrollRef.current === sourceKey) {
      syncingScrollRef.current = null
      return
    }

    syncingScrollRef.current = sourceKey
    target.scrollLeft = source.scrollLeft
  }

  const handleTopScroll = () => {
    syncScroll(topScrollRef, mainScrollRef, 'main')
  }

  const handleMainScroll = () => {
    syncScroll(mainScrollRef, topScrollRef, 'top')
  }

  const handleCurrentQuarter = () => {
    setWindowStart({ year: currentYear, quarterIndex: 0 })
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

  const handleOpenExportDialog = () => {
    const firstSlot = windowSlots[0] || { year: currentYear, quarter: currentQuarter }
    const lastSlot = windowSlots[windowSlots.length - 1] || firstSlot
    setExportTenure({
      fromYear: firstSlot.year,
      fromQuarter: firstSlot.quarter,
      toYear: lastSlot.year,
      toQuarter: lastSlot.quarter,
      includeUnscheduled: true,
    })
    setExportError('')
    setIsExportingPdf(false)
    setIsExportDialogOpen(true)
  }

  const handleCloseExportDialog = () => {
    if (isExportingPdf) {
      return
    }
    setIsExportDialogOpen(false)
    setExportError('')
  }

  useEffect(() => {
    if (!isExportDialogOpen) {
      return
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isExportingPdf) {
        setIsExportDialogOpen(false)
        setExportError('')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isExportDialogOpen, isExportingPdf])

  const handleExportTenureChange = (field, value) => {
    setExportTenure((prev) => ({ ...prev, [field]: value }))
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

  const handleOpenEdit = async (initiative) => {
    const initiativeId = initiative?.id
    if (!initiativeId) {
      setDrawerState({ open: true, mode: 'edit', initiative })
      return
    }

    try {
      const detail = await getInitiativeById(initiativeId)
      let mapped = mapInitiativeFromApi(detail)

      if (!hasMeaningfulLinkedItems(mapped.linkedItems)) {
        const linkedSubcategories = await getLinkedSubcategories(initiativeId).catch(() => [])
        const enrichedLinkedItems = mapLinkedSubcategoriesFromApi(linkedSubcategories)
        if (hasMeaningfulLinkedItems(enrichedLinkedItems)) {
          mapped = mapInitiativeFromApi(detail, {
            linkedItemsById: { [initiativeId]: enrichedLinkedItems },
          })
        }
      }

      setDrawerState({
        open: true,
        mode: 'edit',
        initiative: {
          ...mapped,
          title: mapped.title || initiative?.title || '',
          summary: mapped.summary || initiative?.summary || '',
          linkedItems: mapped.linkedItems || [],
          linkedSubcategoryIds: mapped.linkedSubcategoryIds || [],
          oneTimeFees: mapped.oneTimeFees?.length > 0 ? mapped.oneTimeFees : initiative?.oneTimeFees || [],
          recurringFees:
            mapped.recurringFees?.length > 0 ? mapped.recurringFees : initiative?.recurringFees || [],
          templateId: mapped.templateId || initiative?.templateId || null,
          templateTitle: mapped.templateTitle || initiative?.templateTitle || '',
        },
      })
    } catch {
      setDrawerState({ open: true, mode: 'edit', initiative })
    }
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

  const handleSaveInitiative = async (payload, options = {}) => {
    const closeOnSuccess = options.closeOnSuccess !== false
    const organizationId = Number(activeOrganizationId)
    if (!organizationId) {
      setLoadError('Select a client before creating initiatives.')
      return null
    }
    if (drawerState.mode === 'edit' && drawerState.initiative) {
      try {
        const nextLinkedItems = Array.isArray(payload.linkedItems) ? payload.linkedItems : []

        const apiPayload = mapInitiativeToApi(payload, organizationId, { goalId: payload?.goalId })
        let updated
        try {
          updated = await updateInitiative(drawerState.initiative.id, apiPayload)
        } catch (error) {
          if (!isGoalNotFoundError(error)) {
            throw error
          }

          // Initiative has an invalid goal reference; unlink goal and retry so schedule edits can still be saved.
          const retryPayload = mapInitiativeToApi(
            { ...payload, goalId: null },
            organizationId,
            { goalId: null }
          )
          updated = await updateInitiative(drawerState.initiative.id, retryPayload)
          payload = { ...payload, goalId: null }
        }
        const latest = await getInitiativeById(drawerState.initiative.id).catch(() => updated)
        const mappedBase = mapInitiativeFromApi(latest, {
          linkedItemsById: { [payload.id]: payload.linkedItems || [] },
        })
        const mapped = {
          ...mappedBase,
          title: mappedBase.title || payload.title || '',
          summary: mappedBase.summary || payload.summary || '',
          oneTimeFees:
            mappedBase.oneTimeFees?.length > 0
              ? mappedBase.oneTimeFees
              : payload.oneTimeFees || [],
          recurringFees:
            mappedBase.recurringFees?.length > 0
              ? mappedBase.recurringFees
              : payload.recurringFees || [],
          templateId: payload.templateId || mappedBase.templateId || null,
          templateTitle: payload.templateTitle || mappedBase.templateTitle || '',
        }
        const normalizedMapped = payload.isScheduled
          ? {
              ...mapped,
              isScheduled: true,
              year: payload.year ?? mapped.year,
              quarter: payload.quarter ?? mapped.quarter,
              startDate:
                payload.year && payload.quarter
                  ? getQuarterStartDate(payload.year, payload.quarter)
                  : mapped.startDate,
            }
          : {
              ...mapped,
              isScheduled: false,
              year: null,
              quarter: null,
              startDate: null,
            }

        syncStoredAssessmentLinksForInitiative(drawerState.initiative.id, nextLinkedItems)

        setInitiatives((prev) =>
          prev.map((item) =>
            String(item.id) === String(drawerState.initiative.id) ? normalizedMapped : item
          )
        )

        setUnscheduledPlacements((prev) =>
          applyPlacementOverride(prev, normalizedMapped.id ?? drawerState.initiative.id, {
            isScheduled: Boolean(payload.isScheduled),
            year: payload.year,
            quarter: payload.quarter,
            clearWhenScheduledWithoutSlot: Boolean(payload.isScheduled),
          })
        )

        if (closeOnSuccess) {
          handleCloseDrawer()
        } else {
          setDrawerState((prev) => ({
            ...prev,
            open: true,
            mode: 'edit',
            initiative: normalizedMapped,
            presetYear: null,
            presetQuarter: null,
          }))
        }
        return normalizedMapped
      } catch (error) {
        setLoadError(formatApiError(error, 'Unable to update initiative'))
        throw error
      }
    }

    try {
      const created = await createInitiative(
        mapInitiativeToApi(payload, organizationId, { goalId: payload?.goalId })
      )
      const latestCreated = await getInitiativeById(created.id).catch(() => created)
      const mappedBase = mapInitiativeFromApi(latestCreated, {
        linkedItemsById: { [created.id]: payload.linkedItems || [] },
      })
      const mapped = {
        ...mappedBase,
        title: mappedBase.title || payload.title || '',
        summary: mappedBase.summary || payload.summary || '',
        oneTimeFees:
          mappedBase.oneTimeFees?.length > 0
            ? mappedBase.oneTimeFees
            : payload.oneTimeFees || [],
        recurringFees:
          mappedBase.recurringFees?.length > 0
            ? mappedBase.recurringFees
            : payload.recurringFees || [],
        templateId: payload.templateId || mappedBase.templateId || null,
        templateTitle: payload.templateTitle || mappedBase.templateTitle || '',
      }
      if (pendingLink) {
        const pendingResponseKey = pendingLink.responseId || pendingLink.subcategoryId
        const linkEntry = {
          assessmentId: pendingLink.assessmentId,
          responseId: pendingResponseKey,
          subcategoryId: pendingLink.subcategoryId || pendingResponseKey,
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
        syncStoredAssessmentLinksForInitiative(mapped.id, mapped.linkedItems || [])
        localStorage.removeItem(PENDING_LINK_KEY)
        setPendingLink(null)
      }
      if (pendingLink && mapped?.id) {
        try {
          await updateInitiative(
            mapped.id,
            mapInitiativeToApi(mapped, organizationId, {
              goalId: mapped?.goalId ?? payload?.goalId,
            })
          )
        } catch {
          // keep local link even if API update fails
        }
      }
      setInitiatives((prev) => [mapped, ...prev])
      if (closeOnSuccess) {
        handleCloseDrawer()
      } else {
        setDrawerState({
          open: true,
          mode: 'edit',
          initiative: mapped,
          presetYear: null,
          presetQuarter: null,
        })
      }
      return mapped
    } catch (error) {
      setLoadError(formatApiError(error, 'Unable to create initiative'))
      throw error
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
      state: {
        responseId: item.responseId || item.subcategoryId || item.id || null,
        backTo: `/assessments/${item.assessmentId}`,
      },
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

  const resolveSlotKeyForItem = (item) => {
    if (!item) {
      return 'unscheduled'
    }
    const placementKey = unscheduledPlacements?.[String(item.id)]
    if (placementKey === 'unscheduled') {
      return 'unscheduled'
    }
    if (isQuarterSlotKey(placementKey)) {
      return String(placementKey)
    }
    if (item.isScheduled && item.year && item.quarter) {
      return toQuarterSlotKey(item.year, item.quarter) || `${item.year}-${item.quarter}`
    }
    return placementKey || 'unscheduled'
  }

  const moveInitiativeToQuarter = (id, year, quarter, targetInitiativeId = null) => {
    if (!id) {
      return
    }

    const moved = initiatives.find((item) => String(item.id) === String(id))
    if (!moved) {
      return
    }

    const targetSlotKey = toQuarterSlotKey(year, quarter) || `${year}-${quarter}`
    const targetInitiative = targetInitiativeId
      ? initiatives.find((item) => String(item.id) === String(targetInitiativeId))
      : null
    const rawTargetOrder = Number(targetInitiative?.order)
    const insertOrder = Number.isFinite(rawTargetOrder) ? rawTargetOrder : null


    setUnscheduledPlacements((prev) => {
      if (!prev || !Object.prototype.hasOwnProperty.call(prev, String(id))) {
        return prev
      }
      const next = { ...prev }
      delete next[String(id)]
      return next
    })

    setInitiatives((prev) =>
      prev.map((item) => {
        const itemId = String(item.id)
        const itemSlot =
          itemId === String(id)
            ? targetSlotKey
            : item.isScheduled
              ? `${item.year}-${item.quarter}`
              : (unscheduledPlacements?.[itemId] || null)
        const currentOrder = Number(item.order)
        const resolvedOrder = Number.isFinite(currentOrder) ? currentOrder : -1
        if (
          insertOrder !== null &&
          itemId !== String(id) &&
          itemSlot === targetSlotKey &&
          resolvedOrder >= insertOrder
        ) {
          return { ...item, order: resolvedOrder + 1 }
        }

        if (itemId !== String(id)) {
          return item
        }

        let nextOrder = insertOrder
        if (nextOrder === null) {
          const maxOrder = prev.reduce((max, candidate) => {
            const candidateId = String(candidate.id)
            if (candidateId === String(id)) {
              return max
            }
            const candidateSlot = candidate.isScheduled
              ? `${candidate.year}-${candidate.quarter}`
              : (unscheduledPlacements?.[candidateId] || null)
            if (candidateSlot !== targetSlotKey) {
              return max
            }
            const candidateOrder = Number(candidate.order)
            return Number.isFinite(candidateOrder) ? Math.max(max, candidateOrder) : max
          }, -1)
          nextOrder = maxOrder + 1
        }

        const startDate = getQuarterStartDate(year, quarter)
        return {
          ...item,
          isScheduled: true,
          year,
          quarter,
          startDate,
          order: nextOrder,
        }
      })
    )

    const organizationId = Number(activeOrganizationId)
    if (organizationId) {
      const startDate = getQuarterStartDate(year, quarter)
      const updated = {
        ...moved,
        isScheduled: true,
        year,
        quarter,
        startDate,
        order: insertOrder ?? moved.order,
      }
      const apiPayload = mapInitiativeToApi(updated, organizationId, { goalId: updated?.goalId })
      updateInitiative(id, apiPayload).catch((error) => {
        if (isGoalNotFoundError(error)) {
          const retry = mapInitiativeToApi({ ...updated, goalId: null }, organizationId, {
            goalId: null,
          })
          updateInitiative(id, retry)
            .then(() => {
              setInitiatives((prev) =>
                prev.map((item) =>
                  String(item.id) === String(id) ? { ...item, goalId: null } : item
                )
              )
            })
            .catch((retryError) => {
              setLoadError(formatApiError(retryError, 'Unable to update schedule'))
              setInitiatives((prev) =>
                prev.map((item) => (String(item.id) === String(id) ? moved : item))
              )
            })
          return
        }

        setLoadError(formatApiError(error, 'Unable to update schedule'))
        setInitiatives((prev) =>
          prev.map((item) => (String(item.id) === String(id) ? moved : item))
        )
      })
    }

    if (drawerState.open && String(drawerState.initiative?.id) === String(id)) {
      const startDate = getQuarterStartDate(year, quarter)
      setDrawerState((prev) => ({
        ...prev,
        initiative: {
          ...prev.initiative,
          isScheduled: true,
          year,
          quarter,
          startDate,
          order: insertOrder ?? prev.initiative?.order,
        },
      }))
    }
  }

  const moveInitiativeToUnscheduled = (id, targetInitiativeId = null) => {
    if (!id) {
      return
    }

    const moved = initiatives.find((item) => String(item.id) === String(id))
    if (!moved) {
      return
    }

    const targetInitiative = targetInitiativeId
      ? initiatives.find((item) => String(item.id) === String(targetInitiativeId))
      : null
    const rawTargetOrder = Number(targetInitiative?.order)
    const insertOrder = Number.isFinite(rawTargetOrder) ? rawTargetOrder : null

    setUnscheduledPlacements((prev) => {
      if (!prev || !Object.prototype.hasOwnProperty.call(prev, String(id))) {
        return prev
      }
      const next = { ...prev }
      delete next[String(id)]
      return next
    })

    setInitiatives((prev) =>
      prev.map((item) => {
        const itemId = String(item.id)
        const itemSlot =
          itemId === String(id)
            ? 'unscheduled'
            : item.isScheduled
              ? `${item.year}-${item.quarter}`
              : (unscheduledPlacements?.[itemId] || 'unscheduled')
        const currentOrder = Number(item.order)
        const resolvedOrder = Number.isFinite(currentOrder) ? currentOrder : -1

        if (
          insertOrder !== null &&
          itemId !== String(id) &&
          itemSlot === 'unscheduled' &&
          resolvedOrder >= insertOrder
        ) {
          return { ...item, order: resolvedOrder + 1 }
        }

        if (itemId !== String(id)) {
          return item
        }

        let nextOrder = insertOrder
        if (nextOrder === null) {
          const maxOrder = prev.reduce((max, candidate) => {
            const candidateId = String(candidate.id)
            const candidateSlot =
              candidateId === String(id)
                ? 'unscheduled'
                : candidate.isScheduled
                  ? `${candidate.year}-${candidate.quarter}`
                  : (unscheduledPlacements?.[candidateId] || 'unscheduled')
            if (candidateSlot !== 'unscheduled') {
              return max
            }
            const candidateOrder = Number(candidate.order)
            return Number.isFinite(candidateOrder) ? Math.max(max, candidateOrder) : max
          }, -1)
          nextOrder = maxOrder + 1
        }

        return {
          ...item,
          isScheduled: false,
          year: null,
          quarter: null,
          startDate: null,
          order: nextOrder,
        }
      })
    )

    if (!moved.isScheduled) {
      return
    }

    const organizationId = Number(activeOrganizationId)
    if (organizationId) {
      const updated = {
        ...moved,
        isScheduled: false,
        year: null,
        quarter: null,
        startDate: null,
        order: insertOrder ?? moved.order,
      }
      const apiPayload = mapInitiativeToApi(updated, organizationId, { goalId: updated?.goalId })
      updateInitiative(id, apiPayload).catch((error) => {
        if (isGoalNotFoundError(error)) {
          const retry = mapInitiativeToApi({ ...updated, goalId: null }, organizationId, {
            goalId: null,
          })
          updateInitiative(id, retry)
            .then(() => {
              setInitiatives((prev) =>
                prev.map((item) =>
                  String(item.id) === String(id) ? { ...item, goalId: null } : item
                )
              )
            })
            .catch((retryError) => {
              setLoadError(formatApiError(retryError, 'Unable to update schedule'))
              setInitiatives((prev) =>
                prev.map((item) => (String(item.id) === String(id) ? moved : item))
              )
            })
          return
        }

        setLoadError(formatApiError(error, 'Unable to update schedule'))
        setInitiatives((prev) =>
          prev.map((item) => (String(item.id) === String(id) ? moved : item))
        )
      })
    }
  }

  const handleDropOnCard = (sourceId, targetInitiative, targetSlot) => {
    if (!sourceId || !targetInitiative) {
      return
    }

    const source = initiatives.find((item) => String(item.id) === String(sourceId))
    if (!source || String(source.id) === String(targetInitiative.id)) {
      return
    }

    const sourceSlot = resolveSlotKeyForItem(source)
    const targetSlotKey =
      targetSlot?.type === 'scheduled'
        ? `${targetSlot.year}-${targetSlot.quarter}`
        : 'unscheduled'

    if (sourceSlot === targetSlotKey) {
      handleReorderInQuarter(sourceId, targetInitiative.id)
      return
    }

    if (targetSlot?.type === 'scheduled') {
      moveInitiativeToQuarter(
        sourceId,
        targetSlot.year,
        targetSlot.quarter,
        targetInitiative.id
      )
      return
    }

    moveInitiativeToUnscheduled(sourceId, targetInitiative.id)
  }

  const handleDrop = (event, year, quarter) => {
    event.preventDefault()
    const id = event.dataTransfer.getData('text/plain')
    moveInitiativeToQuarter(id, year, quarter)
    setDraggingId(null)
  }

  const handleDropUnscheduled = (event) => {
    event.preventDefault()
    const id = event.dataTransfer.getData('text/plain')
    moveInitiativeToUnscheduled(id)
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

      const resolveSlotKey = (item) => {
        if (item.isScheduled && item.year && item.quarter) {
          return `${item.year}-${item.quarter}`
        }
        return unscheduledPlacements?.[String(item.id)] || 'unscheduled'
      }

      const sourceSlot = resolveSlotKey(source)
      const targetSlot = resolveSlotKey(target)
      if (sourceSlot !== targetSlot) {
        return prev
      }

      const slotEntries = prev
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => resolveSlotKey(item) === sourceSlot)
        .sort((left, right) => {
          const leftOrder = Number(left.item.order)
          const rightOrder = Number(right.item.order)
          const resolvedLeftOrder = Number.isFinite(leftOrder) ? leftOrder : left.index
          const resolvedRightOrder = Number.isFinite(rightOrder) ? rightOrder : right.index
          return resolvedLeftOrder - resolvedRightOrder
        })

      const ordered = slotEntries.map(({ item }) => item)
      const sourceIndex = ordered.findIndex((item) => String(item.id) === String(source.id))
      const targetIndex = ordered.findIndex((item) => String(item.id) === String(target.id))
      if (sourceIndex === -1 || targetIndex === -1) {
        return prev
      }
      if (sourceIndex === targetIndex) {
        return prev
      }

      const swapped = ordered.slice()
      const sourceItem = swapped[sourceIndex]
      swapped[sourceIndex] = swapped[targetIndex]
      swapped[targetIndex] = sourceItem

      const nextOrderById = new Map(
        swapped.map((item, index) => [String(item.id), index])
      )

      return prev.map((item) => {
        const nextOrder = nextOrderById.get(String(item.id))
        if (nextOrder === undefined) {
          return item
        }
        return { ...item, order: nextOrder }
      })
    })
  }

  const handleDownloadTenurePdf = async () => {
    const organizationId = Number(activeOrganizationId)
    const fromYear = Number(exportTenure.fromYear)
    const toYear = Number(exportTenure.toYear)
    const fromQuarter = exportTenure.fromQuarter
    const toQuarter = exportTenure.toQuarter
    const fromOrder = getQuarterOrderValue(fromYear, fromQuarter)
    const toOrder = getQuarterOrderValue(toYear, toQuarter)

    if (!organizationId) {
      setExportError('Select a client before exporting the roadmap.')
      return
    }

    if (fromOrder === null || toOrder === null) {
      setExportError('Select a valid tenure range.')
      return
    }

    if (fromOrder > toOrder) {
      setExportError('"From" tenure must be earlier than or equal to "To" tenure.')
      return
    }

    setIsExportingPdf(true)
    setExportError('')

    try {
      await downloadInitiativesRoadmapPdf({
        organizationId,
        fromYear,
        fromQuarter,
        toYear,
        toQuarter,
        includeUnscheduled: exportTenure.includeUnscheduled,
      })
      setIsExportDialogOpen(false)
      setToast({ type: 'success', message: 'Roadmap PDF download started.' })
    } catch (error) {
      const message = formatApiError(error, 'Unable to download roadmap PDF')
      setExportError(message)
      setToast({ type: 'error', message })
    } finally {
      setIsExportingPdf(false)
    }
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
            Showing {windowSlots[0].quarter} {windowSlots[0].year} -{' '}
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
            onClick={handleOpenExportDialog}
          >
            <FiDownload /> Export
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Status</label>
          <AppSelect
            options={statusFilterOptions}
            value={filters.status}
            onChange={(nextValue) =>
              setFilters((prev) => ({ ...prev, status: String(nextValue || 'All') }))
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Priority</label>
          <AppSelect
            options={priorityFilterOptions}
            value={filters.priority}
            onChange={(nextValue) =>
              setFilters((prev) => ({ ...prev, priority: String(nextValue || 'All') }))
            }
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">POC</label>
          <AppSelect
            options={pocFilterOptions}
            value={filters.poc}
            onChange={(nextValue) =>
              setFilters((prev) => ({ ...prev, poc: String(nextValue || 'All') }))
            }
          />
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
            {windowSlots[0].quarter} {windowSlots[0].year} -{' '}
            {windowSlots[windowSlots.length - 1].quarter}{' '}
            {windowSlots[windowSlots.length - 1].year}
          </div>
        </div>
        <div
          ref={topScrollRef}
          onScroll={handleTopScroll}
          className="overflow-x-auto border-b border-gray-100 px-4 py-2"
        >
          <div style={{ width: topScrollWidth || '100%', height: 1 }} />
        </div>
        <div
          ref={mainScrollRef}
          onScroll={handleMainScroll}
          className="overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            ref={slotGridRef}
            className="grid min-w-0 grid-flow-col auto-cols-[minmax(280px,1fr)] gap-4 pt-4"
          >
          {displaySlots.map((slot) => {
            if (slot.type === 'unscheduled') {
              const totalOneTime = unplacedUnscheduledInitiatives.reduce(
                (sum, item) =>
                  sum +
                  (item.oneTimeFees || []).reduce(
                    (inner, fee) => inner + Number(fee.amount || 0),
                    0
                  ),
                0
              )
              const totalRecurringMonthly = unplacedUnscheduledInitiatives.reduce(
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
                    {unplacedUnscheduledInitiatives.map((initiative) => (
                      <InitiativeCard
                        key={initiative.id}
                        initiative={initiative}
                        placementLabel="Not Scheduled"
                        onClick={() => handleOpenEdit(initiative)}
                        onDragStart={(event) => handleDragStart(event, initiative)}
                        onDragEnd={handleDragEnd}
                        draggingId={draggingId}
                        onDropOnCard={(sourceId) =>
                          handleDropOnCard(sourceId, initiative, { type: 'unscheduled' })
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

            const items = initiativesBySlot.get(slot.key) || []
            const placedUnscheduled = placedUnscheduledBySlot.get(slot.key) || []
            const combinedItems = [...items, ...placedUnscheduled].sort((left, right) => {
              const leftOrder = Number(left.order)
              const rightOrder = Number(right.order)
              const resolvedLeftOrder = Number.isFinite(leftOrder)
                ? leftOrder
                : Number.MAX_SAFE_INTEGER
              const resolvedRightOrder = Number.isFinite(rightOrder)
                ? rightOrder
                : Number.MAX_SAFE_INTEGER
              return resolvedLeftOrder - resolvedRightOrder
            })
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
                key={slot.key}
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
                  {combinedItems.length === 0 ? (
                    <div className="rounded-md border border-dashed border-gray-200 bg-white px-3 py-6 text-center text-xs text-gray-400">
                      No initiative added
                    </div>
                  ) : (
                    combinedItems.map((initiative) => (
                      <InitiativeCard
                        key={initiative.id}
                        initiative={initiative}
                        placementLabel={
                          initiative.isScheduled ? null : `${slot.quarter} ${slot.year}`
                        }
                        onClick={() => handleOpenEdit(initiative)}
                        onDragStart={(event) => handleDragStart(event, initiative)}
                        onDragEnd={handleDragEnd}
                        draggingId={draggingId}
                        onDropOnCard={(sourceId) =>
                          handleDropOnCard(sourceId, initiative, {
                            type: 'scheduled',
                            year: slot.year,
                            quarter: slot.quarter,
                          })
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
          onPersist={handleSaveInitiative}
          onDelete={handleDelete}
          onLinkedAssessmentClick={handleLinkedAssessmentClick}
          showSaveTemplateAction
          showApplyTemplateAction
        />
      )}

      {isExportDialogOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Select Tenure</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose year and quarter range for PDF export.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseExportDialog}
                className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
                aria-label="Close export dialog"
                disabled={isExportingPdf}
              >
                <FiX />
              </button>
            </div>

            <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">From Year</label>
                <AppSelect
                  options={exportYearSelectOptions}
                  value={exportTenure.fromYear}
                  onChange={(nextValue) =>
                    handleExportTenureChange('fromYear', Number(nextValue))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">From Quarter</label>
                <AppSelect
                  options={quarterSelectOptions}
                  value={exportTenure.fromQuarter}
                  onChange={(nextValue) =>
                    handleExportTenureChange('fromQuarter', String(nextValue || ''))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">To Year</label>
                <AppSelect
                  options={exportYearSelectOptions}
                  value={exportTenure.toYear}
                  onChange={(nextValue) =>
                    handleExportTenureChange('toYear', Number(nextValue))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">To Quarter</label>
                <AppSelect
                  options={quarterSelectOptions}
                  value={exportTenure.toQuarter}
                  onChange={(nextValue) =>
                    handleExportTenureChange('toQuarter', String(nextValue || ''))
                  }
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(exportTenure.includeUnscheduled)}
                  onChange={(event) =>
                    handleExportTenureChange('includeUnscheduled', event.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[rgb(5,117,204)] focus:ring-[rgb(5,117,204)]"
                />
                Include not scheduled initiatives
              </label>
            </div>

            {exportError && (
              <div className="px-5 pb-2 text-sm text-red-600">{exportError}</div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={handleCloseExportDialog}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isExportingPdf}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownloadTenurePdf}
                disabled={isExportingPdf}
                className="inline-flex items-center gap-2 rounded-md bg-[rgb(5,117,204)] px-4 py-2 text-sm font-medium text-white hover:bg-[rgb(0,97,170)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiDownload />
                {isExportingPdf ? 'Downloading...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastMessage toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}

const InitiativeCard = ({
  initiative,
  placementLabel,
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
  const scheduleLabel = placementLabel
    ? placementLabel
    : initiative.isScheduled
      ? `${initiative.quarter} ${initiative.year}`
      : 'Not Scheduled'

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
          <div className="mt-1 text-xs text-gray-500">{scheduleLabel}</div>
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
        <div
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <AppSelect
            options={STATUS_OPTIONS.map((status) => ({
              value: status,
              label: status,
            }))}
            value={initiative.status}
            onChange={(nextValue) => {
              if (onStatusChange) {
                onStatusChange(nextValue)
              }
            }}
            size="sm"
          />
        </div>
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












