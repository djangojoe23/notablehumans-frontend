// components/SortControls.js
import React from 'react';

const SortControls = ({ sortBy, setSortBy, sortAsc, setSortAsc }) => {
  return (
    <div style={{ padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        style={{ flex: 1, padding: 4 }}
      >
        <option value="n">Name</option>
        <option value="by">Birth Year</option>
        <option value="dy">Death Year</option>
        <option value="cd">Article Created Date</option>
        <option value="al">Article Length</option>
        <option value="rv">Recent Views</option>
        <option value="te">Total Edits</option>
      </select>
      <button
        onClick={() => setSortAsc((prev) => !prev)}
        style={{
          padding: '4px 8px',
          border: '1px solid #ccc',
          background: '#fff',
          cursor: 'pointer',
        }}
        title="Toggle sort order"
      >
        {sortAsc ? '↑' : '↓'}
      </button>
    </div>
  );
};

export default SortControls;
