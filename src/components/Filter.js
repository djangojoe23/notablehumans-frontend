// Updated components/Filter.js
import React, { useEffect } from 'react';
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
    Typography
} from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles'



const Filter = ({
  sortBy,
  setSortBy,
  sortAsc,
  setSortAsc,
  searchQuery,
  setSearchQuery,
  dateFilterType, setDateFilterType,
  filterYear=null, setFilterYear,
  filterMonth, setFilterMonth,
  filterDay, setFilterDay,
  filterYearRange = null, setFilterYearRange,
  filterAge, setFilterAge,
  filterAgeType, setFilterAgeType
}) => {

  const theme = useTheme()
  console.log(theme.typography)

  const handleSortDirectionChange = (_, newDirection) => {
    if (newDirection !== null) setSortAsc(newDirection === 'asc');
  };

  const abbreviatedMonths = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // whenever Alive loses its date, force back to Born
  useEffect(() => {
    if (
      dateFilterType === 'alive' && filterYear == null
    ) {
      setDateFilterType('born')
    }
  }, [dateFilterType, filterYear, setDateFilterType])


  return (
    <Box sx={{ p: 2, pb: 0 }}>
      <Stack spacing={0}>
        {/* Search by Name */}
        <TextField
          label="Search by Name"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />

        {/* Filter Date and Years Since Sections */}
        <Box sx={{ display: 'flex', gap: 0}}>
          {/* Filter Date Fieldset */}
          <Box
            component="fieldset"
            sx={{
              flex: 1,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
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
                      textTransform: 'none',
                    },
                    '& .Mui-selected': {
                      fontWeight: theme.typography.subtitle2.fontWeight + 100, // e.g. 600 → 700
                    },
                  }}
                >
                  <ToggleButton value="born">Born</ToggleButton>
                  <ToggleButton value="died">Died</ToggleButton>
                  <Tooltip title="Enter year to enable" placement="top">
                    <span>
                      <ToggleButton
                        value="alive"
                        disabled={!filterYear}
                        aria-describedby="alive-on-help"
                      >
                        Alive On
                      </ToggleButton>
                    </span>
                  </Tooltip>
                </ToggleButtonGroup>
            </Box>
            <Box sx={{ display: 'flex', gap: .5 }}>
              {/* Month */}
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  value={filterMonth ?? ''}
                  onChange={e => setFilterMonth(e.target.value === '' ? null : +e.target.value)}
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
                  value={filterDay ?? ''}
                  onChange={e => setFilterDay(e.target.value === '' ? null : +e.target.value)}
                >
                  <MenuItem value=""><em>Day</em></MenuItem>
                  {[...Array(31)].map((_, i) => (
                    <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Year */}
              <Tooltip title="Enter BCE as a negative number (e.g. –300 for 300 BC)">
                <TextField
                  placeholder="Year"
                  variant="outlined"
                  size="small"
                  type="number"
                  value={filterYear ?? ''}
                  onChange={e => {
                    const v = e.target.value === '' ? null : +e.target.value;
                    setFilterYear(v)
                  }}
                  fullWidth
                  sx={{ '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': { WebkitAppearance: 'none' }, '& input[type=number]': { MozAppearance: 'textfield' } }}
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
              // mt: '1px',
              '& legend': {
                ...theme.typography.subtitle2,
                fontWeight: theme.typography.subtitle2.fontWeight + 100, // e.g. 600 → 700
                lineHeight: 1.25
              }
            }}
          >
            <Box component="legend">Or Within the Following</Box>
            <TextField
              placeholder="0"
              variant="outlined"
              size="small"
              type="number"
              value={filterYear == null ? '' : (filterYearRange ?? '')}
              onChange={e => {
                const raw = e.target.value;
                const intVal = raw === ''
                  ? null
                  : Number.isNaN(parseInt(raw, 10))
                    ? filterYearRange
                    : parseInt(raw, 10);
                setFilterYearRange(intVal);
              }}
              fullWidth
              disabled={filterYear == null}
              slotProps={{
                input: {
                  endAdornment: <InputAdornment position="end">yrs</InputAdornment>
                },
                htmlInput: {
                  step: 1,                // spinner moves by 1
                  inputMode: 'numeric',   // mobile numeric keyboard
                  pattern: '-?[0-9]*'     // only digits & optional leading “-”
                }
              }}
              sx={{ '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': { WebkitAppearance: 'none' }, '& input[type=number]': { MozAppearance: 'textfield' }}}
            />
          </Box>
        </Box>

        {/* Lived-to-be Filter */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 1 /* match your other padding */, py: 0.5 }}
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
          </ToggleButtonGroup>

          <TextField
            placeholder=""
            variant="outlined"
            size="small"
            type="number"
            value={filterAge ?? ''}
            onChange={e => setFilterAge(e.target.value === '' ? null : +e.target.value)}
            slotProps={{
                htmlInput: {
                  min: 0,
                  step: 1,                // spinner moves by 1
                  inputMode: 'numeric',   // mobile numeric keyboard
                  pattern: '[0-9]*'     // only digits & optional leading “-”
                }
              }}
            sx={{
              width: 60,
              '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': {
                WebkitAppearance: 'none'
              },
              '& input[type=number]': { MozAppearance: 'textfield' }
            }}
          />

          <Typography variant="subtitle2">years old.</Typography>
        </Stack>

        {/* Sort Options Fieldset */}
        <Box
            component="fieldset"
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
              '& legend': {
                fontSize: '0.875rem',
                fontWeight: 500
              }
        }}>
          <Box component="legend">Sort By</Box>
          <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ height: 40 }}
          >
            <FormControl fullWidth size="small" sx={{ height: '100%' }}>
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
              sx={{height:'100%'}}
            >
              <ToggleButton value="asc"><ArrowDownward fontSize="small"/></ToggleButton>
              <ToggleButton value="desc"><ArrowUpward fontSize="small"/></ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default Filter;
