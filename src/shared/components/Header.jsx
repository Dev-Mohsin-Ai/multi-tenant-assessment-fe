import React, { useEffect, useState } from 'react'
import HeaderLogo from '../../assets/HeaderLogo.png'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import {
  clearAuthSession,
  hasAuthToken,
  hasResolvedAdminAccess,
  refreshCurrentUserSession,
  isCurrentUserAdmin,
} from '../utils/authSession'

const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const clearActiveOrganization = useAppStore((state) => state.clearActiveOrganization)
  const hasToken = hasAuthToken()
  const [resolvedAdmin, setResolvedAdmin] = useState(() => (hasToken ? isCurrentUserAdmin() : false))
  const showLogout = hasToken && location.pathname.startsWith('/clients/select')
  const showAdmin = hasToken && resolvedAdmin

  useEffect(() => {
    let isActive = true

    if (!hasToken || hasResolvedAdminAccess()) {
      return undefined
    }

    refreshCurrentUserSession().then((allowed) => {
      if (isActive) {
        setResolvedAdmin(Boolean(allowed))
      }
    })

    return () => {
      isActive = false
    }
  }, [hasToken])

  const handleLogout = () => {
    clearAuthSession()
    clearActiveOrganization?.()
    navigate('/login')
  }

  return (
    <header className="fixed top-0 z-30 h-10 w-full border-b border-white/10 bg-[rgb(12,19,34)] text-white shadow-sm">
      <div className="flex h-full items-center justify-between px-3 md:px-5">
        <div
          className="flex items-center gap-1.5 cursor-pointer"
          onClick={() => navigate('/clients/select')}
        >
          <img src={HeaderLogo} alt="Atlas" className="h-9 w-9 shrink-0 object-contain" />
          <div className="text-[15px] font-semibold tracking-wide text-white/95">
            Atlas
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showAdmin ? (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 rounded px-2 py-1"
            >
              Admin
            </button>
          ) : null}
          {showLogout ? (
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 rounded px-2 py-1"
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export default Header
