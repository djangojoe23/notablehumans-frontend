import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem
} from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const Header = () => {
  const [projectsAnchorEl, setProjectsAnchorEl] = useState(null);

  const openProjectsMenu = (e) => {
    setProjectsAnchorEl(e.currentTarget);
  };
  const closeProjectsMenu = () => {
    setProjectsAnchorEl(null);
  };

  return (
    <AppBar
      position="static"
      sx={{ height: 60, backgroundColor: '#333' }}
    >
      <Toolbar sx={{ minHeight: 60, px: 2 }}>
        {/* Title on the left */}
        <Typography
          variant="h3"
          component="div"
          sx={{
            fontFamily: `'Clematis Modern', serif`,
            letterSpacing: '0.03em',
          }}
        >
          The Compulsive Rambler
        </Typography>

        {/* Nav items pushed right */}
        <Box
          sx={{
            ml: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Button
            color="inherit"
            component="a"
            href="/about"
          >
            About
          </Button>

          <Button
            color="inherit"
            onClick={openProjectsMenu}
            endIcon={<ArrowDropDownIcon />}
          >
            Projects
          </Button>
          <Menu
            anchorEl={projectsAnchorEl}
            open={Boolean(projectsAnchorEl)}
            onClose={closeProjectsMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              component="a"
              href="/projects/1"
              onClick={closeProjectsMenu}
            >
              Visualizing History
            </MenuItem>
            <MenuItem
              component="a"
              href="/projects/2"
              onClick={closeProjectsMenu}
            >
              Writing Fables
            </MenuItem>
            <MenuItem
              component="a"
              href="/projects"
              onClick={closeProjectsMenu}
            >
              Doing Math
            </MenuItem>
          </Menu>

          <Button
            color="inherit"
            component="a"
            href="/contact"
          >
            Contact
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
