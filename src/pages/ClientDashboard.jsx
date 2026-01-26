import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FaPlus } from 'react-icons/fa6'
import { FiArrowLeft } from 'react-icons/fi'
import { RiFileListLine } from 'react-icons/ri'
import Table from '../components/Tables'
import AssesmentDialogue from '../components/AssesmentDialogue'
import WorkspaceLayout from '../components/WorkspaceLayout'
import { createAssessment } from '../services/assessmentService'
import { getOrganizationAssessments, getOrganizationById } from '../services/organizationService'

const ClientDashboard = () => {
  const { organizationId } = useParams()
  const navigate = useNavigate()
  const [organization, setOrganization] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [creatingAssessment, setCreatingAssessment] = useState(false)

  useEffect(() => {
    if (!organizationId) {
      navigate('/clients', { replace: true })
      return undefined
    }

    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        const [orgData, assessmentData] = await Promise.all([
          getOrganizationById(organizationId),
          getOrganizationAssessments(organizationId),
        ])
        if (!isMounted) {
          return
        }
        const resolvedOrganization = orgData?.organization || orgData
        const list = Array.isArray(assessmentData)
          ? assessmentData
          : assessmentData?.assessments || []
        setOrganization(resolvedOrganization)
        setAssessments(list)
      } catch (err) {
        if (isMounted) {
          setError('Unable to load client data')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    const refreshAssessments = async () => {
      try {
        const assessmentData = await getOrganizationAssessments(organizationId)
        if (!isMounted) {
          return
        }
        const list = Array.isArray(assessmentData)
          ? assessmentData
          : assessmentData?.assessments || []
        setAssessments(list)
      } catch (err) {
        if (isMounted) {
          setError('Unable to load client data')
        }
      }
    }

    loadData()

    const intervalId = setInterval(refreshAssessments, 15000)
    const handleFocus = () => {
      refreshAssessments()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      isMounted = false
      clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
    }
  }, [navigate, organizationId])

  const getAssessmentId = (assessment) =>
    assessment.id || assessment.assessment_id || assessment.assessmentId

  const rows = useMemo(
    () =>
      assessments.map((assessment) => {
        const id = getAssessmentId(assessment)
        const categories =
          assessment.categories ||
          assessment.template?.categories ||
          assessment.template_categories ||
          assessment.templateCategories ||
          []
        const totalItems =
          assessment.items ??
          assessment.total_items ??
          assessment.totalItems ??
          assessment.questions_count ??
          (Array.isArray(categories)
            ? categories.reduce((count, category) => {
                const subcategories =
                  category.subcategories ||
                  category.sub_categories ||
                  category.items ||
                  category.questions ||
                  []
                return count + (Array.isArray(subcategories) ? subcategories.length : 0)
              }, 0)
            : 0)
        const answered =
          assessment.answers ??
          assessment.answered_items ??
          assessment.answeredItems ??
          assessment.responses_count ??
          (Array.isArray(categories)
            ? categories.reduce((count, category) => {
                const subcategories =
                  category.subcategories ||
                  category.sub_categories ||
                  category.items ||
                  category.questions ||
                  []
                if (!Array.isArray(subcategories)) {
                  return count
                }
                return (
                  count +
                  subcategories.filter((item) =>
                    item.selected_response_id || item.selectedResponseId
                  ).length
                )
              }, 0)
            : 0)
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
      }),
    [assessments]
  )

  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (value) => <span className="font-medium text-gray-900">{value}</span>,
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
          onClick={(event) => {
            event.stopPropagation()
            navigate(`/assessments/${row.id}`, {
              state: { organizationId, organizationName: organization?.name || '' },
            })
          }}
          className="text-[rgb(5,117,204)] hover:underline"
        >
          Open
        </button>
      ),
    },
  ]

  const handleCreateAssessment = async (payload) => {
    const templateValue = payload.templateId
    const resolvedTemplateId = Number(templateValue)
    const resolvedOrganizationId = Number(organizationId)
    if (!templateValue || Number.isNaN(resolvedTemplateId)) {
      setError('Select a valid template before continuing')
      return
    }
    if (Number.isNaN(resolvedOrganizationId)) {
      setError('Invalid client selected')
      return
    }

    setCreatingAssessment(true)
    setError('')
    try {
      const data = await createAssessment({
        organizationId: resolvedOrganizationId,
        templateId: resolvedTemplateId,
        title: payload.title,
      })
      const created = data?.assessment || data
      const assessmentId = data?.assessment_id || getAssessmentId(created)
      if (!assessmentId) {
        throw new Error('Missing assessment id')
      }
      setOpenDialog(false)
      navigate(`/assessments/${assessmentId}`, {
        state: { organizationId, organizationName: organization?.name || '' },
      })
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to create assessment'
      setError(detail)
    } finally {
      setCreatingAssessment(false)
    }
  }

  return (
    <WorkspaceLayout
      activeLabel="Assessments"
      clientName={organization?.name || 'Client'}
      activeNavId="assessments"
      assessmentsPath={organizationId ? `/clients/${organizationId}` : '/clients'}
    >
      <div className="bg-[rgb(248,248,250)] min-h-[calc(100vh-6rem)] rounded-tl-xl overflow-hidden">
        <div className="px-6 pt-6">
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            aria-label="Back to clients"
          >
            <FiArrowLeft aria-hidden="true" />
            Back to clients
          </button>

          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {organization?.name || 'Client'}
              </h2>
              {organization?.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {organization.description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpenDialog(true)}
              disabled={creatingAssessment}
              className="h-9 px-4 rounded-md bg-[rgb(5,117,204)] text-white text-sm font-medium hover:bg-[rgb(0,97,170)] disabled:opacity-70 inline-flex items-center gap-2"
            >
              <FaPlus />
              {creatingAssessment ? 'Creating...' : 'Create New Assessment'}
            </button>
          </div>

          {openDialog && (
            <AssesmentDialogue
              onClose={() => setOpenDialog(false)}
              onNext={handleCreateAssessment}
              organization={organization || { id: organizationId }}
            />
          )}

          {error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="mt-6">
            {loading ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
                Loading assessments...
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-10 text-gray-500">
                <RiFileListLine className="text-3xl" />
                <p className="mt-2 text-sm">No assessments found</p>
              </div>
            ) : (
              <Table
                columns={columns}
                data={rows}
                onRowClick={(row) =>
                  navigate(`/assessments/${row.id}`, {
                    state: { organizationId, organizationName: organization?.name || '' },
                  })
                }
              />
            )}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  )
}

export default ClientDashboard
