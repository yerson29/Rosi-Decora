import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon, CameraIcon, DocumentIcon, HeartIcon, MagicIcon, ViewIcon } from './icons/Icons';
import ImageWithFallback from './ImageWithFallback'; // Import the new component

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
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
     if (selectedFile && selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
     } else {
        alert("Por favor, selecciona un archivo de imagen válido.");
     }
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
        <div className="text-center p-8 rounded-3xl shadow-xl bg-gradient-to-r from-pink-500 to-purple-500 w-full">
            <h2 className="text-4xl font-bold text-white">¡Hola Rosi!</h2>
            <p className="text-white/90 mt-2">Bienvenida a tu asistente de decoración inteligente</p>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full">
            <h3 className="text-2xl font-bold text-center text-pink-500 mb-6">¡Es súper fácil!</h3>
            <ul className="space-y-4 text-gray-600">
                <li className="flex items-start gap-4"><DocumentIcon className="w-6 h-6 text-pink-400 mt-1"/><span><b>Paso 1:</b> Toma una foto de tu habitación o sube una imagen</span></li>
                <li className="flex flex-start gap-4"><MagicIcon className="w-6 h-6 text-pink-400 mt-1"/><span><b>Paso 2:</b> Mira las 5 propuestas mágicas que creamos para ti</span></li>
                <li className="flex items-start gap-4"><ViewIcon className="w-6 h-6 text-pink-400 mt-1"/><span><b>Paso 3:</b> Haz clic en "Ver galería" para ver 5 variaciones de cada estilo aplicadas a tu habitación</span></li>
                <li className="flex items-start gap-4"><HeartIcon className="w-6 h-6 text-pink-400 mt-1"/><span><b>Paso 4:</b> Elige tu favorito y ajústalo a tu gusto</span></li>
            </ul>
        </div>

      <div className="w-full text-center">
        <UploadIcon className="w-16 h-16 text-pink-400 mx-auto animate-bounce" />
        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500 mt-2">¡Sube tu foto aquí!</h3>
        <p className="text-gray-500 mt-1">Arrastra una imagen o selecciona desde tus archivos</p>
      </div>

      {!preview ? (
        <form 
          className="w-full max-w-2xl h-64 border-4 border-dashed border-pink-300 rounded-3xl flex flex-col justify-center items-center text-center p-4 transition-all duration-300"
          onDragEnter={handleDrag} 
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          aria-label="Área para subir imagen"
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} aria-label="Seleccionar archivo de imagen"/>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} aria-label="Tomar foto con la cámara"/>
          <p className="text-gray-500 mb-4">Arrastra y suelta tu imagen aquí</p>
          <div className="flex flex-col sm:flex-row gap-4">
              <button type="button" onClick={() => onButtonClick(fileInputRef)} className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-semibold shadow-lg hover:scale-105 transition-transform" aria-label="Seleccionar archivo desde el sistema">
                Seleccionar archivo
              </button>
              <button type="button" onClick={() => onButtonClick(cameraInputRef)} className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow-lg hover:scale-105 transition-transform" aria-label="Usar la cámara para tomar una foto">
                <CameraIcon className="w-6 h-6"/>
                Usar cámara
              </button>
          </div>
        </form>
      ) : (
        <div className="w-full max-w-2xl p-4 bg-white/50 backdrop-blur-sm rounded-3xl shadow-2xl">
          <div className="relative aspect-video"> {/* Added aspect-video for consistent sizing */}
            {/* Replaced img with ImageWithFallback */}
            <ImageWithFallback 
                src={preview} 
                alt="Vista previa de la imagen subida" 
                className="w-full h-full object-cover rounded-2xl" 
                fallbackIconClassName="w-1/3 h-1/3" 
            />
            <button onClick={removePreview} className="absolute -top-3 -right-3 bg-white text-red-500 rounded-full p-2 shadow-lg hover:bg-red-500 hover:text-white transition-all" aria-label="Eliminar vista previa de la imagen">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <button onClick={handleSubmit} className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-lg shadow-xl hover:scale-105 transition-transform" aria-label="Generar diseños mágicos para la imagen subida">
            Generar Diseños Mágicos
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;