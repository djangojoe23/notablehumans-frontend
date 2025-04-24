// components/SortControls.js
import React from 'react';

const SortControls = ({ sortBy, setSortBy, sortAsc, setSortAsc }) => {
  return (
    <div style={{ padding: '0 10px 10px', display: 'flex', alignItems: 'center' }}>
      <label style={{ marginRight: 8 }}>
        Sort by:
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          style={{ marginLeft: 4 }}
        >
          <option value="n">Name</option>
          <option value="bd">Birth Date</option>
          <option value="dd">Death Date</option>
          <option value="cd">Wikipedia Created Date</option>
          <option value="al">Wikipedia Article Length</option>
          <option value="rv">Wikipedia Recent Views</option>
          <option value="te">Wikipedia Total Edits</option>
        </select>
      </label>
      <button
        onClick={() => setSortAsc(prev => !prev)}
        title={sortAsc ? 'Ascending' : 'Descending'}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: '1.2em',
          lineHeight: 1
        }}
      >
        {sortAsc ? '▲' : '▼'}
      </button>
    </div>
  );
};

export default SortControls;
