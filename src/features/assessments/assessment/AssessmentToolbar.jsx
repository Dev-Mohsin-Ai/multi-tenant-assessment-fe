import React from 'react'
import Select from 'react-select'
import { FaPlus, FaGear } from 'react-icons/fa6'
import AssesmentDialogue from '../components/AssesmentDialogue'

const AssessmentToolbar = ({
  organizationOptions,
  activeOrganization,
  organizations,
  loadingOrganizations,
  creatingAssessment,
  open,
  setOpen,
  onOrganizationChange,
  onCreateAssessment,
  onOrganizationCreated,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60">
          <Select
            options={organizationOptions}
            value={
              activeOrganization
                ? {
                    value: activeOrganization.id,
                    label:
                      activeOrganization.name ||
                      `Organization ${activeOrganization.id}`,
                  }
                : null
            }
            onChange={onOrganizationChange}
            placeholder="Select organization..."
            isLoading={loadingOrganizations}
          />
        </div>
        {loadingOrganizations && (
          <span className="text-xs text-gray-400">Loading organizations...</span>
        )}
      </div>
      <div className="flex">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={creatingAssessment}
          className="ml-2 h-9 bg-[rgb(5,117,204)] text-white px-4 rounded-md flex items-center gap-2 text-sm font-medium hover:bg-[rgb(0,97,170)] cursor-pointer disabled:opacity-70"
        >
          <FaPlus /> {creatingAssessment ? 'Creating...' : 'New Assessment'}
        </button>
        {open && (
          <AssesmentDialogue
            onClose={() => setOpen(false)}
            onNext={onCreateAssessment}
            organizations={organizations}
            activeOrganizationId={activeOrganization?.id}
            onOrganizationCreated={onOrganizationCreated}
          />
        )}

        <button
          type="button"
          className="ml-2 h-9 bg-[rgb(248,248,250)] text-black px-4 rounded-md flex items-center gap-2 text-sm border border-gray-300 hover:bg-[rgb(255,255,255)]"
        >
          <FaGear /> Manage Templates
        </button>
      </div>
    </div>
  )
}

export default AssessmentToolbar
