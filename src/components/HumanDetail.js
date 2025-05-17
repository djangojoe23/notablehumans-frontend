import React from 'react';
import { Box, Typography, IconButton, Link, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material/styles';


import { ATTRIBUTE_LABELS } from '../constants/humanAttributeLabels';
import { formatDate } from '../utils/format';
import { FaWikipediaW } from 'react-icons/fa';
import { SiWikidata } from 'react-icons/si';
import { PiListMagnifyingGlass } from 'react-icons/pi';

export const formatAttributeLabel = (key) => {
  const rawLabel = ATTRIBUTE_LABELS[key] || key;
  return rawLabel
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const HumanDetail = ({ person, scrollToPerson, onFlyTo, onClose }) => {
  const theme = useTheme();

  if (!person) return null;

  const {
    n: name,
    d: description,
    id: wikidataId,
    wu: wikipediaSlug,
    lat,
    lng,
    by,
    bd,
    bp,
    dy,
    dd,
    dp,
    ...attributes
  } = person;

return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Sticky Top Header */}
      <Box
        position="sticky"
        top={0}
        zIndex={1}
        bgcolor="#fff"
        pt={1}
        px={2}
        borderBottom="1px solid"
        borderColor="grey.300"
      >
        {/* Close Button */}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            color: 'grey.600',
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ pr: 1 }}>
          {name}
        </Typography>

        {description && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              mb: 1,
              wordBreak: 'break-word', // allow long words to break
              overflowWrap: 'anywhere', // allow wrapping at any point if needed
            }}
          >
            {description}
          </Typography>
        )}


        {/* Icon Row - evenly distributed */}
        <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={0.5}
        mb={0}
      >
        {[
          {
            type: 'scroll',
            icon: <PiListMagnifyingGlass size={18} />,
            onClick: () => scrollToPerson?.(person),
            title: 'Scroll to name in list',
          },
          {
            type: 'fly',
            onClick: () => onFlyTo?.({ lng, lat }),
            title: 'Fly to marker',
          },
          {
            type: 'link',
            icon: <FaWikipediaW size={18} />,
            href: `https://en.wikipedia.org/wiki/${wikipediaSlug}`,
            title: 'View Wikipedia entry',
          },
          {
            type: 'link',
            icon: <SiWikidata size={18} />,
            href: `https://www.wikidata.org/wiki/${wikidataId}`,
            title: 'View Wikidata entry',
          },
        ].map((item, idx, arr) => (
          <Box
            key={idx}
            display="flex"
            alignItems="center"
            justifyContent="center"
            width="25%"
            position="relative"
          >
            {item.type === 'link' ? (
              <IconButton
                component={Link}
                href={item.href}
                target="_blank"
                rel="noopener"
                size="small"
                title={item.title}
              >
                {item.icon}
              </IconButton>
            ) : item.type === 'fly' ? (
              <IconButton
                onClick={item.onClick}
                size="small"
                title={item.title}
                sx={{
                  width: 36,
                  height: 36,
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                {/* Pulsing Halo */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    opacity: 0.4,
                    transform: 'scale(calc(1 + var(--pulse-ratio) * 3))',
                    transition: 'transform 16ms linear, opacity 16ms linear',
                    zIndex: 0,
                  }}
                />
                {/* Static Center Dot */}
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    zIndex: 1,
                  }}
                />
              </IconButton>
            ) : (
              <IconButton
                onClick={item.onClick}
                size="small"
                title={item.title}
              >
                {item.icon}
              </IconButton>
            )}

            {/* Vertical divider */}
            {idx < arr.length - 1 && (
              <Box
                position="absolute"
                top="25%"
                bottom="25%"
                right={0}
                width="1px"
                bgcolor="grey.300"
              />
            )}
          </Box>
        ))}
      </Box>
    </Box>

      {/* Scrollable attributes */}
      <Box flex={1} overflow="auto" p={2} pt={1}>
        <Box component="dl" m={0}>
          {/* Born */}
          <Box component="div" mb={2}>
            <Typography component="dt" variant="body2" fontWeight="bold">
              Born
            </Typography>
            <Typography component="dd" variant="body2" ml={2} color="text.secondary">
              {bd ? `${formatDate(bd)}${bp ? ` in ${bp}` : ''}` : 'Unknown'}
            </Typography>
          </Box>

          {/* Died */}
          <Box component="div" mb={2}>
            <Typography component="dt" variant="body2" fontWeight="bold">
              Died
            </Typography>
            <Typography component="dd" variant="body2" ml={2} color="text.secondary">
              {dd ? `${formatDate(dd)}${dp ? ` in ${dp}` : ''}` : '-'}
            </Typography>
          </Box>

          {/* Other Attributes */}
          {Object.entries(ATTRIBUTE_LABELS).map(([key]) => {
            let value = attributes[key];
            if (!value) return null;
            if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
              try { value = JSON.parse(value); } catch {}
            }
            return (
              <Box component="div" key={key} mb={2}>
                <Typography component="dt" variant="body2" fontWeight="bold">
                  {formatAttributeLabel(key)}
                </Typography>
                <Typography component="dd" variant="body2" ml={2} color="text.secondary">
                  {Array.isArray(value) ? value.join(', ') : value}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default HumanDetail;
