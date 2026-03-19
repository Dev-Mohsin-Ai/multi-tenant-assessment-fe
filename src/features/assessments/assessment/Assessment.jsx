import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AssessmentList from './AssessmentList'
import AssessmentToolbar from './AssessmentToolbar'
import PerformAssessment from '../perform-assessment/PerformAssessment'
import {
  getOrganizationAssessments,
  getOrganizations,
} from '../../../shared/services/organizationService'
import { createAssessment } from '../../../shared/services/assessmentService'
import { useAppStore } from '../../../shared/store/useAppStore'
import { formatScorePercent } from '../../../shared/utils/scoreUtils'

const Assessment = () => {
  const storedActiveOrganizationId = useAppStore((state) => state.activeOrganizationId)
  const setStoredActiveOrganization = useAppStore((state) => state.setActiveOrganization)
  const [open, setOpen] = useState(false)
  const [showPerform, setShowPerform] = useState(false)
  const [activeAssessmentId, setActiveAssessmentId] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [activeOrganization, setActiveOrganization] = useState(null)
  const [loadingOrganizations, setLoadingOrganizations] = useState(false)
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const [creatingAssessment, setCreatingAssessment] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const organizationOptions = useMemo(
    () =>
      organizations.map((org) => ({
        value: org.id,
        label: org.name || `Organization ${org.id}`,
      })),
    [organizations]
  )

  const getAssessmentId = (assessment) =>
    assessment.id || assessment.assessment_id || assessment.assessmentId

  const refreshAssessments = useCallback(async (organizationId) => {
    if (!organizationId) {
      setAssessments([])
      return
    }

    setLoadingAssessments(true)
    try {
      const data = await getOrganizationAssessments(organizationId)
      const list = Array.isArray(data) ? data : data?.assessments || []
      setAssessments(list)
    } catch {
      setError('Unable to load assessments')
    } finally {
      setLoadingAssessments(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadOrganizations = async () => {
      setLoadingOrganizations(true)
      try {
        const data = await getOrganizations()
        const list = Array.isArray(data) ? data : data?.organizations || []
        if (!isMounted) {
          return
        }
        setOrganizations(list)
        const match = storedActiveOrganizationId
          ? list.find((org) => String(org.id) === String(storedActiveOrganizationId))
          : list[0]
        setActiveOrganization(match || null)
      } catch {
        if (isMounted) {
          setError('Unable to load organizations')
        }
      } finally {
        if (isMounted) {
          setLoadingOrganizations(false)
        }
      }
    }

    loadOrganizations()

    return () => {
      isMounted = false
    }
  }, [storedActiveOrganizationId])

  useEffect(() => {
    if (activeOrganization?.id) {
      setStoredActiveOrganization({
        id: activeOrganization.id,
        name: activeOrganization.name || '',
      })
      refreshAssessments(activeOrganization.id)
    }
  }, [activeOrganization, refreshAssessments, setStoredActiveOrganization])

  const handleNext = async (payload) => {
    if (!payload.organizationId || !payload.templateId) {
      setError('Select an organization and template before continuing')
      return
    }

    setCreatingAssessment(true)
    setError('')
    try {
      const data = await createAssessment({
        organizationId: payload.organizationId,
        templateId: payload.templateId,
        title: payload.title,
      })
      const createdAssessment = data?.assessment || data
      const assessmentId = data?.assessment_id || getAssessmentId(createdAssessment)
      if (!assessmentId) {
        throw new Error('Missing assessment id')
      }

      setAssessments((prev) => [createdAssessment, ...prev])
      const orgMatch = organizations.find(
        (org) => String(org.id) === String(payload.organizationId)
      )
      if (orgMatch) {
        setActiveOrganization(orgMatch)
      }
      setActiveAssessmentId(assessmentId)
      setShowPerform(true)
      setOpen(false)
    } catch {
      setError('Unable to create assessment')
    } finally {
      setCreatingAssessment(false)
    }
  }

  const handleProgress = ({ assessmentId, answered, total }) => {
    setAssessments((prev) =>
      prev.map((assessment) => {
        const id = getAssessmentId(assessment)
        if (id !== assessmentId) {
          return assessment
        }
        return {
          ...assessment,
          _progress: {
            items: total,
            answers: answered,
          },
        }
      })
    )
  }

  const rows = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase()
    return assessments
      .map((assessment) => {
        const id = getAssessmentId(assessment)
        const totalItems =
          assessment.items ??
          assessment.total_items ??
          assessment.totalItems ??
          assessment.questions_count ??
          assessment._progress?.items ??
          0
        const answered =
          assessment.answers ??
          assessment.answered_items ??
          assessment.answeredItems ??
          assessment.responses_count ??
          assessment._progress?.answers ??
          0
        const completion =
          assessment.completion ||
          (totalItems ? `${Math.round((answered / totalItems) * 100)}%` : '0%')
        const score = formatScorePercent(
          assessment.total_score ?? assessment.score ?? null
        )
        const status = assessment.status || 'in_progress'
        return {
          id,
          title: assessment.title || assessment.name || `Assessment ${id}`,
          status: status.replace(/_/g, ' '),
          score,
          items: totalItems,
          answers: answered,
          completion,
        }
      })
      .filter((row) =>
        lowerSearch ? row.title.toLowerCase().includes(lowerSearch) : true
      )
  }, [assessments, search])

  return (
    <div>
      {showPerform ? (
        <PerformAssessment
          assessmentId={activeAssessmentId}
          onBack={() => setShowPerform(false)}
          onProgress={handleProgress}
          onComplete={() => {
            setShowPerform(false)
            if (activeOrganization?.id) {
              refreshAssessments(activeOrganization.id)
            }
          }}
          onDelete={() => {
            setShowPerform(false)
            setActiveAssessmentId(null)
            if (activeOrganization?.id) {
              refreshAssessments(activeOrganization.id)
            }
          }}
        />
      ) : (
        <>
          {error && (
            <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}
          <AssessmentToolbar
            organizationOptions={organizationOptions}
            activeOrganization={activeOrganization}
            organizations={organizations}
            loadingOrganizations={loadingOrganizations}
            creatingAssessment={creatingAssessment}
            open={open}
            setOpen={setOpen}
            onOrganizationChange={(option) => {
              if (!option) {
                setActiveOrganization(null)
                return
              }
              const match = organizations.find(
                (org) => String(org.id) === String(option.value)
              )
              setActiveOrganization(match || null)
            }}
            onCreateAssessment={handleNext}
            onOrganizationCreated={(org) => {
              setOrganizations((prev) => [org, ...prev])
              setActiveOrganization(org)
            }}
          />

          <AssessmentList
            loading={loadingAssessments}
            rows={rows}
            search={search}
            onSearchChange={setSearch}
            onOpenAssessment={(id) => {
              setActiveAssessmentId(id)
              setShowPerform(true)
            }}
          />
        </>
      )}
    </div>
  )
}

export default Assessment
