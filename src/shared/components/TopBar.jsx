import React from 'react'

const TopBar = ({ activeLabel, clientName = 'Client' }) => {
  return (
    <div className="w-full border-b border-gray-200 bg-white px-4 pb-4 pt-4 md:px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-900">{clientName}</h1>
        <span className="text-gray-400">/</span>
        <h2 className="text-base font-semibold text-gray-700">{activeLabel}</h2>
      </div>
    </div>
  )
}

export default TopBar
