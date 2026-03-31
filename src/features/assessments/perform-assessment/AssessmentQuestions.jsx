import React, { useEffect, useRef, useState } from 'react'
import {
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiList,
  FiLayers,
  FiMessageSquare,
  FiPlus,
  FiTrash2,
  FiX,
} from 'react-icons/fi'

const COMMENT_FIELDS = ['publicComment', 'internalComment']

const AssessmentQuestions = ({
  categories,
  pendingComments,
  expandedSections,
  expandedItems,
  toggleSection,
  toggleAllSections,
  toggleAllItems,
  allSectionsExpanded,
  allItemsExpanded,
  setExpandedItems,
  selections,
  handleSelect,
  handleCommentChange,
  handleResetCommentDraft,
  handleSaveComment,
  handleDeleteComment,
  savingItems,
  savingCommentItems,
  isCompleted,
  isReadOnly,
  getBadgeClasses,
}) => {
  const [commentUiByItem, setCommentUiByItem] = useState({})
  const commentInputRefs = useRef({})

  const getCommentUi = (itemId) =>
    commentUiByItem[itemId] || {
      open: false,
      editing: {
        publicComment: false,
        internalComment: false,
      },
    }

  const getSavedCommentValue = (item, type) =>
    type === 'publicComment' ? item?.publicComment || '' : item?.internalComment || ''

  const getDraftCommentValue = (itemId, type, fallbackValue = '') => {
    const itemDraft = pendingComments?.[itemId]
    if (itemDraft && Object.prototype.hasOwnProperty.call(itemDraft, type)) {
      return itemDraft[type] || ''
    }
    return fallbackValue
  }

  const getCommentLabel = (type) =>
    type === 'publicComment' ? 'Public Comment' : 'Internal Comment'

  const getCommentShortLabel = (type) =>
    type === 'publicComment' ? 'Public' : 'Internal'

  const getCommentPlaceholder = (type) =>
    type === 'publicComment' ? 'Add public comment...' : 'Add internal comment...'

  const getCommentStats = (item) => {
    const hasPublicComment = Boolean(getSavedCommentValue(item, 'publicComment').trim())
    const hasInternalComment = Boolean(getSavedCommentValue(item, 'internalComment').trim())
    const commentCount = [hasPublicComment, hasInternalComment].filter(Boolean).length
    const missingTypes = COMMENT_FIELDS.filter((field) => !getSavedCommentValue(item, field).trim())

    return {
      hasPublicComment,
      hasInternalComment,
      commentCount,
      missingTypes,
    }
  }

  const handleCommentIconClick = (item) => {
    const itemId = item?.id
    if (!itemId) {
      return
    }
    if (isCompleted || isReadOnly) {
      return
    }
    setExpandedItems((prev) => {
      const next = new Set(prev)
      next.add(itemId)
      return next
    })
    setCommentUiByItem((prev) => {
      const current = prev[itemId] || getCommentUi(itemId)
      if (current.open) {
        return {
          ...prev,
          [itemId]: {
            ...current,
            open: false,
            editing: {
              publicComment: false,
              internalComment: false,
            },
          },
        }
      }
      return {
        ...prev,
        [itemId]: {
          ...current,
          open: true,
          editing: {
            publicComment: false,
            internalComment: false,
          },
        },
      }
    })
  }

  const handleCommentEdit = (itemId, field) => {
    if (!itemId) {
      return
    }
    setCommentUiByItem((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || getCommentUi(itemId)),
        open: true,
        editing: {
          publicComment: false,
          internalComment: false,
          [field]: true,
        },
      },
    }))
  }

  const handleCommentCancel = (itemId, field) => {
    handleResetCommentDraft?.(itemId, field)
    setCommentUiByItem((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || getCommentUi(itemId)),
        open: true,
        editing: {
          ...(prev[itemId]?.editing || {}),
          [field]: false,
        },
      },
    }))
  }

  useEffect(() => {
    Object.entries(commentUiByItem).forEach(([itemId, ui]) => {
      if (!ui?.open) {
        return
      }
      COMMENT_FIELDS.forEach((field) => {
        if (!ui?.editing?.[field]) {
          return
        }
        const key = `${itemId}:${field}`
        const input = commentInputRefs.current[key]
        if (!input) {
          return
        }
        window.requestAnimationFrame(() => {
          input.focus()
          const length = input.value?.length ?? 0
          if (typeof input.setSelectionRange === 'function') {
            input.setSelectionRange(length, length)
          }
        })
      })
    })
  }, [commentUiByItem])

  return (
    <>
      <div className="px-4 py-4 md:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleAllSections}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <FiLayers className="text-base" />
            {allSectionsExpanded ? 'Collapse all categories' : 'Expand all categories'}
          </button>
          <button
            type="button"
            onClick={toggleAllItems}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <FiList className="text-base" />
            {allItemsExpanded ? 'Collapse all items' : 'Expand all items'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2"
          >
            Show comparison
          </button>
        </div>
      </div>

      <div className="px-4 pb-6 md:px-6 space-y-4">
        {categories.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            This assessment has no categories.
          </div>
        ) : (
          categories.map((section) => {
            const isOpen = expandedSections.has(section.id)
            return (
              <div key={section.id} className="rounded-md border border-gray-200">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full text-left p-4 bg-gray-100 hover:bg-gray-200 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-gray-600">
                      {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {section.title}
                      </h3>
                      {section.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-200 px-4 pb-4">
                    <div className="mt-4 space-y-4">
                      {section.subcategories.map((item) => {
                        const isItemOpen = expandedItems.has(item.id)
                        const isSaving = savingItems.has(item.id)
                        const isSavingComment =
                          savingCommentItems.has(item.id) ||
                          savingCommentItems.has(String(item.id))
                        const { commentCount, missingTypes } = getCommentStats(item)
                        const commentUi = getCommentUi(item.id)
                        const isCommentActive = commentUi.open
                        return (
                          <div
                            key={item.id}
                            data-response-id={item.id}
                            className="rounded-md border border-gray-200"
                          >
                            <div className="w-full px-4 py-3 bg-white hover:bg-gray-50 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedItems((prev) => {
                                    const next = new Set(prev)
                                    if (next.has(item.id)) {
                                      next.delete(item.id)
                                    } else {
                                      next.add(item.id)
                                    }
                                    return next
                                  })
                                }}
                                className="flex flex-1 items-start gap-3 text-left"
                              >
                                <span className="mt-1 text-gray-600">
                                  {isItemOpen ? <FiChevronUp /> : <FiChevronDown />}
                                </span>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    {item.title}
                                  </h4>
                                  {item.description && (
                                    <p className="mt-1 text-xs text-gray-600">
                                      {item.description}
                                    </p>
                                  )}
                                  {isSaving && (
                                    <p className="mt-1 text-xs text-gray-400">
                                      Saving response...
                                    </p>
                                  )}
                                  {isSavingComment && (
                                    <p className="mt-1 text-xs text-gray-400">
                                      Saving comments...
                                    </p>
                                  )}
                                </div>
                              </button>
                              <div className="flex items-center gap-2 text-gray-400">
                                <button
                                  type="button"
                                  onClick={() => handleCommentIconClick(item)}
                                  disabled={isCompleted || isReadOnly}
                                  className={`relative inline-flex h-8 w-8 items-center justify-center rounded-md border ${
                                    isCommentActive
                                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                                      : 'border-gray-200 bg-white hover:text-gray-600'
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                  aria-label={
                                    commentCount > 0
                                      ? `Comments (${commentCount})`
                                      : 'Comments'
                                  }
                                >
                                  <FiMessageSquare className="mx-auto" />
                                  {commentCount > 0 ? (
                                    <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold leading-none text-white">
                                      {commentCount}
                                    </span>
                                  ) : null}
                                </button>
                              </div>
                            </div>

                            {isItemOpen && (
                              <div className="border-t border-gray-200 bg-white">
                                {commentUi.open && (
                                  <div className="border-b border-gray-200 px-4 py-3">
                                    {(() => {
                                      const addableTypes = missingTypes.filter(
                                        (field) => !commentUi.editing?.[field]
                                      )
                                      const visibleCommentFields = COMMENT_FIELDS.filter((field) => {
                                        const value = getSavedCommentValue(item, field)
                                        return value.trim().length > 0 || Boolean(commentUi.editing?.[field])
                                      })

                                      return (
                                        <>
                                    <div className="flex items-center justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-900">Comments</p>
                                      </div>
                                    </div>

                                    {addableTypes.length > 0 && (
                                      <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-medium text-gray-500">Add comment</span>
                                        {addableTypes.map((field) => (
                                          <button
                                            key={`add-${item.id}-${field}`}
                                            type="button"
                                            onClick={() => handleCommentEdit(item.id, field)}
                                            disabled={isSavingComment || isCompleted || isReadOnly}
                                            className="inline-flex h-8 items-center gap-1 rounded-md border border-gray-300 bg-white px-3 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            <FiPlus className="h-3.5 w-3.5" />
                                            {getCommentShortLabel(field)}
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {visibleCommentFields.length > 0 ? (
                                      <div className="mt-3 space-y-2">
                                        {visibleCommentFields.map((field) => {
                                          const savedValue = getSavedCommentValue(item, field)
                                          const draftValue = getDraftCommentValue(item.id, field, savedValue)
                                          const isEditingField = Boolean(commentUi.editing?.[field])

                                          return (
                                            <div
                                              key={`comment-card-${item.id}-${field}`}
                                              className="rounded-lg border border-gray-200 bg-gray-50 p-2.5"
                                            >
                                              <div className="mb-2 flex items-center justify-between gap-2">
                                                <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                                                  {getCommentLabel(field)}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                  {isEditingField ? (
                                                    <>
                                                      <button
                                                        type="button"
                                                        onClick={async () => {
                                                          const saved = await handleSaveComment(item.id)
                                                          if (saved) {
                                                            handleCommentCancel(item.id, field)
                                                          }
                                                        }}
                                                        disabled={
                                                          isSavingComment ||
                                                          isCompleted ||
                                                          isReadOnly ||
                                                          draftValue.trim().length === 0
                                                        }
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                        aria-label={`Save ${getCommentShortLabel(field)} comment`}
                                                        title="Save"
                                                      >
                                                        <FiCheck className="h-3.5 w-3.5" />
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleCommentCancel(item.id, field)}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                                        aria-label={`Cancel ${getCommentShortLabel(field)} comment changes`}
                                                        title="Cancel"
                                                      >
                                                        <FiX className="h-3.5 w-3.5" />
                                                      </button>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleCommentEdit(item.id, field)}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                                        aria-label={`Edit ${getCommentShortLabel(field)} comment`}
                                                        title="Edit"
                                                      >
                                                        <FiEdit2 className="h-3.5 w-3.5" />
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={async () => {
                                                          await handleDeleteComment(item.id, field)
                                                        }}
                                                        disabled={isSavingComment || isCompleted || isReadOnly}
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                        aria-label={`Delete ${getCommentShortLabel(field)} comment`}
                                                        title="Delete"
                                                      >
                                                        <FiTrash2 className="h-3.5 w-3.5" />
                                                      </button>
                                                    </>
                                                  )}
                                                </div>
                                              </div>

                                              {isEditingField ? (
                                                <div>
                                                  <textarea
                                                    key={`comment-${item.id}-${field}`}
                                                    ref={(node) => {
                                                      const key = `${item.id}:${field}`
                                                      if (node) {
                                                        commentInputRefs.current[key] = node
                                                      } else {
                                                        delete commentInputRefs.current[key]
                                                      }
                                                    }}
                                                    value={draftValue}
                                                    onChange={(event) =>
                                                      handleCommentChange(item.id, field, event.target.value)
                                                    }
                                                    rows={3}
                                                    disabled={isSavingComment || isCompleted || isReadOnly}
                                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                                                    placeholder={getCommentPlaceholder(field)}
                                                  />
                                                </div>
                                              ) : (
                                                <div>
                                                  <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
                                                    {savedValue}
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    ) : null}
                                        </>
                                      )
                                    })()}
                                  </div>
                                )}

                                {item.responseOptions.length === 0 ? (
                                  <div className="px-4 py-3 text-xs text-gray-500">
                                    No response options configured.
                                  </div>
                                ) : (
                                  <div className="divide-y divide-gray-200">
                                    {item.responseOptions.map((option) => (
                                      <label
                                        key={`${item.id}-${option.id}`}
                                        className="grid grid-cols-1 sm:grid-cols-[32px_auto_1fr] items-start gap-4 px-4 py-3 text-sm"
                                      >
                                        <span className="pt-1">
                                          <input
                                            type="radio"
                                            name={`response-${item.id}`}
                                            className="h-4 w-4"
                                            checked={selections[item.id] === option.id}
                                            onChange={() => {
                                              handleSelect(item.id, option.id)
                                            }}
                                            disabled={isSaving || isCompleted || isReadOnly}
                                          />
                                        </span>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getBadgeClasses(option.label)}`}>
                                          {option.label}
                                        </span>
                                        <span className="text-sm text-gray-700">
                                          {option.description || 'No description provided.'}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </>
  )
}

export default AssessmentQuestions
