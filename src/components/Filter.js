// src/components/Filter.js
import React, { useEffect, useState } from 'react';
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
import CloseIcon from '@mui/icons-material/Close';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import ProgressiveAutocomplete from '../utils/ProgressiveAutocomplete';


const Filter = ({
  mode = 'browse',
  sortBy,
  setSortBy,
  sortAsc,
  setSortAsc,
  searchQuery,
  setSearchQuery,
  dateFilterType,
  setDateFilterType,
  filterYear = null,
  setFilterYear,
  filterMonth,
  setFilterMonth,
  filterDay,
  setFilterDay,
  filterYearRange = null,
  setFilterYearRange,
  filterAge,
  setFilterAge,
  filterAgeType,
  setFilterAgeType,
  attributeFilters,
  setAttributeFilters
}) => {
  const theme = useTheme();
  const [attributeOptions, setAttributeOptions] = useState({});

  const [withinSign, setWithinSign] = useState('plus');  // 'plus' or 'minus'


  // load attribute options
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/attributes-dict/`)
      .then(res => {
        const withMissing = {};
        Object.entries(res.data).forEach(([key, opts]) => {
          withMissing[key] = ['__MISSING__', ...opts];
        });
        setAttributeOptions(withMissing);
      })
      .catch(console.error);
  }, []);

  const handleSortDirectionChange = (_, dir) => {
    if (dir !== null) setSortAsc(dir === 'asc');
  };

  const abbreviatedMonths = ['', 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // keep “alive” only if year exists
  useEffect(() => {
    if (dateFilterType === 'alive' && filterYear == null) {
      setDateFilterType('born');
    }
  }, [dateFilterType, filterYear, setDateFilterType]);

  useEffect(() => {
    if (filterYearRange != null) {
      setFilterYearRange(prev => {
        const abs = Math.abs(prev);
        return withinSign === 'minus' ? -abs : abs;
      });
    }
  }, [withinSign]);

  const [filterYearText, setFilterYearText] = useState(
    filterYear != null ? String(filterYear) : ''
  );

  useEffect(() => {
    setFilterYearText(filterYear != null ? String(filterYear) : '');
  }, [filterYear]);

  const formatOption = o => o === '__MISSING__' ? '(Not recorded)' : o;

  return (
    <Box sx={{ p: 1 }}>
      <Stack spacing={1}>
        {mode === 'browse' && (
          <>
            {/* Search */}
            <TextField
              label="Search by Name"
              size="small"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              fullWidth
            />

            {/* Sort */}
            <Box component="fieldset" sx={{
              border: 1, borderColor: 'divider', borderRadius: 1, p: 1,
              '& legend': { fontSize: '0.875rem', fontWeight: 500 }
            }}>
              <Box component="legend">Sort List By</Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <FormControl fullWidth size="small">
                  <Select value={sortBy} onChange={e => setSortBy(e.target.value)}>
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
                  value={sortAsc ? 'asc' : 'desc'}
                  exclusive onChange={handleSortDirectionChange}
                  size="small" color="primary"
                >
                  <ToggleButton value="asc"><ArrowDownward fontSize="small"/></ToggleButton>
                  <ToggleButton value="desc"><ArrowUpward fontSize="small"/></ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            </Box>
          </>
        )}

        {mode === 'filters' && (
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
                    value={dateFilterType}
                    exclusive
                    size="small"
                    onChange={(_, v) => v && setDateFilterType(v)}
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
                        <ToggleButton value="alive" disabled={!filterYear}>
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
                      value={filterMonth ?? ''}
                      onChange={e => setFilterMonth(e.target.value === '' ? null : +e.target.value)}
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
                      value={filterDay ?? ''}
                      onChange={e => setFilterDay(e.target.value === '' ? null : +e.target.value)}
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
                            setFilterYear(null);
                          } else {
                            setFilterYear(parseInt(raw, 10));
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

                <Tooltip title={filterYear == null ? "Enter year in date to enable" : ""} placement="top">
                  <span style={{ display: 'block' }}>
                    <TextField
                      placeholder="0"
                      variant="outlined"
                      size="small"
                      type="text"
                      value={filterYearRange != null ? Math.abs(filterYearRange) : ''}
                      onChange={e => {
                        const raw = e.target.value;
                        let val = raw === '' ? null : parseInt(raw, 10);
                        if (val != null) {
                          val = withinSign === 'minus' ? -Math.abs(val) : Math.abs(val);
                        }
                        setFilterYearRange(val);
                      }}
                      fullWidth
                      disabled={filterYear == null}
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
                value={filterAgeType}
                exclusive
                size="small"
                onChange={(_, v) => v && setFilterAgeType(v)}
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
                value={filterAge ?? ''}
                onChange={e => setFilterAge(e.target.value === '' ? null : +e.target.value)}
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
              {attributeFilters.map(f => (
                <Box key={f.id} sx={{ mb: 2, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {Object.keys(attributeOptions).length > 0 && (
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          displayEmpty
                          value={f.attribute}
                          onChange={e => {
                            const attr = e.target.value;
                            setAttributeFilters(fs => fs.map(x =>
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
                      onChange={(_, v) => v && setAttributeFilters(fs => fs.map(x =>
                        x.id === f.id ? { ...x, matchType: v } : x
                      ))}
                    >
                      <ToggleButton value="any">Any</ToggleButton>
                      <ToggleButton value="all">All</ToggleButton>
                    </ToggleButtonGroup>

                    <Box flexGrow={1}/>

                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() =>
                        setAttributeFilters(fs => fs.filter(x => x.id !== f.id))
                      }>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <ProgressiveAutocomplete
                    options={attributeOptions[f.attribute] || []}
                    value={f.values}
                    onChange={vals =>
                      setAttributeFilters(fs =>
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
                  onClick={() => setAttributeFilters(fs => [
                    ...fs,
                    { id: Date.now(), attribute: '', matchType: 'any', values: [] }
                  ])}
                  disabled={attributeFilters.some(f => !f.attribute)}
                >
                  + Add Attribute
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default Filter;
