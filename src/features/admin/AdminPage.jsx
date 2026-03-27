import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WorkspaceLayout from '../../shared/components/WorkspaceLayout'
import AppSelect from '../../shared/components/AppSelect'
import ToastMessage from '../../shared/components/ToastMessage'
import { getOrganizationUsers, getOrganizations } from '../../shared/services/organizationService'
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

const getErrorDetail = (err) => {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') {
    return detail.trim()
  }
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim()
        }
        if (item && typeof item === 'object' && typeof item.msg === 'string') {
          return item.msg.trim()
        }
        return ''
      })
      .filter(Boolean)
      .join('. ')
  }
  return ''
}

const isAlreadyMemberError = (err) => {
  const detail = getErrorDetail(err).toLowerCase()
  return detail.includes('already') && (detail.includes('member') || detail.includes('organization'))
}

const dedupeUsers = (users) => {
  if (!Array.isArray(users)) {
    return []
  }

  const byKey = new Map()
  users.forEach((record) => {
    const user = getUserFromRecord(record) || record
    if (!user || typeof user !== 'object') {
      return
    }

    const idKey = toUserId(user.id)
    const emailKey = String(user.email || '').trim().toLowerCase()
    const key = idKey || emailKey
    if (!key) {
      return
    }

    const previous = byKey.get(key) || {}
    byKey.set(key, {
      ...previous,
      ...user,
      id: user.id ?? previous.id ?? null,
      email: user.email || previous.email || '',
      full_name: user.full_name || previous.full_name || '',
      is_active: user.is_active ?? previous.is_active ?? true,
      is_admin: user.is_admin ?? previous.is_admin ?? false,
      created_at: user.created_at || previous.created_at || null,
    })
  })

  return Array.from(byKey.values())
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
  const [organizationUserErrorsById, setOrganizationUserErrorsById] = useState({})
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
  const [loading, setLoading] = useState(false)
  const [membersLoading, setMembersLoading] = useState(false)
  const [runningActionKey, setRunningActionKey] = useState('')
  const [toast, setToast] = useState(null)
  const selectedOrganizationIdRef = useRef(selectedOrganizationId)

  const loadOrganizationUsers = useCallback(async (organizationId) => {
    if (!organizationId) {
      return
    }
    setMembersLoading(true)
    try {
      const payload = await getOrganizationUsers(Number(organizationId))
      const users = dedupeUsers(
        Array.isArray(payload) ? payload.map((record) => getUserFromRecord(record) || record) : []
      )
      setAllUsers((prev) => {
        const byId = new Map(prev.map((user) => [toUserId(user.id), user]))
        users.forEach((user) => {
          const existing = byId.get(toUserId(user.id))
          byId.set(toUserId(user.id), {
            ...existing,
            ...user,
            id: user.id ?? existing?.id ?? null,
            email: user.email || existing?.email || '',
            full_name: user.full_name || existing?.full_name || '',
            is_active: user.is_active ?? existing?.is_active ?? true,
            is_admin: user.is_admin ?? existing?.is_admin ?? false,
            created_at: user.created_at || existing?.created_at || null,
          })
        })
        return Array.from(byId.values())
      })
      setOrganizationUsersById((prev) => ({
        ...prev,
        [toUserId(organizationId)]: users.map((user) => toUserId(user.id)),
      }))
      setOrganizationUserErrorsById((prev) => {
        const next = { ...prev }
        delete next[toUserId(organizationId)]
        return next
      })
    } catch (err) {
      setOrganizationUserErrorsById((prev) => ({
        ...prev,
        [toUserId(organizationId)]: buildErrorMessage('Unable to load users', err),
      }))
    } finally {
      setMembersLoading(false)
    }
  }, [])

  const loadPageData = useCallback(async () => {
    setLoading(true)
    try {
      const [organizationsData, usersData] = await Promise.all([getOrganizations(), getAdminUsers()])
      const organizationsList = Array.isArray(organizationsData)
        ? organizationsData
        : organizationsData?.organizations || []
      const usersList = dedupeUsers(Array.isArray(usersData) ? usersData : [])

      setOrganizations(organizationsList)
      setAllUsers(usersList)

      const firstOrganizationId = toUserId(organizationsList[0]?.id)
      const previousSelectedId = toUserId(selectedOrganizationIdRef.current)
      const hasPreviousSelection = organizationsList.some(
        (organization) => toUserId(organization.id) === previousSelectedId
      )
      const nextSelectedId = hasPreviousSelection ? previousSelectedId : firstOrganizationId
      setSelectedOrganizationId(nextSelectedId)

      const membershipResults = await Promise.allSettled(
        organizationsList.map((organization) => loadOrganizationUsers(toUserId(organization.id)))
      )
      membershipResults.forEach((result) => {
        if (result.status === 'rejected') {
          // errors are tracked per organization inside loadOrganizationUsers
        }
      })
    } catch (err) {
      setToast({ type: 'error', message: buildErrorMessage('Unable to load admin data', err) })
    } finally {
      setLoading(false)
    }
  }, [loadOrganizationUsers])

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

  const hasResolvedMembershipData = useMemo(() => {
    const key = toUserId(selectedOrganizationId)
    return Boolean(key) && Object.prototype.hasOwnProperty.call(organizationUsersById, key)
  }, [organizationUsersById, selectedOrganizationId])

  const organizationMembers = useMemo(() => {
    const userMap = new Map(allUsers.map((user) => [toUserId(user.id), user]))
    const usersFromIds = dedupeUsers(Array.from(
      new Map(
        selectedOrganizationUserIds
          .map((id) => userMap.get(toUserId(id)))
          .filter(Boolean)
          .map((user) => [toUserId(user.id), user])
      ).values()
    ))

    return usersFromIds
  }, [allUsers, selectedOrganizationUserIds])

  const selectedOrganizationUsersError = useMemo(
    () => organizationUserErrorsById[toUserId(selectedOrganizationId)] || '',
    [organizationUserErrorsById, selectedOrganizationId]
  )

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
    if (!hasResolvedMembershipData) {
      return []
    }
    const memberIdSet = new Set(selectedOrganizationUserIds.map((id) => toUserId(id)))
    return allUsers.filter((user) => !memberIdSet.has(toUserId(user.id)))
  }, [allUsers, hasResolvedMembershipData, selectedOrganizationUserIds])

  const addUserOptions = useMemo(
    () =>
      nonMembers.map((user) => ({
        value: toUserId(user.id),
        label: `${user.full_name || user.email} (${user.email})`,
      })),
    [nonMembers]
  )

  const removeUserOptions = useMemo(
    () =>
      organizationMembers.map((user) => ({
        value: toUserId(user.id),
        label: `${user.full_name || user.email} (${user.email})`,
      })),
    [organizationMembers]
  )

  const onOrganizationClick = async (organizationId) => {
    const id = toUserId(organizationId)
    setSelectedOrganizationId(id)
    setSearchMembers('')
    setSelectedNewUserId('')
    setSelectedRemoveUserId('')
    await loadOrganizationUsers(id)
  }

  const runAction = async (actionKey, successMessage, request, optimisticUpdate) => {
    setRunningActionKey(actionKey)
    try {
      await request()
      if (typeof optimisticUpdate === 'function') {
        optimisticUpdate()
      }
      if (selectedOrganizationId) {
        await loadOrganizationUsers(selectedOrganizationId)
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
    const applyLocalMembership = () => {
      setOrganizationUsersById((prev) => {
        const current = prev[selectedOrganizationId] || []
        if (current.some((id) => toUserId(id) === toUserId(userId))) {
          return prev
        }
        return { ...prev, [selectedOrganizationId]: [...current, toUserId(userId)] }
      })
      setSelectedNewUserId('')
    }

    try {
      setRunningActionKey(`${selectedOrganizationId}:${selectedNewUserId}:add`)
      await addUserToOrganization(userId, organizationId)
      applyLocalMembership()
      await loadOrganizationUsers(selectedOrganizationId)
      setToast({ type: 'success', message: 'User added to client.' })
    } catch (err) {
      if (isAlreadyMemberError(err)) {
        applyLocalMembership()
        setToast({ type: 'success', message: 'User is already a member of this client.' })
        return
      }
      setToast({ type: 'error', message: buildErrorMessage('Action failed', err) })
    } finally {
      setRunningActionKey('')
    }
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
              Manage client membership from a single workspace.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(240px,0.82fr)_minmax(0,1.95fr)]">
              <div className="rounded-lg border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">Clients</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Pick a client to review assigned users.
                  </p>
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
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Members</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredOrganizations.map((organization) => {
                          const organizationId = toUserId(organization.id)
                          const isSelected = toUserId(selectedOrganizationId) === organizationId
                          const knownUsers = organizationUsersById[organizationId]
                          const usersCount = Array.isArray(knownUsers) ? knownUsers.length : '—'
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

              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="border-b border-gray-200 px-4 py-3">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          {selectedOrganization?.name || 'Client Members'}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {selectedOrganization
                            ? selectedOrganization.description || 'No description available.'
                            : 'Select a client to view members.'}
                        </p>
                      </div>
                      <input
                        type="text"
                        value={searchMembers}
                        onChange={(event) => setSearchMembers(event.target.value)}
                        placeholder="Search users..."
                        disabled={!selectedOrganization}
                        className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100 sm:max-w-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="text-xs font-semibold text-gray-700">Add User</div>
                        <div className="mt-2">
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
                          <div className="mt-2 text-xs text-gray-600">
                            {!selectedOrganization
                              ? 'Select a client first.'
                              : !hasResolvedMembershipData
                                ? 'Unable to load users for this client.'
                                : 'All available users are already assigned to this client.'}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={handleAddUser}
                          disabled={!selectedNewUserId || !selectedOrganization || !hasResolvedMembershipData}
                          className="mt-3 h-9 w-full rounded-md bg-[rgb(5,117,204)] px-4 text-sm font-medium text-white hover:bg-[rgb(0,97,170)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Add User
                        </button>
                      </div>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <div className="text-xs font-semibold text-gray-700">Remove User</div>
                        <div className="mt-2">
                          <AppSelect
                            options={removeUserOptions}
                            value={selectedRemoveUserId}
                            onChange={(nextValue) => setSelectedRemoveUserId(toUserId(nextValue))}
                            placeholder="Select a user..."
                            className="w-full"
                            isSearchable
                          />
                        </div>
                        {removeUserOptions.length === 0 ? (
                          <div className="mt-2 text-xs text-gray-600">
                            {!selectedOrganization
                              ? 'Select a client first.'
                              : !hasResolvedMembershipData
                                ? 'Unable to load users for this client.'
                                : 'No removable members found for this client.'}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={handleRemoveSelectedUser}
                          disabled={!selectedRemoveUserId || !selectedOrganization || !hasResolvedMembershipData}
                          className="mt-3 h-9 w-full rounded-md border border-red-300 px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Remove User
                        </button>
                      </div>
                    </div>

                    {!hasResolvedMembershipData && selectedOrganization ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                        <p className="text-xs text-amber-700">
                          {selectedOrganizationUsersError || 'This client user list could not be loaded, so add and remove actions are disabled.'}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="max-h-130 overflow-y-auto overflow-x-hidden">
                  {!selectedOrganization ? (
                    <div className="px-4 py-5 text-sm text-gray-500">
                      Select a client to view members.
                    </div>
                  ) : membersLoading ? (
                    <div className="px-4 py-5 text-sm text-gray-500">Loading users...</div>
                  ) : !hasResolvedMembershipData ? (
                    <div className="px-4 py-5 text-sm text-amber-700">
                      {selectedOrganizationUsersError || 'Unable to load users for this client.'}
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-gray-500">No users found for this client.</div>
                  ) : (
                    <table className="w-full table-fixed divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 w-[21%]">Name</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 w-[24%]">Email</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 w-[13%]">Status</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 w-[11%]">Role</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 w-[15%] whitespace-nowrap">Created</th>
                          <th className="px-3 py-2 text-left font-semibold text-gray-700 w-[16%] whitespace-nowrap">Action</th>
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
                              <td className="px-3 py-2 text-gray-900 break-words">{user.full_name || '-'}</td>
                              <td className="px-3 py-2 text-gray-700 break-all">{user.email || '-'}</td>
                              <td className="px-3 py-2">
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
                              <td className="px-3 py-2">
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
                              <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{formatDate(user.created_at)}</td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUser(user.id)}
                                  disabled={rowBusy}
                                  className="h-8 rounded-md border border-red-300 px-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Remove
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
        </div>
      </div>

      <ToastMessage toast={toast} onClose={() => setToast(null)} />
    </WorkspaceLayout>
  )
}

export default AdminPage
