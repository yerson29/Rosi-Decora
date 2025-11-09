import React from 'react';
import { AppView } from '../types';
import { HomeIcon, ArchiveIcon, SparklesIcon, UserIcon, HeartIcon } from './icons/Icons'; // Added HeartIcon

interface HeaderProps {
  onNavigate: (view: AppView) => void;
  onRosiClick: () => void; // New prop for Rosi button click
}

const Header: React.FC<HeaderProps> = ({ onNavigate, onRosiClick }) => {
  return (
    <header className="bg-white/30 backdrop-blur-sm shadow-md rounded-b-3xl p-4 sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-8 h-8 text-pink-500" />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
            Rosi Decora
          </h1>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => onNavigate('upload')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all shadow-sm" aria-label="Ir a la página de inicio para subir una imagen">
            <HomeIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Inicio</span>
          </button>
          <button onClick={() => onNavigate('archive')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all shadow-sm" aria-label="Ver proyectos guardados en el archivo">
            <ArchiveIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Archivo</span>
          </button>
          <button onClick={() => onNavigate('favorites')} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all shadow-sm" aria-label="Ver diseños favoritos">
            <HeartIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Favoritos</span>
          </button>
          <button onClick={onRosiClick} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-100 text-purple-700 hover:bg-purple-200 transition-all shadow-sm" aria-label="Mostrar mensaje especial para Rosi">
            <UserIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Rosi</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;