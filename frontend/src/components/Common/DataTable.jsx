import React from 'react';

const DataTable = ({ columns, data, actions }) => {
  const hasActions = Array.isArray(actions) && actions.length > 0;
  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.label}</th>
            ))}
            {hasActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id ?? idx}>
              {columns.map((col, colIdx) => (
                <td key={colIdx}>{row[col.key]}</td>
              ))}
              {hasActions && (
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