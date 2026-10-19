import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center ${
        theme === 'dark'
          ? 'bg-[#0B1220] border-[#1A263D] text-[#A7B2C8] hover:text-[#FFF83F] hover:border-[#FFF83F]/40'
          : 'bg-white border-[#D8E1EF] text-[#53627A] hover:text-[#2391FF] hover:border-[#2391FF]/40 shadow-sm'
      } ${className}`}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-[#FFF83F]" />
      ) : (
        <Moon className="w-4 h-4 text-[#2391FF]" />
      )}
    </button>
  );
};
