import React from 'react'
import { FiEdit2, FiFileText, FiPlus, FiSearch } from 'react-icons/fi'

const TemplateBrowse = ({
  loading,
  filteredTemplates,
  searchQuery,
  onSearchChange,
  onSelectTemplate,
  onNewTemplate,
}) => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search templates..."
            className="w-full h-12 pl-12 pr-4 rounded-md border border-gray-300 bg-white focus:outline-none transition-all duration-200"
          />
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
          <FiFileText className="text-6xl mb-4 mx-auto text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No templates found' : 'No templates yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Get started by creating your first assessment template'}
          </p>
          {!searchQuery && (
            <button
              type="button"
              onClick={onNewTemplate}
              className="h-9 px-6 rounded-md bg-[rgb(5,117,204)] text-white text-sm font-medium hover:bg-[rgb(0,97,170)] transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <FiPlus /> Create Your First Template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const categoryCount = template.categories?.length || 0
            const subcategoryCount =
              template.categories?.reduce(
                (sum, cat) => sum + (cat.sub_categories?.length || 0),
                0
              ) || 0
            return (
              <div
                key={template.id}
                className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex items-start justify-between mb-3">
                  <FiFileText className="text-3xl text-gray-400" />
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectTemplate(template)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-all duration-200"
                      title="Edit template"
                    >
                      <FiEdit2 />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {template.title || `Template ${template.id}`}
                </h3>
                <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-gray-100 rounded-md">
                    {categoryCount} {categoryCount === 1 ? 'category' : 'categories'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 rounded-md">
                    {subcategoryCount} {subcategoryCount === 1 ? 'subcategory' : 'subcategories'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default TemplateBrowse
