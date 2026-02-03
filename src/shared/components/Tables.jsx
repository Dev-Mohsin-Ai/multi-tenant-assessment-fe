import React from 'react';

const Table = ({ columns, data, onRowClick }) => {
    return (
        <div className="pt-3 overflow-x-auto">
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <table className="w-full min-w-180 text-sm">
                    <thead className="bg-gray-50 text-gray-700">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={`bg-white ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                            >
                                {columns.map((col) => {
                                    const cell = col.render ? col.render(row[col.key], row) : row[col.key]
                                    return (
                                        <td
                                            key={col.key}
                                            className="px-4 py-3 text-sm text-gray-700"
                                        >
                                            {cell}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Table;
