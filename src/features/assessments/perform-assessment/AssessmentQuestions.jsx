import React, { useState } from 'react'
import {
  FiChevronDown,
  FiChevronUp,
  FiList,
  FiLayers,
  FiMessageSquare,
} from 'react-icons/fi'

const AssessmentQuestions = ({
  categories,
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
  handleSaveComment,
  handleDeleteComment,
  savingItems,
  savingCommentItems,
  isCompleted,
  isReadOnly,
  getBadgeClasses,
}) => {
  const [commentUiByItem, setCommentUiByItem] = useState({})

  const getCommentUi = (itemId) =>
    commentUiByItem[itemId] || {
      open: false,
      type: null,
      showTypePicker: false,
      isEditing: false,
      forceEditNextSelection: false,
    }

  const handleCommentIconClick = (itemId) => {
    if (isCompleted || isReadOnly) {
      return
    }
    setExpandedItems((prev) => {
      const next = new Set(prev)
      next.add(itemId)
      return next
    })
    setCommentUiByItem((prev) => {
      const current = prev[itemId] || {
        open: false,
        type: null,
        showTypePicker: false,
        isEditing: false,
        forceEditNextSelection: false,
      }
      if (current.open) {
        return {
          ...prev,
          [itemId]: {
            ...current,
            open: false,
            showTypePicker: false,
            isEditing: false,
            forceEditNextSelection: false,
          },
        }
      }
      if (!current.type) {
        return {
          ...prev,
          [itemId]: {
            ...current,
            open: true,
            showTypePicker: true,
            isEditing: false,
            forceEditNextSelection: false,
          },
        }
      }
      return {
        ...prev,
        [itemId]: {
          ...current,
          open: true,
          showTypePicker: false,
          isEditing: false,
          forceEditNextSelection: false,
        },
      }
    })
  }

  const handleCommentTypeSelect = (itemId, type, hasValue = false) => {
    setCommentUiByItem((prev) => {
      const current = prev[itemId] || {
        open: false,
        type: null,
        showTypePicker: false,
        isEditing: false,
        forceEditNextSelection: false,
      }
      return {
        ...prev,
        [itemId]: {
          open: true,
          type,
          showTypePicker: false,
          isEditing: current.forceEditNextSelection ? true : !hasValue,
          forceEditNextSelection: false,
        },
      }
    })
  }

  const handleCommentEdit = (itemId) => {
    setCommentUiByItem((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        open: true,
        showTypePicker: false,
        isEditing: true,
        forceEditNextSelection: false,
      },
    }))
  }

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
                        const commentUi = getCommentUi(item.id)
                        const isCommentActive = commentUi.open
                        const selectedCommentValue =
                          commentUi.type === 'publicComment'
                            ? item.publicComment || ''
                            : item.internalComment || ''
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
                                  onClick={() => handleCommentIconClick(item.id)}
                                  disabled={isCompleted || isReadOnly}
                                  className={`h-8 w-8 rounded-md border inline-flex items-center justify-center ${
                                    isCommentActive
                                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                                      : 'border-gray-200 bg-white hover:text-gray-600'
                                  } disabled:cursor-not-allowed disabled:opacity-60`}
                                  aria-label="Comments"
                                >
                                  <FiMessageSquare className="mx-auto" />
                                </button>
                              </div>
                            </div>

                            {isItemOpen && (
                              <div className="border-t border-gray-200 bg-white">
                                {commentUi.open && (
                                  <div className="border-b border-gray-200 px-4 py-3">
                                    {commentUi.showTypePicker ? (
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-xs font-semibold text-gray-700">
                                          Select comment type:
                                        </p>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCommentTypeSelect(
                                              item.id,
                                              'publicComment',
                                              Boolean((item.publicComment || '').trim())
                                            )
                                          }
                                          className="rounded-md border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                                        >
                                          Public
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCommentTypeSelect(
                                              item.id,
                                              'internalComment',
                                              Boolean((item.internalComment || '').trim())
                                            )
                                          }
                                          className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                          Internal
                                        </button>
                                      </div>
                                    ) : !commentUi.isEditing &&
                                      selectedCommentValue.trim().length > 0 ? (
                                      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <p className="text-xs font-semibold text-gray-700">
                                              {commentUi.type === 'publicComment'
                                                ? 'Public Comment'
                                                : 'Internal Comment'}
                                            </p>
                                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                                              {selectedCommentValue}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              onClick={() => handleCommentEdit(item.id)}
                                              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                            >
                                              Edit
                                            </button>
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                const saved = await handleDeleteComment(
                                                  item.id,
                                                  commentUi.type
                                                )
                                                if (saved) {
                                                  setCommentUiByItem((prev) => ({
                                                    ...prev,
                                                    [item.id]: {
                                                      ...(prev[item.id] || {}),
                                                      open: true,
                                                      type: null,
                                                      showTypePicker: true,
                                                      isEditing: false,
                                                      forceEditNextSelection: false,
                                                    },
                                                  }))
                                                }
                                              }}
                                              disabled={isSavingComment || isCompleted || isReadOnly}
                                              className="rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                              Delete
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <label className="mb-1 block text-xs font-semibold text-gray-700">
                                          {commentUi.type === 'publicComment'
                                            ? 'Public Comment'
                                            : 'Internal Comment'}
                                        </label>
                                        <textarea
                                          key={`comment-${item.id}-${commentUi.type}`}
                                          autoFocus={commentUi.isEditing}
                                          value={
                                            commentUi.type === 'publicComment'
                                              ? item.publicComment || ''
                                              : item.internalComment || ''
                                          }
                                          onChange={(event) =>
                                            handleCommentChange(
                                              item.id,
                                              commentUi.type,
                                              event.target.value
                                            )
                                          }
                                          rows={3}
                                          disabled={isSavingComment || isCompleted || isReadOnly}
                                          className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
                                          placeholder={
                                            commentUi.type === 'publicComment'
                                              ? 'Add public comment...'
                                              : 'Add internal comment...'
                                          }
                                        />
                                        <div className="mt-2 flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              setCommentUiByItem((prev) => ({
                                                ...prev,
                                                [item.id]: {
                                                  ...(prev[item.id] || {}),
                                                  type: null,
                                                  showTypePicker: true,
                                                  isEditing: false,
                                                  forceEditNextSelection: true,
                                                },
                                              }))
                                            }
                                            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                          >
                                            Change Type
                                          </button>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              const saved = await handleSaveComment(item.id)
                                              if (saved) {
                                                setCommentUiByItem((prev) => ({
                                                  ...prev,
                                                    [item.id]: {
                                                      ...(prev[item.id] || {}),
                                                      open: true,
                                                      showTypePicker: false,
                                                      isEditing: false,
                                                      forceEditNextSelection: false,
                                                    },
                                                  }))
                                                }
                                            }}
                                            disabled={
                                              isSavingComment ||
                                              isCompleted ||
                                              isReadOnly ||
                                              selectedCommentValue.trim().length === 0
                                            }
                                            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            Save Comment
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCommentUiByItem((prev) => ({
                                                ...prev,
                                                [item.id]: {
                                                  ...(prev[item.id] || {}),
                                                  open: true,
                                                  showTypePicker: false,
                                                  isEditing: false,
                                                  forceEditNextSelection: false,
                                                },
                                              }))
                                            }}
                                            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
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
