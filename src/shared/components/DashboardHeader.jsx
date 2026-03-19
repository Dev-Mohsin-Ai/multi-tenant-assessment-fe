import React, { useEffect, useState } from 'react';
import HeaderLogo from '../../assets/HeaderLogo.png'
import { useNavigate } from 'react-router-dom';
import {
  clearAuthSession,
  hasAuthToken,
  hasResolvedAdminAccess,
  refreshCurrentUserSession,
  isCurrentUserAdmin,
} from '../utils/authSession';

const DashboardHeader = () => {
  const navigate = useNavigate();
  const hasToken = hasAuthToken()
  const [resolvedAdmin, setResolvedAdmin] = useState(() => (hasToken ? isCurrentUserAdmin() : false))
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
    navigate('/login')
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-20 w-full bg-[rgb(12,19,34)] text-white border-b border-b-white/10 px-4 py-1 shadow-sm">
      {/* Mobile-only row */}
      <div className="flex items-center justify-between md:hidden h-12">
        <div className="flex items-center gap-1.5">
          <div className="h-16 w-16">
            <img
              src={HeaderLogo}
              alt="Atlas"
              className="h-full w-full cursor-pointer object-contain"
            />
          </div>
          <h1
            onClick={() => navigate('/clients/select')}
            className="text-lg font-semibold cursor-pointer whitespace-nowrap tracking-wide"
          >
            Atlas
          </h1>
        </div>
        {showAdmin ? (
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="text-xs font-medium text-white/80 hover:text-white border border-white/20 rounded px-2 py-1"
          >
            Admin
          </button>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs font-medium text-white/80 hover:text-white border border-white/20 rounded px-2 py-1"
        >
          Logout
        </button>
      </div>

      {/* Desktop row (original layout) */}
      <div className="hidden md:flex justify-between items-center h-12">
        <div className="flex items-center gap-1.5">
          <div className="h-9 w-9 shrink-0">
            <img
              src={HeaderLogo}
              alt="Atlas"
              className="h-full w-full cursor-pointer object-contain"
            />
          </div>

          <h1
            onClick={() => navigate('/clients/select')}
            className="text-lg font-semibold cursor-pointer whitespace-nowrap tracking-wide"
          >
            Atlas
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {showAdmin ? (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="text-xs font-medium text-white/80 hover:text-white border border-white/20 rounded px-2 py-1"
            >
              Admin
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-medium text-white/80 hover:text-white border border-white/20 rounded px-2 py-1"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
