// src/theme.js
import { createTheme } from '@mui/material/styles';
import { responsiveFontSizes } from '@mui/material/styles';


let theme = createTheme({
  palette: {
    primary: {
      main: '#FFA089',  // ← your single source‑of‑truth
    },
    // you can add secondary, info, etc.
  },
  typography: {
    fontFamily: 'Ubuntu, Arial, sans-serif',
    // here’s the override for subtitle2
    subtitle2: {
      fontFamily: 'Ubuntu, Arial, sans‑serif',
      fontSize: '.75rem',
      fontWeight: 500,                         // semi‑bold
      lineHeight: 1.4,
      letterSpacing: '0.00714em',
    },
  },
});

theme = responsiveFontSizes(theme);
export default theme;
