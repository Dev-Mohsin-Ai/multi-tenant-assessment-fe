import React, { useEffect, useMemo, useState } from 'react'
import WorkspaceLayout from '../../shared/components/WorkspaceLayout'
import { getOrganizations } from '../../shared/services/organizationService'
import AppSelect from '../../shared/components/AppSelect'

const CLIENT_ASSIGNMENTS_KEY = 'adminClientAssignments'

const readAssignments = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(CLIENT_ASSIGNMENTS_KEY) || '{}')
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

const writeAssignments = (value) => {
  try {
    localStorage.setItem(CLIENT_ASSIGNMENTS_KEY, JSON.stringify(value || {}))
  } catch {
    // ignore storage failures
  }
}

const AdminPage = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [savingClientId, setSavingClientId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [assignments, setAssignments] = useState(() => readAssignments())
  const [pendingTargets, setPendingTargets] = useState({})

  useEffect(() => {
    writeAssignments(assignments)
  }, [assignments])

  useEffect(() => {
    let isMounted = true
    const loadClients = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getOrganizations()
        const list = Array.isArray(data) ? data : data?.organizations || []
        if (!isMounted) {
          return
        }
        setClients(list)
        setPendingTargets((prev) => {
          const next = { ...prev }
          list.forEach((client) => {
            const clientId = String(client.id)
            if (!next[clientId]) {
              const backendAssignment =
                client.parent_organization_id ??
                client.parentOrganizationId ??
                client.organization_id ??
                client.organizationId ??
                null
              next[clientId] = String(assignments[clientId] || backendAssignment || client.id)
            }
          })
          return next
        })
      } catch {
        if (isMounted) {
          setError('Unable to load clients')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadClients()
    return () => {
      isMounted = false
    }
  }, [assignments])

  const organizationLookup = useMemo(() => {
    const map = new Map()
    clients.forEach((client) => {
      map.set(String(client.id), client.name || `Organization ${client.id}`)
    })
    return map
  }, [clients])

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return clients
    }
    return clients.filter((client) => {
      const name = String(client.name || '').toLowerCase()
      const description = String(client.description || '').toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }, [clients, search])
  const moveTargetOptions = useMemo(
    () =>
      clients.map((org) => ({
        value: String(org.id),
        label: org.name || `Organization ${org.id}`,
      })),
    [clients]
  )

  const handleMoveClient = (clientId) => {
    const clientKey = String(clientId)
    const selectedTarget = Number(pendingTargets[clientKey])
    if (!selectedTarget) {
      setError('Select a target organization before moving.')
      return
    }

    setSavingClientId(clientId)
    setError('')
    setSuccess('')
    setAssignments((prev) => ({ ...prev, [clientKey]: String(selectedTarget) }))
    setSuccess('Client moved successfully.')
    setSavingClientId(null)
  }

  return (
    <WorkspaceLayout activeLabel="Admin" clientName="Administration" activeNavId="admin">
      <div className="bg-[rgb(248,248,250)] min-h-[calc(100vh-6rem)] rounded-tl-xl overflow-hidden">
        <div className="px-6 py-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Admin Panel</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage client assignments and organization alignment.
            </p>

            <div className="mt-4">
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search clients..."
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700"
              />
            </div>

            {error ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                {success}
              </div>
            ) : null}

            <div className="mt-5 overflow-x-auto rounded-lg border border-gray-200">
              {loading ? (
                <div className="px-4 py-4 text-sm text-gray-500">Loading clients...</div>
              ) : filteredClients.length === 0 ? (
                <div className="px-4 py-4 text-sm text-gray-500">No clients found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Client</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Current Organization
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Move To
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredClients.map((client) => {
                      const clientId = String(client.id)
                      const backendAssignment =
                        client.parent_organization_id ??
                        client.parentOrganizationId ??
                        client.organization_id ??
                        client.organizationId ??
                        client.id
                      const currentOrganizationId = String(
                        assignments[clientId] || backendAssignment || client.id
                      )
                      const selectedTarget = String(
                        pendingTargets[clientId] || currentOrganizationId
                      )
                      return (
                        <tr key={clientId}>
                          <td className="px-4 py-3 align-top">
                            <div className="font-semibold text-gray-900">
                              {client.name || `Client ${client.id}`}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {client.description || 'No description'}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-gray-700">
                            {organizationLookup.get(currentOrganizationId) ||
                              `Organization ${currentOrganizationId}`}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <AppSelect
                              options={moveTargetOptions}
                              value={selectedTarget}
                              onChange={(nextValue) =>
                                setPendingTargets((prev) => ({
                                  ...prev,
                                  [clientId]: String(nextValue || ''),
                                }))
                              }
                              className="min-w-55"
                              size="sm"
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <button
                              type="button"
                              onClick={() => handleMoveClient(client.id)}
                              disabled={savingClientId === client.id}
                              className="h-9 rounded-md bg-[rgb(5,117,204)] px-4 text-sm font-medium text-white hover:bg-[rgb(0,97,170)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {savingClientId === client.id ? 'Moving...' : 'Move'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  )
}

export default AdminPage
