import React, { useState, useMemo } from 'react';
import { FavoriteDesign } from '../types';
import { DeleteIcon, ViewIcon, HeartIcon, SearchIcon } from './icons/Icons';
import ImageWithFallback from './ImageWithFallback';

interface FavoritesViewProps {
  favorites: FavoriteDesign[];
  onView: (projectId: string, initialStyleName?: string) => void;
  onDelete: (favoriteId: string) => void;
  onNavigateToUpload: () => void;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({ favorites, onView, onDelete, onNavigateToUpload }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFavorites = useMemo(() => {
    if (!searchTerm) return favorites;
    return favorites.filter(f => 
        f.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.styleVariation.style_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [favorites, searchTerm]);

  if (favorites.length === 0) {
    return (
      <div className="text-center py-20 flex flex-col items-center justify-center gap-6">
        <HeartIcon className="w-24 h-24 text-primary-accent/50" />
        <h2 className="text-5xl font-bold text-primary-accent dark:text-pink-400 main-title">Nuestro Cofre de Tesoros está vacío</h2>
        <p className="text-text-color-soft dark:text-gray-400 mt-2 max-w-md">Mi amor, guardemos aquí los diseños que más nos roben el corazón.</p>
        <button 
          onClick={onNavigateToUpload} 
          className="mt-4 px-8 py-3 rounded-xl btn-primary text-white font-semibold"
        >
          Empecemos una Nueva Aventura
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h2 className="text-6xl font-bold text-center mb-4 text-primary-accent dark:text-pink-400 main-title">Nuestro Cofre de Tesoros</h2>
      
      <div className="mb-8 max-w-lg mx-auto">
          <div className="relative">
              <input 
                  type="text"
                  placeholder="Buscar un tesoro..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-secondary-accent/30 dark:border-gray-600 bg-card-bg dark:bg-gray-800 focus:ring-2 focus:ring-primary-accent focus:outline-none transition"
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-color-soft" />
          </div>
      </div>

      {filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" role="list" aria-label="Lista de diseños favoritos">
          {filteredFavorites.map(favorite => (
            <div key={favorite.id} className="bg-card-bg rounded-3xl card-shadow overflow-hidden group transition-all duration-300 hover:-translate-y-1 border border-pink-100 dark:border-gray-700" role="listitem">
              <ImageWithFallback 
                  src={favorite.styleVariation.imageUrl} 
                  alt={`Nuestro tesoro: ${favorite.styleVariation.style_name}`} 
                  className="w-full h-48 object-cover" 
                  fallbackIconClassName="w-1/3 h-1/3"
              />
              <div className="p-5">
                <h3 className="font-bold text-xl truncate text-text-color dark:text-gray-100">{favorite.styleVariation.style_name}</h3>
                <p className="text-sm text-text-color-soft dark:text-gray-400">De nuestro sueño: {favorite.projectName}</p>
                <p className="text-sm text-text-color-soft dark:text-gray-400">Atesorado el: {new Date(favorite.favoritedAt).toLocaleDateString()}</p>
                <div className="flex justify-end gap-2 mt-4">
                  <button 
                    onClick={() => onView(favorite.projectId, favorite.styleVariation.style_name)} 
                    className="p-2 rounded-full bg-secondary-accent/20 text-purple-700 hover:bg-secondary-accent/40 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900 transition-all"
                    title="Ver el sueño original"
                    aria-label={`Ver el sueño original de ${favorite.styleVariation.style_name}`}
                  >
                      <ViewIcon className="w-5 h-5"/>
                  </button>
                  <button 
                    onClick={() => onDelete(favorite.id)} 
                    className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 transition-all"
                    title="Quitar del cofre"
                    aria-label={`Quitar del cofre el diseño ${favorite.styleVariation.style_name}`}
                  >
                      <DeleteIcon className="w-5 h-5"/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
          <div className="text-center py-10">
              <p className="text-text-color-soft dark:text-gray-300">Mi amor, no encontré tesoros con ese nombre.</p>
          </div>
      )}
    </div>
  );
};

export default FavoritesView;