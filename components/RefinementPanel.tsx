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
      { imageUrl: styleVariation.imageUrl, prompt: "Nuestro diseño inicial" },
      ...styleVariation.iterations
  ];
  
  return (
    <div className="flex flex-col h-full">
      <h4 className="text-3xl main-title mb-4 text-primary-accent">Susúrrame tus Ideas...</h4>
      
      {styleVariation.iterations.length > 0 && (
          <div className="mb-4">
              <h5 className="font-semibold text-text-color-soft dark:text-gray-400 mb-2">Nuestra Evolución:</h5>
              <div className="flex items-center gap-2 overflow-x-auto pb-2" role="list" aria-label="Historial de iteraciones de diseño">
                   {allImages.slice(0, -1).map((iter, index) => (
                       <div key={index} className="flex-shrink-0 text-center group relative" role="listitem">
                           <ImageWithFallback 
                               src={iter.imageUrl} 
                               alt={`Iteración ${index}: ${iter.prompt}`} 
                               className="w-16 h-16 rounded-lg object-cover shadow-md"
                               fallbackIconClassName="w-8 h-8"
                           />
                           <span className="absolute bottom-1 right-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded-full">#{index}</span>
                       </div>
                   ))}
              </div>
          </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Dime qué soñaste, mi amor. Ej: 'Un sofá donde acurrucarnos' o 'Paredes con el color de tus ojos'..."
          className="w-full p-3 border border-secondary-accent/50 rounded-2xl mb-3 focus:ring-2 focus:ring-primary-accent focus:border-transparent transition bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-500"
          rows={3}
          aria-label="Introduce tu solicitud de refinamiento de diseño"
        ></textarea>
        <p className="text-sm text-text-color-soft dark:text-gray-400 mb-4 text-center">
            Cuéntame con detalle qué imaginas, y haré que se vuelva realidad para nosotros.
        </p>
        <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="flex-grow py-3 rounded-xl btn-primary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Generar una nueva versión del diseño"
            >
              Transformar
            </button>
            <button
                type="button"
                onClick={onRevert}
                disabled={styleVariation.iterations.length === 0}
                className="flex-shrink-0 p-3 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 dark:bg-gray-600 dark:text-gray-200"
                aria-label="Volver a la versión anterior"
                title="Volver a nuestro último sueño"
            >
                <RevertIcon className="w-6 h-6"/>
            </button>
        </div>
      </form>
    </div>
  );
};

export default RefinementPanel;