import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DashboardHeader from './DashboardHeader'
import SideTopbar from './SideTopbar'
import RoadmapIcon from '../assets/icons/Roadmap.svg'
import ListIcon from '../assets/icons/List.svg'
import StrategyIcon from '../assets/icons/Strategy.svg'

const WorkspaceLayout = ({
  children,
  activeLabel,
  clientName,
  activeNavId,
  clientsPath = '/clients',
  assessmentsPath = '/clients',
  templatesPath = '/templates',
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = useMemo(
    () => [
      { id: 'clients', label: 'Clients', icon: ListIcon, path: clientsPath },
      { id: 'assessments', label: 'Assessments', icon: RoadmapIcon, path: assessmentsPath },
      { id: 'templates', label: 'Templates', icon: StrategyIcon, path: templatesPath },
    ],
    [assessmentsPath, clientsPath, templatesPath]
  )

  const resolvedActiveId = useMemo(() => {
    if (activeNavId) {
      return activeNavId
    }
    const match = navItems.find((item) => location.pathname.startsWith(item.path))
    return match?.id || navItems[0]?.id
  }, [activeNavId, location.pathname, navItems])

  const handleSelect = (id) => {
    const target = navItems.find((item) => item.id === id)
    if (target) {
      navigate(target.path)
    }
  }

  return (
    <div className="bg-[rgb(37,38,45)] min-h-screen">
      <DashboardHeader />
      <SideTopbar
        items={navItems}
        activeId={resolvedActiveId}
        onSelect={handleSelect}
        activeLabel={activeLabel}
        clientName={clientName}
      >
        {children}
      </SideTopbar>
    </div>
  )
}

export default WorkspaceLayout
