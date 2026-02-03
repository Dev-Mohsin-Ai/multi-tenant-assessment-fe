import React from 'react'
import { FiEdit2, FiFolder, FiPlus } from 'react-icons/fi'

const TemplatesHeader = ({ activeTab, onTabChange, onNewTemplate, selectedTemplateId }) => {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Assessment Templates
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage your assessment templates with ease
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNewTemplate}
              className="h-9 px-4 rounded-md bg-[rgb(5,117,204)] text-white text-sm font-medium hover:bg-[rgb(0,97,170)] transition-all duration-200 flex items-center gap-2"
            >
              <FiPlus /> New Template
            </button>
          </div>
        </div>

        <div className="flex gap-1 mt-4 border-b border-gray-200">
          <button
            type="button"
            onClick={() => onTabChange('browse')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'browse'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FiFolder /> Browse Templates
          </button>
          <button
            type="button"
            onClick={() => onTabChange('edit')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'edit'
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FiEdit2 /> {selectedTemplateId ? 'Edit Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TemplatesHeader
