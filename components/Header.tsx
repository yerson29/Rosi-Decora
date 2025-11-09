import React from 'react';
import { AppView } from '../types';
import { HomeIcon, ArchiveIcon, SparklesIcon, UserIcon, HeartIcon, SunIcon, MoonIcon } from './icons/Icons';

interface HeaderProps {
  onNavigate: (view: AppView) => void;
  onRosiClick: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, onRosiClick, isDarkMode, toggleDarkMode }) => {
  return (
    <header className="bg-header-bg backdrop-blur-lg shadow-md dark:shadow-lg dark:shadow-pink-900/20 rounded-b-3xl p-4 sticky top-0 z-40 transition-colors duration-300">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('upload')}>
          <SparklesIcon className="w-8 h-8 text-primary-accent" />
          <h1 className="text-3xl main-title text-primary-accent dark:text-pink-400">
            Rosi Decora
          </h1>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => onNavigate('upload')} className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-color-soft dark:text-gray-200 hover:bg-secondary-accent/20 dark:hover:bg-purple-900/50 transition-all" aria-label="Ir a la página de inicio para subir una imagen">
            <HomeIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Inicio</span>
          </button>
          <button onClick={() => onNavigate('archive')} className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-color-soft dark:text-gray-200 hover:bg-secondary-accent/20 dark:hover:bg-purple-900/50 transition-all" aria-label="Ver proyectos guardados en el archivo">
            <ArchiveIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Archivo</span>
          </button>
          <button onClick={() => onNavigate('favorites')} className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-color-soft dark:text-gray-200 hover:bg-secondary-accent/20 dark:hover:bg-purple-900/50 transition-all" aria-label="Ver diseños favoritos">
            <HeartIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Favoritos</span>
          </button>
          <button onClick={onRosiClick} className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-color-soft dark:text-gray-200 hover:bg-secondary-accent/20 dark:hover:bg-purple-900/50 transition-all" aria-label="Mostrar mensaje especial para Rosi">
            <UserIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Rosi</span>
          </button>
          <button onClick={toggleDarkMode} className="p-2 rounded-full text-text-color-soft dark:text-gray-200 hover:bg-secondary-accent/20 dark:hover:bg-purple-900/50 transition-all" aria-label="Cambiar tema">
            {isDarkMode ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-purple-700" />}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;