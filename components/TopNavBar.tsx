
import React from 'react';
import type { ActiveTab } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';

const Tab: React.FC<{ label: string; active: boolean; onClick: () => void; disabled?: boolean }> = ({ label, active, onClick, disabled }) => {
  const { theme } = useTheme();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 md:px-5 py-2.5 text-[11px] md:text-xs font-black transition-all duration-200 rounded-lg whitespace-nowrap uppercase tracking-tighter ${
        active 
          ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20' 
          : `${theme.textSub} hover:${theme.textMain} hover:bg-white/5`
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {label}
    </button>
  );
};

export const TopNavBar: React.FC<{
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isProMode: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
}> = ({ activeTab, onTabChange, isProMode, isExpanded, onToggleExpand }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  
  return (
    <nav className={`w-full mx-auto mb-8 flex items-center gap-4 transition-all duration-500 ${isExpanded ? 'px-0' : 'max-w-[1800px]'}`}>
      <div className={`flex-grow flex items-center space-x-1 ${theme.navBg} border ${theme.border} p-2 rounded-2xl shadow-2xl ${isExpanded ? '' : 'overflow-x-auto thin-scrollbar'} backdrop-blur-xl`}>
          <div className={`flex items-center space-x-1 ${isExpanded ? 'flex-wrap gap-y-2' : ''}`}>
              <Tab label={t('tabCreate')} active={['create', 'interior'].includes(activeTab)} onClick={() => onTabChange('create')} />
              <Tab label={t('tabLandscape')} active={activeTab === 'landscape'} onClick={() => onTabChange('landscape')} />
              <Tab label={t('tabPhotoToSketch')} active={activeTab === 'photoToSketch'} onClick={() => onTabChange('photoToSketch')} />
              <Tab label={t('tabCameraAngle')} active={activeTab === 'cameraAngle'} onClick={() => onTabChange('cameraAngle')} />
              <Tab label={t('tabEdit')} active={activeTab === 'edit'} onClick={() => onTabChange('edit')} />
              <Tab label={t('tabPlanTo3D')} active={activeTab === 'planTo3d'} onClick={() => onTabChange('planTo3d')} />
              <Tab label={t('tabSection')} active={activeTab === 'sectionTo3d'} onClick={() => onTabChange('sectionTo3d')} />
              <Tab label={t('tabCreatePrompt')} active={activeTab === 'prompt'} onClick={() => onTabChange('prompt')} />
              <Tab label={t('tabCreateVideo')} active={activeTab === 'video'} onClick={() => onTabChange('video')} />
              <Tab label={t('library')} active={activeTab === 'library'} onClick={() => onTabChange('library')} />
              <Tab label={t('tabUtilities')} active={activeTab === 'utilities'} onClick={() => onTabChange('utilities')} />
          </div>
      </div>

      <button 
        onClick={onToggleExpand}
        title={isExpanded ? t('collapseUI') : t('expandUI')}
        className={`flex-shrink-0 p-4 rounded-2xl border transition-all shadow-xl group ${
            isExpanded 
            ? 'bg-orange-600 text-white border-orange-500' 
            : `${theme.inputBg} ${theme.textMain} ${theme.border} hover:border-orange-500/50 hover:text-orange-400`
        }`}
      >
        <Icon name={isExpanded ? "arrow-path" : "arrows-pointing-out"} className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>
    </nav>
  );
};
