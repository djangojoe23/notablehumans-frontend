import React, {useEffect, useMemo, useRef} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FaFilter, FaArrowRight, FaArrowLeft, FaTimes, FaMapMarkerAlt} from 'react-icons/fa';
import { SIDEBAR_WIDTH, BUTTON_SIZE, ARROW_SIZE } from '../constants/layout';
import { sortHumansComparator } from '../utils/sortHumans';
import {formatYear} from "../utils/format";
import OverflowTooltip from "./OverflowTooltip"
import HumanDetail from './HumanDetail';
import SortControls from './SortControls';
import '../styles/components/sidebar.css';


const Sidebar = (globeState) => {
    const listRef = useRef(null);

    const sortedHumans = useMemo(() => {
      const features = globeState.notableHumanData?.features ?? [];
      const humans = features.map((f) => ({
          ...f.properties,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0]
      }));
      return [...humans].sort(sortHumansComparator(globeState.sortBy, globeState.sortAsc));
    }, [globeState.notableHumanData, globeState.sortBy, globeState.sortAsc]);

    const getItemSize = () => 36; // fixed row height for now

    const handleRowClick = (human) => {
        const globe = globeState.globeRef.current;
        if (!globe) return;

        // 1. Keep current zoom, pan to the human’s coords
        const currentZoom = globe.getZoom();
        globe.flyTo({
            center: [human.lng, human.lat],
            zoom: currentZoom,       // lock zoom
            essential: true,         // animation
        });

        // 2. Remember who’s selected
        globeState.setDetailedHuman(human);
    };

    const renderRow = ({ index, style }) => {
        const human = sortedHumans[index];
        return (
          <div
            key={human.id}
            className={`sidebar-row${human.id === globeState.detailedHuman?.id ? ' pulsing' : ''}`}
            style={{
                ...style,
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #ddd',
                boxSizing: 'border-box',
                fontSize: '14px',
                cursor: 'pointer',
            }}
            onClick={() => handleRowClick(human)}
          >
            <div
                style={{
                  flex: 1,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
            >
                <OverflowTooltip tooltipText={`${human.n}${human.by != null ? ` (${formatYear(human.by)})` : ''}`}>
                  {human.n} {human.by != null ? `(${formatYear(human.by)})` : ''}
                </OverflowTooltip>
            </div>

            {human.id === globeState.detailedHuman?.id && (
                <FaMapMarkerAlt
                  className="pulse-icon ml-2"
                  title="This is the selected person’s marker"
                />
            )}
          </div>
        );
    };

    useEffect(() => {
      const detailed = globeState.detailedHuman;
      const open     = globeState.sidebarOpen;
      if (!detailed || !open || !listRef.current) return;

      const index = sortedHumans.findIndex(h => h.id === detailed.id);
      if (index !== -1) {
        // match your panel‑open animation duration (0.3s)
        setTimeout(() => {
          listRef.current.scrollToItem(index, 'auto');
        }, 300);
      }
    }, [globeState.detailedHuman, globeState.sidebarOpen, sortedHumans]);


    const scrollToPerson = (person) => {
      const index = sortedHumans.findIndex(h => h.id === person.id);
      if (index !== -1 && listRef.current) {
        // new: always pin to the bottom
        listRef.current.scrollToItem(index, 'auto');
      }
    };

    const flyToMarker = ({ lng, lat }) => {
      const globe = globeState.globeRef.current;
      if (!globe) return;
      const currentZoom = globe.getZoom();
      globe.flyTo({ center: [lng, lat], zoom: currentZoom });
    };

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', pointerEvents: 'none' }}>
          <motion.div
            initial={false}
            animate={{ x: globeState.sidebarOpen ? 0 : -SIDEBAR_WIDTH }}
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
                All Notable Humans ({sortedHumans.length})
              </h3>
            </div>

            {sortedHumans.length > 0 && (
              <SortControls
                sortBy={globeState.sortBy}
                setSortBy={globeState.setSortBy}
                sortAsc={globeState.sortAsc}
                setSortAsc={globeState.setSortAsc}
              />
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                minHeight: 0,
              }}
            >
                {/* Scrollable list using react-window */}
                <div style={{ flex: 1, minHeight: 0 }}>
                  <AutoSizer>
                    {({ height, width }) => (
                      <List
                        ref={listRef}
                        height={height}
                        itemCount={sortedHumans.length}
                        itemSize={getItemSize}
                        width={width}
                      >
                        {renderRow}
                      </List>
                    )}
                  </AutoSizer>
                </div>

                {/* Expanding detail view */}
                <AnimatePresence>
                  {globeState.detailedHuman && (
                    <motion.div
                      key={globeState.detailedHuman.id}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                          maxHeight: '34vh',
                        overflowY: 'auto',
                        background: '#fff',
                        borderTop: '1px solid #ccc',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ padding: 10, position: 'relative' }}>
                        <button
                          onClick={() => globeState.setDetailedHuman(null)}
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
                        <HumanDetail
                            person={globeState.detailedHuman}
                            scrollToPerson={scrollToPerson}
                            onFlyTo={flyToMarker}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
          </motion.div>

          {/* Sidebar toggle button */}
          <motion.button
            onClick={() => {
              globeState.setSidebarOpen(!globeState.sidebarOpen);
            }}
            animate={{ x: globeState.sidebarOpen ? SIDEBAR_WIDTH - 60 : 10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 10,
              zIndex: 20,
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              borderRadius: '50%',
              border: '2px solid #666',
              background: '#f28cb1',
              color: '#666',
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
                animate={{ left: globeState.sidebarOpen ? 5 : BUTTON_SIZE - ARROW_SIZE - 8 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  top: '57%',
                  transform: 'translateY(-50%)',
                }}
              >
                {globeState.sidebarOpen ? <FaArrowLeft size={ARROW_SIZE} /> : <FaArrowRight size={ARROW_SIZE} />}
              </motion.div>
            </div>
          </motion.button>
        </div>
    );
};

export default Sidebar;
