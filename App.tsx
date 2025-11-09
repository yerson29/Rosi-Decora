import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Project, StyleVariation, AppView, ImageBase64, Iteration, FavoriteDesign, Furniture } from './types';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ProjectView from './components/ProjectView';
import ArchiveView from './components/ArchiveView';
import FavoritesView from './components/FavoritesView';
import Tutorial from './components/Tutorial';
import { analyzeImage, generateInitialDesigns, refineDesign } from './services/geminiService';
import ImageWithFallback from './components/ImageWithFallback';
import { ErrorIcon, HeartIcon, CloseIcon } from './components/icons/Icons';
import { getSeedData } from './seedData'; // Import seed data from a separate file

const KISS_IMAGE_BASE64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBmaWxsPSIjRjQ3MkI2IiBkPSJNNTAsOTUgQy0yMCw1NSAyMCwxNSA1MCw0MCBDODAsMTUgMTIwLDU1IDUwLDk1IFoiIC8+PHBhdGggZmlsbD0iI0ZGRkZGRiIgZD0iTSA1MCA0NSBMIDM1IDU1IFYgNzAgSCA2NSBWIDU1IEwgNTAgNDUgWiBNIDQ2IDcwIFYgNjIgSCA1NCBWIDcwIFoiIC8+PC9zdmc+";

const LOADING_MESSAGES = [
  "Imaginando nuestro futuro juntos, mi Rosi...",
  "Pintando las paredes de nuestros sueños...",
  "Un momento mi amor, la magia está sucediendo...",
  "Buscando los muebles perfectos para nosotros...",
  "Tejiendo los hilos de nuestro hogar...",
  "Añadiendo un toque de amor a cada detalle...",
  "Esto tomará solo un instante, mi vida...",
  "Ajustando la iluminación para nuestros momentos...",
  "Casi está listo nuestro próximo recuerdo...",
  "Preparando un diseño digno de ti."
];

const YERSON_MAGIC_PHRASES = [
  "La magia que programé para ti",
  "El encanto que creé para nuestro futuro",
  "Este hechizo de amor que codifiqué para ti",
  "El universo de ideas que diseñé para nosotros",
  "Este motor de sueños que construí para ti, mi vida"
];


const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if(item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
            if (parsed.length > 0) return parsed as T;
        } else if (typeof parsed === 'object' && parsed !== null) {
            return parsed as T;
        }
    }
    return fallback;
  } catch (error) {
    console.error(`Error al leer del localStorage “${key}”:`, error);
    return fallback;
  }
};


// UI Components defined inside App for simplicity
const HeartSpinner = () => (
    <div className="relative w-24 h-24">
        <HeartIcon className="w-24 h-24 text-pink-300 dark:text-pink-800" />
        <HeartIcon className="w-24 h-24 text-pink-500 absolute top-0 left-0 animate-ping" />
        <HeartIcon className="w-24 h-24 text-pink-500 absolute top-0 left-0" />
    </div>
);

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full max-w-sm bg-pink-200 rounded-full h-2.5 dark:bg-pink-700 mt-4">
    <div className="bg-pink-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
  </div>
);

const LoadingOverlay = ({ message, progress }: { message: string, progress: number }) => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-md flex flex-col justify-center items-center z-[100] animate-fade-in text-center p-4 dark:bg-gray-900/80">
        <HeartSpinner />
        <p className="mt-8 text-xl font-semibold text-pink-600 dark:text-pink-400 max-w-sm">{message}</p>
        <ProgressBar progress={progress} />
    </div>
);

type ModalProps = { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; };
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-card-bg dark:bg-gray-800 rounded-3xl card-shadow w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-2xl font-bold main-title text-primary-accent dark:text-pink-400">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors" aria-label="Cerrar modal">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

type ConfirmationDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}
const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
        <p className="text-text-color-soft dark:text-gray-300 mb-8">{message}</p>
        <div className="flex justify-end gap-4">
            <button onClick={onClose} className="px-6 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow-sm hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-all">
                Mejor no
            </button>
            <button onClick={onConfirm} className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow-lg hover:scale-105 transition-transform">
                Sí, mi vida
            </button>
        </div>
    </Modal>
);

