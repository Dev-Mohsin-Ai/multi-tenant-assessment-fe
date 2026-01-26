import React, { useCallback, useEffect, useMemo, useState } from 'react'
import WorkspaceLayout from '../components/WorkspaceLayout'
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  updateTemplate,
} from '../services/templateService'
import {
  FiPlus, FiEdit2, FiTrash2, FiSave, FiSearch, FiFileText,
  FiChevronDown, FiChevronRight, FiFolder, FiLayers,
  FiCheckCircle, FiAlertCircle, FiAlertTriangle
} from 'react-icons/fi'

const YES_NO_OPTIONS = [
  { response_type: 'yes', description: '', score: 10 },
  { response_type: 'no', description: '', score: 0 },
]

const MULTI_RESPONSE_OPTIONS = [
  { response_type: 'satisfactory', description: '', score: 10 },
  { response_type: 'acceptable_risk', description: '', score: 7 },
  { response_type: 'needs_attention', description: '', score: 5 },
  { response_type: 'at_risk', description: '', score: 2 },
  { response_type: 'not_applicable', description: '', score: 0 },
  { response_type: 'unknown', description: '', score: 0 },
]

const getResponseBadgeClass = (value, index = 0) => {
  const normalized = String(value || '').toLowerCase()
  if (normalized.includes('satisfactory')) return 'bg-green-100 text-green-700'
  if (normalized.includes('acceptable')) return 'bg-blue-100 text-blue-700'
  if (normalized.includes('needs')) return 'bg-orange-100 text-orange-700'
  if (normalized.includes('at_risk')) return 'bg-red-100 text-red-700'
  if (normalized.includes('not_applicable')) return 'bg-purple-100 text-purple-700'
  if (normalized.includes('unknown')) return 'bg-gray-100 text-gray-700'
  if (normalized.includes('yes')) return 'bg-green-100 text-green-700'
  if (normalized.includes('partial')) return 'bg-orange-100 text-orange-700'
  if (normalized.includes('no')) return 'bg-red-100 text-red-700'
  const palette = [
    'bg-teal-100 text-teal-700',
    'bg-amber-100 text-amber-700',
    'bg-sky-100 text-sky-700',
    'bg-rose-100 text-rose-700',
    'bg-lime-100 text-lime-700',
  ]
  return palette[index % palette.length]
}

const formatResponseLabel = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const getDefaultOptions = (type) => {
  if (type === 'multi_response') return MULTI_RESPONSE_OPTIONS
  return YES_NO_OPTIONS
}

const getNextMultiResponse = (current = []) => {
  const index = current.length % MULTI_RESPONSE_OPTIONS.length
  return { ...MULTI_RESPONSE_OPTIONS[index] }
}

const createCategory = (weight = 0) => ({
  title: '',
  description: '',
  weight_percentage: weight,
  sub_categories: [],
})

const createSubcategory = (weight = 0) => ({
  title: '',
  description: '',
  weight_percentage: weight,
  scoring_instructions: '',
  remediation_tips: '',
  type: 'yes_no',
  response_options: getDefaultOptions('yes_no'),
})

const normalizeTemplate = (template) => ({
  id: template?.id,
  title: template?.title || template?.name || '',
  categories: (template?.categories || []).map((category) => ({
    title: category?.title || '',
    description: category?.description || '',
    weight_percentage: category?.weight_percentage ?? 0,
    order: category?.order ?? 0,
    sub_categories: (category?.sub_categories || category?.subcategories || []).map(
      (subcategory) => ({
        title: subcategory?.title || '',
        description: subcategory?.description || '',
        weight_percentage: subcategory?.weight_percentage ?? 0,
        scoring_instructions: subcategory?.scoring_instructions || '',
        remediation_tips: subcategory?.remediation_tips || '',
        type: subcategory?.type === 'multi_response' ? 'multi_response' : 'yes_no',
        order: subcategory?.order ?? 0,
        response_options: (
          subcategory?.response_options ||
          subcategory?.responseOptions ||
          []
        ).map((option) => ({
          response_type: option?.response_type || '',
          description: option?.description || '',
          score: option?.score ?? 0,
          order: option?.order ?? 0,
        })),
      })
    ),
  })),
})

