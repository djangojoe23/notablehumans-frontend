// components/Filter.js
import React from 'react';
import { Box, Grid, TextField, Stack, FormControl, InputLabel, Select, MenuItem, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

const Filter = ({
  sortBy, setSortBy,
  sortAsc, setSortAsc,
  searchQuery, setSearchQuery,
  birthYearRange, setBirthYearRange,
  minBirthMonth, setMinBirthMonth,
  minBirthDay, setMinBirthDay,
  maxBirthMonth, setMaxBirthMonth,
  maxBirthDay, setMaxBirthDay
}) => {

  const handleSortDirectionChange = (_, newDirection) => {
    if (newDirection !== null) {
      setSortAsc(newDirection === 'asc');
    }
  };

  const abbreviatedMonths = [
    '', // 0 = "Any"
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];


  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={1.5}>

        {/* Search */}
        <TextField
          label="Search by Name"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />

        {/* Birth Date Range */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            {/* ── MIN COLUMN ── */}
            <Box sx={{ flex: 1 }}>
              <Stack spacing={1}>
                {/* month + day */}
                <Stack direction="row" spacing={1}>
                  <FormControl size="small" variant="outlined" fullWidth>
                    <InputLabel shrink id="min-month-label">Min Birth Month</InputLabel>
                    <Select
                      labelId="min-month-label"
                      value={minBirthMonth ?? ''}
                      label="Min Birth Month"
                      onChange={e => setMinBirthMonth(
                        e.target.value === '' ? null : parseInt(e.target.value, 10)
                      )}
                      displayEmpty
                    >
                      <MenuItem value="">Any</MenuItem>
                      {abbreviatedMonths.slice(1).map((m, i) =>
                        <MenuItem key={i+1} value={i+1}>{m}</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="min-day-label">Min Day</InputLabel>
                    <Select
                      labelId="min-day-label"
                      value={minBirthDay ?? ''}
                      label="Min Day"
                      onChange={e => setMinBirthDay(
                        e.target.value === '' ? null : parseInt(e.target.value, 10)
                      )}
                    >
                      <MenuItem value="">Any</MenuItem>
                      {[...Array(31)].map((_, i) =>
                        <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Stack>

                {/* year */}
                <TextField
                  label="Min Birth Year"
                  variant="outlined"
                  size="small"
                  type="number"
                  value={birthYearRange[0] ?? ''}
                  onChange={e => {
                    const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    if (!isNaN(v) || v === null) setBirthYearRange([v, birthYearRange[1]]);
                  }}
                  fullWidth
                />
              </Stack>
            </Box>

            {/* ── MAX COLUMN ── */}
            <Box sx={{ flex: 1 }}>
              <Stack spacing={1}>
                {/* month + day */}
                <Stack direction="row" spacing={1}>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="max-month-label">Max Month</InputLabel>
                    <Select
                      labelId="max-month-label"
                      value={maxBirthMonth ?? ''}
                      label="Max Month"
                      onChange={e => setMaxBirthMonth(
                        e.target.value === '' ? null : parseInt(e.target.value, 10)
                      )}
                    >
                      <MenuItem value="">Any</MenuItem>
                      {abbreviatedMonths.slice(1).map((m, i) =>
                        <MenuItem key={i+1} value={i+1}>{m}</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="max-day-label">Max Day</InputLabel>
                    <Select
                      labelId="max-day-label"
                      value={maxBirthDay ?? ''}
                      label="Max Day"
                      onChange={e => setMaxBirthDay(
                        e.target.value === '' ? null : parseInt(e.target.value, 10)
                      )}
                    >
                      <MenuItem value="">Any</MenuItem>
                      {[...Array(31)].map((_, i) =>
                        <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Stack>

                {/* year */}
                <TextField
                  label="Max Birth Year"
                  variant="outlined"
                  size="small"
                  type="number"
                  value={birthYearRange[1] ?? ''}
                  onChange={e => {
                    const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
                    if (!isNaN(v) || v === null) setBirthYearRange([birthYearRange[0], v]);
                  }}
                  fullWidth
                />
              </Stack>
            </Box>
          </Stack>

          {/* error */}
          {birthYearRange[0] != null &&
           birthYearRange[1] != null &&
           birthYearRange[0] > birthYearRange[1] && (
            <Typography variant="caption" color="error" align="center" display="block" mt={1}>
              Min year must be ≤ Max year
            </Typography>
          )}
        </Box>


        {/* Sort By + Sort Direction Row */}
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" fullWidth>
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select
              labelId="sort-by-label"
              id="sort-by"
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
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
            sx={{
              flexShrink: 0,
              ml: 1,
              height: '40px',
              alignSelf: 'center',
            }}
          >
            <ToggleButton value="asc" aria-label="Ascending">
              <ArrowUpward fontSize="small" />
            </ToggleButton>
            <ToggleButton value="desc" aria-label="Descending">
              <ArrowDownward fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

      </Stack>
    </Box>
  );
};

export default Filter;
