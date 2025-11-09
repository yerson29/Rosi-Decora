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
        <div key={index} className="bg-white p-4 rounded-2xl shadow-lg transition-all hover:shadow-xl hover:scale-102 flex flex-col sm:flex-row items-start gap-4">
          {/* Replaced FurnitureImage with ImageWithFallback */}
          <ImageWithFallback src={item.imageUrl} alt={item.name} className="w-full sm:w-24 h-24 object-cover rounded-lg flex-shrink-0" fallbackIconClassName="w-1/2 h-1/2" />
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <h5 className="font-bold text-lg text-gray-800">{item.name}</h5>
              <span className="text-lg font-semibold text-pink-500">{item.price}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1 mb-3">{item.description}</p>
            {/* The link is guaranteed to exist due to the filter above, but keeping the check for safety */}
            {item.link && ( 
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