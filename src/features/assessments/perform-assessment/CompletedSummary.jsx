import React from 'react'
import AppSelect from '../../../shared/components/AppSelect'

const CompletedSummary = ({
  responseFilter,
  onFilterChange,
  responseGroupOrder,
  responseGroups,
  visibleGroups,
  totalResponsesCount,
  renderGroupRow,
}) => {
  const filterOptions = [
    { value: 'all', label: `Responses (${totalResponsesCount})` },
    ...responseGroupOrder
      .filter((group) => responseGroups[group.key]?.length)
      .map((group) => ({
        value: group.key,
        label: `${group.label} (${responseGroups[group.key].length})`,
      })),
  ]

  return (
    <div className="px-4 py-6 md:px-6 bg-gray-50 space-y-6">
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm font-semibold text-gray-800">Include responses</p>
        <div className="mt-3 inline-flex items-center gap-2">
          <AppSelect
            options={filterOptions}
            value={responseFilter}
            onChange={onFilterChange}
            className="min-w-56"
          />
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
            <div>
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-left text-xs text-gray-600 border-b border-gray-200">
                    <th className="px-4 py-2">Title &amp; Description</th>
                    <th className="px-4 py-2">Response</th>
                    <th className="px-4 py-2 text-center">Initiative</th>
                    <th className="px-4 py-2 text-center">Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {responseGroups[group.key].map((item) => renderGroupRow(item))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default CompletedSummary
