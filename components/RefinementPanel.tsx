import React, { useState } from 'react';
import { StyleVariation } from '../types';

interface RefinementPanelProps {
  styleVariation: StyleVariation;
  onRefine: (prompt: string) => void;
}

const RefinementPanel: React.FC<RefinementPanelProps> = ({ styleVariation, onRefine }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onRefine(prompt);
      setPrompt('');
    }
  };
  
  const allImages = [
      { imageUrl: styleVariation.imageUrl, prompt: "Diseño inicial" },
      ...styleVariation.iterations
  ];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, type: string) => {
    console.error(`Failed to load ${type} image:`, e.currentTarget.src);
    // Optionally, set a fallback image or hide the broken image
    // e.currentTarget.src = "/path/to/placeholder.png"; 
  };

  return (
    <div className="flex flex-col h-full">
      <h4 className="text-xl font-semibold mb-4 text-gray-700">Ajusta el Diseño</h4>
      
      <div className="relative flex-grow bg-gray-100 rounded-2xl p-2 shadow-inner mb-4 overflow-hidden">
        <img 
            src={allImages[allImages.length - 1].imageUrl} 
            alt="Último diseño" 
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => handleImageError(e, "latest iteration")}
        />
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            Iteración #{styleVariation.iterations.length}
        </div>
      </div>
      
      {styleVariation.iterations.length > 0 && (
          <div className="mb-4">
              <h5 className="font-semibold text-gray-600 mb-2">Historial de Cambios:</h5>
              <div className="flex items-center gap-2 overflow-x-auto pb-2" role="list" aria-label="Historial de iteraciones de diseño">
                   {allImages.slice(0, -1).map((iter, index) => (
                       <div key={index} className="flex-shrink-0 text-center" role="listitem">
                           <img 
                               src={iter.imageUrl} 
                               alt={`Iteración ${index}: ${iter.prompt}`} 
                               className="w-20 h-20 rounded-lg object-cover shadow-md mb-1"
                               onError={(e) => handleImageError(e, `iteration ${index}`)}
                           />
                           <span className="text-xs text-gray-500">#{index}</span>
                       </div>
                   ))}
              </div>
          </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej: 'Añade una planta grande en la esquina', 'Cambia el sofá a un color azul'..."
          className="w-full p-3 border border-gray-300 rounded-2xl mb-3 focus:ring-2 focus:ring-pink-400 focus:border-transparent transition"
          rows={3}
          aria-label="Introduce tu solicitud de refinamiento de diseño"
        ></textarea>
        <button
          type="submit"
          disabled={!prompt.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-semibold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          aria-label="Generar una nueva versión del diseño"
        >
          Generar Nueva Versión
        </button>
      </form>
    </div>
  );
};

export default RefinementPanel;