import React, { } from 'react';

import {
    Box,
    Stack,
    TextField,
    FormControl,
    Select,
    MenuItem,
    ToggleButtonGroup,
    ToggleButton,
    RadioGroup,
    FormControlLabel,
    Radio
} from '@mui/material';
import {useTheme} from "@mui/material/styles";
import {ArrowDownward, ArrowUpward} from "@mui/icons-material";

const ListFilter = ({ filterState }) => {
    const theme = useTheme();

    const handleSortDirectionChange = (_, dir) => {
        if (dir !== null) filterState.setSortAsc(dir === 'asc');
    };

    return (
        <>
            <Box>
                <Box component="fieldset"
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1, pt:0,
                        '& legend': {
                          font: theme.typography.subtitle2,
                          fontSize: '0.875rem',
                        }
                    }}>
                    <Box component="legend">Search by Name</Box>
                    <FormControl component="div" sx={{p: 0}}>
                        <RadioGroup
                            row
                            name="nameMatchType"
                            value={filterState.nameMatchType}
                            onChange={(e) => filterState.setNameMatchType(e.target.value)}
                        >
                            <FormControlLabel
                                value="startswith"
                                control={<Radio size="small" />}
                                label="Starts with"
                                sx={{
                                    '& .MuiFormControlLabel-label': {
                                        fontSize: '0.8rem',
                                        textTransform: 'none',
                                    },
                                }}
                            />
                            <FormControlLabel
                                value="contains"
                                control={<Radio size="small" />}
                                label="Contains"
                                sx={{
                                    '& .MuiFormControlLabel-label': {
                                        fontSize: '0.8rem',
                                        textTransform: 'none',
                                    },
                                }}
                            />
                        </RadioGroup>
                    </FormControl>
                    <TextField
                        size="small"
                        value={filterState.searchQuery}
                        onChange={e => filterState.setSearchQuery(e.target.value)}
                        fullWidth
                    />
                </Box>
            </Box>

            <Box
                component="fieldset"
                sx={{
                    border: 1, borderColor: 'divider', borderRadius: 1, p: 1,
                    '& legend': { font: theme.typography.subtitle2, fontSize: '0.875rem' }
                }}
            >
                <Box component="legend">Sort List By</Box>
                <Stack direction="row" spacing={1} alignItems="center">
                    <FormControl fullWidth size="small">
                        <Select value={filterState.sortBy} onChange={e => filterState.setSortBy(e.target.value)}>
                            <MenuItem value="n">Name</MenuItem>
                            <MenuItem value="bd">Birth Date</MenuItem>
                            <MenuItem value="dd">Death Date</MenuItem>
                            <MenuItem value="cd">Wikipedia Created Date</MenuItem>
                            <MenuItem value="al">Wikipedia Article Length</MenuItem>
                            <MenuItem value="rv">Wikipedia Recent Views</MenuItem>
                            <MenuItem value="te">Wikipedia Total Edits</MenuItem>
                        </Select>
                    </FormControl>
                    <ToggleButtonGroup
                        value={filterState.sortAsc ? 'asc' : 'desc'}
                        exclusive onChange={handleSortDirectionChange}
                        size="small" color="primary"
                    >
                        <ToggleButton value="asc"><ArrowDownward fontSize="small"/></ToggleButton>
                        <ToggleButton value="desc"><ArrowUpward fontSize="small"/></ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
            </Box>
        </>
    )
};

export default ListFilter;