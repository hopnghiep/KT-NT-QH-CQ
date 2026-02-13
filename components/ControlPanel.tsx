
import React, { useState } from 'react';
import { Icon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { CreateFreePanel } from './panels/CreateFreePanel';
import { CreateApiPanel } from './panels/CreateApiPanel';
import { InteriorPanel } from './panels/InteriorPanel';
import { PlanningPanel } from './panels/PlanningPanel';
import { LandscapePanel } from './panels/LandscapePanel';
import { CameraAnglePanel, EditPanel, PlanTo3dPanel, VideoPanel, CanvaPanel, PromptGenPanel, SectionPanel, PhotoToSketchPanel } from './panels/SecondaryPanels';
import type { ActiveTab } from '../types';

export const ControlPanel: React.FC<any> = (props) => {
    const { activeTab, handleGeneration, handleRefresh, handleUndo, handleRedo, canUndo, canRedo, isLoading, sourceImage, sourceImage2, editSubMode, canvaObjects, aiModel, onTabChange, setPrompt, setNegativePrompt } = props;
    const { t } = useLanguage();
    const { theme } = useTheme();

    const handleResetPrompt = () => {
        if (activeTab === 'create') {
            setPrompt(t('promptInitial'));
            setNegativePrompt(t('defaultNegativePrompt'));
        } else if (activeTab === 'interior') {
            setPrompt(t('promptInterior'));
            setNegativePrompt(t('defaultNegativePrompt'));
        } else if (activeTab === 'planning') {
            setPrompt(t('promptPlanning'));
            setNegativePrompt(t('defaultNegativePrompt'));
        } else if (activeTab === 'photoToSketch') {
            setPrompt(t('photoToSketchPrompt'));
            setNegativePrompt('');
        } else {
            setPrompt('');
            setNegativePrompt('');
        }
    };

    const renderPanel = () => {
        const commonProps = { ...props, onRefreshPrompt: handleResetPrompt };
        const isAnyEditTab = ['edit', 'smartEdit', 'mergeHouse', 'mergeMaterial', 'mergeFurniture'].includes(activeTab);
        
        switch (activeTab) {
            case 'create':
                if (aiModel === 'gemini-3-pro-image-preview') {
                    return <CreateApiPanel {...commonProps} />;
                }
                return <CreateFreePanel {...commonProps} />;
            case 'interior':
                return <InteriorPanel {...commonProps} />;
            case 'planning':
                return <PlanningPanel {...commonProps} />;
            case 'landscape':
                return <LandscapePanel {...commonProps} />;
            case 'photoToSketch':
                return <PhotoToSketchPanel {...commonProps} />;
            case 'cameraAngle': return <CameraAnglePanel {...commonProps} />;
            case 'planTo3d': return <PlanTo3dPanel {...commonProps} />;
            case 'sectionTo3d': return <SectionPanel {...commonProps} />;
            case 'canva': return <CanvaPanel {...commonProps} />;
            case 'prompt': return <PromptGenPanel {...commonProps} />;
            case 'video': return <VideoPanel {...commonProps} />;
            default: 
                if (isAnyEditTab) return <EditPanel {...commonProps} />;
                return null;
        }
    }
    
    const isGenerationDisabled = () => {
        if (isLoading) return true;
        if (activeTab === 'canva') return !sourceImage || !canvaObjects || canvaObjects.length === 0;
        if (activeTab === 'prompt') return !sourceImage;
        if (!['create', 'interior', 'planning', 'landscape', 'sectionTo3d', 'photoToSketch'].includes(activeTab) && !sourceImage) return true;
        return false;
    }

    const getButtonText = () => {
        switch(activeTab) {
            case 'video': return t('createVideo');
            case 'prompt': return t('createPrompt');
            case 'landscape': return t('createLandscapeRender');
            default: return t('createImage');
        }
    }

    // Các tab thuộc danh mục Điều chỉnh thiết kế (II) hoặc Video (có nút riêng)
    const hideGlobalButton = ['edit', 'smartEdit', 'mergeHouse', 'mergeMaterial', 'mergeFurniture', 'canva', 'video'].includes(activeTab);

    return (
        <div className="flex flex-col gap-6 w-full animate-fade-in">
            <div className="flex justify-between items-center bg-black/20 p-2 rounded-xl border border-white/5">
                <div className="flex items-center gap-1">
                    <button 
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-10 transition-all"
                        title="Undo"
                    >
                        <Icon name="arrow-uturn-left" className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleRedo}
                        disabled={!canRedo}
                        className="p-2 rounded-lg text-slate-400 hover:text-white disabled:opacity-10 transition-all"
                        title="Redo"
                    >
                        <Icon name="arrow-uturn-right" className="w-5 h-5" />
                    </button>
                </div>
                <button 
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    <Icon name="arrow-path" className="w-4 h-4" />
                    LÀM MỚI
                </button>
            </div>

            {renderPanel()}

            {/* Ẩn khu vực preset và nút tạo ảnh chung nếu tab đã có nút riêng */}
            {!hideGlobalButton && (
                <button onClick={handleGeneration} disabled={isGenerationDisabled()} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-4 px-4 rounded-xl flex items-center justify-center gap-3 disabled:bg-slate-700 disabled:text-slate-500 shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest">
                    <Icon name="sparkles" className="w-5 h-5" />
                    {getButtonText()}
                </button>
            )}
        </div>
    );
};