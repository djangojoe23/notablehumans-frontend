import React, { useEffect, useState } from 'react';
import axios from "axios";

import {
    Box,
    Stack,
    TextField,
    FormControl,
    Select,
    MenuItem,
    InputAdornment,
    ToggleButtonGroup,
    ToggleButton,
    Tooltip,
    Typography,
    Button,
    IconButton,
} from '@mui/material';
import {useTheme} from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import ProgressiveAutocomplete from "../utils/ProgressiveAutocomplete";

const AttributeFilter = ({ filterState }) => {
    const theme = useTheme();

    const abbreviatedMonths = ['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    const [attributeOptions, setAttributeOptions] = useState({});
    // load attribute options
    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/attributes-dict/`)
        .then(result => {
            const withMissing = {};
            Object.entries(result.data).forEach(([key, opts]) => {
                withMissing[key] = ['__MISSING__', ...opts];
            });
            setAttributeOptions(withMissing);
        })
        .catch(console.error);
    }, []);

    const [withinSign, setWithinSign] = useState('plus');  // 'plus' or 'minus'
    useEffect(() => {
        if (filterState.filterYearRange != null) {
            filterState.setFilterYearRange(prev => {
                const abs = Math.abs(prev);
                return withinSign === 'minus' ? -abs : abs;
            });
        }
    }, [withinSign]);

    const [filterYearText, setFilterYearText] = useState(
        filterState.filterYear != null ? String(filterState.filterYear) : ''
    );

    useEffect(() => {
        setFilterYearText(filterState.filterYear != null ? String(filterState.filterYear) : '');
    }, [filterState.filterYear]);

    return (
        <>
            <Box sx={{ height: '100%', overflowY: 'auto' }}>
                {/* Date Filter */}
                <Box sx={{ display: 'flex', gap: 0, my: 0}}>
                    <Box
                        component="fieldset"
                        sx={{
                            flex: 1,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 1,
                            px: 0.5,
                            '& legend': {}
                        }}
                    >
                        <Box component="legend">
                            <ToggleButtonGroup
                                value={filterState.dateFilterType}
                                exclusive
                                size="small"
                                onChange={(_, v) => v && filterState.setDateFilterType(v)}
                                sx={{
                                    '& .MuiToggleButton-root': {
                                        ...theme.typography.subtitle2,
                                        textTransform: 'none'
                                    },
                                    '& .Mui-selected': {
                                        fontWeight: theme.typography.subtitle2.fontWeight + 100
                                    }
                                }}
                            >
                                <ToggleButton value="born">Born</ToggleButton>
                                <ToggleButton value="died">Died</ToggleButton>
                                <Tooltip title="Enter year to enable" placement="top">
                                    <span>
                                        <ToggleButton value="alive" disabled={!filterState.filterYear}>
                                            Alive
                                        </ToggleButton>
                                    </span>
                                </Tooltip>
                            </ToggleButtonGroup>
                        </Box>
                        <Box sx={{ display: 'flex', gap: .5}}>
                            <FormControl fullWidth size="small">
                                <Select
                                    displayEmpty
                                    value={filterState.filterMonth ?? ''}
                                    onChange={e => filterState.setFilterMonth(e.target.value === '' ? null : +e.target.value)}
                                >
                                    <MenuItem value=""><em>Month</em></MenuItem>
                                    {abbreviatedMonths.slice(1).map((m, i) => (
                                        <MenuItem key={i+1} value={i+1}>{m}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth size="small">
                                <Select
                                    displayEmpty
                                    value={filterState.filterDay ?? ''}
                                    onChange={e => filterState.setFilterDay(e.target.value === '' ? null : +e.target.value)}
                                >
                                    <MenuItem value=""><em>Day</em></MenuItem>
                                    {[...Array(31)].map((_, i) => (
                                        <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Tooltip title="Enter BCE as a negative number (e.g. –300 for 300 BC)">
                                <TextField
                                    placeholder="Year"
                                    variant="outlined"
                                    size="small"
                                    type="text"
                                    autoComplete="off"
                                    value={filterYearText}
                                    onChange={e => {
                                        const raw = e.target.value;
                                        // allow empty, lone '-', or a (signed) integer
                                        if (raw === '' || raw === '-' || /^-?\d+$/.test(raw)) {
                                            setFilterYearText(raw);
                                            // only commit to filterYear when there's at least one digit:
                                            if (raw === '' || raw === '-') {
                                                filterState.setFilterYear(null);
                                            } else {
                                                filterState.setFilterYear(parseInt(raw, 10));
                                            }
                                        }
                                    }}
                                    fullWidth
                                    slotProps={{
                                        htmlInput: {
                                            autoComplete: 'off',
                                            inputMode: 'numeric',
                                            pattern: '-?[0-9]*',
                                            onKeyDown: e => {
                                                const isMinus = e.key === '-';
                                                const isDigit = /^[0-9]$/.test(e.key);
                                                const isNav = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key);
                                                // only allow one leading '-' and digits
                                                if (
                                                    !isDigit &&
                                                    !isNav &&
                                                    !(isMinus && e.target.selectionStart === 0 && !e.target.value.includes('-'))
                                                ) {
                                                    e.preventDefault();
                                                }
                                            }
                                        }
                                    }}
                                />
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* Years Since Fieldset */}
                    <Box
                        component="fieldset"
                        sx={{
                            width: '100px',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            p: 1,
                            px: 0,
                            '& legend': {
                                ...theme.typography.subtitle2,
                                fontWeight: theme.typography.subtitle2.fontWeight + 100,
                                lineHeight: 1.3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0
                            }
                        }}
                    >
                        <Box component="legend">
                            Or Within
                            <ToggleButtonGroup
                                size="small"
                                exclusive
                                value={withinSign}
                                onChange={(_, v) => v && setWithinSign(v)}
                                sx={{ pl: 0.5 }}
                            >
                                <ToggleButton sx={{p:0.5}} value="plus">+</ToggleButton>
                                <ToggleButton sx={{p:0.5}} value="minus">−</ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        <Tooltip title={filterState.filterYear == null ? "Enter year in date to enable" : ""} placement="top">
                            <span style={{ display: 'block' }}>
                                <TextField
                                    placeholder="0"
                                    variant="outlined"
                                    size="small"
                                    type="text"
                                    value={filterState.filterYearRange != null ? Math.abs(filterState.filterYearRange) : ''}
                                    onChange={e => {
                                        const raw = e.target.value;
                                        let val = raw === '' ? null : parseInt(raw, 10);
                                        if (val != null) {
                                            val = withinSign === 'minus' ? -Math.abs(val) : Math.abs(val);
                                        }
                                        filterState.setFilterYearRange(val);
                                    }}
                                    fullWidth
                                    disabled={filterState.filterYear == null}
                                    slotProps={{
                                        htmlInput: {
                                            // only positive integers
                                            min: 0,
                                            step: 1,
                                            inputMode: 'numeric',
                                            pattern: '[0-9]*',
                                            onKeyDown: e => {
                                                // allow only digits and navigation keys
                                                if (
                                                    e.key !== 'Backspace' &&
                                                    e.key !== 'Delete' &&
                                                    e.key !== 'ArrowLeft' &&
                                                    e.key !== 'ArrowRight' &&
                                                    !/^[0-9]$/.test(e.key)
                                                ) {
                                                    e.preventDefault();
                                                }
                                            }
                                        },
                                        input: {
                                            // end adornment slot
                                            endAdornment: <InputAdornment position="end">yrs</InputAdornment>
                                        }
                                    }}
                                    sx={{ px: 0.5 }}
                                />
                            </span>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Lived-to-be Filter */}
                <Stack
                    direction="row"
                    justifyContent="center"
                    alignItems="center"
                    spacing={1}
                    sx={{ px: 0, py: 0, pt: 2 }}
                >
                    <Typography variant="subtitle2">Lived to be</Typography>
                    <ToggleButtonGroup
                        value={filterState.filterAgeType}
                        exclusive
                        size="small"
                        onChange={(_, v) => v && filterState.setFilterAgeType(v)}
                        sx={{ '& .MuiToggleButton-root': { textTransform: 'none', minWidth: 56, px: 1 } }}
                    >
                        <ToggleButton value="min">at least</ToggleButton>
                        <ToggleButton value="exact">exactly</ToggleButton>
                        <ToggleButton value="max">at most</ToggleButton>
                    </ToggleButtonGroup>
                    <TextField
                        placeholder=""
                        variant="outlined"
                        size="small"
                        type="text"
                        value={filterState.filterAge ?? ''}
                        onChange={e => filterState.setFilterAge(e.target.value === '' ? null : +e.target.value)}
                        sx={{ width: 60 }}
                        slotProps={{
                            htmlInput: {
                                min: 0,
                                step: 1,
                                inputMode: 'numeric',
                                pattern: '[0-9]*',
                                onKeyDown: e => {
                                    if (
                                        e.key !== 'Backspace' &&
                                        e.key !== 'Delete' &&
                                        e.key !== 'ArrowLeft' &&
                                        e.key !== 'ArrowRight' &&
                                        !/^[0-9]$/.test(e.key)
                                    ) {
                                        e.preventDefault();
                                    }
                                }
                            }
                        }}
                    />
                    <Typography variant="subtitle2">years old.</Typography>
                </Stack>

                {/* Attribute Filters */}
                <Box
                    component="fieldset"
                    sx={{
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 1,
                        mt: 2,
                        '& legend': {
                            ...theme.typography.subtitle2,
                            fontWeight: theme.typography.subtitle2.fontWeight + 100,
                            lineHeight: 1.3
                        }
                    }}
                >
                    <Box component="legend">Attributes Filter</Box>
                    {filterState.attributeFilters.map(f => (
                        <Box key={f.id} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                {Object.keys(attributeOptions).length > 0 && (
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <Select
                                            displayEmpty
                                            value={f.attribute}
                                            onChange={e => {
                                                const attr = e.target.value;
                                                filterState.setAttributeFilters(fs => fs.map(x =>
                                                    x.id === f.id ? { ...x, attribute: attr, values: [] } : x
                                                ));
                                            }}
                                        >
                                            <MenuItem value=""><em>Choose…</em></MenuItem>
                                            {Object.keys(attributeOptions).map(key => (
                                                <MenuItem key={key} value={key}>
                                                    {key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}

                                <ToggleButtonGroup
                                    size="small"
                                    exclusive
                                    value={f.matchType}
                                    onChange={(_, v) => v && filterState.setAttributeFilters(fs => fs.map(x =>
                                        x.id === f.id ? { ...x, matchType: v } : x
                                    ))}
                                >
                                    <ToggleButton value="any">Any</ToggleButton>
                                    <ToggleButton value="all">All</ToggleButton>
                                </ToggleButtonGroup>

                                <Box flexGrow={1}/>

                                <Tooltip title="Remove">
                                    <IconButton size="small" onClick={() =>
                                        filterState.setAttributeFilters(fs => fs.filter(x => x.id !== f.id))
                                    }>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>

                            <ProgressiveAutocomplete
                                options={attributeOptions[f.attribute] || []}
                                value={f.values}
                                onChange={vals =>
                                    filterState.setAttributeFilters(fs =>
                                        fs.map(x =>
                                        x.id === f.id ? { ...x, values: vals } : x
                                        )
                                    )
                                }
                                placeholder="Add value…"
                                limit={100}      // how many to show instantly
                                delayMs={100}   // how long before loading the rest
                            />
                        </Box>
                    ))}
                    <Box textAlign="right">
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => filterState.setAttributeFilters(fs => [
                                ...fs,
                                { id: Date.now(), attribute: '', matchType: 'any', values: [] }
                            ])}
                            disabled={filterState.attributeFilters.some(f => !f.attribute)}
                        >
                            + Add Attribute
                        </Button>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default AttributeFilter;