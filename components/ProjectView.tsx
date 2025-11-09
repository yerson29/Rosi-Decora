import React, { useState } from 'react';
import { Project, StyleVariation } from '../types';
import RefinementPanel from './RefinementPanel';
import FurnitureList from './FurnitureList';
import ImageWithFallback from './ImageWithFallback'; // Import the new component
import { HeartIcon, ShareIcon } from './icons/Icons'; // Import HeartIcon and ShareIcon

interface ProjectViewProps {
  project: Project;
  onRefine: (project: Project, styleName: string, prompt: string) => void;
  onFavorite: (designToFavorite: StyleVariation, projectId: string, projectName: string) => void;
  onRevert: (project: Project, styleName: string) => void; // New prop for reverting
}

const StyleCard: React.FC<{ variation: StyleVariation; onSelect: () => void; onShare: (imageUrl: string) => void; isSelected: boolean }> = ({ variation, onSelect, onShare, isSelected }) => {
    const latestIteration = variation.iterations.length > 0 ? variation.iterations[variation.iterations.length - 1] : null;
    const displayImage = latestIteration ? latestIteration.imageUrl : variation.imageUrl;

    const handleShareClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card selection from firing
        onShare(displayImage);
    };

    return (
        <div 
            className={`bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer transition-all duration-300 ${isSelected ? 'ring-4 ring-pink-400 scale-105' : 'hover:shadow-2xl hover:scale-102'}`}
            onClick={onSelect}
            aria-label={`Seleccionar estilo ${variation.style_name}`}
            role="button"
        >
            <ImageWithFallback 
                src={displayImage} 
                alt={variation.style_name} 
                className="w-full h-64 object-cover" 
                fallbackIconClassName="w-1/2 h-1/2"
            />
            <div className="p-6 flex justify-between items-center">
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">{variation.style_name}</h3>
                <button
                    onClick={handleShareClick}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                    aria-label={`Compartir diseño de estilo ${variation.style_name}`}
                    title="Compartir diseño"
                >
                    <ShareIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};


const ProjectView: React.FC<ProjectViewProps> = ({ project, onRefine, onFavorite, onRevert }) => {
    const [selectedStyle, setSelectedStyle] = useState<StyleVariation | null>(project.styleVariations[0] || null);
    
    const handleShare = (imageUrl: string) => {
        navigator.clipboard.writeText(imageUrl).then(() => {
            alert("¡Enlace copiado al portapapeles, mi amor!");
        }).catch(err => {
            console.error('Failed to copy image data URL: ', err);
            alert("Mi vida, no pude copiar el enlace. ¡Qué pena!");
        });
    };

    // Determine the most current details to display
    const latestIteration = selectedStyle?.iterations.length > 0 
        ? selectedStyle.iterations[selectedStyle.iterations.length - 1] 
        : null;

    const displayDescription = latestIteration?.description ?? selectedStyle?.description;
    const displayPalette = latestIteration?.color_palette ?? selectedStyle?.color_palette;
    const displayFurniture = latestIteration?.furniture_recommendations ?? selectedStyle?.furniture_recommendations;

    return (
        <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">{project.name}</h2>
            <p className="text-center text-gray-600 mb-8">{project.analysis}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12" role="group" aria-label="Variaciones de estilo de diseño de interiores">
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden relative">
                    <ImageWithFallback 
                        src={project.originalImage} 
                        alt="Tu imagen original"
                        className="w-full h-64 object-cover" 
                        fallbackIconClassName="w-1/2 h-1/2"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-end">
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-white" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.5)'}}>Nuestra Foto Original</h3>
                        </div>
                    </div>
                </div>

                {project.styleVariations.map(variation => (
                    <StyleCard 
                        key={variation.style_name} 
                        variation={variation} 
                        isSelected={selectedStyle?.style_name === variation.style_name}
                        onSelect={() => setSelectedStyle(variation)}
                        onShare={handleShare}
                    />
                ))}
            </div>

            {selectedStyle && (
                <div className="bg-white/50 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-10">
                    <h3 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">{selectedStyle.style_name}</h3>
                    
                    <button 
                      onClick={() => onFavorite(selectedStyle, project.id, project.name)} 
                      className="mb-8 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-400 to-fuchsia-400 text-white font-semibold shadow-lg hover:scale-105 transition-transform"
                      aria-label="Guardar este diseño en favoritos"
                    >
                      <HeartIcon className="w-5 h-5"/> Guardar como Favorito
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div>
                            <RefinementPanel 
                                key={selectedStyle.style_name}
                                styleVariation={selectedStyle} 
                                onRefine={(prompt) => onRefine(project, selectedStyle.style_name, prompt)}
                                onRevert={() => onRevert(project, selectedStyle.style_name)} 
                            />
                        </div>
                        <div>
                             <div className="mb-8">
                                <h4 className="text-xl font-semibold mb-3 text-gray-700">Descripción del Estilo</h4>
                                <p className="text-gray-600">{displayDescription}</p>
                            </div>
                            <div className="mb-8">
                                <h4 className="text-xl font-semibold mb-3 text-gray-700">Paleta de Colores</h4>
                                {displayPalette && (
                                    <div className="flex gap-3" role="list" aria-label="Paleta de colores del estilo">
                                        {displayPalette.map((color, index) => (
                                            <div key={index} className="w-12 h-12 rounded-full shadow-md border-2 border-white" style={{ backgroundColor: color }} title={color} role="listitem" aria-label={`Color ${color}`}></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="text-xl font-semibold mb-4 text-gray-700">Muebles Recomendados</h4>
                                {displayFurniture && <FurnitureList furniture={displayFurniture} />}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectView;