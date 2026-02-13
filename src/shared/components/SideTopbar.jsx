import React, { useState } from 'react'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import Assessment from '../../features/assessments/assessment/Assessment'
import Roadmap from '../../features/roadmap/Roadmap'
import RoadmapIcon from '../../assets/icons/Roadmap.svg'
import ListIcon from '../../assets/icons/List.svg'
import { MdOutlineAssessment } from "react-icons/md";

const SideTopbar = ({
    items,
    activeId,
    onSelect,
    activeLabel,
    clientName,
    children,
    contentClassName = '',
}) => {
    const defaultTabs = [
        { id: 'Roadmap', label: 'Roadmap', icon: RoadmapIcon, content: <Roadmap /> },
        { id: 'assessments', label: 'Assessments', icon: ListIcon, content: <Assessment /> },
        
    ]

    const resolvedItems = items || defaultTabs
    const [internalActive, setInternalActive] = useState(resolvedItems[0]?.id)

    const resolvedActiveId =
        activeId ||
        (resolvedItems.some((item) => item.id === internalActive)
            ? internalActive
            : resolvedItems[0]?.id)
    const handleSelect = onSelect || setInternalActive
    const activeItem =
        resolvedItems.find((item) => item.id === resolvedActiveId) || resolvedItems[0]
    const label = activeLabel || activeItem?.label || ''
    const content = children ?? activeItem?.content ?? null

    return (
        <div className="fixed left-0 right-0 top-14 bottom-0 bg-white rounded-tl-xl flex flex-col overflow-auto">
            <TopBar activeLabel={label} clientName={clientName} />

            <div className="flex flex-1 min-h-0">
                <div className="hidden md:block">
                    <Sidebar
                        items={resolvedItems}
                        activeId={resolvedActiveId}
                        onSelect={handleSelect}
                    />
                </div>

                <main
                    className={`flex-1 px-4 md:px-7 pt-6 md:pt-7 overflow-auto rounded-tl-lg bg-[rgb(243,243,247)] ${contentClassName}`.trim()}
                >
                    <div className="flex md:hidden items-center gap-2 pb-3 border-b border-gray-200 mb-4 overflow-x-auto">
                        {resolvedItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelect(item.id)}
                                className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium border ${
                                    item.id === resolvedActiveId
                                        ? 'border-[rgb(5,117,204)] bg-[rgb(236,245,255)] text-[rgb(5,117,204)]'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    {content}
                </main>
            </div>
        </div>
    )
}

export default SideTopbar
