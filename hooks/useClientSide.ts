// hooks/useClientSide.ts
import { useState, useEffect } from 'react';

/**
 * Hook เพื่อตรวจสอบว่า component ถูก mount ใน client-side หรือไม่
 * ช่วยป้องกันปัญหา hydration mismatch
 */
export const useClientSide = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
};

/**
 * Hook สำหรับ safe localStorage access
 */
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const isClient = useClientSide();

  useEffect(() => {
    if (!isClient) return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue, isClient]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

/**
 * Hook สำหรับ safe URL search params access
 */
export const useSearchParams = () => {
  const isClient = useClientSide();
  const [params, setParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    if (isClient && window.location) {
      setParams(new URLSearchParams(window.location.search));
    }
  }, [isClient]);

  return params;
};

/**
 * Hook สำหรับ safe window object access
 */
export const useWindow = () => {
  const isClient = useClientSide();
  return isClient ? window : null;
};

/**
 * Hook สำหรับ safe navigator access
 */
export const useNavigator = () => {
  const isClient = useClientSide();
  return isClient ? navigator : null;
};