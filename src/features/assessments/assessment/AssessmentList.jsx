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
          className="h-10 w-full max-w-lg rounded-md border border-gray-200 px-3 text-sm text-gray-700 bg-white placeholder:text-gray-400 focus:border-[rgb(5,117,204)] focus:ring-1 focus:ring-blue-100"
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
