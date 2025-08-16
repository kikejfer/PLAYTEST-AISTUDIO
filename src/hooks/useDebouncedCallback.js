import { useCallback, useRef, useEffect } from 'react';

/**
 * Hook para debounce de callbacks
 * Optimiza el rendimiento retrasando la ejecución de funciones
 */
export const useDebouncedCallback = (callback, delay = 300, deps = []) => {
  const timeoutRef = useRef();
  const callbackRef = useRef(callback);

  // Actualizar callback ref cuando cambie
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args) => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Configurar nuevo timeout
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay, ...deps]);
};

/**
 * Hook para debounce de valores
 */
export const useDebouncedValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para throttle de callbacks
 */
export const useThrottledCallback = (callback, limit = 100, deps = []) => {
  const timeoutRef = useRef();
  const callbackRef = useRef(callback);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback((...args) => {
    if (Date.now() - lastRan.current >= limit) {
      callbackRef.current(...args);
      lastRan.current = Date.now();
    } else {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        if (Date.now() - lastRan.current >= limit) {
          callbackRef.current(...args);
          lastRan.current = Date.now();
        }
      }, limit - (Date.now() - lastRan.current));
    }
  }, [limit, ...deps]);
};