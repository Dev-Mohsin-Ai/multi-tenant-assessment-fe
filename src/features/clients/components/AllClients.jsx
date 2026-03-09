import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiEdit2 } from 'react-icons/fi'
import Table from '../../../shared/components/Tables'
import {
  createOrganization,
  getOrganizations,
  updateOrganization,
} from '../../../shared/services/organizationService'

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
  const [editingClientId, setEditingClientId] = useState(null)
  const [editingDescription, setEditingDescription] = useState('')
  const [savingDescription, setSavingDescription] = useState(false)

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
        rawDescription: client.description || '',
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
    } catch {
      setError('Unable to create client')
    } finally {
      setCreating(false)
    }
  }

  const handleStartEditDescription = (row) => {
    setEditingClientId(row.id)
    setEditingDescription(row.rawDescription || '')
    setError('')
  }

  const handleCancelEditDescription = () => {
    setEditingClientId(null)
    setEditingDescription('')
  }

  const handleSaveDescription = async () => {
    if (!editingClientId) {
      return
    }
    setSavingDescription(true)
    setError('')
    const nextDescription = editingDescription.trim()
    try {
      const payload = await updateOrganization(editingClientId, {
        description: nextDescription,
      })
      const updated = payload?.organization || payload
      setClients((prev) =>
        prev.map((client) =>
          String(client.id) === String(editingClientId)
            ? {
                ...client,
                ...(updated || {}),
                description:
                  updated?.description !== undefined ? updated.description : nextDescription,
              }
            : client
        )
      )
      setEditingClientId(null)
      setEditingDescription('')
    } catch {
      setError('Unable to update client description')
    } finally {
      setSavingDescription(false)
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
      label: <span className="block text-right">Action</span>,
      render: (value, row) => (
        <div className="flex w-full justify-end">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              handleStartEditDescription(row)
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 text-[rgb(5,117,204)] hover:bg-[rgb(236,245,255)]"
            aria-label="Edit description"
            title="Edit description"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="px-4 md:px-6 pt-5 pb-8 bg-[rgb(248,248,250)] min-h-screen rounded-tl-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">All Clients</h2>
          <p className="text-xs text-gray-500 mt-1">
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
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Client name"
              className="h-10 px-3 border border-gray-200 rounded-md bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:border-[rgb(5,117,204)] focus:ring-1 focus:ring-blue-100"
            />
            <input
              type="text"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="Description (optional)"
              className="h-10 px-3 border border-gray-200 rounded-md bg-white text-sm text-gray-700 placeholder:text-gray-400 focus:border-[rgb(5,117,204)] focus:ring-1 focus:ring-blue-100"
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

      {editingClientId !== null && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900">Edit description</p>
          <textarea
            rows={4}
            value={editingDescription}
            onChange={(event) => setEditingDescription(event.target.value)}
            placeholder="Client description"
            className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDescription}
              disabled={savingDescription}
              className="h-9 rounded-md bg-[rgb(5,117,204)] px-4 text-sm font-medium text-white hover:bg-[rgb(0,97,170)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingDescription ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancelEditDescription}
              disabled={savingDescription}
              className="h-9 rounded-md border border-gray-300 px-4 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search clients..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex-1 h-10 px-3 border border-gray-200 rounded-md outline-none text-sm text-gray-700 bg-white placeholder:text-gray-400 focus:border-[rgb(5,117,204)] focus:ring-1 focus:ring-blue-100"
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
