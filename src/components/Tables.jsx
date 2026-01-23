import React from 'react';

const Table = ({ columns, data }) => {
    return (
        <div className="pt-3">
            <table className="w-full border border-gray-300 border-collapse">

                {/* Header */}
                <thead className="font-bold">
                    <tr className="bg-white">
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="px-3 py-3 text-left text-sm"
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>

                {/* Body */}
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr key={rowIndex} className="odd:bg-gray-100 even:bg-white">
                            {columns.map((col) => {
                                const cell = col.render ? col.render(row[col.key], row) : row[col.key]
                                return (
                                    <td
                                        key={col.key}
                                        className="px-3 py-3 text-sm"
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
    );
};

export default Table;