const buildPayload = (template) => ({
  title: template.title.trim(),
  categories: template.categories.map((category, categoryIndex) => ({
    title: category.title.trim(),
    description: category.description || '',
    weight_percentage: Number(category.weight_percentage) || 0,
    order: categoryIndex,
    sub_categories: category.sub_categories.map((subcategory, subIndex) => {
      const type = subcategory.type === 'multi_response' ? 'multi_response' : 'yes_no'
      const allowedTypes =
        type === 'multi_response'
          ? [
              'satisfactory',
              'acceptable_risk',
              'needs_attention',
              'at_risk',
              'not_applicable',
              'unknown',
            ]
          : ['yes', 'no']
      const response_options =
        type === 'multi_response'
          ? subcategory.response_options.filter((option) =>
              allowedTypes.includes(option.response_type)
            )
          : allowedTypes.map((value) => {
              const existing = subcategory.response_options.find(
                (option) => option.response_type === value
              )
              return {
                response_type: value,
                description: existing?.description || '',
                score: Number(existing?.score ?? (value === 'yes' ? 10 : 0)) || 0,
              }
            })
      return {
        title: subcategory.title.trim(),
        description: subcategory.description || '',
        weight_percentage: Number(subcategory.weight_percentage) || 0,
        scoring_instructions: subcategory.scoring_instructions || '',
        remediation_tips: subcategory.remediation_tips || '',
        type,
        order: subIndex,
        response_options: response_options.map((option, optionIndex) => ({
          response_type: option.response_type,
          description: option.description || '',
          score: Number(option.score) || 0,
          order: optionIndex,
        })),
      }
    }),
  })),
})

