import React, { useCallback, useEffect, useMemo, useState } from 'react'
import WorkspaceLayout from '../../components/WorkspaceLayout'
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  updateTemplate,
} from '../../services/templateService'
import { FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import TemplateBrowse from './TemplateBrowse'
import TemplateEditor from './TemplateEditor'
import TemplatesHeader from './TemplatesHeader'
import {
  MULTI_RESPONSE_OPTIONS,
  YES_NO_OPTIONS,
  buildPayload,
  createCategory,
  createSubcategory,
  getNextMultiResponse,
  normalizeTemplate,
} from './templateUtils'

const TemplatesPage = () => {
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
          return {
            ...subcategory,
            response_options: [
              ...subcategory.response_options,
              getNextMultiResponse(subcategory.response_options),
            ],
          }
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
        <TemplatesHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onNewTemplate={handleNewTemplate}
          selectedTemplateId={selectedTemplateId}
        />

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

        <div className="px-6 py-6">
          {activeTab === 'browse' ? (
            <TemplateBrowse
              loading={loading}
              filteredTemplates={filteredTemplates}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectTemplate={handleSelectTemplate}
              onNewTemplate={handleNewTemplate}
            />
          ) : (
            <TemplateEditor
              formData={formData}
              setFormData={setFormData}
              selectedTemplateId={selectedTemplateId}
              saving={saving}
              deleting={deleting}
              handleSave={handleSave}
              handleDeleteConfirm={handleDeleteConfirm}
              totalCategoryWeight={totalCategoryWeight}
              addCategory={addCategory}
              updateCategory={updateCategory}
              removeCategory={removeCategory}
              duplicateCategory={duplicateCategory}
              addSubcategory={addSubcategory}
              updateSubcategory={updateSubcategory}
              removeSubcategory={removeSubcategory}
              duplicateSubcategory={duplicateSubcategory}
              handleSubcategoryTypeChange={handleSubcategoryTypeChange}
              addOption={addOption}
              updateOption={updateOption}
              removeOption={removeOption}
              collapsedCategories={collapsedCategories}
              collapsedSubcategories={collapsedSubcategories}
              toggleCategoryCollapse={toggleCategoryCollapse}
              toggleSubcategoryCollapse={toggleSubcategoryCollapse}
            />
          )}
        </div>
      </div>
    </WorkspaceLayout>
  )
}

export default TemplatesPage
