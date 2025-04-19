import React, { useRef, useState, useEffect } from "react";

/**
 * Renders children with an automatic tooltip if the content is truncated.
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

  return (
    <div
      ref={textRef}
      title={isTruncated ? tooltipText : ''}
      style={{
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        display: 'block',
      }}
    >
      {children}
    </div>
  );
};

export default OverflowTooltip;
