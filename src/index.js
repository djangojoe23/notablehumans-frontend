import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import theme from './theme';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import reportWebVitals from './reportWebVitals';

import '@fontsource/ubuntu/300.css';  // light
import '@fontsource/ubuntu/400.css';  // regular
import '@fontsource/ubuntu/500.css';  // medium
import '@fontsource/ubuntu/700.css';  // bold


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// Optional performance logging
reportWebVitals();
