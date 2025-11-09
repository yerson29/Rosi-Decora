import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, DocumentIcon, HeartIcon, MagicIcon, SparklesIcon, CloseIcon } from './icons/Icons';

interface TutorialProps {
  onClose: () => void;
}

const TUTORIAL_STEPS = [
  {
    icon: DocumentIcon,
    title: "Nuestro Primer Paso",
    text: "Mi amor, comienza subiendo una foto de ese lugarcito especial que transformaremos en nuestro nido. Puede ser de tu galería o una que tomemos ahora.",
  },
  {
    icon: MagicIcon,
    title: "Un Mundo de Posibilidades",
    text: "Verás cómo la magia convierte nuestro espacio. Exploremos juntos cada sueño que la IA tiene para nosotros.",
  },
  {
    icon: SparklesIcon,
    title: "Tu Toque Mágico",
    text: "Usa el panel de refinamiento para hacer tus deseos realidad. Pídeme lo que sea, como 'cambiar el color de la pared a uno más cálido'.",
  },
  {
    icon: HeartIcon,
    title: "Nuestro Cofre de Tesoros",
    text: "¿Nos enamoramos de un diseño? Lo guardamos en nuestros tesoros para tenerlo siempre a mano. ¡Comencemos a soñar, mi Rosi!",
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
      <div className="bg-card-bg dark:bg-gray-800 p-6 sm:p-8 rounded-3xl card-shadow max-w-md w-full text-center transform scale-95 animate-scale-in relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          aria-label="Cerrar tutorial"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <div className="mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/50 dark:to-purple-900/50 flex items-center justify-center">
                <currentStep.icon className="w-12 h-12 text-primary-accent" />
            </div>
        </div>

        <h3 id="tutorial-title" className="text-4xl sm:text-5xl font-bold mb-4 main-title text-primary-accent leading-tight">
          {currentStep.title}
        </h3>
        
        <p className="text-text-color-soft dark:text-gray-300 text-md sm:text-lg mb-8 min-h-[100px] sm:min-h-[120px] flex items-center justify-center">
          {currentStep.text}
        </p>

        <div className="flex justify-center gap-2 mb-8">
            {TUTORIAL_STEPS.map((_, index) => (
                <div key={index} className={`w-3 h-3 rounded-full transition-colors ${step === index ? 'bg-primary-accent' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            ))}
        </div>

        <div className="grid grid-cols-2 items-center gap-4">
            <button 
              onClick={onClose} 
              className="px-6 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow-md hover:scale-105 transition-transform dark:bg-gray-600 dark:text-gray-200"
              aria-label="Omitir tutorial"
            >
              Omitir
            </button>
            <button 
              onClick={isLastStep ? onClose : handleNext} 
              className="px-6 py-3 rounded-xl btn-primary text-white font-semibold flex items-center justify-center gap-2"
              aria-label={isLastStep ? "Finalizar tutorial" : "Siguiente paso del tutorial"}
            >
              {isLastStep ? '¡Vamos a Soñar!' : 'Siguiente'}
              {!isLastStep && <ChevronRightIcon className="w-5 h-5"/>}
            </button>
        </div>
        
         {step > 0 && (
            <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600" aria-label="Paso anterior del tutorial">
                <ChevronLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
        )}
        {!isLastStep && (
            <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600" aria-label="Siguiente paso del tutorial">
                <ChevronRightIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </button>
        )}
      </div>
    </div>
  );
};

export default Tutorial;