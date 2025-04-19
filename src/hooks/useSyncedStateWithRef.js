import { useState, useRef, useCallback } from 'react';

export default function useSyncedStateWithRef(initialValue) {
  const [state, setState] = useState(initialValue);
  const ref = useRef(initialValue);

  const setBoth = useCallback((valueOrUpdater) => {
    setState(prev => {
      // figure out the new value, whether they passed a plain value or an updater fn
      const nextValue = typeof valueOrUpdater === 'function'
        ? valueOrUpdater(prev)
        : valueOrUpdater;

      ref.current = nextValue;
      return nextValue;
    });
  }, []);

  return [state, setBoth, ref];
}
