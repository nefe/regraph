import { useRef, useEffect } from 'react';

export function usePrevious(value) {
  const ref = useRef();

  // Store current value in ref
  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
