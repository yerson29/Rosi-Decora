import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Project, StyleVariation, Furniture } from '../types';
import RefinementPanel from './RefinementPanel';
import FurnitureList from './FurnitureList';
import ImageWithFallback from './ImageWithFallback';
import { HeartIcon, ShareIcon, EditIcon, ClipboardIcon } from './icons/Icons';

// --- INLINED COMPONENTS FOR SIMPLICITY ---

// ImageComparator Component
const ImageComparator: React.FC<{ before: string; after: string }> = ({ before, after }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        setSliderPos(percent);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const onMouseMove = (moveEvent: MouseEvent) => handleMove(moveEvent.clientX);
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        const onTouchMove = (touchEvent: TouchEvent) => handleMove(touchEvent.touches[0].clientX);
        const onTouchEnd = () => {
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        };
        document.addEventListener('touchmove', onTouchMove);
        document.addEventListener('touchend', onTouchEnd);
    };

    return (
        <div ref={containerRef} className="image-comparator w-full aspect-video select-none">
            <ImageWithFallback src={after} alt="After" className="object-cover" />
            <div className="before-wrapper" style={{ width: `${sliderPos}%` }}>
                <ImageWithFallback src={before} alt="Before" className="object-cover" />
            </div>
            <div
                className="slider"
                style={{ left: `${sliderPos}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <div className="slider-handle"></div>
            </div>
        </div>
    );
};

// Tabs Component
const Tabs: React.FC<{
    tabs: { label: string; content: React.ReactNode }[];
}> = ({ tabs }) => {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.label}
                            onClick={() => setActiveTab(index)}
                            className={`${
                                activeTab === index
                                    ? 'border-primary-accent text-primary-accent dark:text-pink-400'
                                    : 'border-transparent text-text-color-soft hover:text-text-color hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div>{tabs[activeTab].content}</div>
        </div>
    );
};

// ColorPalette Component
const ColorPalette: React.FC<{ palette: string[] }> = ({ palette }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        const textToCopy = palette.join(', ');
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div>
            <div className="flex flex-wrap gap-3" role="list" aria-label="Paleta de colores del estilo">
                {palette.map((color, index) => (
                    <div key={index} className="w-12 h-12 rounded-full shadow-md border-2 border-white dark:border-gray-600" style={{ backgroundColor: color }} title={color} role="listitem" aria-label={`Color ${color}`}></div>
                ))}
            </div>
            <button onClick={handleCopy} className="mt-4 flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                <ClipboardIcon className="w-4 h-4" />
                {copied ? '¡Copiado!' : 'Copiar Paleta'}
            </button>
        </div>
    );
};

// --- MAIN COMPONENT ---

interface ProjectViewProps {
  project: Project;
  initialStyleName?: string;
  onRefine: (project: Project, styleName: string, prompt: string) => void;
  onFavorite: (designToFavorite: StyleVariation, projectId: string, projectName: string) => void;
  onRevert: (project: Project, styleName: string) => void;
  onSaveProjectName: (newName: string) => void;
}


const StyleCard: React.FC<{ variation: StyleVariation; onSelect: () => void; isSelected: boolean }> = ({ variation, onSelect, isSelected }) => {
    const latestIteration = variation.iterations.length > 0 ? variation.iterations[variation.iterations.length - 1] : null;
    const displayImage = latestIteration ? latestIteration.imageUrl : variation.imageUrl;

    return (
        <div 
            className={`bg-card-bg rounded-3xl card-shadow overflow-hidden cursor-pointer transition-all duration-300 ${isSelected ? 'ring-4 ring-primary-accent scale-105' : 'hover:scale-[1.02]'}`}
            onClick={onSelect}
            aria-label={`Seleccionar estilo ${variation.style_name}`}
            role="button"
        >
            <ImageWithFallback 
                src={displayImage} 
                alt={variation.style_name} 
                className="w-full h-40 object-cover" 
                fallbackIconClassName="w-1/2 h-1/2"
            />
            <div className="p-4">
                <h3 className="text-lg font-bold text-primary-accent dark:text-pink-400">{variation.style_name}</h3>
            </div>
        </div>
    );
};


const ProjectView: React.FC<ProjectViewProps> = ({ project, initialStyleName, onRefine, onFavorite, onRevert, onSaveProjectName }) => {
    const [selectedStyle, setSelectedStyle] = useState<StyleVariation | null>(() => {
        const initialStyle = project.styleVariations.find(s => s.style_name === initialStyleName);
        return initialStyle || project.styleVariations[0] || null;
    });

    const [isEditingName, setIsEditingName] = useState(false);
    const [newProjectName, setNewProjectName] = useState(project.name);

    useEffect(() => {
        const styleToSelect = initialStyleName 
            ? project.styleVariations.find(s => s.style_name === initialStyleName) 
            : project.styleVariations[0];
        if(styleToSelect && styleToSelect.style_name !== selectedStyle?.style_name) {
            setSelectedStyle(styleToSelect);
        }
    }, [project, initialStyleName, selectedStyle]);


    const handleNameSave = () => {
        if (newProjectName.trim() && newProjectName.trim() !== project.name) {
            onSaveProjectName(newProjectName.trim());
        }
        setIsEditingName(false);
    };
    
    const handleFavoriteClick = () => {
      if (!selectedStyle) return;

      const latestIteration = selectedStyle.iterations.length > 0 
          ? selectedStyle.iterations[selectedStyle.iterations.length - 1] 
          : null;
      
      // Create a snapshot of the current view to favorite
      const designSnapshot: StyleVariation = {
          ...JSON.parse(JSON.stringify(selectedStyle)),
          // If there's an iteration, use its data as the primary data for the favorite
          imageUrl: latestIteration?.imageUrl ?? selectedStyle.imageUrl,
          imageBase64: latestIteration?.imageBase64 ?? selectedStyle.imageBase64,
          description: latestIteration?.description ?? selectedStyle.description,
          color_palette: latestIteration?.color_palette ?? selectedStyle.color_palette,
          furniture_recommendations: latestIteration?.furniture_recommendations ?? selectedStyle.furniture_recommendations,
      };
      
      onFavorite(designSnapshot, project.id, project.name);
    };


    const handleShare = async (imageUrl: string, styleName: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const file = new File([blob], `${project.name}-${styleName}.png`, { type: blob.type });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Nuestro diseño de ${project.name} - Estilo ${styleName}`,
                    text: `Mi amor, mira este diseño que creamos con Rosi Decora.`,
                    files: [file],
                });
            } else {
                 alert("Tu navegador no soporta compartir archivos directamente. Intenta desde un dispositivo móvil.");
            }
        } catch (err) {
            console.error('Error al compartir: ', err);
            alert("Ocurrió un error al intentar compartir la imagen.");
        }
    };

    const latestIteration = selectedStyle?.iterations.length > 0 
        ? selectedStyle.iterations[selectedStyle.iterations.length - 1] 
        : null;
    
    const finalImageToShow = latestIteration?.imageUrl ?? selectedStyle?.imageUrl ?? project.originalImage;
    const displayDescription = latestIteration?.description ?? selectedStyle?.description;
    const displayPalette = latestIteration?.color_palette ?? selectedStyle?.color_palette;
    const displayFurniture = latestIteration?.furniture_recommendations ?? selectedStyle?.furniture_recommendations;

    const tabs = [
        { label: 'Nuestra Inspiración', content: <p className="text-text-color-soft dark:text-gray-300">{displayDescription}</p> },
        { label: 'Tesoros para Nuestro Hogar', content: displayFurniture ? <FurnitureList furniture={displayFurniture} /> : <p>Aún no hemos encontrado tesoros para este estilo.</p> },
        { label: 'Los Colores de Nuestro Amor', content: displayPalette ? <ColorPalette palette={displayPalette} /> : <p>No hay una paleta de colores definida.</p> },
    ];

    return (
        <div className="container mx-auto">
             <div className="flex justify-center items-center gap-4 mb-2 group">
                {isEditingName ? (
                    <input 
                        type="text" 
                        value={newProjectName} 
                        onChange={(e) => setNewProjectName(e.target.value)} 
                        onBlur={handleNameSave}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setIsEditingName(false); }}
                        className="text-4xl text-center font-bold p-2 bg-white/80 rounded-lg border-2 border-secondary-accent focus:outline-none focus:ring-2 focus:ring-primary-accent transition dark:bg-gray-700 dark:border-pink-700 main-title"
                        autoFocus
                    />
                ) : (
                    <h2 className="text-5xl main-title font-bold text-center text-primary-accent dark:text-pink-400 cursor-pointer" onClick={() => setIsEditingName(true)}>
                        {project.name}
                    </h2>
                )}
                 <button onClick={() => setIsEditingName(true)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-text-color-soft hover:text-primary-accent" aria-label="Editar nombre del proyecto">
                    <EditIcon className="w-6 h-6"/>
                </button>
            </div>

            <p className="text-center text-text-color-soft dark:text-gray-400 mb-8">{project.analysis}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <div className="bg-card-bg p-6 rounded-3xl card-shadow border border-pink-100 dark:border-gray-700 flex flex-col gap-4">
                        <h3 className="text-4xl main-title text-primary-accent">{selectedStyle.style_name}</h3>
                        <ImageComparator before={project.originalImage} after={finalImageToShow} />
                         <div className="flex gap-4 items-center">
                            <button 
                              onClick={handleFavoriteClick} 
                              className="flex-grow flex items-center justify-center gap-2 px-6 py-3 rounded-xl btn-primary text-white font-semibold"
                              aria-label="Guardar este diseño en favoritos"
                            >
                              <HeartIcon className="w-5 h-5"/> Guardar este Tesoro
                            </button>
                            <button
                                onClick={() => handleShare(finalImageToShow, selectedStyle.style_name)}
                                className="p-3 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow-lg hover:scale-105 transition-transform dark:bg-gray-600 dark:text-gray-200"
                                aria-label={`Compartir diseño de estilo ${selectedStyle.style_name}`}
                                title="Compartir nuestro sueño"
                            >
                                <ShareIcon className="w-6 h-6" />
                            </button>
                         </div>
                    </div>

                    <div className="bg-card-bg p-6 rounded-3xl card-shadow border border-pink-100 dark:border-gray-700">
                        <RefinementPanel 
                            key={selectedStyle.style_name + project.id} // Add project id to key to force re-render
                            styleVariation={selectedStyle} 
                            onRefine={(prompt) => onRefine(project, selectedStyle.style_name, prompt)}
                            onRevert={() => onRevert(project, selectedStyle.style_name)} 
                        />
                    </div>
                </div>
            )}
            
            {selectedStyle && (
                <div className="mt-8 bg-card-bg p-6 rounded-3xl card-shadow border border-pink-100 dark:border-gray-700">
                    <Tabs tabs={tabs} />
                </div>
            )}
        </div>
    );
};

export default ProjectView;