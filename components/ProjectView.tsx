import React, { useState } from 'react';
import { Project, StyleVariation } from '../types';
import RefinementPanel from './RefinementPanel';
import FurnitureList from './FurnitureList';

interface ProjectViewProps {
  project: Project;
  onRefine: (project: Project, styleName: string, prompt: string) => void;
}

const StyleCard: React.FC<{ variation: StyleVariation; onSelect: () => void; isSelected: boolean }> = ({ variation, onSelect, isSelected }) => (
    <div 
        className={`bg-white rounded-3xl shadow-xl overflow-hidden cursor-pointer transition-all duration-300 ${isSelected ? 'ring-4 ring-pink-400 scale-105' : 'hover:shadow-2xl hover:scale-102'}`}
        onClick={onSelect}
        aria-label={`Seleccionar estilo ${variation.style_name}`}
        role="button"
    >
        <img 
            src={variation.imageUrl} 
            alt={variation.style_name} 
            className="w-full h-64 object-cover" 
            onError={(e) => {
                console.error("Failed to load style variation image:", e.currentTarget.src);
                // Optionally, set a fallback image
                // e.currentTarget.src = "/path/to/placeholder.png";
            }}
        />
        <div className="p-6">
            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">{variation.style_name}</h3>
        </div>
    </div>
);


const ProjectView: React.FC<ProjectViewProps> = ({ project, onRefine }) => {
    const [selectedStyle, setSelectedStyle] = useState<StyleVariation | null>(project.styleVariations[0] || null);
    
    return (
        <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">{project.name}</h2>
            <p className="text-center text-gray-600 mb-8">{project.analysis}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12" role="group" aria-label="Variaciones de estilo de diseño de interiores">
                {project.styleVariations.map(variation => (
                    <StyleCard 
                        key={variation.style_name} 
                        variation={variation} 
                        isSelected={selectedStyle?.style_name === variation.style_name}
                        onSelect={() => setSelectedStyle(variation)}
                    />
                ))}
            </div>

            {selectedStyle && (
                <div className="bg-white/50 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-10">
                    <h3 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">{selectedStyle.style_name}</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div>
                            <RefinementPanel 
                                key={selectedStyle.style_name}
                                styleVariation={selectedStyle} 
                                onRefine={(prompt) => onRefine(project, selectedStyle.style_name, prompt)} 
                            />
                        </div>
                        <div>
                             <div className="mb-8">
                                <h4 className="text-xl font-semibold mb-3 text-gray-700">Descripción del Estilo</h4>
                                <p className="text-gray-600">{selectedStyle.description}</p>
                            </div>
                            <div className="mb-8">
                                <h4 className="text-xl font-semibold mb-3 text-gray-700">Paleta de Colores</h4>
                                <div className="flex gap-3" role="list" aria-label="Paleta de colores del estilo">
                                    {selectedStyle.color_palette.map((color, index) => (
                                        <div key={index} className="w-12 h-12 rounded-full shadow-md border-2 border-white" style={{ backgroundColor: color }} title={color} role="listitem" aria-label={`Color ${color}`}></div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xl font-semibold mb-4 text-gray-700">Muebles Recomendados</h4>
                                <FurnitureList furniture={selectedStyle.furniture_recommendations} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectView;