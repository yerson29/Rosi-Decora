import React, { useState, useEffect } from 'react';
import { ImageIcon } from './icons/Icons'; // Assuming ImageIcon is available

interface ImageWithFallbackProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  fallbackIconClassName?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, alt, className, fallbackIconClassName }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    setHasError(true);
    console.error(`Error loading image for ${alt}: ${src}`);
  };

  if (hasError || !imgSrc) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 text-gray-500 ${className || ''}`}>
        <ImageIcon className={fallbackIconClassName || "w-1/2 h-1/2"} /> {/* Default icon size */}
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className || ''}
      onError={handleError}
    />
  );
};

export default ImageWithFallback;