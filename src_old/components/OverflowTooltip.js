import React, { useRef, useState, useEffect } from 'react';
import { Tooltip, Box } from '@mui/material';

/**
 * Renders children with an automatic MUI Tooltip if the content is truncated.
 */
const OverflowTooltip = ({ children, tooltipText }) => {
  const textRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [children]);

  const content = (
    <Box
      ref={textRef}
      sx={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        display: 'block',
      }}
    >
      {children}
    </Box>
  );

  return isTruncated ? (
    <Tooltip title={tooltipText} arrow placement="top">
      <span>{content}</span>
    </Tooltip>
  ) : (
    content
  );
};

export default OverflowTooltip;
