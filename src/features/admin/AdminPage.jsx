import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WorkspaceLayout from '../../shared/components/WorkspaceLayout'
import AppSelect from '../../shared/components/AppSelect'
import ToastMessage from '../../shared/components/ToastMessage'
import { getOrganizationById, getOrganizations } from '../../shared/services/organizationService'
import {
  addUserToOrganization,
  getAdminUsers,
  removeUserFromOrganization,
} from '../../shared/services/adminService'

const toUserId = (value) => {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

const getUserFromRecord = (record) => {
  if (!record || typeof record !== 'object') {
    return null
  }
  const nested = record.user && typeof record.user === 'object' ? record.user : null
  const source = nested || record
  const id = source.id ?? source.user_id ?? record.user_id
  if (id === null || id === undefined) {
    return null
  }
  return {
    id: Number(id),
    email: source.email || record.email || '',
    full_name: source.full_name || source.name || record.full_name || '',
    is_active:
      source.is_active ?? record.is_active ?? true,
    is_admin:
      source.is_admin ?? record.is_admin ?? false,
    created_at: source.created_at || record.created_at || null,
  }
}

const extractOrganizationUsers = (organization) => {
  if (!organization || typeof organization !== 'object') {
    return []
  }
  const buckets = [
    organization.users,
    organization.members,
    organization.organization_users,
    organization.user_memberships,
  ]
  const users = []
  buckets.forEach((bucket) => {
    if (!Array.isArray(bucket)) {
      return
    }
    bucket.forEach((record) => {
      const user = getUserFromRecord(record)
      if (user) {
        users.push(user)
      }
    })
  })
  return users
}

const extractOrganizationUserIds = (organization) => {
  const ids = new Set()
  extractOrganizationUsers(organization).forEach((user) => {
    ids.add(toUserId(user.id))
  })

  const buckets = [
    organization?.user_ids,
    organization?.member_ids,
    organization?.organization_user_ids,
  ]
  buckets.forEach((bucket) => {
    if (!Array.isArray(bucket)) {
      return
    }
    bucket.forEach((value) => {
      const id = toUserId(value)
      if (id) {
        ids.add(id)
      }
    })
  })

  return Array.from(ids)
}

const buildErrorMessage = (fallback, err) => {
  const status = err?.response?.status
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) {
    return `${fallback} (${status ?? 'error'}): ${detail}`
  }
  if (status) {
    return `${fallback} (HTTP ${status})`
  }
  return fallback
}

const formatDate = (value) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return date.toLocaleDateString()
}

const SELECTED_CLIENT_STORAGE_KEY = 'adminSelectedClientId'
const MEMBERSHIP_CACHE_STORAGE_KEY = 'adminClientMembershipById'

const readMembershipCache = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(MEMBERSHIP_CACHE_STORAGE_KEY) || '{}')
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }
    const sanitized = {}
    Object.entries(parsed).forEach(([organizationId, userIds]) => {
      if (!Array.isArray(userIds)) {
        return
      }
      const normalized = Array.from(new Set(userIds.map((id) => toUserId(id)).filter(Boolean)))
      sanitized[toUserId(organizationId)] = normalized
    })
    return sanitized
  } catch {
    return {}
  }
}

const writeMembershipCache = (value) => {
  try {
    localStorage.setItem(MEMBERSHIP_CACHE_STORAGE_KEY, JSON.stringify(value || {}))
  } catch {
    // ignore storage failures
  }
}

