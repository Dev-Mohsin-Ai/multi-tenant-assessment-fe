import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Select from 'react-select'
import { FaPlus, FaGear } from "react-icons/fa6"
import Tables from '../components/Tables'
import { RiFileListLine } from "react-icons/ri"
import AssesmentDialogue from "../components/AssesmentDialogue"
import PerformAssessment from './PerformAssessment'
import { getOrganizationAssessments, getOrganizations } from '../services/organizationService'
import { createAssessment } from '../services/assessmentService'

const Assessment = () => {
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
    } catch (err) {
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
        const storedOrgId = localStorage.getItem('activeOrganizationId')
        const match = storedOrgId
          ? list.find((org) => String(org.id) === String(storedOrgId))
          : list[0]
        setActiveOrganization(match || null)
      } catch (err) {
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
  }, [])

  useEffect(() => {
    if (activeOrganization?.id) {
      localStorage.setItem('activeOrganizationId', activeOrganization.id)
      localStorage.setItem('activeOrganizationName', activeOrganization.name || '')
      refreshAssessments(activeOrganization.id)
    }
  }, [activeOrganization, refreshAssessments])

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
    } catch (err) {
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
        const score = assessment.total_score ?? assessment.score ?? '-'
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

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (value, row) => (
        <button
          type="button"
          onClick={() => {
            setActiveAssessmentId(row.id)
            setShowPerform(true)
          }}
          className="text-left text-gray-900 hover:underline"
        >
          {value}
        </button>
      ),
    },
    { key: 'status', label: 'Status' },
    { key: 'score', label: 'Score' },
    { key: 'items', label: 'Items' },
    { key: 'answers', label: 'Answers' },
    { key: 'completion', label: 'Completion' },
    {
      key: 'action',
      label: 'Action',
      render: (value, row) => (
        <button
          type="button"
          onClick={() => {
            setActiveAssessmentId(row.id)
            setShowPerform(true)
          }}
          className="text-[rgb(5,117,204)] hover:underline"
        >
          Open
        </button>
      ),
    },
  ]

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
        />
      ) : (
        <>
          {error && (
            <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-60">
                <Select
                  options={organizationOptions}
                  value={
                    activeOrganization
                      ? {
                          value: activeOrganization.id,
                          label: activeOrganization.name || `Organization ${activeOrganization.id}`,
                        }
                      : null
                  }
                  onChange={(option) => {
                    if (!option) {
                      setActiveOrganization(null)
                      return
                    }
                    const match = organizations.find(
                      (org) => String(org.id) === String(option.value)
                    )
                    setActiveOrganization(match || null)
                  }}
                  placeholder="Select organization..."
                  isLoading={loadingOrganizations}
                />
              </div>
              {loadingOrganizations && (
                <span className="text-xs text-gray-400">Loading organizations...</span>
              )}
            </div>
            <div className="flex">
              <button
                onClick={() => {
                  setOpen(true)
                }}
                disabled={creatingAssessment}
                className="
                ml-2 h-9
                bg-[rgb(5,117,204)] text-white
                px-4 rounded-md
                flex items-center gap-2
                text-sm font-medium
                hover:bg-[rgb(0,97,170)]
                cursor-pointer
                disabled:opacity-70
              "
              >
                <FaPlus /> {creatingAssessment ? 'Creating...' : 'New Assessment'}
              </button>
              {open && (
                <AssesmentDialogue
                  onClose={() => setOpen(false)}
                  onNext={handleNext}
                  organizations={organizations}
                  activeOrganizationId={activeOrganization?.id}
                  onOrganizationCreated={(org) => {
                    setOrganizations((prev) => [org, ...prev])
                    setActiveOrganization(org)
                  }}
                />
              )}

              <button className="
                ml-2 h-9
                bg-[rgb(248,248,250)] text-black
                px-4 rounded-md
                flex items-center gap-2
                text-sm border border-gray-300
                hover:bg-[rgb(255,255,255)]
              ">
                <FaGear /> Manage Templates
              </button>
            </div>

          </div>

          <div className="mt-4">
            <input
              type="search"
              placeholder='Find in list...'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="
                border border-[rgba(0,0,0,0.24)] border-b-[rgb(23,24,31)] h-9 px-3 outline-none focus:border-[#473c9a] hover:border-[#473c9a] focus:border-3 text-sm text-[#473c9a] placeholder-gray-300 focus:placeholder-[#473c9a] bg-white w-full max-w-lg rounded-t-sm focus:bg-[#e9e9ee]
              "
            />
          </div>

          <div>
            {loadingAssessments ? (
              <div className="mt-6 flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-10 text-gray-500">
                <p className="text-sm">Loading assessments...</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-10 text-gray-500">
                <RiFileListLine className="text-3xl" />
                <p className="mt-2 text-sm">No assessments found</p>
              </div>
            ) : (
              <Tables
                columns={columns}
                data={rows}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Assessment
