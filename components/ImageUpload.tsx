import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, CameraIcon, DocumentIcon, HeartIcon, MagicIcon, ViewIcon } from './icons/Icons';
import ImageWithFallback from './ImageWithFallback'; // Import the new component

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  magicPhrase: string;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, magicPhrase }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
     if (!selectedFile) return;

     if (!selectedFile.type.startsWith('image/')) {
        alert("Mi amor, por favor, elige un archivo de imagen.");
        return;
     }

     if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        alert(`Mi vida, el archivo es muy grande. Elige uno de menos de ${MAX_FILE_SIZE_MB} MB, por favor.`);
        return;
     }
     
     setFile(selectedFile);
     setPreview(URL.createObjectURL(selectedFile));
  };
  
  const onButtonClick = (ref: React.RefObject<HTMLInputElement>) => {
    ref.current?.click();
  };

  const removePreview = () => {
      setPreview(null);
      setFile(null);
  }
  
  const handleSubmit = () => {
    if (file) {
      onImageUpload(file);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
        <div className="text-center p-8 rounded-3xl w-full">
            <h2 className="text-5xl md:text-6xl text-primary-accent dark:text-pink-400 main-title">Rosi Decora, Nuestro Nido</h2>
            <p className="text-text-color-soft mt-2 text-lg">Mi vida, aquí comenzamos a darle forma a nuestro hogar, juntos.</p>
        </div>
        
        <div className="bg-card-bg p-8 rounded-3xl card-shadow w-full border border-pink-100 dark:border-gray-700">
            <h3 className="text-3xl font-bold text-center text-primary-accent mb-6 main-title">Nuestro Camino para Crear Magia</h3>
            <ul className="space-y-4 text-text-color-soft dark:text-gray-300">
                <li className="flex items-start gap-4"><DocumentIcon className="w-6 h-6 text-secondary-accent mt-1 flex-shrink-0"/><span><b>Paso 1:</b> Sube una foto de ese rincón especial que soñamos transformar.</span></li>
                <li className="flex items-start gap-4"><MagicIcon className="w-6 h-6 text-secondary-accent mt-1 flex-shrink-0"/><span><b>Paso 2:</b> {magicPhrase} nos mostrará 5 hermosos estilos para nuestro espacio.</span></li>
                <li className="flex items-start gap-4"><ViewIcon className="w-6 h-6 text-secondary-accent mt-1 flex-shrink-0"/><span><b>Paso 3:</b> Exploremos cada idea, veamos los muebles y los colores que nos enamoran.</span></li>
                <li className="flex items-start gap-4"><HeartIcon className="w-6 h-6 text-secondary-accent mt-1 flex-shrink-0"/><span><b>Paso 4:</b> Dime tus ideas y las haremos realidad. ¡Guardemos nuestros tesoros favoritos!</span></li>
            </ul>
        </div>

      <div className="w-full text-center">
        <UploadIcon className="w-16 h-16 text-secondary-accent mx-auto animate-bounce" />
        <h3 className="text-4xl md:text-5xl main-title text-primary-accent mt-2">Elige Nuestro Rincón a Transformar</h3>
        <p className="text-text-color-soft mt-1">Mi amor, arrastra una foto o elígela desde tu dispositivo</p>
      </div>

      {!preview ? (
        <form 
          className={`w-full max-w-2xl h-64 border-4 border-dashed rounded-3xl flex flex-col justify-center items-center text-center p-4 transition-all duration-300 ${dragActive ? 'border-primary-accent bg-pink-50 dark:bg-pink-900/20' : 'border-secondary-accent dark:border-pink-800'}`}
          onDragEnter={handleDrag} 
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          aria-label="Área para subir la foto de nuestro espacio"
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} aria-label="Seleccionar archivo de imagen"/>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} aria-label="Tomar foto con la cámara"/>
          <p className="text-text-color-soft dark:text-gray-400 mb-4">Arrastra aquí la foto de nuestro rincón</p>
          <div className="flex flex-col sm:flex-row gap-4">
              <button type="button" onClick={() => onButtonClick(fileInputRef)} className="px-8 py-3 rounded-xl btn-primary text-white font-semibold" aria-label="Seleccionar archivo desde el sistema">
                Elige una Foto, Mi Amor
              </button>
              <button type="button" onClick={() => onButtonClick(cameraInputRef)} className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow-lg hover:scale-105 transition-transform dark:bg-gray-600 dark:text-gray-200" aria-label="Usar la cámara para tomar una foto">
                <CameraIcon className="w-6 h-6"/>
                Usa la Cámara
              </button>
          </div>
        </form>
      ) : (
        <div className="w-full max-w-2xl p-4 bg-card-bg backdrop-blur-sm rounded-3xl card-shadow dark:bg-gray-800/50">
          <div className="relative aspect-video">
            <ImageWithFallback 
                src={preview} 
                alt="Vista previa de nuestro espacio" 
                className="w-full h-full object-cover rounded-2xl" 
                fallbackIconClassName="w-1/3 h-1/3" 
            />
            <button onClick={removePreview} className="absolute -top-3 -right-3 bg-white text-red-500 rounded-full p-2 shadow-lg hover:bg-red-500 hover:text-white transition-all dark:bg-gray-700 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white" aria-label="Quitar esta foto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <button onClick={handleSubmit} className="mt-6 w-full py-4 rounded-xl btn-primary text-white font-bold text-lg" aria-label="Generar diseños mágicos para la imagen subida">
            Comencemos a Soñar
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;