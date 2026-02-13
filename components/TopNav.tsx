
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export type MainCategory = 'design' | 'adjust' | 'visual' | 'utilities' | 'fengshui';

interface TopNavProps {
  activeCategory: MainCategory;
  onCategoryChange: (cat: MainCategory) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeCategory, onCategoryChange }) => {
  const { theme } = useTheme();
  
  const navItems: { id: MainCategory; label: string }[] = [
    { id: 'design', label: 'I. CÔNG TÁC THIẾT KẾ (DESIGN)' },
    { id: 'adjust', label: 'II. ĐIỀU CHỈNH THIẾT KẾ (ADJUST)' },
    { id: 'visual', label: 'III. DIỄN HỌA KIẾN TRÚC (VISUAL)' },
    { id: 'utilities', label: 'IV. TIỆN ÍCH (UTILITIES)' },
    { id: 'fengshui', label: 'V. PHONG THỦY (FENG SHUI)' },
  ];

  return (
    <div className="w-full flex items-center gap-1 mt-6 mb-6 px-8 overflow-x-auto thin-scrollbar">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onCategoryChange(item.id)}
          className={`px-6 py-3.5 rounded-lg text-xs font-black tracking-widest transition-all whitespace-nowrap border-b-4 ${
            activeCategory === item.id
              ? 'bg-orange-600/10 text-white border-orange-500 shadow-[0_4px_20px_rgba(234,88,12,0.2)]'
              : `text-slate-400 border-transparent hover:text-slate-200 hover:bg-white/5`
          }`}
        >
          {item.label}
        </button>
      ))}
      <div className="flex-grow"></div>
      <button className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-lg border border-white/5">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m4.5 4.5v4.5m0-4.5h-4.5m4.5 0l-5.25 5.25" />
        </svg>
      </button>
    </div>
  );
};
