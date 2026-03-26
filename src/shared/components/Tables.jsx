import React from 'react'

const getColumnAlignment = (column) => {
  const align = String(column?.align || '').toLowerCase()
  if (align === 'center') {
    return 'text-center'
  }
  if (align === 'right') {
    return 'text-right'
  }
  return 'text-left'
}

const Table = ({ columns = [], data = [], onRowClick }) => {
  return (
    <div className="pt-3 overflow-x-auto">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] table-fixed text-sm">
          <colgroup>
            {columns.map((column) => (
              <col key={column.key} style={column.width ? { width: column.width } : undefined} />
            ))}
          </colgroup>
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide ${getColumnAlignment(
                    column
                  )}`}
                >
                  <div className="break-words">{column.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={row.id ?? rowIndex}
                className={`bg-white ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => {
                  const cell = column.render ? column.render(row[column.key], row) : row[column.key]
                  return (
                    <td
                      key={column.key}
                      className={`px-4 py-3 text-sm text-gray-700 align-middle ${getColumnAlignment(
                        column
                      )}`}
                    >
                      <div className="break-words">{cell}</div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Table
