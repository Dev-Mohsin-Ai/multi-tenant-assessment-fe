import React from 'react'
import {
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiInfo,
  FiList,
  FiLayers,
  FiMessageSquare,
  FiPaperclip,
  FiSettings,
} from 'react-icons/fi'

const AssessmentQuestions = ({
  categories,
  expandedSections,
  expandedItems,
  toggleSection,
  toggleAllSections,
  toggleAllItems,
  allSectionsExpanded,
  allItemsExpanded,
  setExpandedItems,
  selections,
  handleSelect,
  savingItems,
  isCompleted,
  getBadgeClasses,
}) => {
  return (
    <>
      <div className="px-4 py-4 md:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleAllSections}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <FiLayers className="text-base" />
            {allSectionsExpanded ? 'Collapse all categories' : 'Expand all categories'}
          </button>
          <button
            type="button"
            onClick={toggleAllItems}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <FiList className="text-base" />
            {allItemsExpanded ? 'Collapse all items' : 'Expand all items'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2"
          >
            Show comparison
          </button>
        </div>
      </div>

      <div className="px-4 pb-6 md:px-6 space-y-4">
        {categories.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            This assessment has no categories.
          </div>
        ) : (
          categories.map((section) => {
            const isOpen = expandedSections.has(section.id)
            return (
              <div key={section.id} className="rounded-md border border-gray-200">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full text-left p-4 bg-gray-100 hover:bg-gray-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-gray-600">
                      {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {section.title}
                      </h3>
                      {section.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-200 px-4 pb-4">
                    <div className="mt-4 space-y-4">
                      {section.subcategories.map((item) => {
                        const isItemOpen = expandedItems.has(item.id)
                        const isSaving = savingItems.has(item.id)
                        return (
                          <div key={item.id} className="rounded-md border border-gray-200">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedItems((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(item.id)) {
                                    next.delete(item.id)
                                  } else {
                                    next.add(item.id)
                                  }
                                  return next
                                })
                              }}
                              className="w-full text-left px-4 py-3 bg-white hover:bg-gray-50 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                            >
                              <div className="flex items-start gap-3">
                                <span className="mt-1 text-gray-600">
                                  {isItemOpen ? <FiChevronUp /> : <FiChevronDown />}
                                </span>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    {item.title}
                                  </h4>
                                  {item.description && (
                                    <p className="mt-1 text-xs text-gray-600">
                                      {item.description}
                                    </p>
                                  )}
                                  {isSaving && (
                                    <p className="mt-1 text-xs text-gray-400">
                                      Saving response...
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-gray-400">
                                <span className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600 inline-flex items-center justify-center" aria-label="Document">
                                  <FiFileText className="mx-auto" />
                                </span>
                                <span className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600 inline-flex items-center justify-center" aria-label="Info">
                                  <FiInfo className="mx-auto" />
                                </span>
                                <span className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600 inline-flex items-center justify-center" aria-label="Attachment">
                                  <FiPaperclip className="mx-auto" />
                                </span>
                                <span className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600 inline-flex items-center justify-center" aria-label="Comments">
                                  <FiMessageSquare className="mx-auto" />
                                </span>
                                <span className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600 inline-flex items-center justify-center" aria-label="Settings">
                                  <FiSettings className="mx-auto" />
                                </span>
                              </div>
                            </button>

                            {isItemOpen && (
                              <div className="border-t border-gray-200 bg-white">
                                {item.responseOptions.length === 0 ? (
                                  <div className="px-4 py-3 text-xs text-gray-500">
                                    No response options configured.
                                  </div>
                                ) : (
                                  <div className="divide-y divide-gray-200">
                                    {item.responseOptions.map((option) => (
                                      <label
                                        key={`${item.id}-${option.id}`}
                                        className="grid grid-cols-1 sm:grid-cols-[32px_auto_1fr] items-start gap-4 px-4 py-3 text-sm"
                                      >
                                        <span className="pt-1">
                                          <input
                                            type="radio"
                                            name={`response-${item.id}`}
                                            className="h-4 w-4"
                                            checked={selections[item.id] === option.id}
                                            onChange={() => {
                                              handleSelect(item.id, option.id)
                                            }}
                                            disabled={isSaving || isCompleted}
                                          />
                                        </span>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getBadgeClasses(option.label)}`}>
                                          {option.label}
                                        </span>
                                        <span className="text-sm text-gray-700">
                                          {option.description || 'No description provided.'}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}

export default AssessmentQuestions
