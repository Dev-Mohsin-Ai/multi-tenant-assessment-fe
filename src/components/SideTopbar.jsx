import React, { useState } from 'react'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import Assessment from '../tabs/Assessment'
import Roadmap from '../tabs/Roadmap'
import RoadmapIcon from '../assets/icons/Roadmap.svg'
import ListIcon from '../assets/icons/List.svg'

const SideTopbar = () => {
    const tabs = [
        { id: 'Roadmap', label: 'Roadmap', icon: RoadmapIcon, content: <Roadmap /> },
        { id: 'assessments', label: 'Assessments', icon: ListIcon, content: <Assessment /> },
    ]

    const [activeTab, setActiveTab] = useState('assessments')

    const activeContent = tabs.find(tab => tab.id === activeTab)

    return (
        <div className="fixed left-0 right-0 top-22 bottom-0 bg-white rounded-tl-xl flex flex-col overflow-auto">
            <TopBar activeLabel={activeContent.label} />

            <div className="flex flex-1 min-h-0">
                <Sidebar
                    items={tabs}
                    activeId={activeTab}
                    onSelect={setActiveTab}
                />

                <main className="flex-1 px-7 pt-5 overflow-auto border border-[rgba(0,0,0,0.24)] rounded-tl-lg bg-[rgb(243,243,247)]">
                    {activeContent.content}
                </main>
            </div>
        </div>
    )
}

export default SideTopbar

