/**
 * Image Cache Service
 * 
 * Provides functionality to cache and preload images for faster scan history loading.
 * Uses both memory cache and IndexedDB for persistent storage.
 */

// In-memory cache to avoid redundant fetches
const memoryCache: Map<string, string> = new Map();

// IndexedDB configuration
const DB_NAME = 'food_scanner_cache';
const DB_VERSION = 1;
const IMAGES_STORE = 'cached_images';

/**
 * Initialize the image cache database
 * @returns A promise that resolves when the database is ready
 */
export async function initImageCache(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('Error opening cache database:', event);
      reject(new Error('Failed to open cache database'));
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store for images if it doesn't exist
      if (!db.objectStoreNames.contains(IMAGES_STORE)) {
        const store = db.createObjectStore(IMAGES_STORE, { keyPath: 'url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        console.log('Created image cache store');
      }
    };
    
    request.onsuccess = (event) => {
      console.log('Cache database initialized successfully');
      resolve();
    };
  });
}

/**
 * Get a cached image URL by key
 * @param url The original image URL to retrieve from cache
 * @returns The data URL of the cached image or null if not found
 */
export async function getCachedImage(url: string): Promise<string | null> {
  // Check memory cache first for fastest retrieval
  if (memoryCache.has(url)) {
    return memoryCache.get(url) || null;
  }
  
  // If not in memory, check IndexedDB
  try {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('Error opening database:', event);
        resolve(null); // Don't reject, just return null to fall back to original image
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([IMAGES_STORE], 'readonly');
        const store = transaction.objectStore(IMAGES_STORE);
        const getRequest = store.get(url);
        
        getRequest.onerror = (event) => {
          console.error('Error fetching image from cache:', event);
          resolve(null);
        };
        
        getRequest.onsuccess = (event) => {
          const result = getRequest.result;
          if (!result) {
            resolve(null);
            return;
          }
          
          // Update memory cache
          memoryCache.set(url, result.dataUrl);
          resolve(result.dataUrl);
        };
      };
    });
  } catch (error) {
    console.error('Error retrieving cached image:', error);
    return null;
  }
}

/**
 * Cache an image into both memory and IndexedDB
 * @param url The original image URL used as key
 * @param dataUrl The data URL of the image content
 * @returns A promise that resolves when caching is complete
 */
export async function cacheImage(url: string, dataUrl: string): Promise<void> {
  // Update memory cache
  memoryCache.set(url, dataUrl);
  
  // Store in IndexedDB for persistence
  try {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('Error opening database for caching:', event);
        resolve(); // Don't reject on error, just log and continue
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([IMAGES_STORE], 'readwrite');
        const store = transaction.objectStore(IMAGES_STORE);
        
        // Store the image with timestamp for cleanup later
        const storeRequest = store.put({
          url,
          dataUrl,
          timestamp: Date.now()
        });
        
        storeRequest.onerror = (event) => {
          console.error('Error storing image in cache:', event);
          resolve();
        };
        
        storeRequest.onsuccess = (event) => {
          resolve();
        };
      };
    });
  } catch (error) {
    console.error('Error caching image:', error);
  }
}

/**
 * Preload and cache an image from a URL
 * @param url The URL of the image to preload
 * @returns A promise that resolves with the cached image URL
 */
export async function preloadImage(url: string): Promise<string> {
  // Skip if URL is not valid
  if (!url || url.startsWith('data:') || !url.startsWith('/')) {
    return url;
  }
  
  // Check if already cached
  const cachedUrl = await getCachedImage(url);
  if (cachedUrl) {
    return cachedUrl;
  }
  
  // Fetch and cache the image
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        // Cache the result
        cacheImage(url, dataUrl)
          .then(() => resolve(dataUrl))
          .catch((error) => {
            console.error('Error caching preloaded image:', error);
            resolve(url); // Fall back to original URL
          });
      };
      reader.onerror = () => {
        console.error('Error reading image file');
        resolve(url); // Fall back to original URL
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error preloading image:', error);
    return url; // Fall back to original URL
  }
}

/**
 * Preload multiple images at once
 * @param urls An array of image URLs to preload
 * @returns A promise that resolves when all images are preloaded
 */
export async function preloadImages(urls: string[]): Promise<void> {
  // Filter out invalid URLs
  const validUrls = urls.filter(url => url && typeof url === 'string' && url.startsWith('/'));
  
  if (validUrls.length === 0) {
    return;
  }
  
  // Preload in parallel with concurrency limit
  const concurrencyLimit = 3; // Load at most 3 images at once
  for (let i = 0; i < validUrls.length; i += concurrencyLimit) {
    const batch = validUrls.slice(i, i + concurrencyLimit);
    await Promise.all(batch.map(url => preloadImage(url)));
  }
}

/**
 * Clean up old cached images to avoid using too much storage
 * @param maxAgeMs Maximum age of cached items in milliseconds (default: 7 days)
 * @returns A promise that resolves when cleanup is complete
 */
export async function cleanupImageCache(maxAgeMs = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const cutoffTime = Date.now() - maxAgeMs;
  
  try {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('Error opening database for cleanup:', event);
        resolve();
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([IMAGES_STORE], 'readwrite');
        const store = transaction.objectStore(IMAGES_STORE);
        const index = store.index('timestamp');
        
        const range = IDBKeyRange.upperBound(cutoffTime);
        const cursorRequest = index.openCursor(range);
        
        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            // Delete old entries
            store.delete(cursor.primaryKey);
            cursor.continue();
          }
        };
        
        transaction.oncomplete = () => {
          console.log('Image cache cleanup complete');
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error('Error during image cache cleanup:', event);
          resolve();
        };
      };
    });
  } catch (error) {
    console.error('Error cleaning up image cache:', error);
  }
}

/**
 * A React-ready hook to get a cached or loading image URL
 * @param originalUrl The original image URL
 * @returns The cached or loading image URL
 */
export function getOptimizedImageUrl(originalUrl: string): string {
  if (!originalUrl) {
    return ''; // Return empty string for falsy URLs
  }
  
  // Check memory cache synchronously
  if (memoryCache.has(originalUrl)) {
    return memoryCache.get(originalUrl) || originalUrl;
  }
  
  // Start preloading in the background
  preloadImage(originalUrl).catch(console.error);
  
  // Return original URL while loading
  return originalUrl;
}