import React, { useState } from 'react';
import { useCachedImage } from '@/hooks/use-cached-image';
import { Skeleton } from '@/components/ui/skeleton';
import { getFoodEmoji } from '@/lib/utils';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  foodName?: string; // Used for emoji fallback
  showSkeleton?: boolean;
  height?: string | number;
  width?: string | number;
  className?: string;
}

/**
 * A component that displays cached images with loading and error states
 */
export default function CachedImage({
  src,
  alt,
  fallbackSrc,
  foodName,
  showSkeleton = true,
  height,
  width,
  className = '',
  ...props
}: CachedImageProps) {
  const { imageUrl, isLoading, error } = useCachedImage(src, fallbackSrc);
  const [imgError, setImgError] = useState(false);
  
  // Handle cases where the image is loaded but throws an error when rendered
  const handleImageError = () => {
    setImgError(true);
  };
  
  // Loading state 
  if (isLoading && showSkeleton) {
    return (
      <Skeleton 
        className={`${className} object-cover`}
        style={{ 
          height: height || '100%',
          width: width || '100%'
        }}
      />
    );
  }
  
  // Error state or missing image URL - show emoji-based fallback
  if (error || imgError || !imageUrl) {
    return (
      <div 
        className={`${className} bg-gray-200 flex items-center justify-center`}
        style={{ 
          height: height || '100%',
          width: width || '100%'
        }}
      >
        <div className="text-gray-500 flex flex-col items-center">
          <span className="text-5xl mb-2">{getFoodEmoji(foodName || alt)}</span>
          <span className="text-sm">{foodName || alt}</span>
        </div>
      </div>
    );
  }
  
  // Successfully loaded image
  return (
    <img
      src={imageUrl}
      alt={alt}
      onError={handleImageError}
      className={`${className} object-cover`}
      style={{ 
        height: height || 'auto',
        width: width || '100%'
      }}
      {...props}
    />
  );
}