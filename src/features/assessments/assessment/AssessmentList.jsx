import React from 'react'
import { RiFileListLine } from 'react-icons/ri'
import Tables from '../../../shared/components/Tables'

const AssessmentList = ({
  loading,
  rows,
  search,
  onSearchChange,
  onOpenAssessment,
}) => {
  const columns = [
    {
      key: 'title',
      label: 'Title',
      render: (value, row) => (
        <button
          type="button"
          onClick={() => onOpenAssessment(row.id)}
          className="text-left text-gray-900 hover:underline"
        >
          {value}
        </button>
      ),
    },
    { key: 'status', label: 'Status' },
    { key: 'score', label: 'Score' },
    { key: 'items', label: 'Items' },
    { key: 'answers', label: 'Answers' },
    { key: 'completion', label: 'Completion' },
    {
      key: 'action',
      label: 'Action',
      render: (value, row) => (
        <button
          type="button"
          onClick={() => onOpenAssessment(row.id)}
          className="text-[rgb(5,117,204)] hover:underline"
        >
          Open
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="mt-4">
        <input
          type="search"
          placeholder="Find in list..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="border border-[rgba(0,0,0,0.24)] border-b-[rgb(23,24,31)] h-9 px-3 outline-none focus:border-[#473c9a] hover:border-[#473c9a] focus:border-3 text-sm text-[#473c9a] placeholder-gray-300 focus:placeholder-[#473c9a] bg-white w-full max-w-lg rounded-t-sm focus:bg-[#e9e9ee]"
        />
      </div>

      <div>
        {loading ? (
          <div className="mt-6 flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-10 text-gray-500">
            <p className="text-sm">Loading assessments...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white p-10 text-gray-500">
            <RiFileListLine className="text-3xl" />
            <p className="mt-2 text-sm">No assessments found</p>
          </div>
        ) : (
          <Tables columns={columns} data={rows} />
        )}
      </div>
    </>
  )
}

export default AssessmentList
