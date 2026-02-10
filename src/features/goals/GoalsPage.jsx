import React from 'react'
import WorkspaceLayout from '../../shared/components/WorkspaceLayout'
import Goals from './Goals'
import { useAppStore } from '../../shared/store/useAppStore'

const GoalsPage = () => {
  const activeClientName = useAppStore((state) => state.activeOrganizationName) || 'Client'
  const activeOrganizationId = useAppStore((state) => state.activeOrganizationId)
  const assessmentsPath = activeOrganizationId
    ? `/clients/${activeOrganizationId}`
    : '/clients/select'

  return (
    <WorkspaceLayout
      activeLabel="Goals"
      clientName={activeClientName}
      activeNavId="goals"
      assessmentsPath={assessmentsPath}
    >
      <div className="bg-[rgb(248,248,250)] min-h-[calc(100vh-6rem)] rounded-tl-xl overflow-hidden p-4 md:p-6">
        <Goals />
      </div>
    </WorkspaceLayout>
  )
}

export default GoalsPage
