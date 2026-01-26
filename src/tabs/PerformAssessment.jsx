import React, { useEffect, useMemo, useState } from 'react'
import {
    FiChevronDown,
    FiChevronUp,
    FiDownload,
    FiList,
    FiLayers,
    FiArrowLeft,
    FiFileText,
    FiInfo,
    FiPaperclip,
    FiMessageSquare,
    FiSettings,
} from 'react-icons/fi'
import {
    completeAssessment,
    getAssessmentById,
    updateSubcategoryResponse,
} from '../services/assessmentService'

const toArray = (value) => (Array.isArray(value) ? value : [])

const normalizeAssessment = (data) => {
    const assessment = data?.assessment || data
    const rawCategories = toArray(
        assessment?.categories ||
        assessment?.template?.categories ||
        assessment?.template_categories ||
        assessment?.templateCategories
    )

    const categories = rawCategories.map((category, categoryIndex) => {
        const categoryId = category.id ?? `category-${categoryIndex}`
        const rawSubcategories = toArray(
            category.subcategories ||
            category.sub_categories ||
            category.items ||
            category.questions ||
            category.subcategory
        )
        const subcategories = rawSubcategories.map((subcategory, subIndex) => {
            const subcategoryId = subcategory.id ?? `${categoryId}-sub-${subIndex}`
            const rawOptions = toArray(
                subcategory.response_options ||
                subcategory.responseOptions ||
                subcategory.responses ||
                subcategory.options
            )
            const responseOptions = rawOptions.map((option, optionIndex) => ({
                id: option.id ?? `${subcategoryId}-option-${optionIndex}`,
                label:
                    option.label ||
                    option.title ||
                    option.name ||
                    option.value ||
                    option.response ||
                    `Option ${optionIndex + 1}`,
                description: option.description || option.text || option.details || '',
            }))

            return {
                id: subcategoryId,
                title:
                    subcategory.title ||
                    subcategory.name ||
                    subcategory.question ||
                    subcategory.label ||
                    `Question ${subIndex + 1}`,
                description:
                    subcategory.description ||
                    subcategory.help_text ||
                    subcategory.summary ||
                    '',
                responseOptions,
                selectedResponseId:
                    subcategory.selected_response_id ||
                    subcategory.selectedResponseId ||
                    subcategory.selected_response?.id ||
                    subcategory.selectedResponse?.id ||
                    null,
            }
        })

        return {
            id: categoryId,
            title:
                category.title ||
                category.name ||
                category.label ||
                `Category ${categoryIndex + 1}`,
            description: category.description || category.summary || '',
            subcategories,
        }
    })

    return {
        ...assessment,
        id: assessment?.id || assessment?.assessment_id,
        title: assessment?.title || assessment?.name || 'Assessment',
        status: assessment?.status,
        organizationId: assessment?.organization_id || assessment?.organizationId,
        categories,
    }
}

const formatDateLabel = (value) => {
    if (!value) {
        return ''
    }
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
        return value
    }
    return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })
}

