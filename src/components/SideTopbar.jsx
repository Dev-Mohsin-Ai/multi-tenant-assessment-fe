import React, { useEffect, useState } from 'react'
import TopBar from './TopBar'
import Sidebar from './Sidebar'
import Assessment from '../tabs/Assessment'
import Roadmap from '../tabs/Roadmap'
import RoadmapIcon from '../assets/icons/Roadmap.svg'
import ListIcon from '../assets/icons/List.svg'

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

    useEffect(() => {
        if (activeId || resolvedItems.length === 0) {
            return
        }
        if (!resolvedItems.some((item) => item.id === internalActive)) {
            setInternalActive(resolvedItems[0].id)
        }
    }, [activeId, internalActive, resolvedItems])

    const resolvedActiveId = activeId || internalActive
    const handleSelect = onSelect || setInternalActive
    const activeItem =
        resolvedItems.find((item) => item.id === resolvedActiveId) || resolvedItems[0]
    const label = activeLabel || activeItem?.label || ''
    const content = children ?? activeItem?.content ?? null

    return (
        <div className="fixed left-0 right-0 top-22 bottom-0 bg-white rounded-tl-xl flex flex-col overflow-auto">
            <TopBar activeLabel={label} clientName={clientName} />

            <div className="flex flex-1 min-h-0">
                <Sidebar
                    items={resolvedItems}
                    activeId={resolvedActiveId}
                    onSelect={handleSelect}
                />

                <main
                    className={`flex-1 px-7 pt-5 overflow-auto border border-[rgba(0,0,0,0.24)] rounded-tl-lg bg-[rgb(243,243,247)] ${contentClassName}`.trim()}
                >
                    {content}
                </main>
            </div>
        </div>
    )
}

export default SideTopbar