const AdminPage = () => {
  const [organizations, setOrganizations] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [organizationUsersById, setOrganizationUsersById] = useState(() => readMembershipCache())
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(() => {
    try {
      return localStorage.getItem(SELECTED_CLIENT_STORAGE_KEY) || ''
    } catch {
      return ''
    }
  })
  const [selectedNewUserId, setSelectedNewUserId] = useState('')
  const [selectedRemoveUserId, setSelectedRemoveUserId] = useState('')
  const [searchOrganizations, setSearchOrganizations] = useState('')
  const [searchMembers, setSearchMembers] = useState('')
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [showRemoveUserDialog, setShowRemoveUserDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  const [runningActionKey, setRunningActionKey] = useState('')
  const [toast, setToast] = useState(null)
  const selectedOrganizationIdRef = useRef(selectedOrganizationId)

  const hydrateOrganizationUsers = useCallback((organization) => {
    const id = toUserId(organization?.id)
    if (!id) {
      return
    }

    const explicitUsers = extractOrganizationUsers(organization)
    const explicitIds = extractOrganizationUserIds(organization)

    if (explicitUsers.length > 0) {
      setAllUsers((prev) => {
        const byId = new Map(prev.map((user) => [toUserId(user.id), user]))
        explicitUsers.forEach((user) => {
          byId.set(toUserId(user.id), user)
        })
        return Array.from(byId.values())
      })
    }

    if (explicitIds.length > 0) {
      setOrganizationUsersById((prev) => ({ ...prev, [id]: explicitIds }))
      return
    }

    if (explicitUsers.length > 0) {
      setOrganizationUsersById((prev) => ({
        ...prev,
        [id]: explicitUsers.map((user) => toUserId(user.id)),
      }))
      return
    }

    setOrganizationUsersById((prev) => {
      if (Object.prototype.hasOwnProperty.call(prev, id)) {
        return prev
      }
      return { ...prev, [id]: [] }
    })
  }, [])

  const loadOrganizationDetails = useCallback(async (organizationId) => {
    if (!organizationId) {
      return
    }
    setMembersLoading(true)
    try {
      const details = await getOrganizationById(Number(organizationId))
      hydrateOrganizationUsers(details)
    } catch {
      // If endpoint doesn't return members in this environment, keep existing mapping.
    } finally {
      setMembersLoading(false)
    }
  }, [hydrateOrganizationUsers])

  const loadPageData = useCallback(async () => {
    setLoading(true)
    try {
      const [organizationsData, usersData] = await Promise.all([getOrganizations(), getAdminUsers()])
      const organizationsList = Array.isArray(organizationsData)
        ? organizationsData
        : organizationsData?.organizations || []
      const usersList = Array.isArray(usersData) ? usersData : []

      setOrganizations(organizationsList)
      setAllUsers(usersList)

      organizationsList.forEach((organization) => hydrateOrganizationUsers(organization))

      const detailsResults = await Promise.allSettled(
        organizationsList.map((organization) => getOrganizationById(Number(organization.id)))
      )
      detailsResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          hydrateOrganizationUsers(result.value)
        }
      })

      const firstOrganizationId = toUserId(organizationsList[0]?.id)
      const previousSelectedId = toUserId(selectedOrganizationIdRef.current)
      const hasPreviousSelection = organizationsList.some(
        (organization) => toUserId(organization.id) === previousSelectedId
      )
      const nextSelectedId = hasPreviousSelection ? previousSelectedId : firstOrganizationId
      setSelectedOrganizationId(nextSelectedId)
      if (nextSelectedId) {
        await loadOrganizationDetails(nextSelectedId)
      }
    } catch (err) {
      setToast({ type: 'error', message: buildErrorMessage('Unable to load admin data', err) })
    } finally {
      setLoading(false)
    }
  }, [hydrateOrganizationUsers, loadOrganizationDetails])

  useEffect(() => {
    loadPageData()
  }, [loadPageData])

  useEffect(() => {
    selectedOrganizationIdRef.current = selectedOrganizationId
    try {
      if (selectedOrganizationId) {
        localStorage.setItem(SELECTED_CLIENT_STORAGE_KEY, selectedOrganizationId)
      } else {
        localStorage.removeItem(SELECTED_CLIENT_STORAGE_KEY)
      }
    } catch {
      // ignore storage failures
    }
  }, [selectedOrganizationId])

  useEffect(() => {
    writeMembershipCache(organizationUsersById)
  }, [organizationUsersById])

  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const selectedOrganization = useMemo(
    () =>
      organizations.find((organization) => toUserId(organization.id) === toUserId(selectedOrganizationId)) ||
      null,
    [organizations, selectedOrganizationId]
  )

  const filteredOrganizations = useMemo(() => {
    const query = searchOrganizations.trim().toLowerCase()
    if (!query) {
      return organizations
    }
    return organizations.filter((organization) => {
      const name = String(organization.name || '').toLowerCase()
      const description = String(organization.description || '').toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }, [organizations, searchOrganizations])

  const selectedOrganizationUserIds = useMemo(() => {
    const key = toUserId(selectedOrganizationId)
    return organizationUsersById[key] || []
  }, [organizationUsersById, selectedOrganizationId])

  const organizationMembers = useMemo(() => {
    const userMap = new Map(allUsers.map((user) => [toUserId(user.id), user]))
    const usersFromIds = selectedOrganizationUserIds
      .map((id) => userMap.get(toUserId(id)))
      .filter(Boolean)

    if (usersFromIds.length > 0) {
      return usersFromIds
    }

    return extractOrganizationUsers(selectedOrganization)
  }, [allUsers, selectedOrganizationUserIds, selectedOrganization])

  const filteredMembers = useMemo(() => {
    const query = searchMembers.trim().toLowerCase()
    if (!query) {
      return organizationMembers
    }
    return organizationMembers.filter((user) => {
      const fullName = String(user.full_name || '').toLowerCase()
      const email = String(user.email || '').toLowerCase()
      return fullName.includes(query) || email.includes(query)
    })
  }, [organizationMembers, searchMembers])

  const nonMembers = useMemo(() => {
    const memberIdSet = new Set(selectedOrganizationUserIds.map((id) => toUserId(id)))
    return allUsers.filter((user) => !memberIdSet.has(toUserId(user.id)))
  }, [allUsers, selectedOrganizationUserIds])

  const addUserOptions = useMemo(
    () =>
      nonMembers.map((user) => ({
        value: toUserId(user.id),
        label: `${user.full_name || user.email} (${user.email})`,
      })),
    [nonMembers]
  )

  const removeUserOptions = useMemo(() => {
    const source = organizationMembers.length > 0 ? organizationMembers : allUsers
    return source.map((user) => ({
      value: toUserId(user.id),
      label: `${user.full_name || user.email} (${user.email})`,
    }))
  }, [organizationMembers, allUsers])

  const onOrganizationClick = async (organizationId) => {
    const id = toUserId(organizationId)
    setSelectedOrganizationId(id)
    setSearchMembers('')
    setSelectedNewUserId('')
    setSelectedRemoveUserId('')
    setShowAddUserDialog(false)
    setShowRemoveUserDialog(false)
    await loadOrganizationDetails(id)
  }

  const runAction = async (actionKey, successMessage, request, optimisticUpdate) => {
    setRunningActionKey(actionKey)
    try {
      await request()
      if (typeof optimisticUpdate === 'function') {
        optimisticUpdate()
      }
      if (selectedOrganizationId) {
        await loadOrganizationDetails(selectedOrganizationId)
      }
      setToast({ type: 'success', message: successMessage })
    } catch (err) {
      setToast({ type: 'error', message: buildErrorMessage('Action failed', err) })
    } finally {
      setRunningActionKey('')
    }
  }

  const handleRemoveUser = async (userId) => {
    const organizationId = Number(selectedOrganizationId)
    if (!organizationId || !userId) {
      return
    }
    await runAction(
      `${selectedOrganizationId}:${userId}:remove`,
      'User removed from client.',
      () => removeUserFromOrganization(Number(userId), organizationId),
      () => {
        setOrganizationUsersById((prev) => ({
          ...prev,
          [selectedOrganizationId]: (prev[selectedOrganizationId] || []).filter(
            (id) => toUserId(id) !== toUserId(userId)
          ),
        }))
      }
    )
  }

  const handleAddUser = async () => {
    const organizationId = Number(selectedOrganizationId)
    const userId = Number(selectedNewUserId)
    if (!organizationId || !userId) {
      setToast({ type: 'error', message: 'Select a user to add.' })
      return
    }
    await runAction(
      `${selectedOrganizationId}:${selectedNewUserId}:add`,
      'User added to client.',
      () => addUserToOrganization(userId, organizationId),
      () => {
        setOrganizationUsersById((prev) => {
          const current = prev[selectedOrganizationId] || []
          if (current.some((id) => toUserId(id) === toUserId(userId))) {
            return prev
          }
          return { ...prev, [selectedOrganizationId]: [...current, toUserId(userId)] }
        })
        setSelectedNewUserId('')
        setShowAddUserDialog(false)
      }
    )
  }

  const handleRemoveSelectedUser = async () => {
    const organizationId = Number(selectedOrganizationId)
    const userId = Number(selectedRemoveUserId)
    if (!organizationId || !userId) {
      setToast({ type: 'error', message: 'Select a user to remove.' })
      return
    }
    await runAction(
      `${selectedOrganizationId}:${selectedRemoveUserId}:remove-dialog`,
      'User removed from client.',
      () => removeUserFromOrganization(userId, organizationId),
      () => {
        setOrganizationUsersById((prev) => ({
          ...prev,
          [selectedOrganizationId]: (prev[selectedOrganizationId] || []).filter(
            (id) => toUserId(id) !== toUserId(userId)
          ),
        }))
        setSelectedRemoveUserId('')
        setShowRemoveUserDialog(false)
      }
    )
  }

  return (
    <WorkspaceLayout activeLabel="Admin" clientName="Administration" activeNavId="admin">
      <div className="bg-[rgb(248,248,250)] min-h-[calc(100vh-6rem)] rounded-tl-xl overflow-hidden">
        <div className="px-6 py-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Admin Panel</h2>
            <p className="mt-1 text-sm text-gray-600">
              Select a client to manage its users.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-5">
              <div className="lg:col-span-2 rounded-lg border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">Organizations</h3>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={searchOrganizations}
                      onChange={(event) => setSearchOrganizations(event.target.value)}
                      placeholder="Search clients..."
                      className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700"
                    />
                  </div>
                </div>
                <div className="max-h-130 overflow-auto">
                  {loading ? (
                    <div className="px-4 py-4 text-sm text-gray-500">Loading clients...</div>
                  ) : filteredOrganizations.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500">No clients found.</div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Client</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Users</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredOrganizations.map((organization) => {
                          const organizationId = toUserId(organization.id)
                          const isSelected = toUserId(selectedOrganizationId) === organizationId
                          const knownUsers = organizationUsersById[organizationId]
                          const usersCount = Array.isArray(knownUsers) ? knownUsers.length : '-'
                          return (
                            <tr
                              key={organizationId}
                              onClick={() => onOrganizationClick(organizationId)}
                              className={`cursor-pointer ${
                                isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                              }`}
                            >
                              <td className="px-4 py-2">
                                <div className="font-medium text-gray-900">
                                  {organization.name || `Organization ${organizationId}`}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-500">
                                  {organization.description || 'No description'}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-gray-700">{usersCount}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="lg:col-span-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      {selectedOrganization?.name || 'Client Users'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedOrganization
                        ? `${organizationMembers.length} user(s) associated`
                        : 'Select a client'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={searchMembers}
                      onChange={(event) => setSearchMembers(event.target.value)}
                      placeholder="Search users..."
                      disabled={!selectedOrganization}
                      className="h-9 min-w-55 rounded-md border border-gray-300 px-3 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddUserDialog(true)}
                      disabled={!selectedOrganization}
                      className="h-9 rounded-md bg-[rgb(5,117,204)] px-4 text-sm font-medium text-white hover:bg-[rgb(0,97,170)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Add User
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRemoveUserDialog(true)}
                      disabled={!selectedOrganization || removeUserOptions.length === 0}
                      className="h-9 rounded-md border border-red-300 px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Remove User
                    </button>
                  </div>
                </div>

                <div className="max-h-130 overflow-auto">
                  {!selectedOrganization ? (
                    <div className="px-4 py-5 text-sm text-gray-500">
                      Select a client to view users.
                    </div>
                  ) : membersLoading ? (
                    <div className="px-4 py-5 text-sm text-gray-500">Loading users...</div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-gray-500">No users found for this organization.</div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Role</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Created</th>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredMembers.map((user) => {
                          const userId = toUserId(user.id)
                          const rowBusy = runningActionKey.startsWith(
                            `${selectedOrganizationId}:${userId}:`
                          )
                          return (
                            <tr key={userId}>
                              <td className="px-4 py-2 text-gray-900">{user.full_name || '-'}</td>
                              <td className="px-4 py-2 text-gray-700">{user.email || '-'}</td>
                              <td className="px-4 py-2">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    user.is_active
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    user.is_admin
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  {user.is_admin ? 'Admin' : 'User'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-gray-700">{formatDate(user.created_at)}</td>
                              <td className="px-4 py-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveUser(user.id)}
                                    disabled={rowBusy}
                                    className="h-8 rounded-md border border-red-300 px-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Remove
                                  </button>
                                </div>
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
        </div>
      </div>

      {showAddUserDialog && selectedOrganization ? (
        <div className="fixed inset-0 z-1200 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-xl rounded-lg border border-gray-200 bg-white p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Add User</h3>
            <p className="mt-1 text-sm text-gray-600">
              Add a user to {selectedOrganization?.name || 'this client'}.
            </p>

            <div className="mt-4">
              <AppSelect
                options={addUserOptions}
                value={selectedNewUserId}
                onChange={(nextValue) => setSelectedNewUserId(toUserId(nextValue))}
                placeholder="Select a user..."
                className="w-full"
                isSearchable
              />
            </div>

            {addUserOptions.length === 0 ? (
              <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                All users are already part of this organization.
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddUserDialog(false)
                  setSelectedNewUserId('')
                }}
                className="h-9 rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddUser}
                disabled={!selectedNewUserId}
                className="h-9 rounded-md bg-[rgb(5,117,204)] px-4 text-sm font-medium text-white hover:bg-[rgb(0,97,170)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showRemoveUserDialog && selectedOrganization ? (
        <div className="fixed inset-0 z-1200 flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-xl rounded-lg border border-gray-200 bg-white p-5 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Remove User</h3>
            <p className="mt-1 text-sm text-gray-600">
              Remove a user from {selectedOrganization?.name || 'this client'}.
            </p>

            <div className="mt-4">
              <AppSelect
                options={removeUserOptions}
                value={selectedRemoveUserId}
                onChange={(nextValue) => setSelectedRemoveUserId(toUserId(nextValue))}
                placeholder="Select a user..."
                className="w-full"
                isSearchable
              />
            </div>

            {organizationMembers.length === 0 ? (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Membership list not returned by backend for this client. You can still try
                remove by selecting a user.
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRemoveUserDialog(false)
                  setSelectedRemoveUserId('')
                }}
                className="h-9 rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveSelectedUser}
                disabled={!selectedRemoveUserId}
                className="h-9 rounded-md border border-red-300 px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remove User
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ToastMessage toast={toast} onClose={() => setToast(null)} />
    </WorkspaceLayout>
  )
}

export default AdminPage
