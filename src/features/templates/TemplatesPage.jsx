import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WorkspaceLayout from '../../shared/components/WorkspaceLayout'
import {
  createTemplate,
  deleteTemplate,
  getTemplates,
  updateTemplate,
} from '../../shared/services/templateService'
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi'
import TemplateBrowse from './TemplateBrowse'
import TemplateEditor from './TemplateEditor'
import TemplatesHeader from './TemplatesHeader'
import { useAppStore } from '../../shared/store/useAppStore'
import {
  MULTI_RESPONSE_OPTIONS,
  YES_NO_OPTIONS,
  buildPayload,
  createCategory,
  createSubcategory,
  getNextMultiResponse,
  normalizeTemplate,
} from './templateUtils'

const AUTO_SAVE_INTERVAL_MS = 30000
const EMPTY_TEMPLATE = { title: '', description: '', categories: [] }
const serializeTemplate = (value) => JSON.stringify(value || EMPTY_TEMPLATE)
const resolveTemplateId = (template) =>
  template?.id ?? template?.template_id ?? template?.templateId ?? null

const TemplatesPage = () => {
  const activeClientName = useAppStore((state) => state.activeOrganizationName) || 'Client'
  const activeOrganizationId = useAppStore((state) => state.activeOrganizationId)
  const assessmentsPath = activeOrganizationId
    ? `/clients/${activeOrganizationId}`
    : '/clients/select'
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [formData, setFormData] = useState({ title: '', categories: [] })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [templatePendingDelete, setTemplatePendingDelete] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState({})
  const [collapsedSubcategories, setCollapsedSubcategories] = useState({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState(null)
  const lastSavedSnapshotRef = useRef(serializeTemplate(EMPTY_TEMPLATE))
  const formDataRef = useRef(formData)
  const saveInFlightRef = useRef(false)

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

  useEffect(() => {
    setSelectedTemplateId(null)
    setFormData(EMPTY_TEMPLATE)
    lastSavedSnapshotRef.current = serializeTemplate(EMPTY_TEMPLATE)
    setHasUnsavedChanges(false)
    setLastAutoSavedAt(null)
    setSearchQuery('')
    setActiveTab('browse')
    setCollapsedCategories({})
    setCollapsedSubcategories({})
  }, [activeOrganizationId])

  const handleSelectTemplate = (template) => {
    const normalized = normalizeTemplate(template)
    setSelectedTemplateId(resolveTemplateId(template))
    setFormData(normalized)
    lastSavedSnapshotRef.current = serializeTemplate(normalized)
    setHasUnsavedChanges(false)
    setLastAutoSavedAt(null)
    setError('')
    setSuccess('')
    setActiveTab('edit')
    setCollapsedCategories({})
    setCollapsedSubcategories({})
  }

  const handleNewTemplate = () => {
    setSelectedTemplateId(null)
    setFormData(EMPTY_TEMPLATE)
    lastSavedSnapshotRef.current = serializeTemplate(EMPTY_TEMPLATE)
    setHasUnsavedChanges(false)
    setLastAutoSavedAt(null)
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

  useEffect(() => {
    formDataRef.current = formData
    setHasUnsavedChanges(serializeTemplate(formData) !== lastSavedSnapshotRef.current)
  }, [formData])

  const saveTemplate = useCallback(
    async ({ silent = false } = {}) => {
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

      if (saveInFlightRef.current || deleting || loading) {
        return false
      }
      const organizationId = Number(activeOrganizationId)
      if (!organizationId) {
        if (!silent) {
          setError('Select a client before saving templates.')
        }
        return false
      }
      if (!silent) {
        setError('')
        setSuccess('')
      }
      if (!formData.title.trim()) {
        if (!silent) {
          setError('Template title is required.')
        }
        return false
      }
      const validationError = validateWeights()
      if (validationError) {
        if (!silent) {
          setError(validationError)
        }
        return false
      }

      saveInFlightRef.current = true
      if (silent) {
        setIsAutoSaving(true)
      } else {
        setSaving(true)
      }

      try {
        const snapshotBeforeSave = serializeTemplate(formData)
        const basePayload = buildPayload(formData)
        if (selectedTemplateId) {
          await updateTemplate(selectedTemplateId, basePayload)
          if (!silent) {
            setSuccess('Template updated successfully!')
          }
        } else {
          const payload = {
            ...basePayload,
            organization_id: organizationId,
          }
          const created = await createTemplate(payload)
          const createdTemplate = created?.template || created
          const createdTemplateId = resolveTemplateId(createdTemplate)
          setSelectedTemplateId(createdTemplateId || null)
          if (!silent) {
            setSuccess('Template created successfully!')
          }
        }
        await loadTemplates()
        lastSavedSnapshotRef.current = snapshotBeforeSave
        setHasUnsavedChanges(
          serializeTemplate(formDataRef.current) !== lastSavedSnapshotRef.current
        )
        setLastAutoSavedAt(new Date())
        if (!silent) {
          setTimeout(() => setSuccess(''), 3000)
        }
        return true
      } catch (err) {
        const details = err?.response?.data?.detail
        const message = Array.isArray(details)
          ? details.map((item) => item?.msg || 'Validation error').join(' ')
          : details || 'Unable to save template. Check required fields and weights.'
        if (!silent) {
          setError(message)
        }
        return false
      } finally {
        saveInFlightRef.current = false
        if (silent) {
          setIsAutoSaving(false)
        } else {
          setSaving(false)
        }
      }
    },
    [
      activeOrganizationId,
      deleting,
      formData,
      loading,
      loadTemplates,
      selectedTemplateId,
      totalCategoryWeight,
    ]
  )

  useEffect(() => {
    if (activeTab !== 'edit') {
      return
    }
    const intervalId = setInterval(() => {
      if (!hasUnsavedChanges) {
        return
      }
      void saveTemplate({ silent: true })
    }, AUTO_SAVE_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [activeTab, hasUnsavedChanges, saveTemplate])

  const autoSaveStatus = useMemo(() => {
    if (activeTab !== 'edit') {
      return ''
    }
    if (isAutoSaving) {
      return 'Auto-saving...'
    }
    if (hasUnsavedChanges) {
      return 'Unsaved changes. Auto-save runs every 30 seconds.'
    }
    if (lastAutoSavedAt) {
      return `Auto-saved at ${lastAutoSavedAt.toLocaleTimeString('en-US')}`
    }
    return 'Auto-save runs every 30 seconds.'
  }, [activeTab, hasUnsavedChanges, isAutoSaving, lastAutoSavedAt])

  const handleSave = () => saveTemplate({ silent: false })
  const handleDeleteConfirm = async (templateId = selectedTemplateId) => {
    if (!templateId) {
      setError('Select a template to delete.')
      return
    }
    setDeleting(true)
    setError('')
    try {
      await deleteTemplate(templateId)
      setSuccess('Template deleted successfully!')
      setTemplatePendingDelete(null)
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
      clientName={activeClientName}
      activeNavId="templates"
      assessmentsPath={assessmentsPath}
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
              onDeleteTemplate={setTemplatePendingDelete}
              deletingTemplateId={deleting ? templatePendingDelete?.id : null}
            />
          ) : (
            <TemplateEditor
              formData={formData}
              setFormData={setFormData}
              selectedTemplateId={selectedTemplateId}
              saving={saving}
              autoSaveStatus={autoSaveStatus}
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
        {templatePendingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,19,34,0.45)] px-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="border-b border-gray-100 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <FiAlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Delete Template</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Delete <span className="font-medium text-gray-900">{templatePendingDelete.title || `Template ${templatePendingDelete.id}`}</span>?
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 text-sm text-gray-600">
                This will mark the template inactive and remove it from active browse results.
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setTemplatePendingDelete(null)}
                  disabled={deleting}
                  className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteConfirm(templatePendingDelete.id)}
                  disabled={deleting}
                  className="rounded-md border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}

export default TemplatesPage
