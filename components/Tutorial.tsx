import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, DocumentIcon, HeartIcon, MagicIcon, SparklesIcon } from './icons/Icons';

interface TutorialProps {
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    icon: DocumentIcon,
    title: "¡Bienvenida a Nuestro Nido Creativo!",
    text: "Aquí transformaremos cualquier foto de un espacio en el hogar de nuestros sueños. Para empezar, solo tienes que subir una imagen de la habitación que quieres rediseñar.",
  },
  {
    icon: MagicIcon,
    title: "La Magia de las Ideas",
    text: "Una vez que subas la foto, crearé 5 estilos de diseño diferentes para ti. Podrás ver cómo se vería nuestro espacio en estilo Moderno, Nórdico, Clásico y más.",
  },
  {
    icon: SparklesIcon,
    title: "El Toque Final es Tuyo, mi Amor",
    text: "¡Esta es la mejor parte! Elige un diseño que te guste y pídeme que lo ajuste. Puedes decirme cosas como 'Añade una alfombra' o 'Cambia el sofá a color azul'. ¡Juntos lo haremos perfecto!",
  },
  {
    icon: HeartIcon,
    title: "Guarda Nuestros Favoritos",
    text: "Cuando un diseño te encante, guárdalo en 'Favoritos' para que nunca perdamos esas ideas geniales. ¿Lista para empezar, mi vida?",
  }
];

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => setStep(prev => Math.min(prev + 1, TUTORIAL_STEPS.length - 1));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 0));

  const isLastStep = step === TUTORIAL_STEPS.length - 1;
  const currentStep = TUTORIAL_STEPS[step];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-lg flex flex-col items-center justify-center z-50 animate-fade-in p-4"
      aria-modal="true" role="dialog" aria-labelledby="tutorial-title"
    >
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full text-center transform scale-95 animate-scale-in relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Cerrar tutorial"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                <currentStep.icon className="w-12 h-12 text-pink-500" />
            </div>
        </div>

        <h3 id="tutorial-title" className="text-2xl sm:text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500 leading-tight">
          {currentStep.title}
        </h3>
        
        <p className="text-gray-600 text-md sm:text-lg mb-8 min-h-[100px] sm:min-h-[120px] flex items-center justify-center">
          {currentStep.text}
        </p>

        <div className="flex justify-center gap-2 mb-8">
            {TUTORIAL_STEPS.map((_, index) => (
                <div key={index} className={`w-3 h-3 rounded-full transition-colors ${step === index ? 'bg-pink-500' : 'bg-gray-300'}`}></div>
            ))}
        </div>

        <div className="grid grid-cols-2 items-center gap-4">
            <button 
              onClick={onClose} 
              className="px-6 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow-md hover:scale-105 transition-transform"
              aria-label="Omitir tutorial"
            >
              Omitir
            </button>
            <button 
              onClick={isLastStep ? onClose : handleNext} 
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-semibold shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
              aria-label={isLastStep ? "Finalizar tutorial" : "Siguiente paso del tutorial"}
            >
              {isLastStep ? '¡Empezar!' : 'Siguiente'}
              {!isLastStep && <ChevronRightIcon className="w-5 h-5"/>}
            </button>
        </div>
        
         {step > 0 && (
            <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Paso anterior del tutorial">
                <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
        )}
        {!isLastStep && (
            <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200" aria-label="Siguiente paso del tutorial">
                <ChevronRightIcon className="w-6 h-6 text-gray-600" />
            </button>
        )}
      </div>
    </div>
  );
};

export default Tutorial;