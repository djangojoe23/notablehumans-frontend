// SidebarList.js
import React, { useMemo, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';

const SidebarList = ({ allHumans, zoomToMarker, sortField, sortOrder, searchQuery }) => {

  // Create a memoized sorted array.
  const sortedHumans = useMemo(() => {
    if (!allHumans) return [];
    // Filter by search query (case-insensitive)
    const filtered = allHumans.filter(human =>
      human.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle string sorting
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle dates if necessary
      if (sortField === "article_created_date") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      // For numbers or dates, subtract values.
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [allHumans, searchQuery, sortField, sortOrder]);

  const OFFSET = 250;
  const [listHeight, setListHeight] = useState(window.innerHeight - OFFSET);

  useEffect(() => {
    const handleResize = () => {
      setListHeight(window.innerHeight - OFFSET);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define a Row component that renders a single item.
  const Row = ({ index, style }) => {
    const human = sortedHumans[index];

    let lat, lon;
    if (human.birth_place && human.birth_place.latitude && human.birth_place.longitude) {
      lat = human.birth_place.latitude;
      lon = human.birth_place.longitude;
    }
    const rowNumber = sortOrder === 'asc' ? sortedHumans.length - index : index + 1;
    return (
      <div style={style} className="sidebar-list-item">
        <span className="row-number">{rowNumber}.</span>
        <span
            className="clickable-name"
            onClick={() => {
                      if (lat && lon && zoomToMarker) {zoomToMarker(human.wikidata_id, lat, lon);}
            }}
        >
          {human.name} ({human.birth_year}-{human.death_year})
      </span>
      </div>
    );
  };

  return (
    <List
      height={listHeight}           // height of the scrollable container
      itemCount={sortedHumans.length} // total number of items
      itemSize={35}          // height of each item (adjust as needed)
      width="100%"
    >
      {Row}
    </List>
  );
};

export default SidebarList;
