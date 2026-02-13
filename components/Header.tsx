
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Icon } from './icons';

interface HeaderProps {
    onBack?: () => void;
    isProMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onBack, isProMode }) => {
  const { t } = useLanguage();
  return (
    <header className="w-full h-24 flex-shrink-0 flex items-center px-8 bg-[#0a0a0a] border-b border-white/5">
      {/* Left Section: Back Button */}
      <div className="w-48 flex-shrink-0 flex items-center">
        {onBack && (
          <button
              onClick={onBack}
              className="p-3 text-slate-400 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full shadow-lg"
              title={t('navHome')}
          >
              <Icon name="arrow-uturn-left" className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Center Section: Two lines, centered and stretched */}
      <div className="flex-grow flex flex-col items-center justify-center gap-1.5 overflow-hidden px-4">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter text-white uppercase leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] whitespace-nowrap">
          {t('appTitle')}
        </h1>
        <p className="text-[10px] md:text-[11px] text-slate-500 font-bold uppercase tracking-[0.25em] opacity-80 whitespace-nowrap">
          {t('developedBy')}
        </p>
      </div>

      {/* Right Section: Action Buttons */}
      <div className="w-auto flex-shrink-0 flex items-center justify-end gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all shadow-md">
          <Icon name="arrow-up-tray" className="w-3.5 h-3.5" />
          XUẤT DỰ ÁN
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all shadow-md">
          <Icon name="download" className="w-3.5 h-3.5" />
          NHẬP DỰ ÁN
        </button>
      </div>
    </header>
  );
}
