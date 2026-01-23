import React, { useState } from 'react'
import { FaPlus, FaGear } from "react-icons/fa6";
import Tables from '../components/tables';
import { RiDeleteBin6Line, RiFileListLine } from "react-icons/ri";
import AssesmentDialogue from "../components/AssesmentDialogue";
import PerformAssessment from './PerformAssessment';

const Assessment = () => {

  const [open, setOpen] = useState(false)
  const [showPerform, setShowPerform] = useState(false)
  const [activeAssessmentId, setActiveAssessmentId] = useState(null)
  const [rows, setRows] = useState([])
  const columns = [
    {
      key: "title",
      label: "Title",
      render: (value, row) => (
        <button
          type="button"
          onClick={() => {
            setActiveAssessmentId(row.id)
            setShowPerform(true)
          }}
          className={`text-left ${row.isNew ? "text-[rgb(5,117,204)]" : "text-gray-900"} hover:underline`}
        >
          {value}
        </button>
      ),
    },
    { key: "performedBy", label: "Performed By" },
    { key: "date", label: "Date" },
    { key: "score", label: "Score" },
    { key: "items", label: "Items" },
    { key: "answers", label: "Answers" },
    { key: "completion", label: "Completion" },
    { key: "delete", label: "Delete" },
  ];


  const handleNext = (payload) => {
    const formattedDate = payload.date ? payload.date.replace(/-/g, '/') : '-'
    const newId = `assessment-${Date.now()}`
    const newRow = {
      id: newId,
      title: payload.title,
      performedBy: payload.performedBy,
      date: formattedDate,
      score: '-',
      items: 0,
      answers: 0,
      completion: '0%',
      delete: <RiDeleteBin6Line className="text-red-500" />,
      isNew: true,
    }
    setRows((prev) => [
      newRow,
      ...prev.map((row) => ({ ...row, isNew: false })),
    ])
    setOpen(false)
    setActiveAssessmentId(newId)
    setShowPerform(true)
  }

  const handleProgress = ({ assessmentId, answered, total }) => {
    const completion = total > 0 ? `${Math.round((answered / total) * 100)}%` : '0%'
    setRows((prev) =>
      prev.map((row) =>
        row.id === assessmentId
          ? {
            ...row,
            items: total,
            answers: answered,
            completion,
          }
          : row
      )
    )
  }

  return (
    <div>
      {showPerform ? (
        <PerformAssessment
          assessmentId={activeAssessmentId}
          onBack={() => setShowPerform(false)}
          onProgress={handleProgress}
        />
      ) : (
        <>
          <div className='flex items-center justify-between'>
            <input
              type="search"
              placeholder='Find in list...'
              className="
                border border-[rgba(0,0,0,0.24)] border-b-[rgb(23,24,31)] h-9 px-3 outline-none focus:border-[#473c9a] hover:border-[#473c9a] focus:border-3 text-sm text-[#473c9a] placeholder-gray-300 focus:placeholder-[#473c9a] bg-white w-1/2 rounded-t-sm focus:bg-[#e9e9ee]
              "
            />
            <div className="flex">
              <button
                onClick={() => {
                  setOpen(true)
                }}
                className="
                ml-2 h-9
                bg-[rgb(5,117,204)] text-white
                px-4 rounded-md
                flex items-center gap-2
                text-sm font-medium
                hover:bg-[rgb(0,97,170)]
                cursor-pointer
              ">
                <FaPlus /> New Assessment
              </button>
              {open && (
                <AssesmentDialogue
                  onClose={() => setOpen(false)}
                  onNext={handleNext}
                />
              )}

              <button className="
                ml-2 h-9
                bg-[rgb(248,248,250)] text-black
                px-4 rounded-md
                flex items-center gap-2
                text-sm border border-gray-300
                hover:bg-[rgb(255,255,255)]
              ">
                <FaGear /> Manage Templates
              </button>
            </div>

          </div>

          <div>
            {rows.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-10 text-gray-500">
                <RiFileListLine className="text-3xl" />
                <p className="mt-2 text-sm">No Assessment created</p>
              </div>
            ) : (
              <Tables
                columns={columns}
                data={rows}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Assessment
