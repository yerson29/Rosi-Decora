import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Project, StyleVariation, AppView, ImageBase64, Iteration } from './types';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ProjectView from './components/ProjectView';
import ArchiveView from './components/ArchiveView';
import { analyzeImage, generateInitialDesigns, refineDesign } from './services/geminiService';

// Base64 image for the kiss (simple SVG lips)
const KISS_IMAGE_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgNjAiPgogIDxwYXRoIGZpbGw9IiNFOTFFNjMiIGQ9Ik0gMTAgMzAgUSAzMCAxMCwgNTAgMzAgVCA5MCAzMCBDIDgwIDQ0LCA2MCA1NSwgNTAgNTUgQyA0MCA1NSwgMjAgNDQsIDEwIDMwIFoiLz4KPC9zdmc+";

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

        // Hydrate imageBase64 objects for runtime use if nullified in storage
        const hydratedProjects = loadedProjects.map(project => {
          const hydratedProject: Project = { ...project };
          if (!hydratedProject.originalImageBase64 && isValidDataUrl(hydratedProject.originalImage)) {
            hydratedProject.originalImageBase64 = dataUrlToImageBase64(hydratedProject.originalImage);
          } else if (!isValidDataUrl(hydratedProject.originalImage)) {
            console.warn(`Project ${project.id}: originalImage is not a valid data URL.`, hydratedProject.originalImage);
          }

          hydratedProject.styleVariations = project.styleVariations.map(variation => {
            const hydratedVariation: StyleVariation = { ...variation };
            // IMPORTANT: imageUrl and imageBase64 for ROOM images are intentionally NOT persisted
            // due to localStorage size limits. They will be null/empty on reload.
            if (!hydratedVariation.imageBase64 && isValidDataUrl(hydratedVariation.imageUrl)) {
              hydratedVariation.imageBase64 = dataUrlToImageBase64(hydratedVariation.imageUrl);
            } else if (!isValidDataUrl(hydratedVariation.imageUrl)) {
              // FIX: Corrected typo from `hydatedVariation` to `hydratedVariation`
              console.warn(`Project ${project.id}, Style ${variation.style_name}: imageUrl is not a valid data URL or was intentionally cleared for persistence.`, hydratedVariation.imageUrl);
            }
            hydratedVariation.iterations = variation.iterations.map(iteration => {
              const hydratedIteration: Iteration = { ...iteration };
              // IMPORTANT: imageUrl and imageBase64 for ROOM images are intentionally NOT persisted
              // due to localStorage size limits. They will be null/empty on reload.
              if (!hydratedIteration.imageBase64 && isValidDataUrl(hydratedIteration.imageUrl)) {
                hydratedIteration.imageBase64 = dataUrlToImageBase64(hydratedIteration.imageUrl);
              } else if (!isValidDataUrl(hydratedIteration.imageUrl)) {
                console.warn(`Project ${project.id}, Style ${variation.style_name}, Iteration '${iteration.prompt}': imageUrl is not a valid data URL or was intentionally cleared for persistence.`, hydratedIteration.imageUrl);
              }
              return hydratedIteration;
            });
            return hydratedVariation;
          });
          return hydratedProject;
        });
        
        setProjects(hydratedProjects);
      }
    } catch (error) {
      console.error("Failed to load or parse projects from localStorage", error);
    }
  }, []);

  const saveProjects = (updatedProjects: Project[]) => {
    try {
      // Create a savable version of projects by nullifying large base64 data URLs/objects
      const savableProjects = updatedProjects.map(project => {
        const clonedProject: Project = { ...project };
        clonedProject.originalImageBase64 = null; // Remove large data object
        clonedProject.originalImage = ''; // IMPORTANT: Remove large data URL string for persistence (room image)

        clonedProject.styleVariations = project.styleVariations.map(variation => {
          const clonedVariation: StyleVariation = { ...variation };
          clonedVariation.imageBase64 = null; // Remove large data object
          clonedVariation.imageUrl = ''; // IMPORTANT: Remove large data URL string for persistence (room image)

          clonedVariation.iterations = variation.iterations.map(iteration => {
            const clonedIteration: Iteration = { ...iteration };
            clonedIteration.imageBase64 = null; // Remove large data object
            clonedIteration.imageUrl = ''; // IMPORTANT: Remove large data URL string for persistence (room image)
            return clonedIteration;
          });
          
          // Furniture recommendations' imageUrls are external URLs and are NOT cleared.
          // They should persist as they are small strings.
          clonedVariation.furniture_recommendations = variation.furniture_recommendations.map(furniture => ({
            ...furniture // Keep all furniture properties, including imageUrl if present
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
          originalImage: fullDataUrl, // Store full data URL for persistence (will be nulled on save to localStorage)
          originalImageBase64: { data: base64Data, mimeType }, // Keep for current session's immediate use
          analysis,
          styleVariations: [],
          createdAt: new Date().toISOString(),
        };

        setLoadingMessage('Generando diseños mágicos...'); // Updated message
        const variations = await generateInitialDesigns(base64Data, mimeType, analysis);

        newProject.styleVariations = variations.map(v => ({
            ...v,
            // v.imageBase64 is correctly set by generateInitialDesigns
            // v.imageUrl is correctly set by generateInitialDesigns
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
        // Note: As per localStorage strategy, imageUrl will be empty for archived projects.
        // This means images for archived projects cannot be refined unless re-uploaded.
        if (styleToRefine.iterations.length > 0) {
            baseImageForRefinement = dataUrlToImageBase64(styleToRefine.iterations[styleToRefine.iterations.length - 1].imageUrl);
        } else {
            baseImageForRefinement = dataUrlToImageBase64(styleToRefine.imageUrl);
        }
      }
          
      if (!baseImageForRefinement || !baseImageForRefinement.data || !baseImageForRefinement.mimeType) {
        console.error("No base image found or could not be reconstructed for refinement.");
        alert("No se encontró una imagen base para refinar el diseño. Por favor, intenta con otro proyecto (Las imágenes de proyectos guardados no persisten).");
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

  const deleteProject = (projectId: string) => {
    const updatedProjects = projects.filter(p => p.id !== projectId);
    saveProjects(updatedProjects);
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
      setActiveView('upload');
    }
    if (activeView === 'archive' && updatedProjects.length === 0) {
      setActiveView('upload');
    }
  };

  const viewProject = (projectId: string) => {
    const projectToView = projects.find(p => p.id === projectId);
    if (projectToView) {
      setCurrentProject(projectToView);
      setActiveView('project');
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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("Failed to load image:", e.currentTarget.src);
    // Optionally, set a fallback image or hide the broken image
    // e.currentTarget.src = "/path/to/placeholder.png"; 
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
                    <img src={KISS_IMAGE_BASE64} alt="Un beso para Rosi" className="mx-auto w-24 h-auto mb-8 animate-pulse-once" onError={handleImageError}/>
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
        {activeView === 'project' && currentProject && <ProjectView project={currentProject} onRefine={handleRefineRequest} />}
        {activeView === 'archive' && <ArchiveView projects={projects} onView={viewProject} onDelete={deleteProject} />}
      </main>
    </div>
  );
};

export default App;