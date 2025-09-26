'use client';

import { useState, useEffect } from 'react';
import { CacheManager } from '../lib/cacheManager';
import { useClientSide } from '../hooks/useClientSide';
import { useRouter } from "next/navigation";

interface DebugInfo {
  userAgent: string;
  screenSize: string;
  isOnline: boolean;
  serviceWorkerSupported: boolean;
  cacheApiSupported: boolean;
  storageSupported: boolean;
  geolocationSupported: boolean;
  clipboardSupported: boolean;
  errors: Array<{
    timestamp: string;
    type: string;
    message: string;
    stack?: string;
  }>;
}

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const isClient = useClientSide();
 const router = useRouter();
  useEffect(() => {
    if (!isClient) return;

    const errors: DebugInfo['errors'] = [];

    // Collect error information
    const originalConsoleError = console.error;
    console.error = (...args) => {
      errors.push({
        timestamp: new Date().toISOString(),
        type: 'console.error',
        message: args.join(' '),
      });
      originalConsoleError.apply(console, args);
    };

    window.addEventListener('error', (event) => {
      errors.push({
        timestamp: new Date().toISOString(),
        type: 'window.error',
        message: event.message,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      errors.push({
        timestamp: new Date().toISOString(),
        type: 'unhandledrejection',
        message: event.reason?.toString() || 'Unknown promise rejection',
      });
    });

    // Collect debug info
    const info: DebugInfo = {
      userAgent: navigator.userAgent,
      screenSize: `${screen.width}x${screen.height}`,
      isOnline: navigator.onLine,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      cacheApiSupported: 'caches' in window,
      storageSupported: typeof Storage !== 'undefined',
      geolocationSupported: 'geolocation' in navigator,
      clipboardSupported: 'clipboard' in navigator,
      errors,
    };

    setDebugInfo(info);

    // Update cache status
    CacheManager.getCacheStatus().then(setCacheStatus);

    // Listen for online/offline
    const updateOnlineStatus = () => {
      setDebugInfo(prev => prev ? { ...prev, isOnline: navigator.onLine } : null);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [isClient]);

  // Don't show in production
  if (process.env.NODE_ENV === 'production' || !isClient || !debugInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600"
          title="เปิด Debug Panel"
        >
          🐛
        </button>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl max-w-md max-h-96 overflow-hidden">
          <div className="bg-red-500 text-white p-2 flex justify-between items-center">
            <span className="font-bold text-sm">🐛 Debug Panel</span>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
          
          <div className="p-3 overflow-y-auto max-h-80 text-xs">
            <div className="space-y-2">
              <div>
                <strong>สภาพแวดล้อม:</strong>
                <div className="ml-2 text-gray-600">
                  <div>📱 User Agent: {debugInfo.userAgent.substring(0, 50)}...</div>
                  <div>📐 Screen: {debugInfo.screenSize}</div>
                  <div>🌐 Online: {debugInfo.isOnline ? '✅' : '❌'}</div>
                </div>
              </div>

              <div>
                <strong>การรองรับ API:</strong>
                <div className="ml-2 text-gray-600">
                  <div>🔧 Service Worker: {debugInfo.serviceWorkerSupported ? '✅' : '❌'}</div>
                  <div>💾 Cache API: {debugInfo.cacheApiSupported ? '✅' : '❌'}</div>
                  <div>🗄️ Storage: {debugInfo.storageSupported ? '✅' : '❌'}</div>
                  <div>📍 Geolocation: {debugInfo.geolocationSupported ? '✅' : '❌'}</div>
                  <div>📋 Clipboard: {debugInfo.clipboardSupported ? '✅' : '❌'}</div>
                </div>
              </div>

              {cacheStatus && (
                <div>
                  <strong>สถานะ Cache:</strong>
                  <div className="ml-2 text-gray-600">
                    <div>SW Registered: {cacheStatus.serviceWorkerRegistered ? '✅' : '❌'}</div>
                    <div>Cache Count: {cacheStatus.cacheCount}</div>
                    <div>Storage Used: {cacheStatus.storageUsed ? '✅' : '❌'}</div>
                  </div>
                </div>
              )}

              <div>
                <strong>ข้อผิดพลาด ({debugInfo.errors.length}):</strong>
                <div className="ml-2 max-h-32 overflow-y-auto">
                  {debugInfo.errors.length === 0 ? (
                    <div className="text-green-600">ไม่มีข้อผิดพลาด ✅</div>
                  ) : (
                    debugInfo.errors.slice(-5).map((error, index) => (
                      <div key={index} className="border-l-2 border-red-300 pl-2 mb-1">
                        <div className="text-red-600 font-semibold">{error.type}</div>
                        <div className="text-gray-600">{error.message}</div>
                        <div className="text-gray-400 text-xs">{new Date(error.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => CacheManager.clearAllCaches().then(() => router.push("/login"))}
                  className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                >
                  ล้าง Cache
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                >
                  Reload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}