import React, { useState } from 'react';
import { StyleVariation } from '../types';
import ImageWithFallback from './ImageWithFallback'; // Import the new component
import { RevertIcon } from './icons/Icons';

interface RefinementPanelProps {
  styleVariation: StyleVariation;
  onRefine: (prompt: string) => void;
  onRevert: () => void;
}

const RefinementPanel: React.FC<RefinementPanelProps> = ({ styleVariation, onRefine, onRevert }) => {
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
  
  return (
    <div className="flex flex-col h-full">
      <h4 className="text-xl font-semibold mb-4 text-gray-700">Ajusta el Diseño</h4>
      
      <div className="relative flex-grow bg-gray-100 rounded-2xl p-2 shadow-inner mb-4 overflow-hidden aspect-video"> {/* Added aspect-video */}
        {/* Replaced img with ImageWithFallback */}
        <ImageWithFallback 
            src={allImages[allImages.length - 1].imageUrl} 
            alt="Último diseño" 
            className="w-full h-full object-cover rounded-xl"
            fallbackIconClassName="w-1/3 h-1/3" // Adjust as needed
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
                           {/* Replaced img with ImageWithFallback */}
                           <ImageWithFallback 
                               src={iter.imageUrl} 
                               alt={`Iteración ${index}: ${iter.prompt}`} 
                               className="w-20 h-20 rounded-lg object-cover shadow-md mb-1"
                               fallbackIconClassName="w-10 h-10" // Adjust as needed
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
        <p className="text-sm text-gray-500 mb-4 text-center">
            Un consejo, mi amor: Sé específica y concisa. Ej: "Añade una alfombra redonda gris", "Cambia el color de la pared a azul pastel", "Quita el cuadro grande".
        </p>
        <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="flex-grow py-3 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-semibold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              aria-label="Generar una nueva versión del diseño"
            >
              Crear Nueva Versión
            </button>
            <button
                type="button"
                onClick={onRevert}
                disabled={styleVariation.iterations.length === 0}
                className="flex-shrink-0 p-3 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                aria-label="Volver a la versión anterior"
                title="Volver a la versión anterior"
            >
                <RevertIcon className="w-6 h-6"/>
            </button>
        </div>
      </form>
    </div>
  );
};

export default RefinementPanel;