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
            className="rounded-lg border border-gray-200 bg-white overflow-visible"
          >
            <div className={`px-4 py-3 flex items-center gap-3 font-semibold ${group.header}`}>
              <span>{group.label}</span>
              <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs ${group.badge}`}>
                {responseGroups[group.key].length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] table-fixed text-sm">
                <colgroup>
                  <col className="w-[32%]" />
                  <col className="w-[20%]" />
                  <col className="w-[22%]" />
                  <col className="w-[13%]" />
                  <col className="w-[13%]" />
                </colgroup>
                <thead>
                  <tr className="text-left text-xs text-gray-600 border-b border-gray-200">
                    <th className="px-4 py-3 align-middle font-semibold">Title &amp; Description</th>
                    <th className="px-4 py-3 align-middle font-semibold">Response</th>
                    <th className="px-4 py-3 text-center align-middle font-semibold">Initiative</th>
                    <th className="px-4 py-3 text-center align-middle font-semibold">Public Comments</th>
                    <th className="px-4 py-3 text-center align-middle font-semibold">Internal Comments</th>
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
