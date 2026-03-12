import React, { useEffect, useMemo, useState } from 'react'
import {
  FiBookOpen,
  FiLayers,
  FiMinusCircle,
  FiRefreshCw,
  FiShield,
  FiStar,
} from 'react-icons/fi'
import AppSelect from './AppSelect'
import { useAppStore } from '../store/useAppStore'
import {
  getOrganizationById,
  toggleFavoriteOrganization,
  updateOrganization,
} from '../services/organizationService'
import {
  formatSegmentLabel,
  NOT_ASSIGNED_VALUE,
  SEGMENT_PRESETS,
} from '../constants/segments'

const SEGMENT_ICONS = {
  [NOT_ASSIGNED_VALUE]: FiMinusCircle,
  TRANSFORM: FiRefreshCw,
  MODERNIZE: FiLayers,
  EDUCATE: FiBookOpen,
  SUSTAIN: FiShield,
}

const renderSegmentOption = (option) => {
  const Icon = SEGMENT_ICONS[String(option?.value || '').toUpperCase()] || FiLayers
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-gray-500" />
      <span>{option.label}</span>
    </div>
  )
}

const TopBar = ({ activeLabel, clientName = 'Client' }) => {
  const activeOrganizationId = useAppStore((state) => state.activeOrganizationId)
  const [organization, setOrganization] = useState(null)
  const [savingFavorite, setSavingFavorite] = useState(false)
  const [savingAssignment, setSavingAssignment] = useState(false)

  const normalizedLabel = String(activeLabel || '').trim().toLowerCase()
  const isAdminTab = normalizedLabel === 'admin' || normalizedLabel === 'administration'
  const showClientControls = Boolean(activeOrganizationId) && !isAdminTab

  useEffect(() => {
    if (!showClientControls) {
      return
    }
    let isMounted = true

    const loadOrganization = async () => {
      try {
        const payload = await getOrganizationById(activeOrganizationId)
        const resolved = payload?.organization || payload
        if (isMounted) {
          setOrganization(resolved || null)
        }
      } catch {
        if (isMounted) {
          setOrganization(null)
        }
      }
    }

    void loadOrganization()
    return () => {
      isMounted = false
    }
  }, [activeOrganizationId, showClientControls])

  const assignmentOptions = useMemo(() => {
    const currentSegment = String(
      organization?.segment || organization?.client_segment || ''
    )
      .trim()
      .toUpperCase()
    const values = currentSegment
      ? [currentSegment, ...SEGMENT_PRESETS]
      : SEGMENT_PRESETS
    const unique = Array.from(new Set(values)).filter(
      (value) => String(value || '').toUpperCase() !== NOT_ASSIGNED_VALUE
    )
    return [
      { value: NOT_ASSIGNED_VALUE, label: formatSegmentLabel(NOT_ASSIGNED_VALUE) },
      ...unique.map((value) => ({ value, label: formatSegmentLabel(value) })),
    ]
  }, [organization])

  const selectedAssignment =
    String(organization?.segment || organization?.client_segment || '')
      .trim()
      .toUpperCase() ||
    NOT_ASSIGNED_VALUE
  const isFavorite = Boolean(organization?.is_favorite ?? organization?.isFavorite ?? false)

  const handleToggleFavorite = async () => {
    if (!showClientControls || savingFavorite) {
      return
    }
    const nextFavorite = !isFavorite
    setSavingFavorite(true)
    setOrganization((prev) => ({ ...(prev || {}), is_favorite: nextFavorite }))
    try {
      const payload = await toggleFavoriteOrganization(activeOrganizationId)
      const updated = payload?.organization || payload
      setOrganization((prev) => ({ ...(prev || {}), ...(updated || {}) }))
    } catch {
      setOrganization((prev) => ({ ...(prev || {}), is_favorite: isFavorite }))
    } finally {
      setSavingFavorite(false)
    }
  }

  const handleAssignmentChange = async (nextValue) => {
    if (!showClientControls || savingAssignment) {
      return
    }
    const nextSegment =
      nextValue === NOT_ASSIGNED_VALUE
        ? NOT_ASSIGNED_VALUE
        : String(nextValue || NOT_ASSIGNED_VALUE).toUpperCase()
    const previousSegment = String(
      organization?.segment || organization?.client_segment || ''
    )
      .trim()
      .toUpperCase()
    setSavingAssignment(true)
    setOrganization((prev) => ({ ...(prev || {}), segment: nextSegment }))
    try {
      const payload = await updateOrganization(activeOrganizationId, {
        name: organization?.name || clientName || `Organization ${activeOrganizationId}`,
        description: organization?.description || '',
        segment: nextSegment,
      })
      const updated = payload?.organization || payload
      setOrganization((prev) => ({ ...(prev || {}), ...(updated || {}) }))
    } catch {
      setOrganization((prev) => ({ ...(prev || {}), segment: previousSegment }))
    } finally {
      setSavingAssignment(false)
    }
  }

  return (
    <div className="w-full border-b border-gray-200 bg-white px-4 pb-4 pt-4 md:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-900">{clientName}</h1>
        {showClientControls ? (
          <>
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={savingFavorite}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${
                isFavorite
                  ? 'border-amber-300 bg-amber-50 text-amber-600'
                  : 'border-gray-300 text-gray-500 hover:bg-gray-50'
              } disabled:cursor-not-allowed disabled:opacity-60`}
              aria-label="Toggle favorite client"
              title="Toggle favorite client"
            >
              <FiStar className="h-4 w-4" />
            </button>
            <div className="min-w-45">
              <AppSelect
                options={assignmentOptions}
                value={selectedAssignment}
                onChange={(nextValue) =>
                  handleAssignmentChange(nextValue || NOT_ASSIGNED_VALUE)
                }
                size="sm"
                isDisabled={savingAssignment}
                formatOptionLabel={renderSegmentOption}
              />
            </div>
          </>
        ) : null}
        <span className="text-gray-400">/</span>
        <h2 className="text-base font-semibold text-gray-700">{activeLabel}</h2>
      </div>
    </div>
  )
}

export default TopBar
