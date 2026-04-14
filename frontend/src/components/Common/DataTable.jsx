import React from 'react';

const DataTable = ({ columns, data, actions }) => {
  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.label}</th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {columns.map((col, colIdx) => (
                <td key={colIdx}>{row[col.key]}</td>
              ))}
              {actions && (
                <td>
                  {actions.map((action, actionIdx) => (
                    <button
                      key={actionIdx}
                      className={action.className}
                      onClick={() => action.onClick(row)}
                      style={{ marginRight: '5px' }}
                    >
                      <i className={`fas ${action.icon}`}></i> {action.label}
                    </button>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;