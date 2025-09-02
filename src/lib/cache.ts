import type { CachedData, VehicleResponse } from './types';

export const cache = {
  set(registration: string, data: VehicleResponse): void {
    const cacheExpiry = parseInt(localStorage.getItem('cache_expiry') || '7');
    const cached: CachedData<VehicleResponse> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + (cacheExpiry * 24 * 60 * 60 * 1000)
    };
    localStorage.setItem(`vehicle_${registration}`, JSON.stringify(cached));
  },

  get(registration: string): VehicleResponse | null {
    const cached = localStorage.getItem(`vehicle_${registration}`);
    if (!cached) return null;
    
    try {
      const parsed: CachedData<VehicleResponse> = JSON.parse(cached);
      if (Date.now() > parsed.expiry) {
        localStorage.removeItem(`vehicle_${registration}`);
        return null;
      }
      return parsed.data;
    } catch {
      localStorage.removeItem(`vehicle_${registration}`);
      return null;
    }
  },

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('vehicle_')) {
        localStorage.removeItem(key);
      }
    });
  },

  clearExpired(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('vehicle_')) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const parsed: CachedData<VehicleResponse> = JSON.parse(cached);
            if (Date.now() > parsed.expiry) {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      }
    });
  }
};