const Templates = () => {
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [formData, setFormData] = useState({ title: '', categories: [] })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState({})
  const [collapsedSubcategories, setCollapsedSubcategories] = useState({})

  const totalCategoryWeight = useMemo(
    () =>
      formData.categories.reduce(
        (total, category) => total + (Number(category.weight_percentage) || 0),
        0
      ),
    [formData.categories]
  )

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getTemplates()
      const list = Array.isArray(data) ? data : data?.templates || []
      setTemplates(list)
    } catch {
      setError('Unable to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  const handleSelectTemplate = (template) => {
    setSelectedTemplateId(template?.id ?? null)
    setFormData(normalizeTemplate(template))
    setError('')
    setSuccess('')
    setActiveTab('edit')
    setCollapsedCategories({})
    setCollapsedSubcategories({})
  }

  const handleNewTemplate = () => {
    setSelectedTemplateId(null)
    setFormData({ title: '', categories: [] })
    setError('')
    setSuccess('')
    setActiveTab('edit')
    setCollapsedCategories({})
    setCollapsedSubcategories({})
  }

  const updateCategory = (index, field, value) => {
    setFormData((prev) => {
      const categories = prev.categories.map((category, catIndex) =>
        catIndex === index ? { ...category, [field]: value } : category
      )
      return { ...prev, categories }
    })
  }

  const updateSubcategory = (catIndex, subIndex, field, value) => {
    setFormData((prev) => {
      const categories = prev.categories.map((category, categoryIndex) => {
        if (categoryIndex !== catIndex) {
          return category
        }
        const sub_categories = category.sub_categories.map((subcategory, subIdx) =>
          subIdx === subIndex ? { ...subcategory, [field]: value } : subcategory
        )
        return { ...category, sub_categories }
      })
      return { ...prev, categories }
    })
  }

  const handleSubcategoryTypeChange = (catIndex, subIndex, value) => {
    setFormData((prev) => {
      const categories = prev.categories.map((category, categoryIndex) => {
        if (categoryIndex !== catIndex) {
          return category
        }
        const sub_categories = category.sub_categories.map((subcategory, subIdx) => {
          if (subIdx !== subIndex) {
            return subcategory
          }
          let response_options = subcategory.response_options
          if (value === 'yes_no') {
            response_options = YES_NO_OPTIONS
          } else if (value === 'multi_response') {
            response_options = MULTI_RESPONSE_OPTIONS
          }
          return {
            ...subcategory,
            type: value,
            response_options: response_options.map((option) => ({ ...option })),
          }
        })
        return { ...category, sub_categories }
      })
      return { ...prev, categories }
    })
  }

  const updateOption = (catIndex, subIndex, optionIndex, field, value) => {
    setFormData((prev) => {
      const categories = prev.categories.map((category, categoryIndex) => {
        if (categoryIndex !== catIndex) {
          return category
        }
        const sub_categories = category.sub_categories.map((subcategory, subIdx) => {
          if (subIdx !== subIndex) {
            return subcategory
          }
          const response_options = subcategory.response_options.map((option, optIdx) =>
            optIdx === optionIndex ? { ...option, [field]: value } : option
          )
          return { ...subcategory, response_options }
        })
        return { ...category, sub_categories }
      })
      return { ...prev, categories }
    })
  }

  const addCategory = () => {
    setFormData((prev) => {
      const weight = prev.categories.length === 0 ? 100 : 0
      return {
        ...prev,
        categories: [...prev.categories, createCategory(weight)],
      }
    })
  }

  const removeCategory = (index) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, catIndex) => catIndex !== index),
    }))
  }

  const duplicateCategory = (index) => {
    setFormData((prev) => {
      const categoryToDuplicate = prev.categories[index]
      const duplicated = {
        ...categoryToDuplicate,
        title: `${categoryToDuplicate.title} (Copy)`,
        weight_percentage: 0,
      }
      return {
        ...prev,
        categories: [...prev.categories, duplicated],
      }
    })
  }

  const addSubcategory = (catIndex) => {
    setFormData((prev) => {
      const categories = prev.categories.map((category, categoryIndex) => {
        if (categoryIndex !== catIndex) {
          return category
        }
        const weight = category.sub_categories.length === 0 ? 100 : 0
        return {
          ...category,
          sub_categories: [...category.sub_categories, createSubcategory(weight)],
        }
      })
      return { ...prev, categories }
    })
  }

  const removeSubcategory = (catIndex, subIndex) => {
    setFormData((prev) => {
      const categories = prev.categories.map((category, categoryIndex) => {
        if (categoryIndex !== catIndex) {
          return category
        }
        return {
          ...category,
          sub_categories: category.sub_categories.filter(
            (_, idx) => idx !== subIndex
          ),
        }
      })
      return { ...prev, categories }
    })
  }

  const duplicateSubcategory = (catIndex, subIndex) => {
    setFormData((prev) => {
      const categories = prev.categories.map((category, categoryIndex) => {
        if (categoryIndex !== catIndex) {
          return category
        }
        const subToDuplicate = category.sub_categories[subIndex]
        const duplicated = {
          ...subToDuplicate,
          title: `${subToDuplicate.title} (Copy)`,
          weight_percentage: 0,
        }
        return {
          ...category,
          sub_categories: [...category.sub_categories, duplicated],
        }
      })
      return { ...prev, categories }
    })
  }

  const addOption = (catIndex, subIndex) => {
    setFormData((prev) => {
      const categories = prev.categories.map((category, categoryIndex) => {
        if (categoryIndex !== catIndex) {
          return category
        }
        const sub_categories = category.sub_categories.map((subcategory, subIdx) => {
          if (subIdx !== subIndex) {
            return subcategory
          }
          if (subcategory.type !== 'multi_response') {
            return subcategory
          }
          if (subcategory.type === 'multi_response') {
            return {
              ...subcategory,
              response_options: [
                ...subcategory.response_options,
                getNextMultiResponse(subcategory.response_options),
              ],
            }
          }
          return subcategory
        })
        return { ...category, sub_categories }
      })
      return { ...prev, categories }
    })
  }

  const removeOption = (catIndex, subIndex, optionIndex) => {
    setFormData((prev) => {
      const categories = prev.categories.map((category, categoryIndex) => {
        if (categoryIndex !== catIndex) {
          return category
        }
        const sub_categories = category.sub_categories.map((subcategory, subIdx) => {
          if (subIdx !== subIndex) {
            return subcategory
          }
          if (subcategory.type !== 'multi_response') {
            return subcategory
          }
          return {
            ...subcategory,
            response_options: subcategory.response_options.filter(
              (_, idx) => idx !== optionIndex
            ),
          }
        })
        return { ...category, sub_categories }
      })
      return { ...prev, categories }
    })
  }

  const toggleCategoryCollapse = (index) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const toggleSubcategoryCollapse = (catIndex, subIndex) => {
    const key = `${catIndex}-${subIndex}`
    setCollapsedSubcategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const validateWeights = () => {
    if (formData.categories.length === 0) {
      return 'Add at least one category.'
    }
    if (totalCategoryWeight !== 100) {
      return 'Category weights must sum to 100.'
    }
    for (const category of formData.categories) {
      const totalSub = category.sub_categories.reduce(
        (sum, sub) => sum + (Number(sub.weight_percentage) || 0),
        0
      )
      if (category.sub_categories.length === 0) {
        return 'Each category must have at least one subcategory.'
      }
      if (totalSub !== 100) {
        return `Subcategory weights must sum to 100 in "${category.title || 'Untitled'}".`
      }
      for (const sub of category.sub_categories) {
        if (sub.response_options.length === 0) {
          return `Add at least one response option in "${sub.title || 'Untitled'}".`
        }
      }
    }
    return ''
  }

  const handleSave = async () => {
    setError('')
    setSuccess('')
    if (!formData.title.trim()) {
      setError('Template title is required.')
      return
    }

    const validationError = validateWeights()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload(formData)
      if (selectedTemplateId) {
        await updateTemplate(selectedTemplateId, payload)
        setSuccess('✓ Template updated successfully!')
      } else {
        const created = await createTemplate(payload)
        setSelectedTemplateId(created?.id || null)
        setSuccess('✓ Template created successfully!')
      }
      await loadTemplates()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const details = err?.response?.data?.detail
      const message = Array.isArray(details)
        ? details.map((item) => item?.msg || 'Validation error').join(' ')
        : details || 'Unable to save template. Check required fields and weights.'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedTemplateId) {
      setError('Select a template to delete.')
      return
    }
    setDeleting(true)
    setError('')
    try {
      await deleteTemplate(selectedTemplateId)
      setSuccess('✓ Template deleted successfully!')
      handleNewTemplate()
      await loadTemplates()
      setActiveTab('browse')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Unable to delete template.')
    } finally {
      setDeleting(false)
    }
  }

  const filteredTemplates = templates.filter((template) =>
    template.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <WorkspaceLayout
      activeLabel="Templates"
      clientName="Template Library"
      activeNavId="templates"
    >
      <div className="bg-[rgb(248,248,250)] min-h-[calc(100vh-6rem)] rounded-tl-xl overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Assessment Templates
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Create and manage your assessment templates with ease
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNewTemplate}
                  className="h-9 px-4 rounded-md bg-[rgb(5,117,204)] text-white text-sm font-medium hover:bg-[rgb(0,97,170)] transition-all duration-200 flex items-center gap-2"
                >
                  <FiPlus /> New Template
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 ${activeTab === 'browse'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <FiFolder /> Browse Templates
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 ${activeTab === 'edit'
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                <FiEdit2 /> {selectedTemplateId ? 'Edit Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {(error || success) && (
          <div className="px-6 pt-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2 animate-fade-in">
                <FiAlertCircle className="text-lg shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-start gap-2 animate-fade-in">
                <FiCheckCircle className="text-lg shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6">
          {activeTab === 'browse' ? (
            <div className="max-w-5xl mx-auto">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full h-12 pl-12 pr-4 rounded-md border border-gray-300 bg-white focus:outline-none transition-all duration-200"
                  />
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
                </div>
              </div>

              {/* Template Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
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
                      onClick={handleNewTemplate}
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
                    const subcategoryCount = template.categories?.reduce(
                      (sum, cat) => sum + (cat.sub_categories?.length || 0),
                      0
                    ) || 0
                    return (
                      <div
                        key={template.id}
                        className="group bg-white rounded-xl border border-gray-200 p-5 hover:shadow-xl hover:border-blue-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <FiFileText className="text-3xl text-gray-400" />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectTemplate(template)
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
          ) : (
            <div className="max-w-6xl mx-auto">
              {/* Editor Header */}
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

                {/* Weight Indicator */}
                <div className={`rounded-md border px-4 py-3 ${totalCategoryWeight === 100 ? 'border-gray-200 bg-gray-50' : 'border-red-300 bg-red-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Total Category Weight
                    </span>
                    <span className={`text-sm font-semibold ${totalCategoryWeight === 100 ? 'text-gray-900' : 'text-red-600'}`}>
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

              {/* Categories Section */}
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
                          {/* Category Header */}
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
                                <span className={`text-xs font-semibold ${subWeight === 100 ? 'text-gray-600' : 'text-red-600'}`}>
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
                                  Duplicate
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

                          {/* Category Content */}
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
                                        {/* Subcategory Header */}
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
                                                {isSubCollapsed ? <FiChevronRight /> : <FiChevronDown />}
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
                                                Duplicate
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

                                        {/* Response Options */}
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
                                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getResponseBadgeClass(option.response_type, optionIndex)}`}
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
          )}
        </div>
      </div>
    </WorkspaceLayout>
  )
}

export default Templates
