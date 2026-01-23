import React from 'react'

const Sidebar = ({ items, activeId, onSelect }) => {
    return (
        <nav className="w-48 py-3 pr-3">
            {items.map((item) => {
                const isActive = item.id === activeId
                return (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelect(item.id)}
                        className={`flex w-full items-center gap-3 px-4 py-2 text-left ${isActive ? 'bg-gray-200 border-l-2 border-black rounded-r-lg' : 'hover:bg-gray-100'}`}
                    >
                        {item.icon && <img src={item.icon} alt="" />}
                        <span>{item.label}</span>
                    </button>
                )
            })}
        </nav>
    )
}

export default Sidebar