const App: React.FC = () => {
  const seedData = useMemo(() => getSeedData(), []);
  
  const [view, setView] = useState<AppView>('upload');
  const [projects, setProjects] = useState<Project[]>(() => loadFromStorage('rosi-decora-projects', seedData.projects));
  const [favorites, setFavorites] = useState<FavoriteDesign[]>(() => loadFromStorage('rosi-decora-favorites', seedData.favorites));
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showRosiModal, setShowRosiModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('rosi-decora-dark-mode');
    return savedMode ? JSON.parse(savedMode) : true; // Default to dark mode
  });

  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void; } | null>(null);
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const [magicPhrase] = useState(() => YERSON_MAGIC_PHRASES[Math.floor(Math.random() * YERSON_MAGIC_PHRASES.length)]);

  
  // Dark Mode effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('rosi-decora-dark-mode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);
  
  // Load initial data from localStorage or seed
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('rosi-decora-tutorial-seen');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);
  
  // Save data to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('rosi-decora-projects', JSON.stringify(projects));
    } catch (e) {
      console.error("Failed to save projects to localStorage", e);
    }
  }, [projects]);
  
  useEffect(() => {
    try {
      localStorage.setItem('rosi-decora-favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save favorites to localStorage", e);
    }
  }, [favorites]);

  // Loading message rotation
  useEffect(() => {
    let interval: number;
    if (isLoading) {
      setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      interval = window.setInterval(() => {
        setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const showToast = (message: string) => {
    setToast({ message, id: Date.now() });
    setTimeout(() => {
        setToast(null);
    }, 4000); // Hide after 4 seconds
  };

  const fileToDataUrl = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
          reader.readAsDataURL(file);
      });
  };

  const handleImageUpload = async (file: File) => {
      setIsLoading(true);
      setLoadingProgress(0);
      try {
          const dataUrl = await fileToDataUrl(file);
          const base64Data = dataUrl.split(',')[1];
          const mimeType = file.type;
          
          setLoadingMessage("Analizando nuestro espacio...");
          setLoadingProgress(5);
          const analysis = await analyzeImage(base64Data, mimeType);
          setLoadingProgress(10);

          const totalStyles = 5;
          const onProgress = (style: string, current: number) => {
              setLoadingMessage(`Soñando con un estilo ${style} para nosotros...`);
              // Progress from 10% to 100%
              const progress = 10 + (current / totalStyles) * 90;
              setLoadingProgress(progress);
          };
          
          const styleVariations = await generateInitialDesigns(base64Data, mimeType, analysis, onProgress);
          
          const newProject: Project = {
              id: `project-${Date.now()}`,
              name: `Nuestro Rincón Soñado`,
              originalImage: dataUrl,
              originalImageBase64: { data: base64Data, mimeType },
              analysis,
              styleVariations,
              createdAt: new Date().toISOString(),
          };

          setProjects(prev => [newProject, ...prev]);
          setCurrentProject(newProject);
          setView('project');
      } catch (err: any) {
          setError(`Amor, ocurrió un error al procesar nuestra foto: ${err.message}`);
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleRefine = async (project: Project, styleName: string, prompt: string) => {
      setIsLoading(true);
      setLoadingProgress(0);
      setLoadingMessage("Añadiendo tu toque mágico...");
      try {
          const styleIndex = project.styleVariations.findIndex(v => v.style_name === styleName);
          if (styleIndex === -1) throw new Error("Style not found");

          const currentVariation = project.styleVariations[styleIndex];
          const lastIteration = currentVariation.iterations[currentVariation.iterations.length - 1];
          const imageToRefine = lastIteration?.imageBase64 ?? currentVariation.imageBase64;

          if (!imageToRefine) throw new Error("No hay una imagen que pueda refinar, mi amor.");
          
          setLoadingProgress(50);
          const { newImage, newDetails } = await refineDesign(imageToRefine.data, imageToRefine.mimeType, prompt, styleName);
          setLoadingProgress(100);

          const newIteration: Iteration = {
              prompt,
              imageUrl: `data:${newImage.mimeType};base64,${newImage.data}`,
              imageBase64: newImage,
              description: newDetails.description,
              color_palette: newDetails.color_palette,
              furniture_recommendations: newDetails.furniture_recommendations,
          };

          const updatedProjects = projects.map(p => {
              if (p.id === project.id) {
                  const updatedVariations = [...p.styleVariations];
                  const updatedVariation = { ...updatedVariations[styleIndex] };
                  updatedVariation.iterations = [...updatedVariation.iterations, newIteration];
                  updatedVariations[styleIndex] = updatedVariation;
                  return { ...p, styleVariations: updatedVariations };
              }
              return p;
          });
          
          setProjects(updatedProjects);
          const updatedProject = updatedProjects.find(p => p.id === project.id);
          if (updatedProject) {
              setCurrentProject(updatedProject);
          }

      } catch (err: any) {
          setError(`Mi amor, no pude refinar el diseño: ${err.message}`);
          console.error(err);
      } finally {
          setIsLoading(false);
      }
  };
  
  const handleRevert = (project: Project, styleName: string) => {
    const updatedProjects = projects.map(p => {
      if (p.id === project.id) {
        const styleIndex = p.styleVariations.findIndex(v => v.style_name === styleName);
        if (styleIndex !== -1 && p.styleVariations[styleIndex].iterations.length > 0) {
          const updatedVariations = [...p.styleVariations];
          const updatedVariation = { ...updatedVariations[styleIndex] };
          updatedVariation.iterations = updatedVariation.iterations.slice(0, -1);
          updatedVariations[styleIndex] = updatedVariation;
          return { ...p, styleVariations: updatedVariations };
        }
      }
      return p;
    });
    setProjects(updatedProjects);
    const updatedProject = updatedProjects.find(p => p.id === project.id);
    if (updatedProject) {
        setCurrentProject(updatedProject);
    }
  }
  
  const handleViewProject = (projectId: string, initialStyleName?: string) => {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          setCurrentProject(project);
          setView('project');
      }
  };

  const handleDeleteProjectRequest = (projectId: string) => {
    setConfirmAction({
        title: "Decir Adiós a un Sueño",
        message: "Mi vida, ¿estás segura de que quieres dejar ir este sueño? No podremos recuperarlo.",
        onConfirm: () => {
            setProjects(prev => prev.filter(p => p.id !== projectId));
            setFavorites(prev => prev.filter(f => f.projectId !== projectId));
            if (currentProject?.id === projectId) {
                setCurrentProject(null);
                setView('archive');
            }
            setConfirmAction(null);
        }
    });
  };

  const handleFavorite = (designToFavorite: StyleVariation, projectId: string, projectName: string) => {
    const isAlreadyFavorited = favorites.some(fav => fav.styleVariation.imageUrl === designToFavorite.imageUrl && fav.projectId === projectId);
    
    if (isAlreadyFavorited) {
      showToast("Mi amor, este tesoro ya está a salvo en nuestro cofre.");
      return;
    }

    const newFavorite: FavoriteDesign = {
      id: `fav-${Date.now()}`,
      projectId,
      projectName,
      favoritedAt: new Date().toISOString(),
      styleVariation: JSON.parse(JSON.stringify(designToFavorite)),
    };

    setFavorites(prev => [newFavorite, ...prev]);
    showToast("¡Tesoro guardado en nuestro cofre! ❤️");
  };
  
  const handleDeleteFavoriteRequest = (favoriteId: string) => {
     setConfirmAction({
        title: "Soltar un Tesoro",
        message: "¿Segura que quieres quitar este tesoro de nuestro cofre, mi amor?",
        onConfirm: () => {
            setFavorites(prev => prev.filter(f => f.id !== favoriteId));
            setConfirmAction(null);
        }
    });
  };

  const handleSaveProjectName = (projectId: string, newName: string) => {
    const updatedProjects = projects.map(p => 
        p.id === projectId ? { ...p, name: newName } : p
    );
    setProjects(updatedProjects);

    if (currentProject?.id === projectId) {
        setCurrentProject(prev => prev ? { ...prev, name: newName } : null);
    }
    
    setFavorites(prevFavs => prevFavs.map(f => 
        f.projectId === projectId ? { ...f, projectName: newName } : f
    ));
  };
  
  const handleNavigate = (targetView: AppView) => {
    if (targetView !== 'project') {
      setCurrentProject(null);
    }
    setView(targetView);
  }
  
  const handleTutorialClose = () => {
    setShowTutorial(false);
    localStorage.setItem('rosi-decora-tutorial-seen', 'true');
  };

  const renderView = () => {
    switch(view) {
      case 'project':
        if (!currentProject) {
            setView('archive');
            return <ArchiveView projects={projects} onView={handleViewProject} onDelete={handleDeleteProjectRequest} />;
        }
        return <ProjectView 
                    project={currentProject} 
                    onRefine={handleRefine} 
                    onFavorite={handleFavorite}
                    onRevert={handleRevert}
                    onSaveProjectName={(newName) => handleSaveProjectName(currentProject.id, newName)}
                />;
      case 'archive':
        return <ArchiveView projects={projects} onView={handleViewProject} onDelete={handleDeleteProjectRequest} />;
      case 'favorites':
        return <FavoritesView favorites={favorites} onView={handleViewProject} onDelete={handleDeleteFavoriteRequest} onNavigateToUpload={() => handleNavigate('upload')} />;
      case 'upload':
      default:
        return <ImageUpload onImageUpload={handleImageUpload} magicPhrase={magicPhrase} />;
    }
  }

  return (
    <div className="min-h-screen">
      {isLoading && <LoadingOverlay message={loadingMessage} progress={loadingProgress} />}
      
      {toast && (
        <div key={toast.id} className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-accent to-secondary-accent text-white px-6 py-3 rounded-xl shadow-lg z-[101] animate-fade-in flex items-center gap-3">
            <HeartIcon className="w-6 h-6" />
            <span>{toast.message}</span>
        </div>
      )}

      <Modal isOpen={!!error} onClose={() => setError(null)} title="¡Oh no, mi amor!">
        <div className="text-center">
          <ErrorIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-text-color-soft dark:text-gray-300 mb-6">{error}</p>
          <div className="flex gap-4">
              <button
                  onClick={() => {
                      navigator.clipboard.writeText(error || "No error details available.");
                      showToast("Detalles del error copiados, mi vida.");
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow-md hover:scale-105 transition-transform dark:bg-gray-600 dark:text-gray-200"
              >
                  Copiar Error
              </button>
              <button
                  onClick={() => setError(null)}
                  className="flex-1 px-6 py-3 rounded-xl btn-primary text-white font-semibold"
              >
                  Entendido
              </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showRosiModal} onClose={() => setShowRosiModal(false)} title="Para mi Rosi">
          <div className="text-center">
              <ImageWithFallback src={KISS_IMAGE_BASE64} alt="A heart for Rosi" className="w-48 h-48 mx-auto animate-pulse-once" />
              <p className="text-text-color-soft dark:text-gray-300 mt-4 text-lg">
                  Hecho con todo mi amor, por Yerson, especialmente para ti, mi vida. ❤️
              </p>
          </div>
      </Modal>
      
      {showTutorial && <Tutorial onClose={handleTutorialClose} />}

      {confirmAction && (
          <ConfirmationDialog 
              isOpen={!!confirmAction}
              onClose={() => setConfirmAction(null)}
              onConfirm={confirmAction.onConfirm}
              title={confirmAction.title}
              message={confirmAction.message}
          />
      )}
      
      <Header 
        onNavigate={handleNavigate} 
        onRosiClick={() => setShowRosiModal(true)} 
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(prev => !prev)}
      />
      <main className="p-4 sm:p-8">
        <div key={view} className="animate-fade-in">
          {renderView()}
        </div>
      </main>
    </div>
  );
};

export default App;