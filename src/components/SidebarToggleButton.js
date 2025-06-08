import React from 'react';
import { IconButton, useTheme } from '@mui/material';
import { motion } from 'framer-motion';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// Props:
// - tab:        string name of this tab (e.g. 'browse' or 'filters')
// - Icon:       the “inactive” icon component (e.g. ListIcon or FilterListIcon)
// - top:        CSS top offset (number of pixels) for positioning
// - globeState: your state object that has `sidebarOpen`
// - activeTab:  the currently‐active tab string
// - setActiveTab: state setter to switch tabs
// - BUTTON_SIZE, SIDEBAR_WIDTH: the constants you already have
const SidebarToggleButton = ({
    tab,
    Icon,
    top,
    globeState,
    activeTab,
    setActiveTab,
    BUTTON_SIZE,
    SIDEBAR_WIDTH
}) => {
    const theme = useTheme();

    // Should we show the “ChevronLeft” (i.e. “close”) icon?
    const isActive = globeState.sidebarOpen && activeTab === tab;

    // When clicked: if already open on this tab, do nothing (or close if you want).
    // Otherwise, open & switch activeTab.
    const handleClick = () => {
        if (globeState.sidebarOpen && activeTab === tab) {
            // Already open on this tab → keep sidebar open but maybe do nothing.
            // If you’d prefer clicking again closes it, uncomment the next line:
            globeState.setSidebarOpen(false);
        } else {
            globeState.setSidebarOpen(true);
            setActiveTab(tab);
        }
    };

    return (
        <motion.div
            animate={{ x: globeState.sidebarOpen ? SIDEBAR_WIDTH + 10 : 10 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
                position: 'absolute',
                top: top,
                zIndex: 20,
                width: BUTTON_SIZE,
                height: BUTTON_SIZE,
                pointerEvents: 'auto',
            }}
        >
      <IconButton
        onClick={handleClick}
        sx={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '2px solid #666',
            backgroundColor: theme.palette.primary.main,
            color: '#666',
        }}
      >
        {isActive ? (
            <ChevronLeftIcon />
        ) : (
            <Icon />
        )}
      </IconButton>
    </motion.div>
    );
};

export default SidebarToggleButton;
