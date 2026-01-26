import React, { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import PerformAssessment from '../tabs/PerformAssessment'
import WorkspaceLayout from '../components/WorkspaceLayout'

const AssessmentPage = () => {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [organizationId, setOrganizationId] = useState(
    location.state?.organizationId || null
  )
  const [organizationName] = useState(location.state?.organizationName || '')
  const handleLoaded = useCallback(
    (assessment) => {
      if (!organizationId && assessment?.organizationId) {
        setOrganizationId(assessment.organizationId)
      }
    },
    [organizationId]
  )

  const backTarget = useMemo(() => {
    if (organizationId) {
      return `/clients/${organizationId}`
    }
    return '/clients'
  }, [organizationId])

  const handleBack = () => {
    navigate(backTarget)
  }

  const handleComplete = () => {
    navigate(backTarget)
  }

  return (
    <WorkspaceLayout
      activeLabel="Assessments"
      clientName={
        organizationName || (organizationId ? `Client ${organizationId}` : 'Client')
      }
      activeNavId="assessments"
      assessmentsPath={organizationId ? `/clients/${organizationId}` : '/clients'}
    >
      <div className="bg-[rgb(248,248,250)] min-h-[calc(100vh-6rem)] rounded-tl-xl overflow-hidden p-4 md:p-6">
        <PerformAssessment
          assessmentId={assessmentId}
          onBack={handleBack}
          onComplete={handleComplete}
          onLoaded={handleLoaded}
        />
      </div>
    </WorkspaceLayout>
  )
}

export default AssessmentPage
