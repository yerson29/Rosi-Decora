import React from 'react';
import { Furniture } from '../types';
import { ExternalLinkIcon } from './icons/Icons';
import ImageWithFallback from './ImageWithFallback'; // Import the new component


interface FurnitureListProps {
  furniture: Furniture[];
}

const FurnitureList: React.FC<FurnitureListProps> = ({ furniture }) => {
  return (
    <div className="space-y-4">
      {furniture
        .filter(item => item.link) // Filter: only show items with a valid link
        .map((item, index) => (
        <div key={index} className="bg-white/50 dark:bg-gray-800 p-4 rounded-2xl card-shadow transition-all hover:scale-[1.02] flex flex-col sm:flex-row items-start gap-4">
          <ImageWithFallback src={item.imageUrl} alt={item.name} className="w-full sm:w-24 h-24 object-cover rounded-lg flex-shrink-0" fallbackIconClassName="w-1/2 h-1/2" />
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <h5 className="font-bold text-lg text-text-color dark:text-gray-100">{item.name}</h5>
              <span className="text-lg font-semibold text-primary-accent dark:text-pink-400">{item.price}</span>
            </div>
            <p className="text-sm text-text-color-soft dark:text-gray-400 mt-1 mb-3">{item.description}</p>
            {item.link && ( 
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
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