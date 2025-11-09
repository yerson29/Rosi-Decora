import React from 'react';
import { Project } from '../types';
import { DeleteIcon, ViewIcon } from './icons/Icons';
import ImageWithFallback from './ImageWithFallback'; // Import the new component

interface ArchiveViewProps {
  projects: Project[];
  onView: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

const ArchiveView: React.FC<ArchiveViewProps> = ({ projects, onView, onDelete }) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-3xl font-bold text-gray-700">No tienes proyectos guardados</h2>
        <p className="text-gray-500 mt-2">¡Sube una imagen para empezar a decorar!</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <h2 className="text-4xl font-bold text-center mb-10 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">Mis Proyectos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" role="list" aria-label="Lista de proyectos guardados">
        {projects.map(project => (
          <div key={project.id} className="bg-white rounded-3xl shadow-xl overflow-hidden group transition-all hover:shadow-2xl hover:-translate-y-1" role="listitem">
            {/* Replaced img with ImageWithFallback */}
            <ImageWithFallback 
                src={project.originalImage} 
                alt={`Imagen original del proyecto ${project.name}`} 
                className="w-full h-48 object-cover" 
                fallbackIconClassName="w-1/3 h-1/3"
            />
            <div className="p-5">
              <h3 className="font-bold text-xl truncate text-gray-800">{project.name}</h3>
              <p className="text-sm text-gray-500">Creado: {new Date(project.createdAt).toLocaleDateString()}</p>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => onView(project.id)} 
                  className="p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-all"
                  title="Ver proyecto"
                  aria-label={`Ver detalles del proyecto ${project.name}`}
                >
                    <ViewIcon className="w-5 h-5"/>
                </button>
                <button 
                  onClick={() => onDelete(project.id)} 
                  className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                  title="Eliminar proyecto"
                  aria-label={`Eliminar proyecto ${project.name}`}
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

export default ArchiveView;