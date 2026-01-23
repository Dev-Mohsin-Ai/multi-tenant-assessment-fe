import React, { useState } from 'react'
import SearchTemplate from './SearchTemplate'

const AssesmentDialogue = ({ onClose, onNext }) => {
    const [template, setTemplate] = useState(null)
    const [performedBy, setPerformedBy] = useState('Hamza Abid')
    const [assessmentDate, setAssessmentDate] = useState('2026-01-24')
    const [assessmentTitle, setAssessmentTitle] = useState('')

    const handleNext = () => {
        const templateLabel = template?.label || ''
        onNext({
            template: templateLabel,
            performedBy,
            date: assessmentDate,
            title: assessmentTitle.trim() || templateLabel || 'New Assessment',
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40">
            <div className="mt-24 bg-white w-1/3 max-w-[90vw] rounded-lg p-6 shadow-xl">
                <div className="flex items-center justify-between">
                    <h1 className="text-[rgb(5,117,204)] text-2xl font-semibold">
                        New Assessment
                    </h1>
                </div>

                <div className="mt-4 space-y-4 text-sm text-gray-800">
                    <div>
                        <h2 className="font-medium text-black">Template</h2>
                        <p className="text-xs text-gray-500">Select template</p>
                        <div className="mt-2">
                            <SearchTemplate value={template} onChange={setTemplate} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h2 className="font-medium text-black">Performed by</h2>
                            <div className="mt-2">
                                <select
                                    value={performedBy}
                                    onChange={(event) => setPerformedBy(event.target.value)}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-700"
                                >
                                    <option>Hamza Abid</option>
                                    <option>Ali Khan</option>
                                    <option>Sara Ahmed</option>
                                    <option>Usman Raza</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <h2 className="font-medium text-black">Assessment date</h2>
                            <div className="mt-2">
                                <input
                                    type="date"
                                    value={assessmentDate}
                                    onChange={(event) => setAssessmentDate(event.target.value)}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-700"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h2 className="font-medium text-black">Assessment Title</h2>
                        <div className="mt-2">
                            <input
                                type="text"
                                placeholder="Title"
                                value={assessmentTitle}
                                onChange={(event) => setAssessmentTitle(event.target.value)}
                                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white text-sm text-gray-700 placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 cursor-pointer border border-gray-300 rounded-md px-3 h-9"
                    >
                        <span className="inline-flex items-center justify-center text-gray-600">
                            x
                        </span>
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={handleNext}
                        className="h-9 px-4 rounded-md bg-[rgb(5,117,204)] text-white text-sm font-medium hover:bg-[rgb(0,97,170)] cursor-pointer"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AssesmentDialogue
