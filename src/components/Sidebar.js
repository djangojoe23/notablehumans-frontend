import React, { useEffect, useState, useRef } from 'react';

import { Box, Paper, Typography, ListItem, ListItemText, Stack } from '@mui/material';
import {useTheme} from "@mui/material/styles";
import ListIcon from "@mui/icons-material/List";
import FilterListIcon from "@mui/icons-material/FilterList";

import {motion} from "framer-motion";
import AutoSizer from 'react-virtualized-auto-sizer';
import {VariableSizeList as VirtualList} from "react-window";

import SidebarToggleButton from './SidebarToggleButton';
import ListFilter from './ListFilter'
import AttributeFilter from './AttributeFilter'
import { formatYear } from '../utils/formatDates';
import OverflowTooltip from './OverflowTooltip';


const Sidebar = ({humans, SIDEBAR_WIDTH, globeState, filterState }) => {
    const theme = useTheme();
    const TOGGLE_BUTTON_SIZE = 50;
    const TOGGLE_BUTTON_SPACING = 10;
    const getItemSize = () => 36;

    const listRef = useRef(null);
    const [activeTab, setActiveTab] = useState('list');

    const handleRowClick = async (human) => {
        console.log(human)
    };

    const renderRow = ({ index, style }) => {
        const human = humans[index];
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
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.06)', },
                    borderBottom: index < humans.length - 1 ? '1px solid #e0e0e0' : 'none',
                    cursor: 'pointer',
                }}
            >
                <ListItemText
                    primary={
                        <OverflowTooltip tooltipText={`${human.n}${human.by != null ? ` (${formatYear(human.by)}` : ''} - ${human.dy != null ? ` ${formatYear(human.dy)})` : '?)'}`} >
                            {human.n} {human.by != null ? `(${formatYear(human.by)}` : ''} - {human.dy != null ? `${formatYear(human.dy)})` : '?)'}
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
                        ml: -3,
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
                                backgroundColor: theme.palette.primary.main,
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
                                backgroundColor: theme.palette.primary.main,
                                zIndex: 1,
                            }}
                        />
                        </>
                    )}
                </Box>
            </ListItem>
        );
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
                <Box display="flex" flexDirection="column" flex={1} minHeight={0} sx={{mt: 1, p: .5, pt: 1}}>
                    <Stack spacing={1} sx={{ flex: 1, minHeight: 0 }}>
                        {activeTab === 'list' && (
                            <>
                                <ListFilter filterState={filterState}/>
                                <Box sx={{ borderTop: '1px solid', borderColor: 'grey.300', mt: 1 }} />
                                <Box display="flex" flexDirection="column" flex={1} minHeight={0}>
                                    <Box flex={1} minHeight={0}>
                                        <AutoSizer>
                                            {({ height, width }) =>
                                                humans.length > 0 ? (
                                                    <VirtualList
                                                        ref={listRef}
                                                        height={height}
                                                        itemCount={humans.length}
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
                                                            No notable humans found.
                                                        </Typography>
                                                    </Box>
                                                )
                                            }
                                        </AutoSizer>
                                    </Box>
                                </Box>
                            </>
                        )}
                        {activeTab === 'filter' && (
                            <Box flex={1} overflow="auto">
                                <AttributeFilter filterState={filterState} />
                            </Box>
                        )}
                    </Stack>
                </Box>
            </Paper>

            <SidebarToggleButton
                tab="list"
                Icon={ListIcon}
                top={TOGGLE_BUTTON_SPACING}
                globeState={globeState}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                BUTTON_SIZE={TOGGLE_BUTTON_SIZE}
                SIDEBAR_WIDTH={SIDEBAR_WIDTH}
            />

              {/* Filters toggle button below Browse (i.e. top = BUTTON_SIZE + 2*SPACING) */}
            <SidebarToggleButton
                tab="filter"
                Icon={FilterListIcon}
                top={TOGGLE_BUTTON_SIZE + 2*TOGGLE_BUTTON_SPACING}
                globeState={globeState}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                BUTTON_SIZE={TOGGLE_BUTTON_SIZE}
                SIDEBAR_WIDTH={SIDEBAR_WIDTH}
            />
        </Box>
    );
};

export default Sidebar;