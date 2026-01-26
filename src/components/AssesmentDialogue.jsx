import React, { useEffect, useMemo, useState } from 'react'
import Select from 'react-select'
import SearchTemplate from './SearchTemplate'
import { createOrganization, getOrganizations } from '../services/organizationService'
import { deleteTemplate, getTemplates } from '../services/templateService'

const AssesmentDialogue = ({
  onClose,
  onNext,
  organizations: initialOrganizations = [],
  activeOrganizationId,
  onOrganizationCreated,
  organization,
}) => {
  const [organizations, setOrganizations] = useState(initialOrganizations)
  const [templates, setTemplates] = useState([])
  const [selectedOrg, setSelectedOrg] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [performedBy, setPerformedBy] = useState('Hamza Abid')
  const [assessmentDate, setAssessmentDate] = useState(() => {
    const today = new Date()
    return today.toISOString().slice(0, 10)
  })
  const [assessmentTitle, setAssessmentTitle] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgDescription, setOrgDescription] = useState('')
  const [loadingOrganizations, setLoadingOrganizations] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [creatingOrganization, setCreatingOrganization] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState(false)
  const [error, setError] = useState('')
  const isOrganizationLocked = Boolean(organization)

  const lockedOption = useMemo(() => {
    if (!organization) {
      return null
    }
    return {
      value: organization.id,
      label: organization.name || `Organization ${organization.id}`,
      description: organization.description || '',
    }
  }, [organization])

  const orgOptions = useMemo(
    () =>
      organizations.map((org) => {
        const id = org.id ?? org.organization_id ?? org.organizationId
        return {
          value: id,
          label: org.name || `Organization ${id}`,
          description: org.description || '',
        }
      }),
    [organizations]
  )

  const templateOptions = useMemo(
    () =>
      templates.map((template) => {
        const id = template.id ?? template.template_id ?? template.templateId
        return {
          value: id,
          label:
            template.name || template.title || template.label || `Template ${id}`,
          description: template.description || '',
        }
      }),
    [templates]
  )
  const resolvedTemplateOptions = templateOptions
  const templatesAvailable = resolvedTemplateOptions.length > 0

  useEffect(() => {
    let isMounted = true

    const loadOrganizations = async () => {
      if (isOrganizationLocked || initialOrganizations.length > 0) {
        return
      }

      setLoadingOrganizations(true)
      try {
        const data = await getOrganizations()
        const list = Array.isArray(data) ? data : data?.organizations || []
        if (isMounted) {
          setOrganizations(list)
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load organizations')
        }
      } finally {
        if (isMounted) {
          setLoadingOrganizations(false)
        }
      }
    }

    const loadTemplates = async () => {
      setLoadingTemplates(true)
      try {
        const data = await getTemplates()
        const list = Array.isArray(data) ? data : data?.templates || []
        if (isMounted) {
          setTemplates(list)
        }
      } catch (err) {
        if (isMounted) {
          setError('Unable to load templates')
        }
      } finally {
        if (isMounted) {
          setLoadingTemplates(false)
        }
      }
    }

    loadOrganizations()
    loadTemplates()

    return () => {
      isMounted = false
    }
  }, [initialOrganizations.length, isOrganizationLocked])

  useEffect(() => {
    if (!lockedOption) {
      return
    }
    if (!selectedOrg || selectedOrg.value !== lockedOption.value) {
      setSelectedOrg(lockedOption)
    }
  }, [lockedOption, selectedOrg])

  useEffect(() => {
    if (isOrganizationLocked || selectedOrg || orgOptions.length === 0) {
      return
    }

    const storedOrgId = activeOrganizationId || localStorage.getItem('activeOrganizationId')
    const match = storedOrgId
      ? orgOptions.find((option) => String(option.value) === String(storedOrgId))
      : orgOptions[0]

    if (match) {
      setSelectedOrg(match)
    }
  }, [activeOrganizationId, isOrganizationLocked, orgOptions, selectedOrg])

  const handleCreateOrganization = async () => {
    if (isOrganizationLocked) {
      return
    }
    const name = orgName.trim()
    if (!name) {
      setError('Organization name is required')
      return
    }

    setCreatingOrganization(true)
    setError('')
    try {
      const data = await createOrganization({
        name,
        description: orgDescription.trim(),
      })
      const created = data?.organization || data
      if (!created) {
        throw new Error('Missing organization data')
      }

      setOrganizations((prev) => [created, ...prev])
      const createdOption = {
        value: created.id,
        label: created.name || `Organization ${created.id}`,
        description: created.description || '',
      }
      setSelectedOrg(createdOption)
      setOrgName('')
      setOrgDescription('')
      if (onOrganizationCreated) {
        onOrganizationCreated(created)
      }
    } catch (err) {
      setError('Unable to create organization')
    } finally {
      setCreatingOrganization(false)
    }
  }

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) {
      setError('Select a template to delete')
      return
    }

    const templateId = Number(selectedTemplate.value)
    if (Number.isNaN(templateId)) {
      setError('Select a valid template to delete')
      return
    }

    const confirmDelete = window.confirm('Delete this template? This will mark it inactive.')
    if (!confirmDelete) {
      return
    }

    setDeletingTemplate(true)
    setError('')
    try {
      await deleteTemplate(templateId)
      setTemplates((prev) =>
        prev.filter((template) => {
          const id = template.id ?? template.template_id ?? template.templateId
          return Number(id) !== templateId
        })
      )
      setSelectedTemplate(null)
    } catch (err) {
      setError('Unable to delete template')
    } finally {
      setDeletingTemplate(false)
    }
  }

  const handleNext = () => {
    const resolvedOrg = selectedOrg || lockedOption

    if (!resolvedOrg || !selectedTemplate) {
      setError('Select an organization and template before continuing')
      return
    }

    const resolvedOrgId = Number(resolvedOrg.value)
    const resolvedTemplateId = Number(selectedTemplate.value)
    if (Number.isNaN(resolvedOrgId)) {
      setError('Select a valid organization before continuing')
      return
    }
    if (Number.isNaN(resolvedTemplateId)) {
      setError('Select a valid template before continuing')
      return
    }

    const templateLabel = selectedTemplate.label || ''

    onNext({
      organizationId: resolvedOrgId,
      organizationName: resolvedOrg.label,
      templateId: resolvedTemplateId,
      templateLabel,
      performedBy,
      date: assessmentDate,
      title: assessmentTitle.trim() || templateLabel || 'New Assessment',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40">
      <div className="mt-24 bg-white w-1/3 max-w-[90vw] rounded-lg p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-[rgb(5,117,204)] text-2xl font-semibold">
            New Assessment
          </h1>
        </div>

        <div className="mt-4 space-y-4 text-sm text-gray-800">
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </p>
          )}

          <div>
            <h2 className="font-medium text-black">Organization</h2>
            {isOrganizationLocked ? (
              <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                <p className="text-xs text-gray-500">Selected client</p>
                <p className="font-medium text-gray-900">
                  {organization.name || `Organization ${organization.id}`}
                </p>
                {organization.description && (
                  <p className="text-xs text-gray-500">{organization.description}</p>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500">Select or create an organization</p>
                <div className="mt-2">
                  <Select
                    options={orgOptions}
                    value={selectedOrg}
                    onChange={setSelectedOrg}
                    placeholder="Select organization..."
                    isLoading={loadingOrganizations}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={orgName}
                    onChange={(event) => setOrgName(event.target.value)}
                    placeholder="New organization name"
                    className="h-9 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-700 placeholder:text-gray-400"
                  />
                  <input
                    type="text"
                    value={orgDescription}
                    onChange={(event) => setOrgDescription(event.target.value)}
                    placeholder="Description (optional)"
                    className="h-9 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-700 placeholder:text-gray-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCreateOrganization}
                  disabled={creatingOrganization}
                  className="mt-3 h-9 px-3 rounded-md border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {creatingOrganization ? 'Creating organization...' : 'Create organization'}
                </button>
              </>
            )}
          </div>

          <div>
            <h2 className="font-medium text-black">Template</h2>
            <p className="text-xs text-gray-500">Select template</p>
            <div className="mt-2">
              <SearchTemplate
                value={selectedTemplate}
                onChange={setSelectedTemplate}
                options={resolvedTemplateOptions}
                isLoading={loadingTemplates}
                placeholder="Select a template..."
              />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteTemplate}
                disabled={deletingTemplate || !selectedTemplate}
                className="h-8 px-3 rounded-md border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {deletingTemplate ? 'Deleting...' : 'Delete template'}
              </button>
            </div>
            {!loadingTemplates && !templatesAvailable && (
              <p className="mt-2 text-xs text-gray-500">
                No templates available.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="font-medium text-black">Performed by</h2>
              <div className="mt-2">
                <select
                  value={performedBy}
                  onChange={(event) => setPerformedBy(event.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-700"
                >
                  <option>Hamza Abid</option>
                  <option>Ali Khan</option>
                  <option>Sara Ahmed</option>
                  <option>Usman Raza</option>
                </select>
              </div>
            </div>

            <div>
              <h2 className="font-medium text-black">Assessment date</h2>
              <div className="mt-2">
                <input
                  type="date"
                  value={assessmentDate}
                  onChange={(event) => setAssessmentDate(event.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-700"
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-medium text-black">Assessment Title</h2>
            <div className="mt-2">
              <input
                type="text"
                placeholder="Title"
                value={assessmentTitle}
                onChange={(event) => setAssessmentTitle(event.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-700 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 cursor-pointer border border-gray-300 rounded-md px-3 h-9"
          >
            <span className="inline-flex items-center justify-center text-gray-600">
              x
            </span>
            Close
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={loadingTemplates || !templatesAvailable}
            className="h-9 px-4 rounded-md bg-[rgb(5,117,204)] text-white text-sm font-medium hover:bg-[rgb(0,97,170)] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssesmentDialogue
