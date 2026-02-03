import React, { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import PerformAssessment from './perform-assessment/PerformAssessment'
import WorkspaceLayout from '../../shared/components/WorkspaceLayout'

const ReadOnlyAssessmentPage = () => {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [organizationId, setOrganizationId] = useState(
    location.state?.organizationId || null
  )
  const [organizationName] = useState(location.state?.organizationName || '')
  const responseId = location.state?.responseId || null
  const handleLoaded = useCallback(
    (assessment) => {
      if (!organizationId && assessment?.organizationId) {
        setOrganizationId(assessment.organizationId)
      }
    },
    [organizationId]
  )

  const backTarget = useMemo(() => {
    if (location.state?.backTo) {
      return location.state.backTo
    }
    return -1
  }, [location.state])

  const handleBack = () => {
    if (typeof backTarget === 'number') {
      navigate(backTarget)
      return
    }
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
          onLoaded={handleLoaded}
          readOnly
          focusResponseId={responseId}
        />
      </div>
    </WorkspaceLayout>
  )
}

export default ReadOnlyAssessmentPage
