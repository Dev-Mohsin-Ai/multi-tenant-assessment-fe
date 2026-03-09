import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import {
  FiChevronsDown,
  FiChevronsUp,
  FiChevronDown,
  FiChevronUp,
  FiMoreVertical,
  FiPlus,
  FiX,
} from 'react-icons/fi'
import InitiativeDrawer from '../roadmap/InitiativeDrawer'
import AppSelect from '../../shared/components/AppSelect'
import {
  createInitiative,
  deleteInitiative,
  getInitiativeById,
  getInitiatives,
  updateInitiative,
} from '../../shared/services/initiativeService'
import {
  createGoal,
  deleteGoal as deleteGoalApi,
  getGoalInitiatives,
  getGoals,
  updateGoal as updateGoalApi,
} from '../../shared/services/goalService'
import { mapInitiativeFromApi, mapInitiativeToApi } from '../roadmap/initiativeMapper'
import { CONTACTS, PRIORITY_OPTIONS, QUARTERS, STATUS_OPTIONS } from '../roadmap/initiativeConstants'
import { useAppStore } from '../../shared/store/useAppStore'

const buildScheduleOptions = (years) =>
  years.flatMap((year) => QUARTERS.map((quarter) => `${quarter}, ${year}`))

const formatApiError = (error, fallback) => {
  const status = error?.response?.status
  const data = error?.response?.data
  const detail =
    typeof data === 'string'
      ? data
      : typeof data?.detail === 'string'
        ? data.detail
        : Array.isArray(data?.detail)
          ? data.detail
              .map((item) => item?.msg || item?.message || '')
              .filter(Boolean)
              .join(', ')
          : ''

  const statusLabel = status ? ` (HTTP ${status})` : ''
  const detailLabel = detail ? `: ${detail}` : ''
  return `${fallback}${statusLabel}${detailLabel}`
}

const isGoalNotFoundError = (error) => {
  const status = error?.response?.status
  const data = error?.response?.data
  const detail =
    typeof data === 'string'
      ? data
      : typeof data?.detail === 'string'
        ? data.detail
        : ''

  return Number(status) === 404 && /goal not found/i.test(detail)
}

const UNSCHEDULED_PLACEMENTS_KEY = 'unscheduledPlacements'
const parseQuarterSlotKey = (value) => {
  const match = /^(\d{4})-(Q[1-4])$/.exec(String(value || ''))
  if (!match) {
    return null
  }
  return { year: Number(match[1]), quarter: match[2] }
}

