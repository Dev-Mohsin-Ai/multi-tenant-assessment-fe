import React from 'react'
import {
  FiChevronDown,
  FiChevronRight,
  FiCopy,
  FiFolder,
  FiPlus,
  FiSave,
  FiTrash2,
} from 'react-icons/fi'
import { formatResponseLabel, getResponseBadgeClass } from './templateUtils'

const TemplateEditor = (props) => {
  const {
    formData,
    setFormData,
    selectedTemplateId,
    saving,
    deleting,
    handleSave,
    handleDeleteConfirm,
    totalCategoryWeight,
    addCategory,
    updateCategory,
    removeCategory,
    duplicateCategory,
    addSubcategory,
    updateSubcategory,
    removeSubcategory,
    duplicateSubcategory,
    handleSubcategoryTypeChange,
    addOption,
    updateOption,
    removeOption,
    collapsedCategories,
    collapsedSubcategories,
    toggleCategoryCollapse,
    toggleSubcategoryCollapse,
  } = props

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Template Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full h-11 px-4 rounded-md border border-gray-300 text-lg font-semibold focus:outline-none transition-all duration-200"
              placeholder="Enter template name..."
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-5 rounded-md bg-[rgb(5,117,204)] text-white text-sm font-medium hover:bg-[rgb(0,97,170)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              <FiSave /> {saving ? 'Saving...' : selectedTemplateId ? 'Update' : 'Save'}
            </button>
            {selectedTemplateId && (
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="h-9 px-5 rounded-md bg-white border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                <FiTrash2 /> {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        </div>

        <div
          className={`rounded-md border px-4 py-3 ${
            totalCategoryWeight === 100
              ? 'border-gray-200 bg-gray-50'
              : 'border-red-300 bg-red-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Total Category Weight
            </span>
            <span
              className={`text-sm font-semibold ${
                totalCategoryWeight === 100 ? 'text-gray-900' : 'text-red-600'
              }`}
            >
              {totalCategoryWeight}%
            </span>
          </div>
          {totalCategoryWeight !== 100 && (
            <p className="mt-2 text-xs text-red-600">
              Category weights must sum to 100%.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
            <p className="text-sm text-gray-600 mt-1">
              Build your assessment structure with categories and subcategories
            </p>
          </div>
          <button
            type="button"
            onClick={addCategory}
            className="h-9 px-4 rounded-md bg-[rgb(5,117,204)] text-white text-sm font-medium hover:bg-[rgb(0,97,170)] transition-all duration-200 flex items-center gap-2"
          >
            <FiPlus /> Add Category
          </button>
        </div>

        {formData.categories.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
            <FiFolder className="text-5xl mb-4 mx-auto text-gray-400" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              No categories yet
            </h4>
            <p className="text-gray-600 mb-6">
              Start building your template by adding your first category
            </p>
            <button
              type="button"
              onClick={addCategory}
              className="h-9 px-6 rounded-md bg-[rgb(5,117,204)] text-white text-sm font-medium hover:bg-[rgb(0,97,170)] transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <FiPlus /> Add First Category
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.categories.map((category, catIndex) => {
              const subWeight = category.sub_categories.reduce(
                (sum, sub) => sum + (Number(sub.weight_percentage) || 0),
                0
              )
              const isCollapsed = collapsedCategories[catIndex]
              const categoryBg =
                catIndex % 2 === 0 ? 'bg-white' : 'bg-[rgb(248,249,251)]'
              const categoryHeaderBg =
                catIndex % 2 === 0 ? 'bg-gray-50' : 'bg-[rgb(242,244,247)]'

              return (
                <div
                  key={`category-${catIndex}`}
                  className={`rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${categoryBg}`}
                >
                  <div className={`${categoryHeaderBg} border-b border-gray-200 px-5 py-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleCategoryCollapse(catIndex)}
                          className="text-lg hover:scale-110 transition-transform duration-200"
                        >
                          {isCollapsed ? <FiChevronRight /> : <FiChevronDown />}
                        </button>
                        <span className="text-sm font-bold text-gray-700">
                          Category {catIndex + 1}
                        </span>
                        <span
                          className={`text-xs font-semibold ${
                            subWeight === 100 ? 'text-gray-600' : 'text-red-600'
                          }`}
                        >
                          Subcategories: {subWeight}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => duplicateCategory(catIndex)}
                          className="text-sm px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center gap-1"
                          title="Duplicate category"
                        >
                          <FiCopy /> Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCategory(catIndex)}
                          className="text-sm px-3 py-1 rounded-md bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all duration-200 flex items-center gap-1"
                        >
                          <FiTrash2 /> Remove
                        </button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Title
                          </label>
                          <input
                            type="text"
                            value={category.title}
                            onChange={(e) =>
                              updateCategory(catIndex, 'title', e.target.value)
                            }
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none transition-all duration-200"
                            placeholder="Category title"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Description
                          </label>
                          <input
                            type="text"
                            value={category.description}
                            onChange={(e) =>
                              updateCategory(catIndex, 'description', e.target.value)
                            }
                            className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none transition-all duration-200"
                            placeholder="Description"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">
                            Weight %
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={category.weight_percentage}
                            onChange={(e) =>
                              updateCategory(catIndex, 'weight_percentage', e.target.value)
                            }
                            className={`w-full h-10 px-3 rounded-md border bg-white text-sm focus:outline-none transition-all duration-200 ${
                              totalCategoryWeight === 100 ? 'border-gray-300' : 'border-red-400'
                            }`}
                            placeholder="0-100"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className={`p-5 ${categoryBg}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Subcategories
                        </h4>
                        {category.sub_categories.reduce(
                          (sum, sub) => sum + (Number(sub.weight_percentage) || 0),
                          0
                        ) !== 100 && (
                          <span className="text-xs text-red-600">
                            Subcategory weights must sum to 100%.
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => addSubcategory(catIndex)}
                          className="text-sm px-3 py-1 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center gap-1"
                        >
                          <FiPlus /> Add Subcategory
                        </button>
                      </div>

                      {category.sub_categories.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                          <p className="text-sm text-gray-600 mb-3">
                            No subcategories yet
                          </p>
                          <button
                            type="button"
                            onClick={() => addSubcategory(catIndex)}
                            className="text-sm px-4 py-2 rounded-md bg-[rgb(5,117,204)] text-white hover:bg-[rgb(0,97,170)] transition-all duration-200 flex items-center gap-2 mx-auto"
                          >
                            <FiPlus /> Add First Subcategory
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {category.sub_categories.map((subcategory, subIndex) => {
                            const subKey = `${catIndex}-${subIndex}`
                            const isSubCollapsed = collapsedSubcategories[subKey]

                            return (
                              <div
                                key={`subcategory-${catIndex}-${subIndex}`}
                                className="rounded-lg border border-gray-200 bg-white overflow-hidden"
                              >
                                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleSubcategoryCollapse(catIndex, subIndex)
                                        }
                                        className="text-sm hover:scale-110 transition-transform duration-200"
                                      >
                                        {isSubCollapsed ? (
                                          <FiChevronRight />
                                        ) : (
                                          <FiChevronDown />
                                        )}
                                      </button>
                                      <span className="text-xs font-semibold text-gray-700">
                                        Subcategory {subIndex + 1}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          duplicateSubcategory(catIndex, subIndex)
                                        }
                                        className="text-xs px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200"
                                        title="Duplicate subcategory"
                                      >
                                        <FiCopy /> Duplicate
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeSubcategory(catIndex, subIndex)
                                        }
                                        className="text-xs px-2 py-1 rounded bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-all duration-200"
                                      >
                                        <FiTrash2 />
                                      </button>
                                    </div>
                                  </div>

                                  {!isSubCollapsed && (
                                    <>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                                        <div>
                                          <label className="text-[10px] font-medium text-gray-600 mb-1 block">
                                            Title
                                          </label>
                                          <input
                                            type="text"
                                            value={subcategory.title}
                                            onChange={(e) =>
                                              updateSubcategory(
                                                catIndex,
                                                subIndex,
                                                'title',
                                                e.target.value
                                              )
                                            }
                                            className="w-full h-9 px-2 rounded border border-gray-300 bg-white text-xs focus:outline-none transition-all duration-200"
                                            placeholder="Subcategory title"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-medium text-gray-600 mb-1 block">
                                            Description
                                          </label>
                                          <input
                                            type="text"
                                            value={subcategory.description}
                                            onChange={(e) =>
                                              updateSubcategory(
                                                catIndex,
                                                subIndex,
                                                'description',
                                                e.target.value
                                              )
                                            }
                                            className="w-full h-9 px-2 rounded border border-gray-300 bg-white text-xs focus:outline-none transition-all duration-200"
                                            placeholder="Description"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-medium text-gray-600 mb-1 block">
                                            Weight %
                                          </label>
                                          <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={subcategory.weight_percentage}
                                            onChange={(e) =>
                                              updateSubcategory(
                                                catIndex,
                                                subIndex,
                                                'weight_percentage',
                                                e.target.value
                                              )
                                            }
                                            className={`w-full h-9 px-2 rounded border bg-white text-xs focus:outline-none transition-all duration-200 ${
                                              category.sub_categories.reduce(
                                                (sum, sub) =>
                                                  sum + (Number(sub.weight_percentage) || 0),
                                                0
                                              ) === 100
                                                ? 'border-gray-300'
                                                : 'border-red-400'
                                            }`}
                                            placeholder="0-100"
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-[rgb(248,248,250)] p-3 rounded-md border border-gray-200">
                                        <div>
                                          <label className="text-[10px] font-medium text-gray-600 mb-1 block">
                                            Scoring Instructions
                                          </label>
                                          <input
                                            type="text"
                                            value={subcategory.scoring_instructions}
                                            onChange={(e) =>
                                              updateSubcategory(
                                                catIndex,
                                                subIndex,
                                                'scoring_instructions',
                                                e.target.value
                                              )
                                            }
                                            className="w-full h-9 px-2 rounded border border-gray-300 bg-white text-xs focus:outline-none transition-all duration-200"
                                            placeholder="Scoring instructions"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-medium text-gray-600 mb-1 block">
                                            Remediation Tips
                                          </label>
                                          <input
                                            type="text"
                                            value={subcategory.remediation_tips}
                                            onChange={(e) =>
                                              updateSubcategory(
                                                catIndex,
                                                subIndex,
                                                'remediation_tips',
                                                e.target.value
                                              )
                                            }
                                            className="w-full h-9 px-2 rounded border border-gray-300 bg-white text-xs focus:outline-none transition-all duration-200"
                                            placeholder="Remediation tips"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] font-medium text-gray-600 mb-1 block">
                                            Type
                                          </label>
                                          <select
                                            value={subcategory.type}
                                            onChange={(e) =>
                                              handleSubcategoryTypeChange(
                                                catIndex,
                                                subIndex,
                                                e.target.value
                                              )
                                            }
                                            className="w-full h-9 px-2 rounded border border-gray-300 bg-white text-xs focus:outline-none transition-all duration-200"
                                          >
                                            <option value="yes_no">Yes/No</option>
                                            <option value="multi_response">Multi Response</option>
                                          </select>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {!isSubCollapsed && (
                                  <div className="p-4 bg-[rgb(248,248,250)] border-t border-gray-200">
                                    <div className="flex items-center justify-between mb-3">
                                      <div>
                                        <h5 className="text-xs font-semibold text-gray-700">
                                          Response Options
                                        </h5>
                                        {subcategory.type !== 'multi_response' && (
                                          <p className="text-[10px] text-gray-500">
                                            Fixed options for this type.
                                          </p>
                                        )}
                                      </div>
                                      {subcategory.type === 'multi_response' && (
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => removeOption(catIndex, subIndex, 0)}
                                            disabled={subcategory.response_options.length === 0}
                                            className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
                                            title="Remove option"
                                          >
                                            -
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => addOption(catIndex, subIndex)}
                                            className="text-xs px-2 py-1 rounded bg-[rgb(5,117,204)] text-white hover:bg-[rgb(0,97,170)] transition-all duration-200"
                                            title="Add option"
                                          >
                                            +
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {subcategory.response_options.length === 0 ? (
                                      <div className="text-center py-4 border border-dashed border-gray-300 rounded bg-white">
                                        <p className="text-xs text-gray-600 mb-2">
                                          No response options yet
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() => addOption(catIndex, subIndex)}
                                          className="text-xs px-3 py-1 rounded bg-[rgb(5,117,204)] text-white hover:bg-[rgb(0,97,170)] transition-all duration-200 flex items-center gap-1 mx-auto"
                                        >
                                          <FiPlus /> Add First Option
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        {subcategory.response_options.map(
                                          (option, optionIndex) => (
                                            <div
                                              key={`option-${catIndex}-${subIndex}-${optionIndex}`}
                                              className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 bg-white p-3 rounded border border-gray-200 shadow-sm"
                                            >
                                              <div>
                                                <label className="text-[10px] font-medium text-gray-600 mb-1 block">
                                                  Response Type
                                                </label>
                                                <div className="mb-1">
                                                  <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getResponseBadgeClass(
                                                      option.response_type,
                                                      optionIndex
                                                    )}`}
                                                  >
                                                    {formatResponseLabel(option.response_type || 'custom')}
                                                  </span>
                                                </div>
                                              </div>
                                              <div>
                                                <label className="text-[10px] font-medium text-gray-600 mb-1 block">
                                                  Description
                                                </label>
                                                <input
                                                  type="text"
                                                  value={option.description}
                                                  onChange={(e) =>
                                                    updateOption(
                                                      catIndex,
                                                      subIndex,
                                                      optionIndex,
                                                      'description',
                                                      e.target.value
                                                    )
                                                  }
                                                  className="w-full h-8 px-2 rounded border border-gray-300 bg-[rgb(248,248,250)] text-xs focus:outline-none transition-all duration-200"
                                                  placeholder="Description"
                                                />
                                              </div>
                                              {subcategory.type === 'multi_response' ? (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    removeOption(
                                                      catIndex,
                                                      subIndex,
                                                      optionIndex
                                                    )
                                                  }
                                                  className="self-end h-8 px-2 rounded bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs transition-all duration-200"
                                                >
                                                  <FiTrash2 />
                                                </button>
                                              ) : (
                                                <div className="self-end h-8" />
                                              )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TemplateEditor
