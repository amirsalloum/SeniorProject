import React from 'react';

const ExportButton = ({ data, fileName, columns }) => {
  const handleExport = () => {
    const csvContent = [
      columns.map((col) => col.header),
      ...data.map((row) =>
        columns.map((col) => {
          if (col.key === 'actionTime') {
            return new Date(row.actionDate).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });
          }
          return row[col.key];
        })
      ),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
  };

  return (
    <div className="flex justify-end"> {/* Aligns button to the right */}
      <button
        className="bg-gray-800 text-white py-2 px-4 rounded-[15px] hover:bg-[#163450] transition duration-300 focus:outline-none flex items-center justify-center"
        onClick={handleExport}
      >
        Export <span className="ml-2 text-xs">&#x25BC;</span> {/* Unicode down arrow icon */}
      </button>
    </div>
  );
};

export default ExportButton;