const Goals = () => {
  const navigate = useNavigate()
  const activeOrganizationId = useAppStore((state) => state.activeOrganizationId)
  const currentYear = new Date().getFullYear()
  const NOT_SCHEDULED_LABEL = 'Not Scheduled'
  const years = useMemo(
    () => Array.from({ length: 5 }, (_, index) => currentYear + index),
    [currentYear]
  )
  const yearOptions = useMemo(
    () => Array.from({ length: 6 }, (_, index) => currentYear - 1 + index),
    [currentYear]
  )
  const scheduleOptions = useMemo(() => buildScheduleOptions(yearOptions), [yearOptions])
  const statusFilterOptions = [
    { value: 'All status', label: 'All status' },
    { value: 'On Track', label: 'On Track' },
    { value: 'At Risk', label: 'At Risk' },
    { value: 'Off Track', label: 'Off Track' },
    { value: 'Completed', label: 'Completed' },
  ]
  const yearFilterOptions = [
    { value: 'All year', label: 'All year' },
    ...yearOptions.map((year) => ({ value: year, label: String(year) })),
  ]
  const periodFilterOptions = [
    { value: 'All period', label: 'All period' },
    ...QUARTERS.map((quarter) => ({ value: quarter, label: quarter })),
  ]
  const initiativeStatusOptions = STATUS_OPTIONS.map((status) => ({
    value: status,
    label: status,
  }))
  const initiativePriorityOptions = PRIORITY_OPTIONS.map((priority) => ({
    value: priority.value,
    label: priority.display,
  }))
  const scheduleFilterOptions = [
    { value: NOT_SCHEDULED_LABEL, label: NOT_SCHEDULED_LABEL },
    ...scheduleOptions.map((label) => ({ value: label, label })),
  ]
  const contactOptions = CONTACTS.map((contact) => ({
    value: contact.id,
    label: contact.full_name,
  }))

  const [filters, setFilters] = useState({
    status: 'All status',
    year: 'All year',
    period: 'All period',
  })

  const [availableInitiatives, setAvailableInitiatives] = useState([])
  const [loadingInitiatives, setLoadingInitiatives] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [initiativeDrawerState, setInitiativeDrawerState] = useState({
    open: false,
    mode: 'edit',
    initiative: null,
  })

  const [goals, setGoals] = useState(() => [])
  const [loadingGoals, setLoadingGoals] = useState(false)
  const [goalError, setGoalError] = useState('')

  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [dialogState, setDialogState] = useState(() => ({
    open: false,
    context: 'create', // 'create' | 'link'
    goalId: null,
    mode: 'existing', // 'existing' | 'new'
    goalTitle: '',
    existingInitiativeIds: [],
    newInitiativeTitle: '',
    newInitiativePocId: CONTACTS[0]?.id || 1,
    newInitiativeIsScheduled: false,
    newInitiativeYear: currentYear,
    newInitiativeQuarter: QUARTERS[0],
    error: '',
    saving: false,
  }))
  const [rowMenu, setRowMenu] = useState(null)
  const [goalMenuId, setGoalMenuId] = useState(null)
  const placementsStorageKey = useMemo(() => {
    const organizationId = Number(activeOrganizationId)
    if (!organizationId) {
      return UNSCHEDULED_PLACEMENTS_KEY
    }
    return `${UNSCHEDULED_PLACEMENTS_KEY}:${organizationId}`
  }, [activeOrganizationId])
  const [placementOverrides, setPlacementOverrides] = useState(() => ({}))

  useEffect(() => {
    try {
      const scopedRaw = localStorage.getItem(placementsStorageKey)
      if (scopedRaw) {
        setPlacementOverrides(JSON.parse(scopedRaw))
        return
      }
      if (placementsStorageKey !== UNSCHEDULED_PLACEMENTS_KEY) {
        const legacyRaw = localStorage.getItem(UNSCHEDULED_PLACEMENTS_KEY)
        setPlacementOverrides(legacyRaw ? JSON.parse(legacyRaw) : {})
        return
      }
      setPlacementOverrides({})
    } catch {
      setPlacementOverrides({})
    }
  }, [placementsStorageKey])

  const persistPlacementOverrides = useCallback(
    (updater) => {
      setPlacementOverrides((prev) => {
        const next =
          typeof updater === 'function'
            ? updater(prev || {})
            : updater && typeof updater === 'object'
              ? updater
              : {}
        try {
          const serialized = JSON.stringify(next)
          localStorage.setItem(placementsStorageKey, serialized)
          if (placementsStorageKey !== UNSCHEDULED_PLACEMENTS_KEY) {
            localStorage.setItem(UNSCHEDULED_PLACEMENTS_KEY, serialized)
          }
        } catch {
          // ignore storage failures
        }
        return next
      })
    },
    [placementsStorageKey]
  )

  const loadInitiatives = useCallback(async () => {
    const organizationId = Number(activeOrganizationId)
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
  }, [activeOrganizationId])

  useEffect(() => {
    loadInitiatives()
  }, [loadInitiatives])

  const loadGoals = useCallback(async () => {
    const organizationId = Number(activeOrganizationId)
    if (!organizationId) {
      setGoals([])
      return
    }

    setLoadingGoals(true)
    setGoalError('')

    try {
      const data = await getGoals({ organization_id: organizationId })
      const list = Array.isArray(data) ? data : data?.goals || []

      const goalsWithInitiatives = await Promise.all(
        list.map(async (goal) => {
          try {
            const initiatives = await getGoalInitiatives(goal.id)
            const initiativeList = Array.isArray(initiatives)
              ? initiatives
              : initiatives?.initiatives || []
            const mappedFromEndpoint = initiativeList.map((item) => mapInitiativeFromApi(item))

            return {
              ...goal,
              statusLabel: goal.statusLabel || 'On Track',
              targetYear: goal.targetYear || currentYear,
              targetQuarter: goal.targetQuarter || 'Q1',
              completed: Boolean(goal.completed),
              initiatives: mappedFromEndpoint,
            }
          } catch {
            return {
              ...goal,
              statusLabel: goal.statusLabel || 'On Track',
              targetYear: goal.targetYear || currentYear,
              targetQuarter: goal.targetQuarter || 'Q1',
              completed: Boolean(goal.completed),
              initiatives: [],
            }
          }
        })
      )

      setGoals(goalsWithInitiatives)
      setExpandedIds(new Set(goalsWithInitiatives.map((goal) => goal.id)))
    } catch {
      setGoalError('Unable to load goals')
    } finally {
      setLoadingGoals(false)
    }
  }, [activeOrganizationId, currentYear])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  useEffect(() => {
    const openGoalId = localStorage.getItem('openGoalId')
    if (!openGoalId) {
      return
    }

    const match = goals.find((goal) => String(goal.id) === String(openGoalId))
    if (!match) {
      return
    }

    setExpandedIds((prev) => new Set([...prev, match.id]))

    setTimeout(() => {
      const node = document.getElementById(`goal-${match.id}`)
      node?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)

    localStorage.removeItem('openGoalId')
  }, [goals])

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
    return goals.filter((goal) => {
      const matchesStatus =
        filters.status === 'All status' ||
        String(goal.statusLabel || '').toLowerCase() === String(filters.status).toLowerCase()
      const matchesYear =
        filters.year === 'All year' || String(goal.targetYear) === String(filters.year)
      const matchesPeriod =
        filters.period === 'All period' || String(goal.targetQuarter) === String(filters.period)
      return matchesStatus && matchesYear && matchesPeriod
    })
  }, [filters.period, filters.status, filters.year, goals])

  const isAllExpanded = useMemo(() => {
    if (filteredGoals.length === 0) {
      return false
    }
    return filteredGoals.every((goal) => expandedIds.has(goal.id))
  }, [expandedIds, filteredGoals])

  const dialogLinkedInitiativeIds = useMemo(() => {
    if (!dialogState.goalId) {
      return new Set()
    }
    const goal = goals.find((item) => item.id === dialogState.goalId)
    return new Set((goal?.initiatives || []).map((initiative) => String(initiative.id)))
  }, [dialogState.goalId, goals])

  const initiativeOwnerGoalById = useMemo(() => {
    const map = new Map()
    goals.forEach((goal) => {
      const initiatives = Array.isArray(goal?.initiatives) ? goal.initiatives : []
      initiatives.forEach((initiative) => {
        const key = String(initiative?.id || '')
        if (!key || map.has(key)) {
          return
        }
        map.set(key, goal.id)
      })
    })
    return map
  }, [goals])

  const dialogAvailableInitiatives = useMemo(() => {
    return availableInitiatives.filter((initiative) => {
      const initiativeId = String(initiative?.id || '')
      if (!initiativeId) {
        return false
      }

      // Never show initiatives already linked to this goal in the picker.
      if (dialogLinkedInitiativeIds.has(initiativeId)) {
        return false
      }

      // Enforce single-goal ownership: initiative must be unlinked or belong to current goal.
      const currentGoalId = dialogState.goalId
      const ownerGoalId =
        initiativeOwnerGoalById.get(initiativeId) ?? initiative?.goalId ?? null

      if (ownerGoalId === null || ownerGoalId === undefined) {
        return true
      }
      if (currentGoalId === null || currentGoalId === undefined) {
        return false
      }
      return String(ownerGoalId) === String(currentGoalId)
    })
  }, [
    availableInitiatives,
    dialogLinkedInitiativeIds,
    dialogState.goalId,
    initiativeOwnerGoalById,
  ])

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

  useEffect(() => {
    if (!dialogState.open) {
      return
    }
    if (dialogState.mode !== 'existing') {
      return
    }
    if (!Array.isArray(dialogState.existingInitiativeIds) || dialogState.existingInitiativeIds.length === 0) {
      return
    }
    const stillAvailable = new Set(dialogAvailableInitiatives.map((initiative) => String(initiative.id)))
    setDialogState((prev) => {
      const currentIds = Array.isArray(prev.existingInitiativeIds) ? prev.existingInitiativeIds : []
      const nextIds = currentIds.filter((id) => stillAvailable.has(String(id)))
      const unchanged =
        nextIds.length === currentIds.length &&
        nextIds.every((id, index) => String(id) === String(currentIds[index]))

      if (unchanged) {
        return prev
      }

      return {
        ...prev,
        existingInitiativeIds: nextIds,
      }
    })
  }, [
    dialogAvailableInitiatives,
    dialogState.existingInitiativeIds,
    dialogState.mode,
    dialogState.open,
  ])

  const handleCloseInitiativeDrawer = useCallback(() => {
    setInitiativeDrawerState({ open: false, mode: 'edit', initiative: null })
  }, [])

  const upsertAvailableInitiatives = useCallback((nextInitiatives) => {
    const updates = Array.isArray(nextInitiatives) ? nextInitiatives.filter(Boolean) : []
    if (updates.length === 0) {
      return
    }

    setAvailableInitiatives((prev) => {
      const byId = new Map(prev.map((initiative) => [String(initiative.id), initiative]))
      updates.forEach((initiative) => {
        const key = String(initiative.id)
        byId.set(key, { ...(byId.get(key) || {}), ...initiative })
      })
      return Array.from(byId.values())
    })
  }, [])

  const syncGoalsWithInitiatives = useCallback((nextInitiatives) => {
    const updates = Array.isArray(nextInitiatives) ? nextInitiatives.filter(Boolean) : []
    if (updates.length === 0) {
      return
    }

    const updatesById = new Map(updates.map((initiative) => [String(initiative.id), initiative]))

    setGoals((prev) =>
      prev.map((goal) => {
        const goalId = String(goal.id)
        const current = Array.isArray(goal.initiatives) ? goal.initiatives : []
        const retained = current.filter((initiative) => !updatesById.has(String(initiative.id)))
        const assigned = updates.filter(
          (initiative) =>
            initiative.goalId !== null &&
            initiative.goalId !== undefined &&
            String(initiative.goalId) === goalId
        )
        return { ...goal, initiatives: [...retained, ...assigned] }
      })
    )
  }, [])

  const handleOpenInitiativeFromGoal = useCallback(
    async (initiativeId) => {
      if (!initiativeId) {
        return
      }

      setRowMenu(null)
      setGoalMenuId(null)
      setLoadError('')

      const fallbackFromGoals = goals
        .flatMap((goal) => goal.initiatives || [])
        .find((initiative) => String(initiative.id) === String(initiativeId))

      const fallbackFromList =
        availableInitiatives.find((initiative) => String(initiative.id) === String(initiativeId)) ||
        null

      const fallback = fallbackFromGoals || fallbackFromList

      try {
        const detailed = await getInitiativeById(initiativeId)
        const fallbackLinkedItems = Array.isArray(fallback?.linkedItems)
          ? fallback.linkedItems
          : []
        const mapped = mapInitiativeFromApi(detailed, {
          linkedItemsById: fallbackLinkedItems.length > 0
            ? { [initiativeId]: fallbackLinkedItems }
            : undefined,
        })
        setInitiativeDrawerState({ open: true, mode: 'edit', initiative: mapped })
      } catch {
        setLoadError('Unable to load initiative')
      }
    },
    [availableInitiatives, goals]
  )

  const handleSaveInitiativeFromDrawer = useCallback(
    async (payload) => {
      const organizationId = Number(activeOrganizationId)
      const targetId = initiativeDrawerState.initiative?.id
      if (!organizationId || !targetId) {
        setLoadError('Select a client before updating initiatives.')
        return
      }

      setLoadError('')

      try {
        const owningGoal = goals.find((goal) =>
          (goal.initiatives || []).some(
            (initiative) => String(initiative.id) === String(targetId)
          )
        )
        const goalIdToPersist = owningGoal?.id ?? initiativeDrawerState.initiative?.goalId ?? null
        const apiPayload =
          goalIdToPersist === null
            ? mapInitiativeToApi(payload, organizationId)
            : mapInitiativeToApi(payload, organizationId, { goalId: goalIdToPersist })

        let updated
        let nextPayload = payload
        try {
          updated = await updateInitiative(targetId, apiPayload)
        } catch (error) {
          if (!isGoalNotFoundError(error)) {
            throw error
          }
          const retryPayload = mapInitiativeToApi(
            { ...payload, goalId: null },
            organizationId,
            { goalId: null }
          )
          updated = await updateInitiative(targetId, retryPayload)
          nextPayload = { ...payload, goalId: null }
        }

        const mapped = mapInitiativeFromApi(updated, {
          linkedItemsById: Array.isArray(nextPayload?.linkedItems)
            ? { [targetId]: nextPayload.linkedItems }
            : undefined,
        })
        const normalizedMapped = nextPayload.isScheduled
          ? mapped
          : {
              ...mapped,
              isScheduled: false,
              year: null,
              quarter: null,
              startDate: null,
            }

        upsertAvailableInitiatives([normalizedMapped])
        syncGoalsWithInitiatives([normalizedMapped])

        handleCloseInitiativeDrawer()
      } catch (error) {
        setLoadError(formatApiError(error, 'Unable to update initiative'))
      }
    },
    [
      activeOrganizationId,
      goals,
      handleCloseInitiativeDrawer,
      initiativeDrawerState.initiative?.goalId,
      initiativeDrawerState.initiative?.id,
      syncGoalsWithInitiatives,
      upsertAvailableInitiatives,
    ]
  )

  const handleDeleteInitiativeFromDrawer = useCallback(
    async (initiativeId) => {
      if (!initiativeId) {
        return
      }

      setLoadError('')

      try {
        await deleteInitiative(initiativeId)
        setAvailableInitiatives((prev) =>
          prev.filter((item) => String(item.id) !== String(initiativeId))
        )
        setGoals((prev) =>
          prev.map((goal) => ({
            ...goal,
            initiatives: (goal.initiatives || []).filter(
              (initiative) => String(initiative.id) !== String(initiativeId)
            ),
          }))
        )
        handleCloseInitiativeDrawer()
      } catch {
        setLoadError('Unable to delete initiative')
      }
    },
    [handleCloseInitiativeDrawer]
  )

  const handleLinkedAssessmentClick = useCallback(
    (item) => {
      if (!item?.assessmentId) {
        return
      }
      navigate(`/assessments/${item.assessmentId}/read-only`, {
        state: { responseId: item.responseId, backTo: '/goals' },
      })
    },
    [navigate]
  )

  const handleOpenNewGoal = () => {
    openGoalDialog({
      context: 'create',
      goalId: null,
      mode: 'existing',
      goalTitle: '',
      existingInitiativeIds: [],
      newInitiativeTitle: '',
      newInitiativePocId: CONTACTS[0]?.id || 1,
      newInitiativeIsScheduled: false,
      newInitiativeYear: currentYear,
      newInitiativeQuarter: QUARTERS[0],
    })
  }

  const handleOpenLinkGoal = (goal) => {
    openGoalDialog({
      context: 'link',
      goalId: goal.id,
      mode: 'existing',
      goalTitle: goal.title || '',
      existingInitiativeIds: [],
      newInitiativeTitle: '',
      newInitiativePocId: CONTACTS[0]?.id || 1,
      newInitiativeIsScheduled: false,
      newInitiativeYear: currentYear,
      newInitiativeQuarter: QUARTERS[0],
    })
  }

  const handleSaveDialog = async ({ viewAfterSave }) => {
    const title = dialogState.goalTitle.trim()
    if (!title) {
      setDialogState((prev) => ({ ...prev, error: 'Goal title is required.' }))
      return
    }

    setDialogState((prev) => ({ ...prev, saving: true, error: '' }))

    try {
      const organizationId = Number(activeOrganizationId)
      if (!organizationId) {
        setDialogState((prev) => ({
          ...prev,
          saving: false,
          error: 'Select a client before saving goals.',
        }))
        return
      }

      let goalId = dialogState.goalId

      if (dialogState.context === 'create') {
        const created = await createGoal({ title, organization_id: organizationId })
        goalId = created?.id
        if (goalId) {
          setGoals((prev) => {
            if (prev.some((goal) => String(goal.id) === String(goalId))) {
              return prev
            }
            return [
              {
                ...created,
                statusLabel: created?.statusLabel || 'On Track',
                targetYear: created?.targetYear || currentYear,
                targetQuarter: created?.targetQuarter || 'Q1',
                completed: Boolean(created?.completed),
                initiatives: [],
              },
              ...prev,
            ]
          })
        }
      } else if (goalId) {
        await updateGoalApi(goalId, { title })
        setGoals((prev) =>
          prev.map((goal) => (String(goal.id) === String(goalId) ? { ...goal, title } : goal))
        )
      }

      if (!goalId) {
        setDialogState((prev) => ({
          ...prev,
          saving: false,
          error: 'Unable to determine the goal to save.',
        }))
        return
      }

      let linkedInitiative = null

      if (dialogState.mode === 'existing') {
        const selectedIds = Array.isArray(dialogState.existingInitiativeIds)
          ? dialogState.existingInitiativeIds.map((id) => String(id)).filter(Boolean)
          : []
        const isCreateWithoutInitiatives =
          dialogState.context === 'create' && selectedIds.length === 0
        if (selectedIds.length === 0 && !isCreateWithoutInitiatives) {
          setDialogState((prev) => ({
            ...prev,
            saving: false,
            error: 'Select one or more initiatives to continue.',
          }))
          return
        }

        if (isCreateWithoutInitiatives) {
          closeGoalDialog()
          setExpandedIds((prev) => new Set([...prev, goalId]))
          return
        }

        const selectedInitiatives = selectedIds
          .map(
            (id) =>
              availableInitiatives.find((item) => String(item.id) === String(id)) || null
          )
          .filter(Boolean)

        if (selectedInitiatives.length !== selectedIds.length) {
          setDialogState((prev) => ({
            ...prev,
            saving: false,
            error: 'One or more selected initiatives were not found.',
          }))
          return
        }

        const linkedElsewhere = selectedInitiatives.filter((initiative) => {
          const initiativeId = String(initiative?.id || '')
          const ownerGoalId =
            initiativeOwnerGoalById.get(initiativeId) ?? initiative?.goalId ?? null
          if (ownerGoalId === null || ownerGoalId === undefined) {
            return false
          }
          return String(ownerGoalId) !== String(goalId)
        })

        if (linkedElsewhere.length > 0) {
          setDialogState((prev) => ({
            ...prev,
            saving: false,
            error: 'Selected initiative is already linked to another goal.',
          }))
          return
        }

        const updatedInitiatives = await Promise.all(
          selectedInitiatives.map(async (initiative) => {
            const mappedPayload = mapInitiativeToApi(initiative, organizationId, { goalId })
            const updated = await updateInitiative(initiative.id, mappedPayload)
            return mapInitiativeFromApi(updated)
          })
        )

        upsertAvailableInitiatives(updatedInitiatives)
        syncGoalsWithInitiatives(updatedInitiatives)
        linkedInitiative = updatedInitiatives[0] || null
      } else {
        const initiativeTitle = dialogState.newInitiativeTitle.trim()
        if (!initiativeTitle) {
          if (dialogState.context === 'create') {
            closeGoalDialog()
            setExpandedIds((prev) => new Set([...prev, goalId]))
            return
          }
          setDialogState((prev) => ({
            ...prev,
            saving: false,
            error: 'Initiative title is required.',
          }))
          return
        }
        const isScheduled = Boolean(
          dialogState.newInitiativeIsScheduled &&
            Number(dialogState.newInitiativeYear) &&
            QUARTERS.includes(dialogState.newInitiativeQuarter)
        )
        const payload = mapInitiativeToApi(
          {
            title: initiativeTitle,
            summary: '',
            status: 'Open',
            priority: 'Medium',
            isScheduled,
            year: isScheduled ? Number(dialogState.newInitiativeYear) : null,
            quarter: isScheduled ? dialogState.newInitiativeQuarter : null,
            contactId: dialogState.newInitiativePocId,
            oneTimeFees: [],
            recurringFees: [],
            linkedSubcategoryIds: [],
          },
          organizationId,
          { goalId }
        )
        const created = await createInitiative(payload)
        linkedInitiative = mapInitiativeFromApi(created)
        upsertAvailableInitiatives([linkedInitiative])
        syncGoalsWithInitiatives([linkedInitiative])
      }

      closeGoalDialog()
      if (viewAfterSave && linkedInitiative?.id) {
        localStorage.setItem('openInitiativeId', String(linkedInitiative.id))
        navigate('/roadmap')
      } else {
        setExpandedIds((prev) => new Set([...prev, goalId]))
      }
    } catch (error) {
      setDialogState((prev) => ({
        ...prev,
        saving: false,
        error: formatApiError(error, 'Unable to save. Please try again'),
      }))
    } finally {
      setDialogState((prev) => ({ ...prev, saving: false }))
    }
  }

  const handleUnlinkInitiative = async (goalId, initiativeId) => {
    if (!initiativeId) {
      return
    }

    const organizationId = Number(activeOrganizationId)
    if (!organizationId) {
      setLoadError('Select a client before updating initiatives.')
      return
    }

    setLoadError('')

    const existing =
      goals
        .find((goal) => String(goal.id) === String(goalId))
        ?.initiatives?.find((initiative) => String(initiative.id) === String(initiativeId)) ||
      availableInitiatives.find((initiative) => String(initiative.id) === String(initiativeId)) ||
      null

    if (!existing) {
      setLoadError('Unable to find initiative to unlink.')
      return
    }

    try {
      const detailed = await getInitiativeById(existing.id).catch(() => null)
      const sourceInitiative = detailed ? mapInitiativeFromApi(detailed) : existing
      const updated = await updateInitiative(
        existing.id,
        mapInitiativeToApi(sourceInitiative, organizationId, { goalId: null })
      )
      const mapped = mapInitiativeFromApi(updated)
      if (mapped.goalId !== null && mapped.goalId !== undefined) {
        throw new Error('unlink-not-persisted')
      }
      const normalizedMapped = {
        ...mapped,
        goalId: null,
      }
      upsertAvailableInitiatives([normalizedMapped])
      syncGoalsWithInitiatives([normalizedMapped])
      await Promise.all([loadGoals(), loadInitiatives()])
    } catch (error) {
      console.error('Unlink initiative failed', error)
    }
  }

  const handleRemoveGoal = async (goalId) => {
    if (!goalId) {
      return
    }

    setGoalError('')
    try {
      await deleteGoalApi(goalId)
      setGoals((prev) => prev.filter((goal) => String(goal.id) !== String(goalId)))
      setExpandedIds((prev) => {
        const next = new Set(prev)
        next.delete(goalId)
        return next
      })
      setRowMenu((prev) => (prev?.goalId === goalId ? null : prev))
      setGoalMenuId((prev) => (prev === goalId ? null : prev))
      setDialogState((prev) => (prev.goalId === goalId ? { ...prev, open: false } : prev))
    } catch {
      setGoalError('Unable to remove goal')
    }
  }

  const patchInitiativeInState = useCallback((initiativeId, updates) => {
    const id = String(initiativeId)
    setGoals((prev) =>
      prev.map((goal) => ({
        ...goal,
        initiatives: (goal.initiatives || []).map((initiative) =>
          String(initiative.id) === id ? { ...initiative, ...updates } : initiative
        ),
      }))
    )
    setAvailableInitiatives((prev) =>
      prev.map((initiative) =>
        String(initiative.id) === id ? { ...initiative, ...updates } : initiative
      )
    )
  }, [])

  const getInitiativeSnapshot = useCallback(
    (goalId, initiativeId) =>
      goals
        .find((goal) => String(goal.id) === String(goalId))
        ?.initiatives?.find((initiative) => String(initiative.id) === String(initiativeId)) ||
      availableInitiatives.find((initiative) => String(initiative.id) === String(initiativeId)) ||
      null,
    [availableInitiatives, goals]
  )

  const handlePersistInitiativePatch = useCallback(
    async (goalId, initiativeId, updates) => {
      const organizationId = Number(activeOrganizationId)
      if (!organizationId) {
        setLoadError('Select a client before updating initiatives.')
        return
      }
      const isScheduleMutation = Object.prototype.hasOwnProperty.call(
        updates || {},
        'isScheduled'
      )

      const existing = getInitiativeSnapshot(goalId, initiativeId)
      if (!existing) {
        setLoadError('Unable to find initiative to update.')
        return
      }

      const optimistic = { ...existing, ...updates }
      const normalizedOptimistic = optimistic.isScheduled
        ? optimistic
        : {
            ...optimistic,
            isScheduled: false,
            year: null,
            quarter: null,
            startDate: null,
          }

      patchInitiativeInState(initiativeId, normalizedOptimistic)
      if (isScheduleMutation) {
        const requestedQuarterValue = QUARTERS.includes(updates?.quarter) ? updates.quarter : null
        const numericRequestedYear = Number(updates?.year)
        const requestedYearValue = Number.isFinite(numericRequestedYear)
          ? numericRequestedYear
          : null

        persistPlacementOverrides((prev) => {
          const nextPlacements = { ...(prev || {}) }
          if (updates?.isScheduled === false) {
            nextPlacements[String(initiativeId)] = 'unscheduled'
          } else if (updates?.isScheduled === true && requestedYearValue && requestedQuarterValue) {
            nextPlacements[String(initiativeId)] = `${requestedYearValue}-${requestedQuarterValue}`
          }
          return nextPlacements
        })
      }

      try {
        const goalIdToPersist =
          normalizedOptimistic.goalId !== null && normalizedOptimistic.goalId !== undefined
            ? normalizedOptimistic.goalId
            : goalId
        const shouldOmitGoalId =
          Object.prototype.hasOwnProperty.call(updates || {}, 'isScheduled') &&
          updates?.isScheduled === false

        let updated
        try {
          const primaryPayload = shouldOmitGoalId
            ? mapInitiativeToApi(normalizedOptimistic, organizationId)
            : mapInitiativeToApi(normalizedOptimistic, organizationId, { goalId: goalIdToPersist })
          updated = await updateInitiative(
            initiativeId,
            primaryPayload
          )
        } catch (error) {
          if (!isGoalNotFoundError(error)) {
            throw error
          }
          updated = await updateInitiative(
            initiativeId,
            mapInitiativeToApi(
              {
                ...normalizedOptimistic,
                goalId: null,
              },
              organizationId,
              { goalId: null }
            )
          )
        }

        const latest = await getInitiativeById(initiativeId).catch(() => updated)
        const mapped = mapInitiativeFromApi(latest)
        const hasRequestedScheduleState = Object.prototype.hasOwnProperty.call(
          updates || {},
          'isScheduled'
        )
        const requestedScheduleState = hasRequestedScheduleState ? Boolean(updates?.isScheduled) : null

        let normalizedMapped = mapped
        if (requestedScheduleState === false) {
          normalizedMapped = {
            ...mapped,
            isScheduled: false,
            year: null,
            quarter: null,
            startDate: null,
          }
        } else if (requestedScheduleState === true) {
          const requestedYear = Number(updates?.year ?? normalizedOptimistic.year ?? mapped.year)
          const requestedQuarter = updates?.quarter ?? normalizedOptimistic.quarter ?? mapped.quarter
          normalizedMapped = {
            ...mapped,
            isScheduled: true,
            year: Number.isFinite(requestedYear) ? requestedYear : mapped.year,
            quarter: QUARTERS.includes(requestedQuarter) ? requestedQuarter : mapped.quarter,
          }
        } else if (!mapped.isScheduled) {
          normalizedMapped = {
            ...mapped,
            isScheduled: false,
            year: null,
            quarter: null,
            startDate: null,
          }
        }
        upsertAvailableInitiatives([normalizedMapped])
        syncGoalsWithInitiatives([normalizedMapped])
        const requestedQuarterValue = QUARTERS.includes(updates?.quarter) ? updates.quarter : null
        const numericRequestedYear = Number(updates?.year)
        const requestedYearValue = Number.isFinite(numericRequestedYear)
          ? numericRequestedYear
          : null

        persistPlacementOverrides((prev) => {
          const nextPlacements = { ...(prev || {}) }
          if (requestedScheduleState === false) {
            nextPlacements[String(initiativeId)] = 'unscheduled'
          } else if (requestedScheduleState === true && requestedYearValue && requestedQuarterValue) {
            nextPlacements[String(initiativeId)] = `${requestedYearValue}-${requestedQuarterValue}`
          } else if (normalizedMapped.isScheduled) {
            delete nextPlacements[String(initiativeId)]
          } else {
            nextPlacements[String(initiativeId)] = 'unscheduled'
          }
          return nextPlacements
        })
        setLoadError('')
      } catch (error) {
        if (!isScheduleMutation) {
          setLoadError(formatApiError(error, 'Unable to update initiative'))
          await Promise.all([loadGoals(), loadInitiatives()])
        } else {
          console.error('Unable to persist schedule update', error)
        }
      }
    },
    [
      activeOrganizationId,
      getInitiativeSnapshot,
      loadGoals,
      loadInitiatives,
      patchInitiativeInState,
      persistPlacementOverrides,
      syncGoalsWithInitiatives,
      upsertAvailableInitiatives,
    ]
  )

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-[rgb(248,248,250)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-end gap-6">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">Status</div>
              <AppSelect
                options={statusFilterOptions}
                value={filters.status}
                onChange={(nextValue) =>
                  setFilters((prev) => ({ ...prev, status: String(nextValue || 'All status') }))
                }
                className="w-80 max-w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-gray-900">Target Period</div>
              <div className="flex flex-wrap items-center gap-3">
                <AppSelect
                  options={yearFilterOptions}
                  value={filters.year}
                  onChange={(nextValue) =>
                    setFilters((prev) => ({ ...prev, year: nextValue ?? 'All year' }))
                  }
                  className="w-48"
                />
                <AppSelect
                  options={periodFilterOptions}
                  value={filters.period}
                  onChange={(nextValue) =>
                    setFilters((prev) => ({ ...prev, period: String(nextValue || 'All period') }))
                  }
                  className="w-48"
                />
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
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-700">
                {isAllExpanded ? <FiChevronsUp /> : <FiChevronsDown />}
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

      {(goalError || loadingGoals || loadError || loadingInitiatives) && (
        <div className="rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
          {loadingGoals
            ? 'Loading goals...'
            : loadingInitiatives
              ? 'Loading initiatives...'
              : goalError || loadError}
        </div>
      )}

      {filteredGoals.map((goal) => {
        const isExpanded = expandedIds.has(goal.id)
        const linkedInitiatives = goal.initiatives || []
        return (
          <div
            key={goal.id}
            id={`goal-${goal.id}`}
            className="rounded-xl border border-gray-200 bg-white"
          >
            <div className="flex items-center justify-between px-6 py-5">
              <button
                type="button"
                onClick={() => handleToggleExpanded(goal.id)}
                className="inline-flex items-center gap-4 text-left"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-700">
                  {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                </span>
                <div className="inline-flex items-center gap-3">
                  <div className="text-xl font-semibold text-gray-900">{goal.title}</div>
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 px-2 text-sm text-gray-700">
                    {linkedInitiatives.length}
                  </span>
                </div>
              </button>

              {isExpanded && (
              <div className="flex items-center gap-4">
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
                  <table className="w-full table-fixed text-left text-sm">
                    <thead className="bg-white">
                      <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:font-semibold [&>th]:text-gray-900 [&>th]:whitespace-nowrap border-b border-gray-200">
                        <th className="w-[40%]">Initiative</th>
                        <th className="w-52">Status</th>
                        <th className="w-56">Scheduled</th>
                        <th className="w-48">POC</th>
                        <th className="w-44">Priority</th>
                        <th className="w-20">Actions</th>
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
                          const placementKey = placementOverrides[String(initiative.id)]
                          const parsedPlacement = parseQuarterSlotKey(placementKey)
                          const scheduleValue =
                            placementKey === 'unscheduled'
                              ? NOT_SCHEDULED_LABEL
                              : parsedPlacement
                                ? `${parsedPlacement.quarter}, ${parsedPlacement.year}`
                                : initiative.isScheduled
                                  ? `${initiative.quarter}, ${initiative.year}`
                                  : NOT_SCHEDULED_LABEL
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
                              <td className="px-4 py-4 align-middle">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInitiativeFromGoal(initiative.id)}
                                  className="text-[rgb(5,117,204)] hover:underline"
                                >
                                  {initiative.title || 'Untitled initiative'}
                                </button>
                              </td>
                              <td className="px-4 py-4 align-middle">
                                <AppSelect
                                  options={initiativeStatusOptions}
                                  value={statusValue}
                                  onChange={(nextValue) =>
                                    handlePersistInitiativePatch(goal.id, initiative.id, {
                                      status: nextValue,
                                    })
                                  }
                                  className="w-full"
                                />
                              </td>
                              <td className="px-4 py-4 align-middle">
                                <AppSelect
                                  options={scheduleFilterOptions}
                                  value={scheduleValue}
                                  onChange={(nextValue) => {
                                    const selected = String(nextValue || '')
                                    if (selected === NOT_SCHEDULED_LABEL) {
                                      handlePersistInitiativePatch(goal.id, initiative.id, {
                                        isScheduled: false,
                                        quarter: null,
                                        year: null,
                                      })
                                      return
                                    }
                                    const [quarterRaw, yearRaw] = selected.split(',')
                                    const quarter = quarterRaw?.trim()
                                    const year = Number(String(yearRaw || '').trim())
                                    handlePersistInitiativePatch(goal.id, initiative.id, {
                                      quarter,
                                      year,
                                      isScheduled: true,
                                    })
                                  }}
                                  className="w-full"
                                />
                              </td>
                              <td className="px-4 py-4 align-middle text-sm text-gray-900">
                                {contactName}
                              </td>
                              <td className="px-4 py-4 align-middle">
                                <AppSelect
                                  options={initiativePriorityOptions}
                                  value={priorityValue}
                                  onChange={(nextValue) =>
                                    handlePersistInitiativePatch(goal.id, initiative.id, {
                                      priority: nextValue,
                                    })
                                  }
                                  className="w-full"
                                />
                              </td>
                              <td className="px-4 py-4 align-middle">
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
                                            handleOpenInitiativeFromGoal(initiative.id)
                                            setRowMenu(null)
                                          }}
                                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                          Edit initiative
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

      {initiativeDrawerState.open && (
        <InitiativeDrawer
          key={`${initiativeDrawerState.mode}-${initiativeDrawerState.initiative?.id ?? 'new'}-na-na`}
          open={initiativeDrawerState.open}
          mode={initiativeDrawerState.mode}
          years={years}
          initiative={initiativeDrawerState.initiative}
          presetYear={null}
          presetQuarter={null}
          onClose={handleCloseInitiativeDrawer}
          onSave={handleSaveInitiativeFromDrawer}
          onDelete={handleDeleteInitiativeFromDrawer}
          onLinkedAssessmentClick={handleLinkedAssessmentClick}
          linkedAssessmentId={null}
        />
      )}

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
               </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-900">Add to</div>
                <div className="inline-flex overflow-hidden rounded-md border border-gray-200 bg-white">
                  <button
                    type="button"
                    onClick={() =>
                      setDialogState((prev) => ({
                        ...prev,
                        mode: 'existing',
                        error: '',
                        existingInitiativeIds: [],
                        newInitiativeTitle: '',
                        newInitiativeIsScheduled: false,
                      }))
                    }
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
                    onClick={() =>
                      setDialogState((prev) => ({
                        ...prev,
                        mode: 'new',
                        error: '',
                        existingInitiativeIds: [],
                        newInitiativeTitle: '',
                        newInitiativePocId: CONTACTS[0]?.id || 1,
                        newInitiativeIsScheduled: false,
                        newInitiativeYear: currentYear,
                        newInitiativeQuarter: QUARTERS[0],
                      }))
                    }
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
                   <Select
                     isMulti
                     isSearchable
                     placeholder={loadingInitiatives ? 'Loading initiatives...' : 'Search initiatives...'}
                     isDisabled={loadingInitiatives || dialogAvailableInitiatives.length === 0}
                     options={dialogAvailableInitiatives.map((initiative) => ({
                       value: String(initiative.id),
                       label: initiative.title || `Initiative #${initiative.id}`,
                     }))}
                     value={(dialogState.existingInitiativeIds || [])
                       .map((id) => String(id))
                       .map((id) => {
                         const match = dialogAvailableInitiatives.find(
                           (initiative) => String(initiative.id) === id
                         )
                         return match
                           ? { value: id, label: match.title || `Initiative #${match.id}` }
                           : null
                       })
                       .filter(Boolean)}
                     onChange={(selected) => {
                       const nextIds = Array.isArray(selected)
                         ? selected.map((item) => String(item.value))
                         : []
                       setDialogState((prev) => ({ ...prev, existingInitiativeIds: nextIds }))
                     }}
                     menuPortalTarget={document.body}
                     styles={{
                       menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                       control: (base) => ({
                         ...base,
                         minHeight: 40,
                         borderColor: 'rgb(229,231,235)',
                         boxShadow: 'none',
                       }),
                     }}
                   />
                   {dialogAvailableInitiatives.length === 0 && !loadingInitiatives && (
                     <div className="text-xs text-gray-500">
                       No more initiatives available to link.
                     </div>
                   )}
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
                      <AppSelect
                        options={contactOptions}
                        value={dialogState.newInitiativePocId}
                        onChange={(nextValue) =>
                          setDialogState((prev) => ({
                            ...prev,
                            newInitiativePocId: Number(nextValue),
                          }))
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-900">Schedule</div>
                    <div className="rounded-md border border-gray-200 bg-white p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div
                          className={`inline-flex h-9 items-center rounded-md border px-3 text-sm font-semibold ${
                            dialogState.newInitiativeIsScheduled
                              ? 'border-[rgb(5,117,204)] bg-[rgb(236,245,255)] text-[rgb(5,117,204)]'
                              : 'border-gray-300 bg-gray-50 text-gray-500'
                          }`}
                        >
                          {dialogState.newInitiativeIsScheduled ? 'Scheduled' : 'Not Scheduled'}
                        </div>
                        {!dialogState.newInitiativeIsScheduled ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDialogState((prev) => ({
                                ...prev,
                                newInitiativeIsScheduled: true,
                                newInitiativeYear: Number(prev.newInitiativeYear) || currentYear,
                                newInitiativeQuarter: prev.newInitiativeQuarter || QUARTERS[0],
                              }))
                            }
                            className="inline-flex h-9 items-center justify-center rounded-md bg-[rgb(5,117,204)] px-3 text-sm font-semibold text-white hover:bg-[rgb(0,97,170)]"
                          >
                            Schedule
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setDialogState((prev) => ({
                                ...prev,
                                newInitiativeIsScheduled: false,
                              }))
                            }
                            className="inline-flex h-9 items-center justify-center rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <AppSelect
                          options={yearOptions.map((year) => ({
                            value: year,
                            label: String(year),
                          }))}
                          value={dialogState.newInitiativeYear}
                          onChange={(nextValue) =>
                            setDialogState((prev) => ({
                              ...prev,
                              newInitiativeYear: Number(nextValue),
                            }))
                          }
                          isDisabled={!dialogState.newInitiativeIsScheduled}
                          className="w-full"
                          size="sm"
                        />
                        <AppSelect
                          options={QUARTERS.map((quarter) => ({
                            value: quarter,
                            label: quarter,
                          }))}
                          value={dialogState.newInitiativeQuarter}
                          onChange={(nextValue) =>
                            setDialogState((prev) => ({
                              ...prev,
                              newInitiativeQuarter: nextValue,
                            }))
                          }
                          isDisabled={!dialogState.newInitiativeIsScheduled}
                          className="w-full"
                          size="sm"
                        />
                      </div>
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
