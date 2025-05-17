// Updated components/Filter.js
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
    Autocomplete,
    IconButton,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles'
import axios from 'axios';


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

    const [attributeOptions, setAttributeOptions] = useState({});
    useEffect(() => {
      axios.get(`${process.env.REACT_APP_API_URL}/attributes-dict/`)
        .then(res => setAttributeOptions(res.data))
        .catch(err => console.error("Error loading attributes:", err));
    }, []);

    // true if there’s at least one attribute filter with no attribute chosen yet
    const [attributeFilters, setAttributeFilters] = React.useState([
    { id: 1, attribute: '', matchType: 'any', values: [] }
    ]);
    const hasEmptyFilter = attributeFilters.some(f =>
      f.attribute === '' || f.values.length === 0
    );

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

  // Shared accordion styles
  const summarySX = {
    flexDirection: 'row-reverse',
    p: 0,
    py: 1,
    minHeight: 0,
    '&.Mui-expanded': { minHeight: 0 },
    '& .MuiAccordionSummary-content': { pl: 1, margin: 0 },
    '& .MuiAccordionSummary-content.Mui-expanded': { margin: 0 }
  };

  // Accordion root override to remove expanded margin
  const accordionSX = {
    '&.Mui-expanded': { margin: 0 }
  };

  return (
    <Box sx={{ p: 1, pb: 0, pt: 0 }}>
      <Stack spacing={0}>
        {/* Search by Name */}
        <Box sx={{my:1}}>
          <TextField
              label="Search by Name"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
          />
        </Box>


        {/* Birth & Death Date Filter Accordion */}
        <Accordion defaultExpanded disableGutters sx={accordionSX}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            disableGutters
            sx={summarySX}
          >
            <Typography variant="subtitle2" sx={{ fontSize: ".9rem" }}>Dates Filter</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{px: .25, pt: 0, pb: 1}}>
            {/* Date & Years Since Filters */}
            <Box sx={{ display: 'flex', gap: 0, my: 0}}>
              {/* Date Fieldset */}
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
                          Alive On
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
                      type="number"
                      value={filterYear ?? ''}
                      onChange={e => setFilterYear(e.target.value === '' ? null : +e.target.value)}
                      fullWidth
                      sx={{
                        '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': { WebkitAppearance: 'none' },
                        '& input[type=number]': { MozAppearance: 'textfield' }
                      }}
                    />
                  </Tooltip>
                </Box>
              </Box>

              {/* Years Since Fieldset */}
              <Box component="fieldset" sx={{ width: '100px', border: 1, borderColor: 'divider', borderRadius: 1, p: 1, px: 0.5, '& legend': { ...theme.typography.subtitle2, fontWeight: theme.typography.subtitle2.fontWeight + 100, lineHeight: 1.3 } }}>
                <Box component="legend">Or Within the Following</Box>
                <Tooltip title={filterYear == null ? "Enter year in date to enable" : ""} placement="top">
                  <span style={{ display: 'block' }}>
                    <TextField
                      placeholder="0"
                      variant="outlined"
                      size="small"
                      type="number"
                      value={filterYear == null ? '' : (filterYearRange ?? '')}
                      onChange={e => {
                        const raw = e.target.value;
                        const intVal = raw === '' ? null : Number.isNaN(parseInt(raw, 10)) ? filterYearRange : parseInt(raw, 10);
                        setFilterYearRange(intVal);
                      }}
                      fullWidth
                      disabled={filterYear == null}
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">yrs</InputAdornment> }, htmlInput: { step: 1, inputMode: 'numeric', pattern: '-?[0-9]*' } }}
                      sx={{ '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': { WebkitAppearance: 'none' }, '& input[type=number]': { MozAppearance: 'textfield' } }}
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
              sx={{ px: 0, py: 0, pt: 1 }}
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
                slotProps={{ htmlInput: { min: 0, step: 1, inputMode: 'numeric', pattern: '[0-9]*' } }}
                sx={{ width: 60, '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': { WebkitAppearance: 'none' }, '& input[type=number]': { MozAppearance: 'textfield' } }}
              />
              <Typography variant="subtitle2">years old.</Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>


        {/* Attribute Filter Accordion */}
        <Accordion defaultExpanded disableGutters sx={accordionSX}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={summarySX}
          >
            <Typography variant="subtitle2" sx={{ fontSize: ".9rem" }}>Attributes Filter</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{py: 0, px: 0.5}}>
            <Box sx={{ my: 0, py: 0 }}>
              {attributeFilters.map(f => (
  <Box
    key={f.id}
    sx={{ mb: 1, p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}
  >
    {/* Line 1: selector, match toggle, clear */}
    <Stack direction="row" alignItems="center" spacing={1}>
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          displayEmpty
          value={f.attribute}
          onChange={e => {
            const attr = e.target.value;
            setAttributeFilters(fs =>
              fs.map(x =>
                x.id === f.id
                  ? { ...x, attribute: attr, values: [] }
                  : x
              )
            );
          }}
        >
          <MenuItem value=""><em>Choose…</em></MenuItem>
          {Object.keys(attributeOptions).map(key => (
            <MenuItem key={key} value={key}>
              {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <ToggleButtonGroup
        size="small"
        exclusive
        value={f.matchType}
        onChange={(_, v) =>
          v && setAttributeFilters(fs =>
            fs.map(x =>
              x.id === f.id ? { ...x, matchType: v } : x
            )
          )
        }
      >
        <ToggleButton value="any">Any</ToggleButton>
        <ToggleButton value="all">All</ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ flexGrow: 1 }} />

      <Tooltip title="Remove attribute filter" placement="top">
        <IconButton size="small" onClick={() => setAttributeFilters(fs => fs.filter(x => x.id !== f.id))}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>

      {/* Line 3: selected chips */}
    {f.values.length > 0 && (
      <Box sx={{ mt: 1 }}>
        {f.values.map(val => (
          <Chip
            key={val}
            label={val}
            size="small"
            onDelete={() =>
              setAttributeFilters(fs =>
                fs.map(x =>
                  x.id === f.id
                    ? {
                        ...x,
                        values: x.values.filter(v => v !== val)
                      }
                    : x
                )
              )
            }
            sx={{ mr: 0.5, mb: 0.5 }}
          />
        ))}
      </Box>
    )}

    {/* Line 2: value picker */}
    <Box sx={{ mt: 1 }}>
      <Autocomplete
        multiple
        size="small"
        options={attributeOptions[f.attribute.toLowerCase()] || []}
        value={f.values}
        onChange={(_, values) =>
          setAttributeFilters(fs =>
            fs.map(x =>
              x.id === f.id ? { ...x, values } : x
            )
          )
        }
        openOnFocus
        disableCloseOnSelect
        clearOnBlur={false}
        filterSelectedOptions
        filterOptions={(options, { inputValue }) =>
                      options.filter(opt =>
                        opt.toLowerCase().startsWith(inputValue.toLowerCase())
                      )
                    }
        renderInput={params => {
          const { InputProps, ...rest } = params;
          return (
            <TextField
              {...rest}
              placeholder="Add…"
              size="small"
              fullWidth
              slotProps={{
                input: { ...InputProps, startAdornment: null }
              }}
            />
          );
        }}
      />
    </Box>


  </Box>
))}


              <Box sx={{ display: 'flex', justifyContent: 'right', alignItems: 'center', mb: 1 }}>
                <Tooltip title={hasEmptyFilter ? "Finish the existing filter first" : ""}>
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setAttributeFilters(f => [...f, { id: Date.now(), attribute: '', matchType: 'any', values: [] }])}
                      disabled={hasEmptyFilter}
                    >
                      + Add Attribute
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

















        {/* Sort Options Fieldset */}
        <Box
            component="fieldset"
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              p: 1,
              mt: 1,
              '& legend': {
                fontSize: '0.875rem',
                fontWeight: 500
              }
        }}>
          <Box component="legend">Sort List By</Box>
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
