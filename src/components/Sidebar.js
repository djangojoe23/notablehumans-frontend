import React from 'react';
import { motion } from 'framer-motion';
import { FaFilter, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

const Sidebar = ({ mapRef, sidebarOpen, setSidebarOpen }) => {
  const SIDEBAR_WIDTH = 400;
  const BUTTON_SIZE = 50;
  const ARROW_SIZE = 14;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', pointerEvents: 'none' }}>
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -SIDEBAR_WIDTH }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onAnimationComplete={() => {
          if (mapRef?.current && typeof mapRef.current.panBy === 'function') {
            const panDistance = sidebarOpen ? -SIDEBAR_WIDTH / 2 : SIDEBAR_WIDTH / 2;
            mapRef.current.panBy([panDistance, 0], {
              duration: 500,
              easing: t => t,
            });
          }
        }}
        style={{
          width: SIDEBAR_WIDTH,
          height: '100%',
          background: '#f4f4f4',
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
          <p>List goes here...</p>
        </div>
      </motion.div>

      <motion.button
        onClick={() => setSidebarOpen(!sidebarOpen)}
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
