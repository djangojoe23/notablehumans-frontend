import React, { useEffect, useMemo, useRef } from 'react';
import { Box, Paper, Typography, ListItem, ListItemText, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { motion, AnimatePresence } from 'framer-motion';
import { VariableSizeList as VirtualList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import { SIDEBAR_WIDTH, BUTTON_SIZE } from '../constants/layout';
import { formatYear } from '../utils/format';
import OverflowTooltip from './OverflowTooltip';
import HumanDetail from './HumanDetail';
import Filter from './Filter';


const Sidebar = ({ notableHumans = [], filters, ...globeState }) => {
  const listRef = useRef(null);

  const getItemSize = () => 36; // fixed row height for now

  const handleRowClick = (human) => {
    const globe = globeState.globeRef.current;
    if (!globe) return;

    globe.flyTo({
      center: [human.lng, human.lat],
      zoom: globe.getZoom(),
      essential: true,
    });

    globeState.setDetailedHuman(human);
  };

  const renderRow = ({ index, style }) => {
    const human = notableHumans[index];
    const isSelected = human.id === globeState.detailedHuman?.id;

    return (
      <ListItem
        component="div"
        disableGutters
        dense
        selected={isSelected}
        onClick={() => handleRowClick(human)}
        style={{ ...style, padding: 0 }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          py: 0.5,
          minHeight: '36px',
          backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
          },
          borderBottom: index < notableHumans.length - 1 ? '1px solid #e0e0e0' : 'none',
          cursor: 'pointer',
        }}
      >
        <ListItemText
          primary={
            <OverflowTooltip tooltipText={`${human.n}${human.by != null ? ` (${formatYear(human.by)})` : ''}`}>
              {human.n} {human.by != null ? `(${formatYear(human.by)})` : ''}
            </OverflowTooltip>
          }
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontSize: '14px',
            px: 2,
          }}
        />
            <Box
            sx={{
              width: 40,
              height: 24,
              position: 'relative',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible',
                ml: -3, // <-- scoot it left
            }}
            >
                {isSelected && (
                <>
                  {/* Pulsing halo */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#f28cb1',
                      opacity: 0.4,
                      transform: 'scale(calc(1 + var(--pulse-ratio) * 3))',
                      transition: 'transform 16ms linear, opacity 16ms linear',
                      zIndex: 0,
                    }}
                  />
                  {/* Static center dot */}
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#f28cb1',
                      zIndex: 1,
                    }}
                  />
                </>
              )}
            </Box>
      </ListItem>
    );
  };

  useEffect(() => {
    const detailed = globeState.detailedHuman;
    const open = globeState.sidebarOpen;
    if (!detailed || !open || !listRef.current) return;

    const index = notableHumans.findIndex((h) => h.id === detailed.id);
    if (index !== -1) {
      setTimeout(() => {
        listRef.current.scrollToItem(index, 'auto');
      }, 300);
    }
  }, [globeState.detailedHuman, globeState.sidebarOpen, notableHumans]);

  const scrollToPerson = (person) => {
    const index = notableHumans.findIndex((h) => h.id === person.id);
    if (index !== -1 && listRef.current) {
      listRef.current.scrollToItem(index, 'auto');
    }
  };

  const flyToMarker = ({ lng, lat }) => {
    const globe = globeState.globeRef.current;
    if (!globe) return;
    globe.flyTo({ center: [lng, lat], zoom: globe.getZoom() });
  };

  return (
    <Box position="absolute" top={0} left={0} height="100%" pointerEvents="none">
      <Paper
        component={motion.div}
        initial={false}
        animate={{ x: globeState.sidebarOpen ? 0 : -SIDEBAR_WIDTH }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        square
        elevation={4}
        sx={{
          width: SIDEBAR_WIDTH,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'absolute',
          zIndex: 10,
          pointerEvents: 'auto',
        }}
      >
        <Box px={2} py={1}>
          <Typography variant="subtitle1" fontWeight="bold">
            All Notable Humans ({notableHumans.length})
          </Typography>
        </Box>

          <Filter
            sortBy={filters.sortBy}
            setSortBy={filters.setSortBy}
            sortAsc={filters.sortAsc}
            setSortAsc={filters.setSortAsc}
            searchQuery={filters.searchQuery}
            setSearchQuery={filters.setSearchQuery}
          />

        <Box display="flex" flexDirection="column" flex={1} minHeight={0}>
          <Box flex={1} minHeight={0}>
            <AutoSizer>
              {({ height, width }) => (
              notableHumans.length > 0 ? (

                <VirtualList
                  ref={listRef}
                  height={height}
                  itemCount={notableHumans.length}
                  itemSize={getItemSize}
                  width={width}
                >
                  {renderRow}
                </VirtualList>
                  ) : (
                  <Box
                    height={height}
                    width={width}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    p={2}
                  >
                    <Typography variant="body2" color="textSecondary" align="center">
                      No humans found matching your filters.
                    </Typography>
                  </Box>
                )
              )}
            </AutoSizer>
          </Box>

          {/* Expanding Detail Panel */}
          <AnimatePresence>
            {globeState.detailedHuman && (
              <Paper
                component={motion.div}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                square
                sx={{
                  maxHeight: '34vh',
                  overflowY: 'auto',
                  borderTop: '1px solid',
                  borderColor: 'grey.300',
                  bgcolor: '#fff',
                }}
              >
                <HumanDetail
                    person={globeState.detailedHuman}
                    scrollToPerson={scrollToPerson}
                    onFlyTo={flyToMarker}
                    onClose={() => globeState.setDetailedHuman(null)}
                  />
              </Paper>
            )}
          </AnimatePresence>
        </Box>
      </Paper>

      {/* Sidebar Toggle Button */}
      <motion.div
        animate={{ x: globeState.sidebarOpen ? SIDEBAR_WIDTH - 60 : 10 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: 10,
          zIndex: 20,
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          pointerEvents: 'auto',
        }}
      >
        <IconButton
          onClick={() => globeState.setSidebarOpen(!globeState.sidebarOpen)}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '2px solid #666',
            backgroundColor: '#f28cb1',
            color: '#666',
          }}
        >
          {globeState.sidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </motion.div>
    </Box>
  );
};

export default Sidebar;
