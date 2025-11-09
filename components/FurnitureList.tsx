import React, { useState, useEffect } from 'react';
import { Furniture } from '../types';
import { ExternalLinkIcon, ImageIcon } from './icons/Icons';

interface FurnitureListProps {
  furniture: Furniture[];
}

// Helper component to handle furniture image loading and fallbacks
const FurnitureImage: React.FC<{ src: string | undefined; alt: string }> = ({ src, alt }) => {
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
            <div className="w-full sm:w-24 h-24 flex-shrink-0 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                <ImageIcon className="w-12 h-12" />
            </div>
        );
    }

    return (
        <img
            src={imgSrc}
            alt={alt}
            className="w-full sm:w-24 h-24 object-cover rounded-lg flex-shrink-0"
            onError={handleError}
        />
    );
};


const FurnitureList: React.FC<FurnitureListProps> = ({ furniture }) => {
  return (
    <div className="space-y-4">
      {furniture.map((item, index) => (
        <div key={index} className="bg-white p-4 rounded-2xl shadow-lg transition-all hover:shadow-xl hover:scale-102 flex flex-col sm:flex-row items-start gap-4">
          <FurnitureImage src={item.imageUrl} alt={item.name} />
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <h5 className="font-bold text-lg text-gray-800">{item.name}</h5>
              <span className="text-lg font-semibold text-pink-500">{item.price}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1 mb-3">{item.description}</p>
            {item.link && ( // Only show link if it exists
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-800 transition-colors"
              >
                Ver producto <ExternalLinkIcon className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FurnitureList;