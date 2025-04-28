// components/Filter.js
import React from 'react';
import { Box, TextField, Stack, FormControl, InputLabel, Select, MenuItem, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

const Filter = ({ sortBy, setSortBy, sortAsc, setSortAsc, searchQuery, setSearchQuery }) => {
  const handleSortDirectionChange = (_, newDirection) => {
    if (newDirection !== null) {
      setSortAsc(newDirection === 'asc');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={1.5}>

        <TextField
          label="Search for Notable Human"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />

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
          fullWidth
          sx={{
            mt: 0.5,
            '.MuiToggleButtonGroup-grouped': {
              flexGrow: 1,
              flexBasis: 0,
            }
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
    </Box>
  );
};

export default Filter;
