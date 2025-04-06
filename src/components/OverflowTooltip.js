import React, { useState, useEffect, useRef } from 'react';

/**
 * OverflowTooltip wraps text and only applies a tooltip (via the title attribute)
 * if the text overflows its container.
 */
const OverflowTooltip = ({ children, style = {} }) => {
  const containerRef = useRef(null);
  const [isOverflowed, setIsOverflowed] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (element) {
      setIsOverflowed(element.scrollWidth > element.clientWidth);
    }
  }, [children, style]);

  return (
    <div
      ref={containerRef}
      style={{
        ...style,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
      title={isOverflowed ? children : undefined}
    >
      {children}
    </div>
  );
};

export default OverflowTooltip;
