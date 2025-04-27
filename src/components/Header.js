import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const Header = () => (
  <AppBar position="static" sx={{ height: '60px', justifyContent: 'center', backgroundColor: '#333' }}>
    <Toolbar sx={{ minHeight: '60px', px: 2 }}>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        Notable Humans Project
      </Typography>
    </Toolbar>
  </AppBar>
);

export default Header;
