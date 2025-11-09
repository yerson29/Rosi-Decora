import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Project, StyleVariation, AppView, ImageBase64, Iteration, FavoriteDesign } from './types';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ProjectView from './components/ProjectView';
import ArchiveView from './components/ArchiveView';
import FavoritesView from './components/FavoritesView'; // Import the new component
import { analyzeImage, generateInitialDesigns, refineDesign } from './services/geminiService';
import ImageWithFallback from './components/ImageWithFallback'; // Import the new component

// Base64 image for the kiss (simple SVG lips)
const KISS_IMAGE_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgNjAiPgogIDxwYXRoIGZpbGw9IiNFOTFFNjMiIGQ9Ik0gMTAgMzAgUSAzMCAtMTAsIDUwIDMwIFQgOTAgMzAgQyA4MCA0NCwgNjAgNTUsIDUwIDU1IEMgNDAgNTUsIDIwIDQ0LCAxMCAzMCBaIi8+CiAgPC9zdmc+";


// Helper to convert data URL to ImageBase64 object
const dataUrlToImageBase64 = (dataUrl: string): ImageBase64 | null => {
  if (typeof dataUrl !== 'string' || !dataUrl || !dataUrl.startsWith('data:')) {
      console.warn("Invalid data URL format (null, not string, or missing 'data:' prefix):", dataUrl);
      return null;
  }
  const parts = dataUrl.split(',');
  if (parts.length !== 2) {
      console.warn("Invalid data URL format (missing comma or multiple commas, expected 'data:MIMETYPE;base64,DATA'):", dataUrl);
      return null;
  }
  const mimeTypePart = parts[0];
  if (!mimeTypePart.includes(';base64')) {
    // If it doesn't contain ;base64, it might be data:MIMETYPE,DATA. Attempt to parse.
    const simpleMimeMatch = mimeTypePart.match(/data:(.*)/);
    if (simpleMimeMatch && simpleMimeMatch.length > 1) {
        return { data: parts[1], mimeType: simpleMimeMatch[1] };
    }
    console.warn("Data URL does not contain ';base64' indicator and simple MIME type extraction failed:", dataUrl);
    return null;
  }
  
  const base64Data = parts[1];
  const mimeTypeMatch = mimeTypePart.match(/data:(.*?);base64/);
  if (!mimeTypeMatch || mimeTypeMatch.length < 2) {
      console.warn("Could not extract mime type from data URL with ';base64' indicator:", dataUrl);
      return null;
  }
  const mimeType = mimeTypeMatch[1];
  return { data: base64Data, mimeType };
};

// Helper to validate if a string is a well-formed data URL for images
const isValidDataUrl = (url: string | null | undefined): boolean => {
    return typeof url === 'string' && url.startsWith('data:') && url.includes(';base64,');
};


