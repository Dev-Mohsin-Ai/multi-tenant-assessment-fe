import React, { useEffect, useMemo, useState } from 'react'
import {
    FiChevronDown,
    FiChevronUp,
    FiDownload,
    FiList,
    FiLayers,
    FiArrowLeft,
    FiPlus,
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
            const formatLabel = (value) =>
                String(value || '')
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (char) => char.toUpperCase())

            const responseOptions = rawOptions.map((option, optionIndex) => {
                const responseType =
                    option.response_type || option.responseType || option.type || option.value
                return {
                    id: option.id ?? `${subcategoryId}-option-${optionIndex}`,
                    label:
                        option.label ||
                        option.title ||
                        option.name ||
                        (responseType ? formatLabel(responseType) : null) ||
                        `Option ${optionIndex + 1}`,
                    description: option.description || option.text || option.details || '',
                }
            })

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
    const [responseFilter, setResponseFilter] = useState('all')

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

    const isCompleted = assessment?.status === 'completed'
    const progressPercent = totalItems
        ? Math.round((answeredCount / totalItems) * 100)
        : 0

    const scoreCandidate = Number(
        assessment?.total_score ??
        assessment?.totalScore ??
        assessment?.score ??
        ''
    )
    const overallScoreValue = Number.isFinite(scoreCandidate)
        ? scoreCandidate > 0 && scoreCandidate <= 1
            ? scoreCandidate * 100
            : scoreCandidate
        : null

    const responseGroups = useMemo(() => {
        const groups = {}
        const normalizeKey = (label) =>
            String(label || '')
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '_')
        categories.forEach((category) => {
            category.subcategories.forEach((subcategory) => {
                const selectedId =
                    selections[subcategory.id] || subcategory.selectedResponseId
                if (!selectedId) {
                    return
                }
                const selectedOption = subcategory.responseOptions.find(
                    (option) => option.id === selectedId
                )
                if (!selectedOption) {
                    return
                }
                const key = normalizeKey(selectedOption.label)
                if (!groups[key]) {
                    groups[key] = []
                }
                groups[key].push({
                    id: `${subcategory.id}-${selectedOption.id}`,
                    title: subcategory.title,
                    description: subcategory.description,
                    responseLabel: selectedOption.label,
                    responseDescription: selectedOption.description,
                })
            })
        })
        return groups
    }, [categories, selections])

    const responseGroupOrder = [
        { key: 'at_risk', label: 'At Risk', header: 'bg-red-100 text-red-800', badge: 'bg-red-500 text-white' },
        { key: 'needs_attention', label: 'Needs Attention', header: 'bg-orange-100 text-orange-800', badge: 'bg-orange-500 text-white' },
        { key: 'acceptable_risk', label: 'Acceptable Risk', header: 'bg-amber-100 text-amber-800', badge: 'bg-amber-500 text-white' },
        { key: 'satisfactory', label: 'Satisfactory', header: 'bg-green-100 text-green-800', badge: 'bg-green-500 text-white' },
        { key: 'yes', label: 'Yes', header: 'bg-green-100 text-green-800', badge: 'bg-green-500 text-white' },
        { key: 'no', label: 'No', header: 'bg-red-100 text-red-800', badge: 'bg-red-500 text-white' },
        { key: 'not_applicable', label: 'Not Applicable', header: 'bg-purple-100 text-purple-800', badge: 'bg-purple-500 text-white' },
        { key: 'unknown', label: 'Unknown', header: 'bg-gray-100 text-gray-700', badge: 'bg-gray-500 text-white' },
    ]

    const visibleGroups = responseGroupOrder
        .filter((group) => responseGroups[group.key]?.length)
        .filter((group) => responseFilter === 'all' || responseFilter === group.key)

    const totalResponsesCount = Object.values(responseGroups).reduce(
        (total, items) => total + items.length,
        0
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
        if (isCompleted) {
            return
        }
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
            const completedAt = new Date().toISOString()
            setAssessment((prev) =>
                prev ? { ...prev, status: 'completed', completed_at: completedAt } : prev
            )
            if (onComplete) {
                onComplete(assessmentId, {
                    ...assessment,
                    status: 'completed',
                    completed_at: completedAt,
                })
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

    const getStatusBadgeClasses = (status) => {
        if (status === 'completed') {
            return 'bg-green-100 text-green-700'
        }
        return 'bg-amber-100 text-amber-700'
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-4 md:px-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-black">
                            {assessment.title}
                        </h2>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                            {assessment.status && (
                                <span
                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClasses(
                                        assessment.status
                                    )}`}
                                >
                                    {assessment.status.replace(/_/g, ' ')}
                                </span>
                            )}
                            {overallScoreValue !== null && overallScoreValue !== undefined && (
                                <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-semibold text-orange-900">
                                    Overall Score: {Number(overallScoreValue).toFixed(2)}%
                                </span>
                            )}
                            {!isCompleted && (
                                <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 border border-gray-200">
                                    Progress: {progressPercent}%
                                </span>
                            )}
                            {!isCompleted && (
                                <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 border border-gray-200">
                                    Answers: {answeredCount}/{totalItems || 0}
                                </span>
                            )}
                        </div>
                        {templateTitle && (
                            <p className="mt-2 text-xs text-gray-500">
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
                            disabled={isCompleting || isCompleted}
                            className="px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2 text-sm font-medium disabled:opacity-60"
                        >
                            {isCompleted
                                ? 'Assessment completed'
                                : isCompleting
                                ? 'Completing...'
                                : 'Complete assessment'}
                        </button>
                        <button className="px-4 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 inline-flex items-center gap-2 text-sm font-medium">
                            <FiDownload className="text-base" />
                            Download report
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
            </div>

            {!isCompleted && (
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
            )}

            {isCompleted && (
                <div className="px-4 py-6 md:px-6 bg-gray-50 space-y-6">
                    <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm font-semibold text-gray-800">Include responses</p>
                        <div className="mt-3 inline-flex items-center gap-2">
                            <select
                                value={responseFilter}
                                onChange={(e) => setResponseFilter(e.target.value)}
                                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm font-medium text-gray-800"
                            >
                                <option value="all">Responses ({totalResponsesCount})</option>
                                {responseGroupOrder
                                    .filter((group) => responseGroups[group.key]?.length)
                                    .map((group) => (
                                        <option key={group.key} value={group.key}>
                                            {group.label} ({responseGroups[group.key].length})
                                        </option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {visibleGroups.length === 0 ? (
                        <div className="rounded-md border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
                            No responses available to display.
                        </div>
                    ) : (
                        visibleGroups.map((group) => (
                            <div
                                key={group.key}
                                className="rounded-lg border border-gray-200 overflow-hidden bg-white"
                            >
                                <div className={`px-4 py-3 flex items-center gap-3 font-semibold ${group.header}`}>
                                    <span>{group.label}</span>
                                    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs ${group.badge}`}>
                                        {responseGroups[group.key].length}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-225 w-full text-sm">
                                        <thead>
                                            <tr className="text-left text-xs text-gray-600 border-b border-gray-200">
                                                <th className="w-10 px-4 py-2">
                                                    <input type="checkbox" className="h-4 w-4" />
                                                </th>
                                                <th className="px-4 py-2">Title &amp; Description</th>
                                                <th className="px-4 py-2">Response</th>
                                                <th className="px-4 py-2 text-center">Owner</th>
                                                <th className="px-4 py-2 text-center">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {responseGroups[group.key].map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-b border-gray-200 last:border-b-0"
                                                >
                                                    <td className="px-4 py-3">
                                                        <input type="checkbox" className="h-4 w-4" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-gray-900">
                                                            {item.title}
                                                        </div>
                                                        {item.description && (
                                                            <p className="text-xs text-gray-600 mt-1">
                                                                {item.description}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-gray-900">
                                                            {item.responseLabel}
                                                        </div>
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            {item.responseDescription || 'No description provided.'}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-gray-500">-</td>
                                                    <td className="px-4 py-3 text-center text-gray-500">-</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {!isCompleted && (
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
                                                            className="w-full text-left px-4 py-3 bg-white hover:bg-gray-50 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
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
                                                                <span className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600 inline-flex items-center justify-center" aria-label="Document">
                                                                    <FiFileText className="mx-auto" />
                                                                </span>
                                                                <span className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600 inline-flex items-center justify-center" aria-label="Info">
                                                                    <FiInfo className="mx-auto" />
                                                                </span>
                                                                <span className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600 inline-flex items-center justify-center" aria-label="Attachment">
                                                                    <FiPaperclip className="mx-auto" />
                                                                </span>
                                                                <span className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600 inline-flex items-center justify-center" aria-label="Comments">
                                                                    <FiMessageSquare className="mx-auto" />
                                                                </span>
                                                                <span className="h-8 w-8 rounded-md border border-gray-200 bg-white hover:text-gray-600 inline-flex items-center justify-center" aria-label="Settings">
                                                                    <FiSettings className="mx-auto" />
                                                                </span>
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
                                                                                        disabled={isSaving || isCompleted}
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
            )}
        </div>
    )
}

export default PerformAssessment
