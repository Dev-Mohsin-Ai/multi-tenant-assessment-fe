import React from 'react'
import { FiCheckCircle, FiInfo, FiXCircle } from 'react-icons/fi'

const TOAST_VARIANTS = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: FiCheckCircle,
  },
  error: {
    wrapper: 'border-red-200 bg-red-50 text-red-800',
    icon: FiXCircle,
  },
  info: {
    wrapper: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: FiInfo,
  },
}

const ToastMessage = ({ toast, onClose }) => {
  if (!toast?.message) {
    return null
  }

  const variant = TOAST_VARIANTS[toast.type] || TOAST_VARIANTS.info
  const Icon = variant.icon

  return (
    <div className="pointer-events-none fixed right-5 top-20 z-[95]">
      <div
        className={`pointer-events-auto flex min-w-[280px] max-w-sm items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-lg ${variant.wrapper}`}
        role="status"
        aria-live="polite"
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{toast.message}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-1 text-xs hover:bg-black/10"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default ToastMessage
