import React from 'react'

const Button = ({ text, icon, className = '' }) => {
    return (
        <div>
            <button className={`bg-white inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-gray-300 hover:border-[#473c9a] transition text-sm font-medium whitespace-nowrap ${className}`.trim()}>
                {text}
                {icon}
            </button>
        </div>
    )
}

export default Button
