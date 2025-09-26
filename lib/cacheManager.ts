// utils/cacheManager.ts
export class CacheManager {
  static async clearAllCaches(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const promises = registrations.map(registration => registration.unregister());
        await Promise.all(promises);
        console.log('Service workers unregistered successfully');
      }

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
        await Promise.all(deletePromises);
        console.log('All caches cleared successfully');
      }

      // Clear storage
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }

      console.log('Cache clearing completed successfully');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }

  static async updateServiceWorker(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        console.log('Service worker updated successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating service worker:', error);
      return false;
    }
  }

  static async getCacheStatus(): Promise<{
    serviceWorkerRegistered: boolean;
    cacheCount: number;
    storageUsed: boolean;
  }> {
    if (typeof window === 'undefined') {
      return {
        serviceWorkerRegistered: false,
        cacheCount: 0,
        storageUsed: false
      };
    }

    try {
      const serviceWorkerRegistered = 'serviceWorker' in navigator && 
        !!(await navigator.serviceWorker.getRegistration());

      const cacheCount = 'caches' in window ? 
        (await caches.keys()).length : 0;

      const storageUsed = (typeof localStorage !== 'undefined' && localStorage.length > 0) ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.length > 0);

      return {
        serviceWorkerRegistered,
        cacheCount,
        storageUsed
      };
    } catch (error) {
      console.error('Error getting cache status:', error);
      return {
        serviceWorkerRegistered: false,
        cacheCount: 0,
        storageUsed: false
      };
    }
  }
}

// Hook สำหรับ React components
export const useCacheManager = () => {
  const clearCaches = async () => {
    await CacheManager.clearAllCaches();
    window.location.reload();
  };

  const updateApp = async () => {
    const updated = await CacheManager.updateServiceWorker();
    if (updated) {
      window.location.reload();
    }
    return updated;
  };

  return {
    clearCaches,
    updateApp,
    getCacheStatus: CacheManager.getCacheStatus
  };
};