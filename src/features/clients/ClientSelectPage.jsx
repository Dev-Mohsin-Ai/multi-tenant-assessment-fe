import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiBookOpen,
  FiLayers,
  FiMinusCircle,
  FiRefreshCw,
  FiShield,
  FiStar,
} from 'react-icons/fi'
import AllClients from './components/AllClients'
import {
  formatSegmentLabel,
  NOT_ASSIGNED_VALUE,
} from '../../shared/constants/segments'

const SEGMENT_ICONS = {
  [NOT_ASSIGNED_VALUE]: FiMinusCircle,
  TRANSFORM: FiRefreshCw,
  MODERNIZE: FiLayers,
  EDUCATE: FiBookOpen,
  SUSTAIN: FiShield,
}

const STARRED_CARD_STYLES = [
  'border-amber-200 bg-amber-50',
  'border-blue-200 bg-blue-50',
  'border-emerald-200 bg-emerald-50',
  'border-rose-200 bg-rose-50',
  'border-violet-200 bg-violet-50',
  'border-cyan-200 bg-cyan-50',
  'border-orange-200 bg-orange-50',
  'border-lime-200 bg-lime-50',
]

const ClientSelectPage = () => {
  const navigate = useNavigate()
  const [starredClients, setStarredClients] = useState([])
  const visibleStarredClients = useMemo(
    () => (starredClients || []).slice(0, 8),
    [starredClients]
  )

  return (
    <div className="min-h-screen bg-[rgb(248,248,250)]">
      <div className="mx-auto w-full max-w-full px-10 pt-16 pb-12">
        <div className="mb-6 rounded-md border border-gray-200 bg-white px-6 py-5 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Select client</h1>
          <p className="mt-1 text-sm text-gray-600">
            Choose a client to continue your workspace.
          </p>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Starred Clients
            </p>
            <p className="mt-1 text-xs text-gray-600">
              Quick access cards for your priority clients and their segment.
            </p>
            {visibleStarredClients.length === 0 ? (
              <div className="mt-3 rounded-md border border-dashed border-gray-300 bg-[rgb(248,248,250)] px-3 py-2">
                <p className="text-[11px] text-gray-500">
                  No starred clients yet. Click the star in the table to pin clients here.
                </p>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
                {visibleStarredClients.map((client, index) => {
                  const normalizedSegment =
                    String(client.segment || '').trim().toUpperCase() || NOT_ASSIGNED_VALUE
                  const Icon = SEGMENT_ICONS[normalizedSegment] || FiLayers
                  const cardStyle =
                    STARRED_CARD_STYLES[index % STARRED_CARD_STYLES.length]

                  return (
                    <button
                      type="button"
                      key={client.id}
                      onClick={() => navigate(`/clients/${client.id}`)}
                      className={`rounded-md border px-3 py-2 text-left transition hover:shadow-sm ${cardStyle}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white text-amber-600">
                          <FiStar className="h-3 w-3" />
                        </span>
                        <p className="truncate text-[11px] font-semibold text-gray-900">
                          {client.name}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-600">
                        <Icon className="h-3 w-3" />
                        <span className="truncate">{formatSegmentLabel(normalizedSegment)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
          <AllClients onStarredClientsChange={setStarredClients} />
        </div>
      </div>
    </div>
  )
}

export default ClientSelectPage
