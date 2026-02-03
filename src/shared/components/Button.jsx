import React from 'react'

const Button = ({ text, icon, className = '' }) => {
    return (
        <div>
            <button className={`bg-white inline-flex items-center gap-2 px-4 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition text-sm font-medium text-gray-700 whitespace-nowrap ${className}`.trim()}>
                {text}
                {icon}
            </button>
        </div>
    )
}

export default Button
