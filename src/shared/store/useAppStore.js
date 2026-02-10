import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const LEGACY_ACTIVE_ORG_ID_KEY = 'activeOrganizationId'
const LEGACY_ACTIVE_ORG_NAME_KEY = 'activeOrganizationName'

const getLegacyActiveOrgId = () => {
  try {
    return localStorage.getItem(LEGACY_ACTIVE_ORG_ID_KEY) || null
  } catch {
    return null
  }
}

const getLegacyActiveOrgName = () => {
  try {
    return localStorage.getItem(LEGACY_ACTIVE_ORG_NAME_KEY) || null
  } catch {
    return null
  }
}

const syncLegacyActiveOrg = ({ id, name }) => {
  try {
    if (!id) {
      localStorage.removeItem(LEGACY_ACTIVE_ORG_ID_KEY)
      localStorage.removeItem(LEGACY_ACTIVE_ORG_NAME_KEY)
      return
    }
    localStorage.setItem(LEGACY_ACTIVE_ORG_ID_KEY, String(id))
    if (typeof name === 'string') {
      localStorage.setItem(LEGACY_ACTIVE_ORG_NAME_KEY, name)
    }
  } catch {
    // ignore
  }
}

export const useAppStore = create(
  persist(
    (set) => ({
      activeOrganizationId: getLegacyActiveOrgId(),
      activeOrganizationName: getLegacyActiveOrgName(),
      setActiveOrganization: ({ id, name }) => {
        const nextId = id ? String(id) : null
        const nextName = typeof name === 'string' ? name : null
        syncLegacyActiveOrg({ id: nextId, name: nextName })
        set({ activeOrganizationId: nextId, activeOrganizationName: nextName })
      },
      clearActiveOrganization: () => {
        syncLegacyActiveOrg({ id: null, name: null })
        set({ activeOrganizationId: null, activeOrganizationName: null })
      },
    }),
    {
      name: 'scalepad-app',
      partialize: (state) => ({
        activeOrganizationId: state.activeOrganizationId,
        activeOrganizationName: state.activeOrganizationName,
      }),
    }
  )
)

