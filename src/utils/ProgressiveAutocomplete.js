import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, Chip, CircularProgress } from '@mui/material';

/**
 * Shows the first `limit` options immediately on open,
 * then loads the full list after `delayMs`.
 */
export default function ProgressiveAutocomplete({
  options,
  value,
  onChange,
  placeholder = '',
  limit = 100,
  delayMs = 1000,
}) {
  const [displayOptions, setDisplayOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reset to initial slice whenever `options` change
  useEffect(() => {
    setDisplayOptions(options.slice(0, limit));
  }, [options, limit]);

  const handleOpen = () => {
    setDisplayOptions(options.slice(0, limit));
    setLoading(true);
    setTimeout(() => {
      setDisplayOptions(options);
      setLoading(false);
    }, delayMs);
  };

  const formatOption = o => o === '__MISSING__' ? '(Not recorded)' : o;

  return (
    <Autocomplete
      multiple
      size="small"
      disablePortal
      options={displayOptions}
      value={value}
      loading={loading}
      loadingText="Loading…"
      onOpen={handleOpen}
      onChange={(_, vals) => onChange(vals)}
      filterOptions={(opts, { inputValue }) =>
        opts.filter(o =>
          o.toLowerCase().startsWith(inputValue.toLowerCase())
        )
      }
      getOptionLabel={formatOption}
      renderInput={params => (
        <TextField
          {...params}
          placeholder={placeholder}
          size="small"
          fullWidth
        />
      )}
      sx={{ mt: 1 }}
    />
  );
}
