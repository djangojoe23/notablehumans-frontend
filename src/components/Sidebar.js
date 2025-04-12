import React, { useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FaFilter, FaArrowRight, FaArrowLeft, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { SIDEBAR_WIDTH, BUTTON_SIZE, ARROW_SIZE } from '../constants/layout';

// Utility: only shows a tooltip if the text is visually truncated
const OverflowTooltip = ({ children, tooltipText }) => {
  const textRef = React.useRef(null);
  const [isTruncated, setIsTruncated] = React.useState(false);

  React.useEffect(() => {
    const el = textRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [children]);

  return (
    <div
      ref={textRef}
      title={isTruncated ? tooltipText : ''}
      style={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        display: 'block',
        // cursor: 'default',
      }}
    >
      {children}
    </div>
  );
};


/**
 * Sidebar slide-out panel to show people at a selected marker/cluster.
 */
const Sidebar = ({
    sidebarOpen,
    setSidebarOpen,
    setSidebarTrigger,
    humansAtMarker,
    sidebarMode,
    onSelectPerson,
    selectedListHuman,
    setSelectedListHuman,
    expandedHumanId, setExpandedHumanId
}) => {

    const getItemSize = (index) => {
      const human = humansAtMarker[index];
      const isExpanded = expandedHumanId === human.wikidata_id;
      return isExpanded ? 140 : 40; // Adjust height as needed
    };

    const listRef = React.useRef(null);

    useEffect(() => {
      if (!listRef.current) return;
      listRef.current.resetAfterIndex(0, true); // Recalculates heights
    }, [expandedHumanId, humansAtMarker]);

    // 👇 Scroll the expanded row into view
    React.useEffect(() => {
        if (!listRef.current || !expandedHumanId) return;

        const index = humansAtMarker.findIndex(
          (h) => h.wikidata_id === expandedHumanId
        );

        if (index !== -1) {
          listRef.current.scrollToItem(index, 'smart');
        }
    }, [expandedHumanId, humansAtMarker]);

    const handleRowClick = (human) => {
        const alreadyFocused =
        sidebarMode === 'location' &&
        selectedListHuman?.wikidata_id === human.wikidata_id;

        if (alreadyFocused) {
            // Just expand the info — skip the flyTo
            setExpandedHumanId(human.wikidata_id);
            return;
        }

        // Otherwise, trigger flyTo + highlight
        setSelectedListHuman(human);
        setExpandedHumanId(human.wikidata_id);
        onSelectPerson?.(human); // <-- still triggers map behavior
    };

    // === Render one row in the scrollable list ===
    const renderHumanRow = useCallback(({ index, style }) => {
      const human = humansAtMarker[index];
      const isSelected = selectedListHuman?.wikidata_id === human.wikidata_id;
      const isExpanded = expandedHumanId === human.wikidata_id;

      return (
        <div
          key={human.wikidata_id}
          style={{
            ...style,
            padding: '0 10px',
            display: 'flex',
            flexDirection: 'column',
            borderBottom: '1px solid #ddd',
            boxSizing: 'border-box',
            backgroundColor: isSelected ? 'rgba(242, 140, 177, 0.25)' : undefined,
          }}
        >
          {/* Name row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <div
              onClick={() => handleRowClick(human)}
              style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', cursor: 'pointer', }}
            >
              <OverflowTooltip tooltipText={human.name}>
                {human.name} {human.birth_year ? `(${human.birth_year})` : ''}
              </OverflowTooltip>
            </div>

            {/* Expand/collapse icon */}
            <div
              onClick={(e) => {
                e.stopPropagation(); // prevent flying to marker
                setExpandedHumanId(isExpanded ? null : human.wikidata_id);
              }}
              style={{ marginLeft: 8, cursor: 'pointer' }}
            >
              {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            </div>
          </div>

            {isExpanded && (
              <div style={{ fontSize: 13, padding: '6px 0 10px', color: '#444' }}>
                <div><strong>Wikidata ID:</strong> {human.wikidata_id}</div>
                <div><strong>Views:</strong> {human.article_recent_views?.toLocaleString() ?? 'N/A'}</div>
                <div><strong>Edits:</strong> {human.article_total_edits ?? 'N/A'}</div>
                <div><strong>Birthplace:</strong> {human.birth_place?.name ?? 'Unknown'}</div>
              </div>
            )}


        </div>
      );
    }, [humansAtMarker, onSelectPerson, selectedListHuman, expandedHumanId, setExpandedHumanId]);


  return (
    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', pointerEvents: 'none' }}>
      {/* Slide-in sidebar panel */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -SIDEBAR_WIDTH }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          width: SIDEBAR_WIDTH,
          height: '100%',
          background: '#f4f4f4',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '2px 0 8px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          boxSizing: 'border-box',
          zIndex: 10,
          position: 'absolute',
          pointerEvents: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ marginTop: BUTTON_SIZE + 10, padding: 10 }}>
            <h3>
              {sidebarMode === 'all' ? 'All Notable Humans' : 'People at This Location'}
            </h3>
        </div>

        {/* List container */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowX: 'hidden', }}>
          {humansAtMarker.length > 0 ? (
            <AutoSizer>
              {({ height, width }) => (
                <div className="sidebar-list-container" style={{ width: width, overflowX: 'hidden' }}>
                    <List
                      ref={listRef}
                      height={height}
                      itemCount={humansAtMarker.length}
                      itemSize={getItemSize} // <-- dynamic sizing!
                      width={width}
                    >
                      {renderHumanRow}
                    </List>
                </div>
              )}
            </AutoSizer>
          ) : (
            <p style={{ padding: '10px', color: '#666' }}>
              Click a marker to view people born there.
            </p>
          )}
        </div>
      </motion.div>

      {/* Sidebar toggle button */}
      <motion.button
        onClick={() => {
          setSidebarTrigger('button');
          setSidebarOpen(!sidebarOpen);
        }}
        animate={{ x: sidebarOpen ? SIDEBAR_WIDTH + 10 : 10 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: 10,
          zIndex: 20,
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: '50%',
          border: '2px solid #fff',
          background: '#11b4da',
          color: '#fff',
          cursor: 'pointer',
          padding: 0,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Filter icon in center */}
          <FaFilter
            size={28}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          {/* Directional arrow depending on open/closed */}
          <motion.div
            animate={{ left: sidebarOpen ? 5 : BUTTON_SIZE - ARROW_SIZE - 8 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '57%',
              transform: 'translateY(-50%)',
            }}
          >
            {sidebarOpen ? <FaArrowLeft size={ARROW_SIZE} /> : <FaArrowRight size={ARROW_SIZE} />}
          </motion.div>
        </div>
      </motion.button>
    </div>
  );
};

export default Sidebar;
