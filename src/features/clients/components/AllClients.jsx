import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Table from '../../../shared/components/Tables'
import { createOrganization, getOrganizations } from '../../../shared/services/organizationService'

const AllClients = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  useEffect(() => {
    let isMounted = true
    const loadClients = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getOrganizations()
        const list = Array.isArray(data) ? data : data?.organizations || []
        if (isMounted) {
          setClients(list)
        }
      } catch (err) {
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
  }, [])

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return clients
    }
    return clients.filter((client) => {
      const name = client.name || ''
      const description = client.description || ''
      return (
        name.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      )
    })
  }, [clients, search])

  const rows = useMemo(
    () =>
      filteredClients.map((client) => ({
        id: client.id,
        name: client.name || `Organization ${client.id}`,
        description: client.description || 'No description',
      })),
    [filteredClients]
  )

  const handleCreateClient = async () => {
    const name = newName.trim()
    if (!name) {
      setError('Client name is required')
      return
    }
    setCreating(true)
    setError('')
    try {
      const data = await createOrganization({
        name,
        description: newDescription.trim(),
      })
      const created = data?.organization || data
      if (!created) {
        throw new Error('Missing organization data')
      }
      setClients((prev) => [created, ...prev])
      setNewName('')
      setNewDescription('')
      setShowCreate(false)
    } catch (err) {
      setError('Unable to create client')
    } finally {
      setCreating(false)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Client',
      render: (value) => <span className="font-medium text-gray-900">{value}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => (
        <span className="text-sm text-gray-600">{value}</span>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (value, row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            navigate(`/clients/${row.id}`)
          }}
          className="text-[rgb(5,117,204)] hover:underline"
        >
          Open
        </button>
      ),
    },
  ]

  return (
    <div className="px-4 pt-4 bg-[rgb(248,248,250)] min-h-screen rounded-tl-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Clients</h2>
          <p className="text-xs text-gray-500">
            {rows.length} client{rows.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
          className="h-9 px-4 rounded-md bg-[rgb(5,117,204)] text-white text-sm font-medium hover:bg-[rgb(0,97,170)]"
        >
          {showCreate ? 'Cancel' : 'Create New Client'}
        </button>
      </div>

      {showCreate && (
        <div className="mt-4 rounded-md border border-gray-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Client name"
              className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-700 placeholder:text-gray-400"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="Description (optional)"
              className="h-10 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-700 placeholder:text-gray-400"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCreateClient}
              disabled={creating}
              className="h-9 px-4 rounded-md bg-[rgb(5,117,204)] text-white text-sm font-medium hover:bg-[rgb(0,97,170)] disabled:opacity-70"
            >
              {creating ? 'Creating...' : 'Save client'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="h-9 px-4 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex-1 h-10 px-3 border border-[rgb(200,200,205)] rounded-sm outline-none text-sm text-[#473c9a] bg-white placeholder:text-[rgb(182,183,195)] focus:border-2 focus:border-[#473c9a]"
        />
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
            Loading clients...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
            No clients found.
          </div>
        ) : (
          <Table
            columns={columns}
            data={rows}
            onRowClick={(row) => navigate(`/clients/${row.id}`)}
          />
        )}
      </div>
    </div>
  )
}

export default AllClients
