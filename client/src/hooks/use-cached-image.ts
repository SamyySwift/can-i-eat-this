import { useState, useEffect } from 'react';
import { getCachedImage, preloadImage } from '@/lib/imageCache';

/**
 * A React hook that provides cached images for faster loading
 * 
 * @param url The URL of the image to load and cache
 * @param fallbackUrl Optional fallback URL to use if the image can't be loaded
 * @returns An object containing the optimized image URL and loading state
 */
export function useCachedImage(url?: string, fallbackUrl?: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(url || null);
  const [isLoading, setIsLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<boolean>(false);
  
  useEffect(() => {
    // Reset states when URL changes
    setImageUrl(url || null);
    setIsLoading(!!url);
    setError(false);
    
    let isMounted = true;
    
    if (!url) {
      return;
    }
    
    // Try to get cached version first
    const getImage = async () => {
      try {
        // First, check if it's in the cache
        const cachedUrl = await getCachedImage(url);
        
        if (cachedUrl && isMounted) {
          setImageUrl(cachedUrl);
          setIsLoading(false);
          return;
        }
        
        // If not cached, preload it
        const preloadedUrl = await preloadImage(url);
        
        if (isMounted) {
          setImageUrl(preloadedUrl);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading cached image:', err);
        if (isMounted) {
          setError(true);
          setIsLoading(false);
          setImageUrl(fallbackUrl || url); // Fallback to original or provided fallback
        }
      }
    };
    
    getImage();
    
    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [url, fallbackUrl]);
  
  return {
    imageUrl: error && fallbackUrl ? fallbackUrl : imageUrl,
    isLoading,
    error
  };
}