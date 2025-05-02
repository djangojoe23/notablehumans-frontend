// Updated components/Filter.js
import React from 'react';
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
  Typography
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

const Filter = ({
  sortBy,
  setSortBy,
  sortAsc,
  setSortAsc,
  searchQuery,
  setSearchQuery,
  birthYearRange = [null, null],
  setBirthYearRange,
  minBirthMonth,
  setMinBirthMonth,
  minBirthDay,
  setMinBirthDay,
  yearRange = null,
  setYearRange
}) => {
  const handleSortDirectionChange = (_, newDirection) => {
    if (newDirection !== null) setSortAsc(newDirection === 'asc');
  };

  const abbreviatedMonths = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <Box sx={{ p: 2, pb: 0 }}>
      <Stack spacing={2}>
        {/* Search by Name */}
        <TextField
          label="Search by Name"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />

        {/* Birth Date and Years Since Sections */}
        <Box sx={{ display: 'flex', gap: 0 }}>
          {/* Birth Date Fieldset */}
          <Box
            component="fieldset"
            sx={{
              flex: 1,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
              '& legend': { fontSize: '0.875rem', fontWeight: 500 }
            }}
          >
            <Box component="legend">Born On</Box>
            <Box sx={{ display: 'flex', gap: .5 }}>
              {/* Month */}
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  value={minBirthMonth ?? ''}
                  onChange={e => setMinBirthMonth(e.target.value === '' ? null : +e.target.value)}
                >
                  <MenuItem value=""><em>Mo.</em></MenuItem>
                  {abbreviatedMonths.slice(1).map((m, i) => (
                    <MenuItem key={i+1} value={i+1}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Day */}
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  value={minBirthDay ?? ''}
                  onChange={e => setMinBirthDay(e.target.value === '' ? null : +e.target.value)}
                >
                  <MenuItem value=""><em>Day</em></MenuItem>
                  {[...Array(31)].map((_, i) => (
                    <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Year */}
              <TextField
                placeholder="Year"
                variant="outlined"
                size="small"
                type="number"
                value=""
                onChange={e => {
                  const v = e.target.value === '' ? null : +e.target.value;
                  if (setBirthYearRange) setBirthYearRange([v, birthYearRange?.[1] ?? null]);
                }}
                fullWidth
                sx={{ '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': { WebkitAppearance: 'none' }, '& input[type=number]': { MozAppearance: 'textfield' } }}
              />
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
              '& legend': { fontSize: '0.85rem', fontWeight: 500 }
            }}
          >
            <Box component="legend">Or Within Next</Box>
            <TextField
              placeholder="0"
              variant="outlined"
              size="small"
              type="number"
              value={yearRange ?? ''}
              onChange={e => setYearRange && setYearRange(e.target.value === '' ? null : +e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">yrs</InputAdornment>
                }
              }}
              sx={{ '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': { WebkitAppearance: 'none' }, '& input[type=number]': { MozAppearance: 'textfield' } }}
            />
          </Box>
        </Box>

        {/* Sort Options Fieldset */}
        <Box component="fieldset" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1, '& legend': { fontSize: '0.875rem', fontWeight: 500 } }}>
          <Box component="legend">Sort By</Box>
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
              exclusive
              onChange={handleSortDirectionChange}
              size="small"
              color="primary"
            >
              <ToggleButton value="asc"><ArrowUpward fontSize="small"/></ToggleButton>
              <ToggleButton value="desc"><ArrowDownward fontSize="small"/></ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default Filter;
