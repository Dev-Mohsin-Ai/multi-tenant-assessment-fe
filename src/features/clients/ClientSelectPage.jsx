import React from 'react'
import { FiClipboard, FiLayout, FiMap } from 'react-icons/fi'
import AllClients from './components/AllClients'

const ClientSelectPage = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[rgb(248,248,250)]">
      <div className="mx-auto w-full max-w-full px-10 pt-20 pb-12">
        <div className="mb-6 rounded-md border border-gray-200 bg-white px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center rounded-full bg-[rgb(236,245,255)] px-3 py-1 text-xs font-semibold text-[rgb(5,117,204)]">
                Workspace required
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-gray-900">Select client</h1>
              <p className="mt-1 text-sm text-gray-600">
                Your selection becomes the active workspace across all tabs.
              </p>
              <ul className="mt-4 space-y-3 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <FiClipboard className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="font-semibold text-gray-900">Assessments:</span>{' '}
                    start new or continue in-progress work for this client.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <FiLayout className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="font-semibold text-gray-900">Templates:</span>{' '}
                    manage the assessment structure used for scoring.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                    <FiMap className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="font-semibold text-gray-900">Roadmap:</span>{' '}
                    turn findings into initiatives and track status by quarter.
                  </span>
                </li>
              </ul>
            </div>
            <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-[rgb(248,248,250)] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Quick tips
              </p>
              <div className="mt-3 space-y-3 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-gray-900">Use search</p>
                  <p className="text-xs text-gray-600">
                    Find clients by name, domain, or description.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Switch anytime</p>
                  <p className="text-xs text-gray-600">
                    Changing the client updates Roadmap and Assessments instantly.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Create new</p>
                  <p className="text-xs text-gray-600">
                    Add a client if they're not listed below.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-xs text-gray-600 md:grid-cols-3">
            <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Workspace
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                Client-specific data
              </p>
              <p className="mt-1">
                Assessments, initiatives, and templates are scoped per client.
              </p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Visibility
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                Clear ownership
              </p>
              <p className="mt-1">
                Switching clients updates the left sidebar context instantly.
              </p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                History
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                Track changes
              </p>
              <p className="mt-1">
                Keep assessments and roadmap items aligned over time.
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <AllClients />
        </div>
      </div>
    </div>
  )
}

export default ClientSelectPage
