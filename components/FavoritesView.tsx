import React from 'react';
import { FavoriteDesign } from '../types';
import { DeleteIcon, ViewIcon } from './icons/Icons';
import ImageWithFallback from './ImageWithFallback';

interface FavoritesViewProps {
  favorites: FavoriteDesign[];
  onView: (projectId: string, initialStyleName?: string) => void; // To view the original project
  onDelete: (favoriteId: string) => void;
}

const FavoritesView: React.FC<FavoritesViewProps> = ({ favorites, onView, onDelete }) => {
  if (favorites.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-bold text-gray-700">No tienes diseños favoritos guardados</h2>
        <p className="text-gray-500 mt-2">Guarda tus diseños preferidos desde la vista de proyecto.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h2 className="text-4xl font-bold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">Mis Diseños Favoritos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" role="list" aria-label="Lista de diseños favoritos">
        {favorites.map(favorite => (
          <div key={favorite.id} className="bg-white rounded-3xl shadow-xl overflow-hidden group transition-all hover:shadow-2xl hover:-translate-y-1" role="listitem">
            <ImageWithFallback 
                src={favorite.styleVariation.imageUrl} 
                alt={`Diseño favorito: ${favorite.styleVariation.style_name}`} 
                className="w-full h-48 object-cover" 
                fallbackIconClassName="w-1/3 h-1/3"
            />
            <div className="p-5">
              <h3 className="font-bold text-xl truncate text-gray-800">{favorite.styleVariation.style_name}</h3>
              <p className="text-sm text-gray-500">Proyecto original: {favorite.projectName}</p>
              <p className="text-sm text-gray-500">Guardado: {new Date(favorite.favoritedAt).toLocaleDateString()}</p>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => onView(favorite.projectId, favorite.styleVariation.style_name)} 
                  className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all"
                  title="Ver proyecto original"
                  aria-label={`Ver proyecto original para ${favorite.styleVariation.style_name}`}
                >
                    <ViewIcon className="w-5 h-5"/>
                </button>
                <button 
                  onClick={() => onDelete(favorite.id)} 
                  className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                  title="Eliminar de favoritos"
                  aria-label={`Eliminar diseño favorito ${favorite.styleVariation.style_name}`}
                >
                    <DeleteIcon className="w-5 h-5"/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoritesView;