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
      sx={{ backgroundColor: '#333' }}
    >
      <Toolbar
        sx={{
          // Let items wrap onto new lines when there isn't enough horizontal space
          flexWrap: 'wrap',
          minHeight: 60,
          px: 2,
        }}
      >
        {/* Title (always fully visible; will wrap if absolutely needed) */}
        <Typography
          variant="h3"
          component="div"
          sx={{
            fontFamily: `'Ubuntu', serif`,
            letterSpacing: '0.03em',
            // Never shrink this text—keep it fully visible
            flexShrink: 0,
            // Responsive font-size: 2rem on md+, 1.5rem on sm, 1.25rem on xs
            fontSize: {
              xs: '1.25rem',
              sm: '1.5rem',
              md: '2rem'
            },
            // Allow wrapping onto a second line if that's the only way
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          The Compulsive Rambler
        </Typography>

        {/* Nav items (About / Projects / Contact) */}
        <Box
          sx={{
            ml: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 2,

            // Let this box wrap its buttons if needed
            flexWrap: 'wrap',
          }}
        >
          <Button
            color="inherit"
            component="a"
            href="/about"
            sx={{
              // Shrink button text responsively on smaller screens
              fontSize: { xs: '0.6rem', sm: '0.8rem', md: '1rem' },
              paddingX: { xs: 0.5, sm: 1, md: 1.5 },
            }}
          >
            About
          </Button>

          <Button
            color="inherit"
            onClick={openProjectsMenu}
            endIcon={<ArrowDropDownIcon fontSize="small" />}
            sx={{
              fontSize: { xs: '0.6rem', sm: '0.8rem', md: '1rem' },
              paddingX: { xs: 0.5, sm: 1, md: 1.5 },
            }}
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
            <MenuItem
              component="a"
              href="/projects"
              onClick={closeProjectsMenu}
            >
              Movement
            </MenuItem>
          </Menu>

          <Button
            color="inherit"
            component="a"
            href="/contact"
            sx={{
              fontSize: { xs: '0.6rem', sm: '0.8rem', md: '1rem' },
              paddingX: { xs: 0.5, sm: 1, md: 1.5 },
            }}
          >
            Contact
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
