import { useState, useRef, useCallback } from 'react';

export default function useSyncedStateWithRef(initialValue) {
  const [state, setState] = useState(initialValue);
  const ref = useRef(initialValue);

  const setBoth = useCallback((value) => {
    ref.current = value;
    setState(value);
  }, []);

  return [state, setBoth, ref];
}
