import React from 'react';
import { motion } from 'framer-motion';
import { FaFilter, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

const SidebarComponent = ({ sidebarOpen, setSidebarOpen }) => {
  // Define dimension constants
  const SIDEBAR_WIDTH = 400; // Full width when open
  const BUTTON_SIZE = 50;    // Toggle button size
  const ARROW_SIZE = 14;     // Arrow icon size

  // Define arrow left offsets based on sidebar state
  const arrowLeftOpen = 5;
  const arrowLeftClosed = BUTTON_SIZE - ARROW_SIZE - 8; // e.g., 50 - 14 - 8 = 28

  // Style objects can be defined outside the return if reused
  const sidebarContainerStyle = {
    background: '#f4f4f4',
    overflow: 'hidden',
    height: '100%',
    boxSizing: 'border-box',
    flexShrink: 0,
  };

  const toggleButtonStyle = {
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
  };

  const filterIconStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  const arrowContainerStyle = {
    position: 'absolute',
    top: '57%',
    transform: 'translateY(-50%)',
  };

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex' }}>
      {/* Sidebar container with animated width */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? SIDEBAR_WIDTH : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={sidebarContainerStyle}
      >
        {sidebarOpen && (
          <div style={{ marginTop: BUTTON_SIZE + 10, padding: 10 }}>
            <h3>Locations</h3>
            <p>hello</p>
            {/* Additional sidebar content */}
          </div>
        )}
      </motion.div>

      {/* Toggle button */}
      <motion.button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        animate={{ left: sidebarOpen ? SIDEBAR_WIDTH - BUTTON_SIZE - 10 : 10 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={toggleButtonStyle}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Main filter icon */}
          <FaFilter size={28} style={filterIconStyle} />
          {/* Animated arrow container */}
          <motion.div
            animate={{ left: sidebarOpen ? arrowLeftOpen : arrowLeftClosed }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={arrowContainerStyle}
          >
            {sidebarOpen ? (
              <FaArrowLeft size={ARROW_SIZE} />
            ) : (
              <FaArrowRight size={ARROW_SIZE} />
            )}
          </motion.div>
        </div>
      </motion.button>
    </div>
  );
};

export default SidebarComponent;
