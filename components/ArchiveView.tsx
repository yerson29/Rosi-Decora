import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { DeleteIcon, ViewIcon, SearchIcon } from './icons/Icons';
import ImageWithFallback from './ImageWithFallback';

interface ArchiveViewProps {
  projects: Project[];
  onView: (projectId: string) => void;
  onDelete: (projectId:string) => void;
}

const ArchiveView: React.FC<ArchiveViewProps> = ({ projects, onView, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    return projects.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [projects, searchTerm]);

  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-5xl font-bold text-primary-accent dark:text-pink-400 main-title">Nuestra galería de sueños está vacía</h2>
        <p className="text-text-color-soft dark:text-gray-400 mt-2">Mi amor, sube una foto para que creemos nuestro primer sueño juntos.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h2 className="text-6xl font-bold text-center mb-4 text-primary-accent dark:text-pink-400 main-title">Galería de Nuestros Sueños</h2>
      
      <div className="mb-8 max-w-lg mx-auto">
          <div className="relative">
              <input 
                  type="text"
                  placeholder="Buscar en nuestros recuerdos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-secondary-accent/30 dark:border-gray-600 bg-card-bg dark:bg-gray-800 focus:ring-2 focus:ring-primary-accent focus:outline-none transition"
              />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-color-soft" />
          </div>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" role="list" aria-label="Lista de proyectos guardados">
          {filteredProjects.map(project => (
            <div key={project.id} className="bg-card-bg rounded-3xl card-shadow overflow-hidden group transition-all duration-300 hover:-translate-y-1 border border-pink-100 dark:border-gray-700" role="listitem">
              <ImageWithFallback 
                  src={project.originalImage} 
                  alt={`Imagen original de nuestro sueño: ${project.name}`} 
                  className="w-full h-48 object-cover" 
                  fallbackIconClassName="w-1/3 h-1/3"
              />
              <div className="p-5">
                <h3 className="font-bold text-xl truncate text-text-color dark:text-gray-100">{project.name}</h3>
                <p className="text-sm text-text-color-soft dark:text-gray-400">Soñado el: {new Date(project.createdAt).toLocaleDateString()}</p>
                
                <div className="flex gap-2 mt-2 overflow-hidden">
                    {project.styleVariations.slice(0, 4).map(variation => (
                        <ImageWithFallback 
                            key={variation.style_name}
                            src={variation.imageUrl}
                            alt={variation.style_name}
                            className="w-10 h-10 rounded-md object-cover border-2 border-white dark:border-gray-600"
                        />
                    ))}
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <button 
                    onClick={() => onView(project.id)} 
                    className="p-2 rounded-full bg-secondary-accent/20 text-purple-700 hover:bg-secondary-accent/40 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900 transition-all"
                    title="Revivir este sueño"
                    aria-label={`Ver detalles del sueño ${project.name}`}
                  >
                      <ViewIcon className="w-5 h-5"/>
                  </button>
                  <button 
                    onClick={() => onDelete(project.id)} 
                    className="p-2 rounded-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 transition-all"
                    title="Dejar ir este sueño"
                    aria-label={`Eliminar el sueño ${project.name}`}
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
            <p className="text-text-color-soft dark:text-gray-300">Mi amor, no encontré ningún recuerdo con ese nombre.</p>
        </div>
      )}
    </div>
  );
};

export default ArchiveView;