const PerformAssessment = ({
    onBack,
    assessmentId,
    onProgress,
    onComplete,
    onLoaded,
}) => {
    const [assessment, setAssessment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [expandedSections, setExpandedSections] = useState(() => new Set())
    const [expandedItems, setExpandedItems] = useState(() => new Set())
    const [selections, setSelections] = useState({})
    const [savingItems, setSavingItems] = useState(() => new Set())
    const [isCompleting, setIsCompleting] = useState(false)

    useEffect(() => {
        let isMounted = true
        if (!assessmentId) {
            setLoading(false)
            return () => {
                isMounted = false
            }
        }

        const loadAssessment = async () => {
            setLoading(true)
            setError('')
            try {
                const data = await getAssessmentById(assessmentId)
                const normalized = normalizeAssessment(data)
                if (!isMounted) {
                    return
                }
                setAssessment(normalized)
                if (onLoaded) {
                    onLoaded(normalized)
                }
                const initialSelections = {}
                normalized.categories.forEach((category) => {
                    category.subcategories.forEach((subcategory) => {
                        if (subcategory.selectedResponseId) {
                            initialSelections[subcategory.id] = subcategory.selectedResponseId
                        }
                    })
                })
                setSelections(initialSelections)
            } catch (error) {
                console.error('Unable to load assessment:', error)
                if (isMounted) {
                    setError('Unable to load assessment')
                }
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        loadAssessment()

        return () => {
            isMounted = false
        }
    }, [assessmentId, onLoaded])

    const categories = useMemo(() => assessment?.categories || [], [assessment])
    const templateTitle =
        assessment?.template_title ||
        assessment?.templateTitle ||
        assessment?.template?.title ||
        ''
    const performedBy =
        assessment?.performed_by ||
        assessment?.performedBy ||
        assessment?.performed_by_name ||
        ''
    const assessmentDate =
        assessment?.assessment_date ||
        assessment?.assessmentDate ||
        assessment?.date ||
        ''
    const formattedAssessmentDate = formatDateLabel(assessmentDate)

    const allSectionsExpanded =
        categories.length > 0 &&
        categories.every((section) => expandedSections.has(section.id))
    const allItemsExpanded =
        categories.length > 0 &&
        categories.every((section) =>
            section.subcategories.every((item) => expandedItems.has(item.id))
        )

    const totalItems = useMemo(
        () => categories.reduce((count, category) => count + category.subcategories.length, 0),
        [categories]
    )

    const answeredCount = useMemo(
        () => Object.values(selections).filter(Boolean).length,
        [selections]
    )

    useEffect(() => {
        if (onProgress && assessmentId) {
            onProgress({ assessmentId, answered: answeredCount, total: totalItems })
        }
    }, [assessmentId, answeredCount, onProgress, totalItems])

    const toggleSection = (id) => {
        setExpandedSections((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const expandAll = () => {
        setExpandedSections(new Set(categories.map((section) => section.id)))
    }

    const expandAllItems = () => {
        setExpandedSections(new Set(categories.map((section) => section.id)))
        const allItems = new Set()
        categories.forEach((category) => {
            category.subcategories.forEach((subcategory) => {
                allItems.add(subcategory.id)
            })
        })
        setExpandedItems(allItems)
    }

    const toggleAllSections = () => {
        if (allSectionsExpanded) {
            setExpandedSections(new Set())
            return
        }
        expandAll()
    }

    const toggleAllItems = () => {
        if (allItemsExpanded) {
            setExpandedItems(new Set())
            return
        }
        expandAllItems()
    }

    const handleSelect = async (subcategoryId, responseId) => {
        setSelections((prev) => ({
            ...prev,
            [subcategoryId]: responseId,
        }))
        if (!assessmentId) {
            return
        }
        setSavingItems((prev) => {
            const next = new Set(prev)
            next.add(subcategoryId)
            return next
        })
        try {
            await updateSubcategoryResponse({
                assessmentId,
                subcategoryId,
                selectedResponseId: responseId,
            })
        } catch (error) {
            console.error('Unable to save response:', error)
            setError('Unable to save response')
        } finally {
            setSavingItems((prev) => {
                const next = new Set(prev)
                next.delete(subcategoryId)
                return next
            })
        }
    }

    const handleComplete = async () => {
        if (!assessmentId) {
            return
        }
        setIsCompleting(true)
        setError('')
        try {
            await completeAssessment(assessmentId)
            setAssessment((prev) => (prev ? { ...prev, status: 'completed' } : prev))
            if (onComplete) {
                onComplete(assessmentId, assessment)
            }
        } catch (error) {
            console.error('Unable to complete assessment:', error)
            setError('Unable to complete assessment')
        } finally {
            setIsCompleting(false)
        }
    }

    const getBadgeClasses = (label) => {
        const normalized = label.toLowerCase()
        if (normalized.includes('risk')) {
            return 'bg-red-100 text-red-800'
        }
        if (normalized.includes('attention')) {
            return 'bg-orange-100 text-orange-800'
        }
        if (normalized.includes('satisfactory') || normalized.includes('good')) {
            return 'bg-green-100 text-green-800'
        }
        return 'bg-gray-100 text-gray-700'
    }

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
                Loading assessment...
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg border border-red-200 p-6 text-sm text-red-600">
                {error}
            </div>
        )
    }

    if (!assessment) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-sm text-gray-600">
                No assessment data found.
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-black">
                        {assessment.title}
                    </h2>
                    {assessment.status && (
                        <p className="mt-1 text-xs text-gray-500">
                            Status: {assessment.status.replace(/_/g, ' ')}
                        </p>
                    )}
                    {templateTitle && (
                        <p className="mt-1 text-xs text-gray-500">
                            Template: {templateTitle}
                        </p>
                    )}
                    {(performedBy || formattedAssessmentDate) && (
                        <p className="mt-1 text-xs text-gray-500">
                            Performed by: {performedBy || 'Unknown'} {formattedAssessmentDate}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleComplete}
                        disabled={isCompleting || assessment.status === 'completed'}
                        className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2 text-sm disabled:opacity-60"
                    >
                        {assessment.status === 'completed'
                            ? 'Assessment completed'
                            : isCompleting
                            ? 'Completing...'
                            : 'Complete assessment'}
                    </button>
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer inline-flex items-center gap-2"
                        >
                            <FiArrowLeft className="text-base" />
                            Back to assessments
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
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
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2"
                    >
                        Show comparison
                    </button>
                    <button className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2">
                        <FiDownload className="text-base" />
                        Download report
                    </button>
                </div>
            </div>

            <div className="mt-6 space-y-4">
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
                                    className="w-full text-left p-4 bg-gray-100 hover:bg-gray-200 flex items-start justify-between gap-4"
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
                                                return (
                                                    <div key={item.id} className="rounded-md border border-gray-200">
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
                                                            className="w-full text-left px-4 py-3 bg-white hover:bg-gray-50 flex items-start justify-between gap-4"
                                                        >
                                                            <div className="flex items-start gap-3">
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
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-gray-400">
                                                                <button type="button" className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600" aria-label="Document">
                                                                    <FiFileText className="mx-auto" />
                                                                </button>
                                                                <button type="button" className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600" aria-label="Info">
                                                                    <FiInfo className="mx-auto" />
                                                                </button>
                                                                <button type="button" className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600" aria-label="Attachment">
                                                                    <FiPaperclip className="mx-auto" />
                                                                </button>
                                                                <button type="button" className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600" aria-label="Comments">
                                                                    <FiMessageSquare className="mx-auto" />
                                                                </button>
                                                                <button type="button" className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600" aria-label="Settings">
                                                                    <FiSettings className="mx-auto" />
                                                                </button>
                                                            </div>
                                                        </button>

                                                        {isItemOpen && (
                                                            <div className="border-t border-gray-200 bg-white">
                                                                {item.responseOptions.length === 0 ? (
                                                                    <div className="px-4 py-3 text-xs text-gray-500">
                                                                        No response options configured.
                                                                    </div>
                                                                ) : (
                                                                    <div className="divide-y divide-gray-200">
                                                                        {item.responseOptions.map((option) => (
                                                                            <label
                                                                                key={`${item.id}-${option.id}`}
                                                                                className="grid grid-cols-[32px_auto_1fr] items-start gap-4 px-4 py-3 text-sm"
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
                                                                                        disabled={isSaving}
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
        </div>
    )
}

export default PerformAssessment
