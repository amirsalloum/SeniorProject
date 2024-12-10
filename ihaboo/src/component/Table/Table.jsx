import React from "react";

const Table = ({
  columns,
  data,
  isLoading,
  handleRowClick,
  formatCellData,
  noDataMessage,
  rowClassName,
}) => {
  return (
    <div className="overflow-hidden rounded-[15px] border-gray-300 max-h-[400px] w-full bg-white">
      {/* Table Container */}
      <div className="overflow-y-auto max-h-[350px] rounded-[15px]">
        <table className="min-w-full table-auto bg-white">
          <thead className="sticky top-0 bg-white z-10">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-bold text-gray-600 border-b border-gray-300"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-4 text-gray-500"
                >
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-4 text-gray-500"
                >
                  {noDataMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.leaveRequestID || index}
                  className={`transition-colors duration-300 hover:bg-gray-100 ${
                    typeof rowClassName === "function" ? rowClassName(row) : ""
                  }`}
                  onClick={() => handleRowClick(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-2 text-left text-sm text-gray-700 border-b border-gray-300 cursor-pointer"
                    >
                      {formatCellData
                        ? formatCellData(row[column.key], column.key)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;