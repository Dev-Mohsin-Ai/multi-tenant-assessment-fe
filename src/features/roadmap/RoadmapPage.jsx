import React from 'react'
import WorkspaceLayout from '../../shared/components/WorkspaceLayout'
import Roadmap from './Roadmap'

const RoadmapPage = () => {
  return (
    <WorkspaceLayout activeLabel="Roadmap" clientName="Roadmap" activeNavId="roadmap">
      <div className="bg-[rgb(248,248,250)] min-h-[calc(100vh-6rem)] rounded-tl-xl overflow-hidden p-4 md:p-6">
        <Roadmap />
      </div>
    </WorkspaceLayout>
  )
}

export default RoadmapPage
