// lib/errorHandler.ts
export const isClient = typeof window !== 'undefined';

// Safe localStorage wrapper
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isClient) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('localStorage.getItem error:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isClient) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('localStorage.setItem error:', error);
    }
  },
  removeItem: (key: string): void => {
    if (!isClient) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('localStorage.removeItem error:', error);
    }
  }
};

// Safe URL params getter
export const getSafeParams = (): URLSearchParams | null => {
  if (!isClient) return null;
  try {
    return new URLSearchParams(window.location.search);
  } catch (error) {
    console.error('URLSearchParams error:', error);
    return null;
  }
};

// Safe navigator access
export const safeNavigator = {
  clipboard: {
    writeText: async (text: string): Promise<boolean> => {
      if (!isClient || !navigator?.clipboard) return false;
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (error) {
        console.error('Clipboard write error:', error);
        return false;
      }
    }
  },
  geolocation: {
    getCurrentPosition: (
      success: (position: GeolocationPosition) => void,
      error?: (error: GeolocationPositionError) => void
    ): void => {
      if (!isClient || !navigator?.geolocation) {
        error?.(new Error('Geolocation not supported') as any);
        return;
      }
      try {
        navigator.geolocation.getCurrentPosition(success, error);
      } catch (err) {
        console.error('Geolocation error:', err);
        error?.(err as GeolocationPositionError);
      }
    }
  }
};

// Global error handler
export const setupGlobalErrorHandler = () => {
  if (!isClient) return;

  window.addEventListener('error', (event) => {
    console.error('Global error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      stack: event.error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', {
      reason: event.reason,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  });
};