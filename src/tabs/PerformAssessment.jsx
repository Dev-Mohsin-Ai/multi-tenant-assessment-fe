import React, { useMemo, useState, useEffect } from 'react'
import { FiChevronDown, FiChevronUp, FiDownload, FiList, FiLayers, FiArrowLeft, FiFileText, FiInfo, FiPaperclip, FiMessageSquare, FiSettings } from 'react-icons/fi'

const PerformAssessment = ({ onBack, assessmentId, onProgress }) => {
    const defaultLevels = useMemo(() => ([
        {
            label: 'At Risk',
            text: 'No formal policy exists. Client has little recourse if technology is misused.',
        },
        {
            label: 'Needs Attention',
            text: 'Policy exists but adoption or enforcement is inconsistent.',
        },
        {
            label: 'Satisfactory',
            text: 'Policy is documented, reviewed regularly, and shared with staff.',
        },
        {
            label: 'Not Applicable',
            text: 'Not applicable to this organization.',
        },
    ]), [])

    const sections = useMemo(() => ([
        {
            id: 'security',
            title: 'Security Policies & Controls',
            description: 'Evaluates core security policies including acceptable use, access controls, and data protection.',
            items: [
                {
                    title: 'Acceptable Use Policy (AUP)',
                    description: 'Assesses whether the organization has a comprehensive acceptable use policy for technology resources.',
                    levels: defaultLevels,
                },
                {
                    title: 'Password Policy',
                    description: 'Evaluates password policy implementation and enforcement across the organization.',
                    levels: defaultLevels,
                },
                {
                    title: 'Controlled Access / Least Privilege Policy',
                    description: 'Evaluates whether the organization implements least privilege access controls.',
                    levels: defaultLevels,
                },
                {
                    title: 'Data Encryption Policy',
                    description: 'Assesses data encryption policy implementation and monitoring.',
                    levels: defaultLevels,
                },
                {
                    title: 'Network Security Policy',
                    description: 'Evaluates network security policy documentation and currency.',
                    levels: defaultLevels,
                },
                {
                    title: 'Physical Security and Access Logging Policy',
                    description: 'Evaluates physical security controls and access monitoring for sensitive systems.',
                    levels: defaultLevels,
                },
            ],
        },
        {
            id: 'device',
            title: 'Device & Media Management',
            description: 'Covers mobile device policies, BYOD controls, and removable media security.',
            items: [
                {
                    title: 'Mobile Device Management (MDM)',
                    description: 'Reviews whether mobile devices are centrally managed and monitored.',
                    levels: defaultLevels,
                },
                {
                    title: 'BYOD Policy',
                    description: 'Assesses controls for personal device access to company resources.',
                    levels: defaultLevels,
                },
                {
                    title: 'Removable Media Controls',
                    description: 'Checks restrictions and monitoring of USB and external media usage.',
                    levels: defaultLevels,
                },
                {
                    title: 'Device Encryption',
                    description: 'Confirms encryption standards for laptops and mobile devices.',
                    levels: defaultLevels,
                },
                {
                    title: 'Asset Inventory',
                    description: 'Validates that devices are tracked and reconciled in inventory.',
                    levels: defaultLevels,
                },
            ],
        },
        {
            id: 'employee',
            title: 'Employee & Access Management',
            description: 'Covers employee lifecycle management, access controls, and security procedures.',
            items: [
                {
                    title: 'Onboarding Procedures',
                    description: 'Ensures access provisioning follows approved onboarding workflows.',
                    levels: defaultLevels,
                },
                {
                    title: 'Offboarding Procedures',
                    description: 'Checks timely revocation of access for departing employees.',
                    levels: defaultLevels,
                },
                {
                    title: 'Role-Based Access',
                    description: 'Verifies access is aligned to job roles and responsibilities.',
                    levels: defaultLevels,
                },
                {
                    title: 'Privileged Access Reviews',
                    description: 'Assesses periodic review of privileged accounts and permissions.',
                    levels: defaultLevels,
                },
            ],
        },
        {
            id: 'operational',
            title: 'Operational Security',
            description: 'Covers incident response, patch management, and operational security procedures.',
            items: [
                {
                    title: 'Incident Response Plan',
                    description: 'Checks if a documented plan exists and is tested regularly.',
                    levels: defaultLevels,
                },
                {
                    title: 'Patch Management',
                    description: 'Evaluates patching cadence and vulnerability remediation.',
                    levels: defaultLevels,
                },
                {
                    title: 'Security Monitoring',
                    description: 'Assesses logging, alerting, and monitoring coverage.',
                    levels: defaultLevels,
                },
                {
                    title: 'Change Management',
                    description: 'Reviews approval and documentation of production changes.',
                    levels: defaultLevels,
                },
            ],
        },
        {
            id: 'continuity',
            title: 'Business Continuity',
            description: 'Covers business continuity planning, cloud infrastructure, and internet redundancy.',
            items: [
                {
                    title: 'Business Continuity Plan',
                    description: 'Ensures continuity plans are documented and tested.',
                    levels: defaultLevels,
                },
                {
                    title: 'Disaster Recovery',
                    description: 'Reviews recovery objectives and backup procedures.',
                    levels: defaultLevels,
                },
                {
                    title: 'Internet Redundancy',
                    description: 'Checks for redundant ISP connections and failover testing.',
                    levels: defaultLevels,
                },
                {
                    title: 'Cloud Resilience',
                    description: 'Assesses high availability and regional redundancy configurations.',
                    levels: defaultLevels,
                },
            ],
        },
    ]), [defaultLevels])

    const [expandedSections, setExpandedSections] = useState(() => new Set())
    const [expandedItems, setExpandedItems] = useState(() => new Set())
    const [selections, setSelections] = useState({})

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
        setExpandedSections(new Set(sections.map((section) => section.id)))
    }

    const expandAllItems = () => {
        setExpandedSections(new Set(sections.map((section) => section.id)))
        const allItems = new Set()
        sections.forEach((section, sectionIndex) => {
            section.items.forEach((_, itemIndex) => {
                allItems.add(`${sections[sectionIndex].id}-${itemIndex}`)
            })
        })
        setExpandedItems(allItems)
    }

    const totalItems = useMemo(
        () => sections.reduce((count, section) => count + section.items.length, 0),
        [sections]
    )

    useEffect(() => {
        if (onProgress && assessmentId) {
            const answered = Object.keys(selections).length
            onProgress({ assessmentId, answered, total: totalItems })
        }
    }, [assessmentId, onProgress, selections, totalItems])

    const getBadgeClasses = (label) => {
        switch (label) {
            case 'At Risk':
                return 'bg-red-100 text-red-800'
            case 'Needs Attention':
                return 'bg-orange-100 text-orange-800'
            case 'Satisfactory':
                return 'bg-green-100 text-green-800'
            default:
                return 'bg-gray-100 text-gray-700'
        }
    }
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold text-black">
                        Base Policies & Procedures Assessment
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer inline-flex items-center gap-2"
                >
                    <FiArrowLeft className="text-base" />
                    Back to assessments
                </button>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={expandAll}
                        className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2"
                    >
                        <FiLayers className="text-base" />
                        Expand all categories
                    </button>
                    <button
                        type="button"
                        onClick={expandAllItems}
                        className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2"
                    >
                        <FiList className="text-base" />
                        Expand all items
                    </button>
                </div>
                <button className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center gap-2">
                    <FiDownload className="text-base" />
                    Download report
                </button>
            </div>

            <div className="mt-6 space-y-4">
                {sections.map((section) => {
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
                                        <p className="mt-1 text-sm text-gray-600">
                                            {section.description}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {isOpen && (
                                <div className="border-t border-gray-200 px-4 pb-4">
                                    <div className="mt-4 space-y-4">
                                        {section.items.map((item, index) => {
                                            const itemId = `${section.id}-${index}`
                                            const isItemOpen = expandedItems.has(itemId)
                                            return (
                                                <div key={itemId} className="rounded-md border border-gray-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setExpandedItems((prev) => {
                                                                const next = new Set(prev)
                                                                if (next.has(itemId)) {
                                                                    next.delete(itemId)
                                                                } else {
                                                                    next.add(itemId)
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
                                                                <p className="mt-1 text-xs text-gray-600">
                                                                    {item.description}
                                                                </p>
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
                                                            <div className="divide-y divide-gray-200">
                                                                {item.levels.map((level) => (
                                                                    <label key={`${itemId}-${level.label}`} className="grid grid-cols-[32px_auto_1fr] items-start gap-4 px-4 py-3 text-sm">
                                                                        <span className="pt-1">
                                                                            <input
                                                                                type="radio"
                                                                                name={`${itemId}-level`}
                                                                                className="h-4 w-4"
                                                                                checked={selections[itemId] === level.label}
                                                                                onChange={() => {
                                                                                    setSelections((prev) => ({
                                                                                        ...prev,
                                                                                        [itemId]: level.label,
                                                                                    }))
                                                                                }}
                                                                            />
                                                                        </span>
                                                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getBadgeClasses(level.label)}`}>
                                                                            {level.label}
                                                                        </span>
                                                                        <span className="text-sm text-gray-700">
                                                                            {level.text}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
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
                })}
            </div>
        </div>
    )
}

export default PerformAssessment