const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [favorites, setFavorites] = useState<FavoriteDesign[]>([]); // New state for favorites
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [activeView, setActiveView] = useState<AppView>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showRosiMessage, setShowRosiMessage] = useState(false);


  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem('rosi-decora-projects');
      if (savedProjects) {
        const loadedProjects: Project[] = JSON.parse(savedProjects);

        const hydratedProjects = loadedProjects.map(project => {
          const hydratedProject: Project = { ...project };
          // For originalImage, it's explicitly set to '' when saving, so it won't be a valid data URL on load.
          // ImageBase64 will be null, and ImageWithFallback will show the placeholder.
          hydratedProject.originalImageBase64 = null; 

          hydratedProject.styleVariations = project.styleVariations.map(variation => {
            const hydratedVariation: StyleVariation = { ...variation };
            // For imageUrl, it's explicitly set to '' when saving, so it won't be a valid data URL on load.
            // ImageBase64 will be null, and ImageWithFallback will show the placeholder.
            hydratedVariation.imageBase64 = null; 
            hydratedVariation.iterations = variation.iterations.map(iteration => {
              const hydratedIteration: Iteration = { ...iteration };
              // For imageUrl, it's explicitly set to '' when saving, so it won't be a valid data URL on load.
              // ImageBase64 will be null, and ImageWithFallback will show the placeholder.
              hydratedIteration.imageBase64 = null; 
              return hydratedIteration;
            });
            return hydratedVariation;
          });
          return hydratedProject;
        });
        
        setProjects(hydratedProjects);
      }

      const savedFavorites = localStorage.getItem('rosi-decora-favorites'); // Load favorites
      if (savedFavorites) {
        const loadedFavorites: FavoriteDesign[] = JSON.parse(savedFavorites);
        const hydratedFavorites = loadedFavorites.map(favorite => {
          const hydratedFavorite: FavoriteDesign = { ...favorite };
          const hydratedStyleVariation: StyleVariation = { ...favorite.styleVariation };
          hydratedStyleVariation.imageBase64 = null;
          hydratedStyleVariation.iterations = favorite.styleVariation.iterations.map(iteration => ({
            ...iteration,
            imageBase64: null,
          }));
          hydratedFavorite.styleVariation = hydratedStyleVariation;
          return hydratedFavorite;
        });
        setFavorites(hydratedFavorites);
      }

    } catch (error) {
      console.error("Failed to load or parse projects/favorites from localStorage", error);
    }
  }, []);

  const saveProjects = (updatedProjects: Project[]) => {
    try {
      // Create a savable version of projects, explicitly clearing large image data from string fields
      // to prevent QuotaExceededError. Images will not persist on page reload.
      const savableProjects = updatedProjects.map(project => {
        const clonedProject: Project = { ...project };
        clonedProject.originalImage = ''; // Clear original image data for saving space
        clonedProject.originalImageBase64 = null; // Also clear the object
        clonedProject.styleVariations = project.styleVariations.map(variation => {
          const clonedVariation: StyleVariation = { ...variation };
          clonedVariation.imageUrl = ''; // Clear variation image data for saving space
          clonedVariation.imageBase64 = null; // Also clear the object

          clonedVariation.iterations = variation.iterations.map(iteration => {
            const clonedIteration: Iteration = { ...iteration };
            clonedIteration.imageUrl = ''; // Clear iteration image data for saving space
            clonedIteration.imageBase64 = null; // Also clear the object
            return clonedIteration;
          });
          
          clonedVariation.furniture_recommendations = variation.furniture_recommendations.map(furniture => ({
            ...furniture 
          }));
        
          return clonedVariation;
        });
        return clonedProject;
      });
      setProjects(updatedProjects); // Keep full data in state for current session
      localStorage.setItem('rosi-decora-projects', JSON.stringify(savableProjects));
    } catch (error) {
      console.error("Failed to save projects to localStorage", error);
      alert("No se pudieron guardar los proyectos. El almacenamiento local está lleno. Por favor, elimina algunos proyectos antiguos.");
    }
  };

  const saveFavorites = (updatedFavorites: FavoriteDesign[]) => { // New function to save favorites
    try {
      // Create a savable version of favorites, explicitly clearing large image data from string fields
      // to prevent QuotaExceededError. Images will not persist on page reload.
      const savableFavorites = updatedFavorites.map(favorite => {
        const clonedFavorite: FavoriteDesign = { ...favorite };
        const clonedStyleVariation: StyleVariation = { ...favorite.styleVariation };
        
        clonedStyleVariation.imageUrl = ''; // Clear image data for saving space
        clonedStyleVariation.imageBase64 = null;

        clonedStyleVariation.iterations = favorite.styleVariation.iterations.map(iteration => {
          const clonedIteration: Iteration = { ...iteration };
          clonedIteration.imageUrl = ''; // Clear image data for saving space
          clonedIteration.imageBase64 = null;
          return clonedIteration;
        });

        clonedFavorite.styleVariation = clonedStyleVariation;
        return clonedFavorite;
      });

      setFavorites(updatedFavorites);
      localStorage.setItem('rosi-decora-favorites', JSON.stringify(savableFavorites));
    } catch (error) {
      console.error("Failed to save favorites to localStorage", error);
      alert("No se pudieron guardar los favoritos. El almacenamiento local está lleno. Por favor, elimina algunos favoritos o proyectos antiguos.");
    }
  };
  
  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const fullDataUrl = reader.result as string;
      const base64Data = fullDataUrl.split(',')[1];
      const mimeType = file.type;

      try {
        setLoadingMessage('Analizando tu espacio...');
        const analysis = await analyzeImage(base64Data, mimeType);

        const newProject: Project = {
          id: Date.now().toString(),
          name: `Proyecto ${projects.length + 1}`,
          originalImage: fullDataUrl, // Store full data URL for persistence (during active session)
          originalImageBase64: { data: base64Data, mimeType }, // Keep for current session's immediate use
          analysis,
          styleVariations: [],
          createdAt: new Date().toISOString(),
        };

        setLoadingMessage('Generando diseños mágicos...'); // Updated message
        const variations = await generateInitialDesigns(base64Data, mimeType, analysis);

        newProject.styleVariations = variations.map(v => ({
            ...v,
            iterations: [] // Start with empty iterations, as generateInitialDesigns returns this
        }));
        
        setCurrentProject(newProject);
        saveProjects([...projects, newProject]);
        setActiveView('project');

      } catch (error: any) {
        console.error("Error during AI generation:", error);
        alert(`Hubo un error al generar los diseños: ${error.message || 'Por favor, intenta de nuevo.'}`);
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    };
    reader.onerror = (error) => {
        console.error("Error reading file:", error);
        setIsLoading(false);
        alert("No se pudo leer el archivo de imagen.");
    };
  };

  const handleRefineRequest = async (project: Project, styleName: string, prompt: string) => {
      setIsLoading(true);
      setLoadingMessage('Ajustando el diseño a tu gusto...');

      const styleToRefine = project.styleVariations.find(v => v.style_name === styleName);
      if (!styleToRefine) {
        setIsLoading(false);
        return;
      }

      let baseImageForRefinement: ImageBase64 | null = null;

      // Prioritize the raw ImageBase64 object if available (current session or hydrated)
      if (styleToRefine.iterations.length > 0 && styleToRefine.iterations[styleToRefine.iterations.length - 1].imageBase64) {
          baseImageForRefinement = styleToRefine.iterations[styleToRefine.iterations.length - 1].imageBase64;
      } else if (styleToRefine.imageBase64) {
          baseImageForRefinement = styleToRefine.imageBase64;
      } else {
        // Fallback: Reconstruct ImageBase64 from the data URL if the raw object is null (archived project)
        // Note: For saved projects, imageUrl will be '', so this path won't yield a valid image
        if (styleToRefine.iterations.length > 0) {
            baseImageForRefinement = dataUrlToImageBase64(styleToRefine.iterations[styleToRefine.iterations.length - 1].imageUrl);
        } else {
            baseImageForRefinement = dataUrlToImageBase64(styleToRefine.imageUrl);
        }
      }
          
      if (!baseImageForRefinement || !baseImageForRefinement.data || !baseImageForRefinement.mimeType) {
        console.error("No base image found or could not be reconstructed for refinement.");
        alert("No se encontró una imagen base para refinar el diseño. Por favor, intenta con otro proyecto."); 
        setIsLoading(false);
        return;
      }

      try {
        const newImageData = await refineDesign(baseImageForRefinement.data, baseImageForRefinement.mimeType, prompt);

        const newIteration: Iteration = {
            prompt: prompt,
            imageUrl: `data:${newImageData.mimeType};base64,${newImageData.data}`,
            imageBase64: newImageData, // Keep for current session's immediate use
        };

        const updatedProject = {
            ...project,
            styleVariations: project.styleVariations.map(variation => {
                if (variation.style_name === styleName) {
                    return {
                        ...variation,
                        iterations: [...variation.iterations, newIteration]
                    };
                }
                return variation;
            })
        };

        setCurrentProject(updatedProject);
        const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
        saveProjects(updatedProjects);
      } catch (error: any) {
          console.error("Error refining design:", error);
          alert(`Hubo un error al refinar el diseño: ${error.message || 'Por favor, intenta de nuevo.'}`);
      } finally {
          setIsLoading(false);
          setLoadingMessage('');
      }
  };

  const handleFavoriteDesign = (designToFavorite: StyleVariation, projectId: string, projectName: string) => {
    const newFavorite: FavoriteDesign = {
      id: Date.now().toString(),
      projectId: projectId,
      projectName: projectName,
      favoritedAt: new Date().toISOString(),
      styleVariation: { // Clone to ensure we don't modify the original state object reference unexpectedly
        ...designToFavorite,
        iterations: designToFavorite.iterations.map(iter => ({...iter}))
      }, 
    };
    const updatedFavorites = [...favorites, newFavorite];
    setFavorites(updatedFavorites);
    saveFavorites(updatedFavorites);
    alert("¡Diseño guardado en Favoritos!");
  };

  const deleteProject = (projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveProjects(updatedProjects);
    // Also remove any favorites associated with this project
    const updatedFavorites = favorites.filter(fav => fav.projectId !== projectId);
    saveFavorites(updatedFavorites);

    if (currentProject?.id === projectId) {
      setCurrentProject(null);
      setActiveView('upload');
    }
    if (activeView === 'archive' && updatedProjects.length === 0) {
      setActiveView('upload');
    }
    if (activeView === 'favorites' && updatedFavorites.length === 0) {
      setActiveView('upload');
    }
  };

  const deleteFavorite = (favoriteId: string) => {
    const updatedFavorites = favorites.filter(fav => fav.id !== favoriteId);
    saveFavorites(updatedFavorites);
    if (activeView === 'favorites' && updatedFavorites.length === 0) {
      setActiveView('upload');
    }
  };

  const viewProject = (projectId: string, initialStyleName?: string) => {
    const projectToView = projects.find(p => p.id === projectId);
    if (projectToView) {
      setCurrentProject(projectToView);
      setActiveView('project');
      // Logic to select specific style if needed (e.g., from favorites)
      // This will be handled inside ProjectView, passing a prop or using state there.
    }
  };
  
  const handleViewChange = (view: AppView) => {
      if (view === 'upload') {
          setCurrentProject(null);
      }
      setActiveView(view);
  }

  const handleRosiClick = () => {
    setShowRosiMessage(true);
  };


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-100 text-gray-800 antialiased" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <Header onNavigate={handleViewChange} onRosiClick={handleRosiClick} />
      <main className="p-4 sm:p-6 md:p-8">
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-pink-400"></div>
            <p className="text-white text-xl mt-8 font-semibold" aria-live="assertive" aria-atomic="true">{loadingMessage}</p>
          </div>
        )}

        {showRosiMessage && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-lg flex flex-col items-center justify-center z-50 animate-fade-in"
                aria-modal="true"
                role="dialog"
                aria-labelledby="rosi-message-title"
                tabIndex={-1}
            >
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg text-center transform scale-95 animate-scale-in">
                    <h3 id="rosi-message-title" className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500 leading-tight">
                        ¡Rosi, eres la inspiración más bonita en cada rincón de mi corazón!
                    </h3>
                    <p className="text-gray-700 text-lg mb-8">
                        Siempre llenas de magia y amor cada espacio. ¡Gracias por tanto cariño!
                    </p>
                    {/* Replaced img with ImageWithFallback */}
                    <ImageWithFallback 
                        src={KISS_IMAGE_BASE64} 
                        alt="Un beso para Rosi" 
                        className="mx-auto w-24 h-auto mb-8 animate-pulse-once" 
                        fallbackIconClassName="w-12 h-12 text-pink-400" 
                    />
                    <button 
                        onClick={() => setShowRosiMessage(false)} 
                        className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-semibold shadow-lg hover:scale-105 transition-transform"
                        aria-label="Cerrar mensaje de Rosi"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        )}

        {activeView === 'upload' && <ImageUpload onImageUpload={handleImageUpload} />}
        {activeView === 'project' && currentProject && <ProjectView project={currentProject} onRefine={handleRefineRequest} onFavorite={handleFavoriteDesign} />}
        {activeView === 'archive' && <ArchiveView projects={projects} onView={viewProject} onDelete={deleteProject} />}
        {activeView === 'favorites' && <FavoritesView favorites={favorites} onView={viewProject} onDelete={deleteFavorite} />}
      </main>
    </div>
  );
};

export default App;