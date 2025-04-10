import React from 'react';
import { motion } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FaFilter, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import { SIDEBAR_WIDTH, BUTTON_SIZE, ARROW_SIZE } from '../constants/layout';


const Sidebar = ({
                 sidebarOpen,
                 setSidebarOpen,
                 sidebarTrigger,
                 setSidebarTrigger,
                 humansAtMarker,
                 lastMarkerCoordinates,
                 pendingClusterExpansion,
                 setPendingClusterExpansion
                }) => {

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', pointerEvents: 'none' }}>
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -SIDEBAR_WIDTH }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onAnimationComplete={() => {
          if (!sidebarOpen) {
            setSidebarTrigger(null); // Optional: reset trigger after closing
          }
        }}
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
        <div style={{ marginTop: BUTTON_SIZE + 10, padding: 10 }}>
          <h3>Notable Humans</h3>
          {/*<p>{humans.length} entries</p>*/}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, padding: '0 10px' }}>
          {humansAtMarker.length > 0 ? (
            <div style={{ flex: 1 }}>
                <AutoSizer>
                  {({ height, width }) => (
                    <List
                      height={height}
                      itemCount={humansAtMarker.length}
                      itemSize={40}
                      width={width}
                    >
                      {({ index, style }) => {
                        const human = humansAtMarker[index];

                        return (
                          <div
                            key={human.wikidata_id}
                            style={{
                              ...style,
                              display: 'flex',
                              alignItems: 'center',
                              borderBottom: '1px solid #ddd',
                              padding: '0 10px',
                              fontSize: 14,
                              fontWeight: 500,
                            }}
                          >
                            {human.name} {human.birth_year ? `(${human.birth_year})` : ''}
                          </div>
                        );
                      }}
                    </List>
                  )}
                </AutoSizer>
            </div>
          ) : (
            <p style={{ padding: '10px', color: '#666' }}>
              Click a marker to view people born there.
            </p>
          )}
        </div>

      </motion.div>

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
          <FaFilter size={28} style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)'
          }} />
          <motion.div
            animate={{ left: sidebarOpen ? 5 : BUTTON_SIZE - ARROW_SIZE - 8 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '57%',
              transform: 'translateY(-50%)'
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
