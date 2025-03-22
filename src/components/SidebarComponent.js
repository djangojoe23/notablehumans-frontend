import React from 'react';
import { motion } from 'framer-motion';
import { FaFilter, FaArrowRight, FaArrowLeft } from 'react-icons/fa';

const SidebarComponent = ({ sidebarOpen, setSidebarOpen }) => {
    const sidebarWidth = 400; // Full width when open
    const buttonSize = 50;    // Toggle button size
    const arrowSize = 14;     // Arrow icon size

    // Define the arrow's left offset for each state
    const arrowLeftOpen = 5;
    const arrowLeftClosed = buttonSize - arrowSize - 5; // e.g. 40 - 12 - 5 = 23

    return (
        <div style={{ position: 'relative', height: '100%', display: 'flex' }}>
            {/* Sidebar container that animates its width */}
            <motion.div
                initial={false}
                animate={{ width: sidebarOpen ? sidebarWidth : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{
                    background: '#f4f4f4',
                    overflow: 'hidden',
                    height: '100%',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                }}
            >
                {sidebarOpen && (
                    <div style={{ marginTop: buttonSize + 10, padding: 10 }}>
                        <h3>Locations</h3>
                        <p>hello</p>
                        {/* Additional sidebar content */}
                    </div>
                )}
            </motion.div>

            {/* Toggle button as a motion component */}
            <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                animate={{ left: sidebarOpen ? sidebarWidth - buttonSize - 10 : 10 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    top: 10,
                    zIndex: 20,
                    width: buttonSize,
                    height: buttonSize,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#007bff',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: 0,
                }}
            >
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {/* Main filter icon, centered */}
                <FaFilter
                    size={28}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                />
                {/* Arrow icon container, which animates its left offset */}
                <motion.div
                    animate={{ left: sidebarOpen ? arrowLeftOpen : arrowLeftClosed }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{
                        position: 'absolute',
                        top: '57%',
                        transform: 'translateY(-50%)',
                    }}
                >
                    {sidebarOpen ? (
                      <FaArrowLeft size={arrowSize} />
                    ) : (
                      <FaArrowRight size={arrowSize} />
                    )}
                </motion.div>
            </div>
            </motion.button>
        </div>
        );
    };

export default SidebarComponent;
