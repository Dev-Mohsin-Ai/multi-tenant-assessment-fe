const TOKEN_KEY = 'token'
const USER_KEY = 'authUser'
const IS_ADMIN_KEY = 'isAdmin'
const DEFAULT_BASE_URL = 'https://multi-assessment-pro-be-production.up.railway.app'
const IS_ACTIVE_KEY = 'isActive'

const resolveAdminFlag = (source) => {
  if (!source || typeof source !== 'object') {
    return null
  }
  const directValue =
    source.is_admin ??
    source.isAdmin ??
    source.admin

  if (typeof directValue === 'boolean') {
    return directValue
  }

  const role = source.role ?? source.user_role ?? source.userRole
  if (typeof role === 'string') {
    return role.toLowerCase() === 'admin'
  }

  const roles = source.roles
  if (Array.isArray(roles)) {
    return roles.some((item) => String(item).toLowerCase() === 'admin')
  }

  return null
}

const resolveBooleanFlag = (value) => {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') {
      return true
    }
    if (normalized === 'false') {
      return false
    }
  }
  return null
}

export const persistAuthSession = (data = {}) => {
  const token = data.access_token ?? data.token ?? null
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }

  // `/auth/me` is the single source of truth for current-user role/state.
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(IS_ADMIN_KEY)
  localStorage.removeItem(IS_ACTIVE_KEY)
}

export const clearAuthSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(IS_ADMIN_KEY)
  localStorage.removeItem(IS_ACTIVE_KEY)
}

export const hasAuthToken = () => Boolean(localStorage.getItem(TOKEN_KEY))

export const hasResolvedAdminAccess = () => localStorage.getItem(IS_ADMIN_KEY) !== null

export const isCurrentUserAdmin = () => {
  const stored = localStorage.getItem(IS_ADMIN_KEY)
  return stored === 'true'
}

const getBaseUrl = () => {
  const rawBaseUrl = import.meta.env.VITE_API_URL || DEFAULT_BASE_URL
  const isLocalBackendUrl =
    /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/)?$/i.test(rawBaseUrl)

  return import.meta.env.DEV && isLocalBackendUrl ? '/api' : rawBaseUrl
}

export const refreshCurrentUserSession = async () => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(IS_ADMIN_KEY)
    localStorage.removeItem(IS_ACTIVE_KEY)
    return false
  }

  try {
    const response = await fetch(`${getBaseUrl()}/auth/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      localStorage.setItem(USER_KEY, JSON.stringify(data || {}))
      const isAdmin = resolveAdminFlag(data)
      const isActive = resolveBooleanFlag(data?.is_active)
      if (typeof isAdmin === 'boolean') {
        localStorage.setItem(IS_ADMIN_KEY, isAdmin ? 'true' : 'false')
      } else {
        localStorage.removeItem(IS_ADMIN_KEY)
      }
      if (typeof isActive === 'boolean') {
        localStorage.setItem(IS_ACTIVE_KEY, isActive ? 'true' : 'false')
      } else {
        localStorage.removeItem(IS_ACTIVE_KEY)
      }
      return isAdmin === true
    }

    if (response.status === 401) {
      clearAuthSession()
      return false
    }

    localStorage.removeItem(IS_ADMIN_KEY)
    return false
  } catch {
    localStorage.removeItem(IS_ADMIN_KEY)
    return false
  }
}
