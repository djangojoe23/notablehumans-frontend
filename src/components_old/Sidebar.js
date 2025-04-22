import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  FaFilter,
  FaArrowRight,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaTimes,
} from 'react-icons/fa';
import { SIDEBAR_WIDTH, BUTTON_SIZE, ARROW_SIZE } from '../constants/layout';
import HumanDetail from '../components/HumanDetail';
import SortControls from '../components/SortControls';
import { formatYear } from '../utils/format';
import { sortHumansComparator } from '../utils/sortHumans';


const OverflowTooltip = ({ children, tooltipText }) => {
  const textRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
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
      }}
    >
      {children}
    </div>
  );
};

const Sidebar = (props) => {
  const listRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getItemSize = () => 40;

  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0, true);
    }
  }, [props.humansAtMarker]);

  useEffect(() => {
    if (!props.selectedListHuman) return;
        const stillExists = props.humansAtMarker.some((h) => h.id === props.selectedListHuman.id);
        if (!stillExists) {
        props.setSelectedListHuman(null);
        props.setExpandedHumanId(null);
    }
  }, [props.humansAtMarker, props.selectedListHuman, props.setExpandedHumanId, props.setSelectedListHuman]);

  const locateHumanAndExpandDetail = (human) => {
    props.setSelectedListHuman(human);
    props.setExpandedHumanId(human.id);
    props.onSelectPerson?.(human, {source: 'sidebar'});
  };

  const toggleDetailOnly = (human) => {
    props.setExpandedHumanId((prevId) => (prevId === human.id ? null : human.id));
    props.setSelectedListHuman(human);
  };

  const filteredHumans = useMemo(() => {
      if (!searchQuery.trim()) return props.humansAtMarker;
      return props.humansAtMarker.filter(human =>
        human.n.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }, [props.humansAtMarker, searchQuery]);

  const sortedHumans = useMemo(() => {
    const sorted = [...filteredHumans].sort(sortHumansComparator(props.sortBy, props.sortAsc));
      return sorted;
  }, [filteredHumans, props.sortBy, props.sortAsc]);

  useEffect(() => {
      if (!listRef.current || !props.expandedHumanId) return;

      const index = sortedHumans.findIndex(h => h.id === props.expandedHumanId);
      if (index === -1) return;

      // Use a slight delay to allow layout shift (detail panel animation) to settle
      setTimeout(() => {
        listRef.current.scrollToItem(index, 'smart');
      }, 300); // match your detail panel animation duration
  }, [props.expandedHumanId, sortedHumans]);

  const renderHumanRow = useCallback(
    ({ index, style }) => {
      const human = sortedHumans[index];

      return (
        <div
          key={human.id}
          className="sidebar-row"
          onClick={() => toggleDetailOnly(human)}
          style={{
            ...style,
            padding: '0 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #ddd',
            boxSizing: 'border-box',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            <OverflowTooltip tooltipText={human.n}>
              {human.n} {human.by != null ? `(${formatYear(human.by)})` : ''}
            </OverflowTooltip>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              locateHumanAndExpandDetail(human);
            }}
            style={{ marginLeft: 8, cursor: 'pointer' }}
            title="Fly to on globe"
          >
            <FaMapMarkerAlt />
          </div>
        </div>
      );
    },
    [sortedHumans, props.selectedListHuman]
  );

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', pointerEvents: 'none' }}>
      <motion.div
        initial={false}
        animate={{ x: props.sidebarOpen ? 0 : -SIDEBAR_WIDTH }}
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
        <div style={{ marginTop: 0, padding: 10 }}>
          <h3 style={{ margin: 0 }}>
            {props.sidebarMode === 'all' ? 'All Notable Humans' : 'People at This Location'} ({sortedHumans.length})
          </h3>
        </div>

      <div style={{ margin: '10px', padding: '5px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            style={{
              width: '100%',
              padding: '8px',
              boxSizing: 'border-box',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        {sortedHumans.length > 0 && (
          <SortControls
            sortBy={props.sortBy}
            setSortBy={props.setSortBy}
            sortAsc={props.sortAsc}
            setSortAsc={props.setSortAsc}
          />
        )}

        {/* Content section: list + detail */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Scrollable list */}
          <div style={{ flex: 1, minHeight: 0 }}>
            {sortedHumans.length > 0 ? (
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    ref={listRef}
                    height={height}
                    itemCount={sortedHumans.length}
                    itemSize={getItemSize}
                    width={width}
                  >
                    {renderHumanRow}
                  </List>
                )}
              </AutoSizer>
            ) : (
              <p style={{ padding: '10px', color: '#666' }}>
                Click a marker to view people born there.
              </p>
            )}
          </div>

          {/* Detail panel below */}
          <AnimatePresence>
            {props.expandedHumanId && props.selectedListHuman?.id === props.expandedHumanId && (
              <motion.div
                key={props.expandedHumanId}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  overflow: 'hidden',
                  background: '#fff',
                  borderTop: '1px solid #ccc',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ padding: 10, position: 'relative' }}>
                  <button
                    onClick={() => props.setExpandedHumanId(null)}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title="Collapse detail panel"
                  >
                    <FaTimes />
                  </button>
                  <HumanDetail person={props.selectedListHuman} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Sidebar toggle button */}
      <motion.button
        onClick={() => {
          props.setSidebarTrigger('button');
          props.setSidebarOpen(!props.sidebarOpen);
        }}
        animate={{ x: props.sidebarOpen ? SIDEBAR_WIDTH + 10 : 10 }}
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
          <FaFilter
            size={28}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
          <motion.div
            animate={{ left: props.sidebarOpen ? 5 : BUTTON_SIZE - ARROW_SIZE - 8 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '57%',
              transform: 'translateY(-50%)',
            }}
          >
            {props.sidebarOpen ? <FaArrowLeft size={ARROW_SIZE} /> : <FaArrowRight size={ARROW_SIZE} />}
          </motion.div>
        </div>
      </motion.button>
    </div>
  );
};

export default Sidebar;
