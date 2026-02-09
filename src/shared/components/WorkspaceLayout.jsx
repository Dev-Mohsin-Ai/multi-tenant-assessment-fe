import React, { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DashboardHeader from './DashboardHeader'
import SideTopbar from './SideTopbar'
import ListIcon from '../../assets/icons/List.svg'
import { MdAssessment } from "react-icons/md";
import { FaUsers } from "react-icons/fa6";
import { SiRoadmapdotsh } from 'react-icons/si'
import { HiTemplate } from "react-icons/hi";
import { FiTarget } from 'react-icons/fi'

const WorkspaceLayout = ({
  children,
  activeLabel,
  clientName,
  activeNavId,
  clientsPath = '/clients/select',
  assessmentsPath = '/clients/select',
  templatesPath = '/templates',
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = useMemo(
    () => [
      { id: 'clients', label: 'Clients', icon: <FaUsers/>, path: clientsPath },
      { id: 'assessments', label: 'Assessments', icon: <MdAssessment />, iconSize: 26, path: assessmentsPath },
      { id: 'roadmap', label: 'Roadmap', icon: <SiRoadmapdotsh />, path: '/roadmap' },
      { id: 'goals', label: 'Goals', icon: <FiTarget />, path: '/goals' },
      { id: 'templates', label: 'Templates', icon: <HiTemplate />, iconSize: 26, path: templatesPath },
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
