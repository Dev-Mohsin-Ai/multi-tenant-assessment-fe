import React from 'react'

const Sidebar = ({ items, activeId, onSelect }) => {
    return (
        <nav className="w-52 py-4 pr-3">
            {items.map((item) => {
                const isActive = item.id === activeId
                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.id)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left rounded-r-lg transition ${
                            isActive
                                ? 'bg-blue-50 border-l-2 border-blue-600 text-blue-700'
                                : 'text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        <span className="flex h-6 w-6 items-center justify-center">
                            {item.icon &&
                                (typeof item.icon === 'string' ? (
                                    <img src={item.icon} alt="" className="h-5 w-5" />
                                ) : (
                                    <span
                                        className="flex items-center justify-center [&>svg]:h-[var(--icon-size)] [&>svg]:w-[var(--icon-size)]"
                                        style={{ '--icon-size': `${item.iconSize || 20}px` }}
                                    >
                                        {item.icon}
                                    </span>
                                ))}
                        </span>
                        <span className="text-sm font-medium">{item.label}</span>
                    </button>
                )
            })}
        </nav>
    )
}

export default Sidebar
