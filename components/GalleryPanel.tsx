
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './icons';
import type { ActiveTab, SourceImage, ObjectTransform, EditSubMode, BoundingBox, HistoryItem } from '../types';
import { BrushEditor } from './BrushEditor';
import { AreaSelector } from './ArrowEditor';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { sourceImageToDataUrl } from '../utils';

const EmptyState: React.FC<{ activeTab: ActiveTab }> = ({ activeTab }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    return (
        <div className={`h-full flex flex-col items-center justify-center text-center ${theme.textSub} p-10`}>
            <Icon name={'sparkles'} className="w-24 h-24 text-slate-600 opacity-30 mb-8" />
            <h3 className={`text-3xl font-black ${theme.textSub} tracking-tighter uppercase`}>{t('emptyStateHeader')}</h3>
            <p className="mt-4 text-lg font-medium opacity-60">{activeTab === 'video' ? 'Video sẽ xuất hiện ở đây.' : t('emptyStateText')}</p>
        </div>
    );
};

interface GalleryPanelProps {
    isLoading: boolean;
    loadingMessage: string;
    imageCount: number;
    activeTab: ActiveTab;
    generatedVideoUrl: string | null;
    generatedImages: string[];
    generatedPrompts: string | null;
    selectedImage: string | null;
    lastUsedPrompt: string;
    sourceImage: SourceImage | null;
    sourceImage2: SourceImage | null;
    isSelectingArea: boolean;
    isEditingMask: boolean;
    isZoomedEditing: boolean;
    setIsZoomedEditing: (val: boolean) => void;
    editTool: 'lasso' | 'brush' | 'auto';
    setEditTool: (tool: 'lasso' | 'brush' | 'auto') => void;
    brushSize: number;
    setBrushSize: (size: number) => void;
    setSelectedImage: (image: string) => void;
    setMaskImage: (mask: SourceImage | null) => void;
    onAreaSelected: (annotatedImage: SourceImage | null, box?: BoundingBox) => void;
    setFullscreenImage: (url: string | null) => void;
    handleStartEditing: () => void;
    handleSetAsSourceImage: () => void;
    copyToClipboard: (text: string) => void;
    onGenerateFromPrompt: (prompt: string) => void;
    areaSelectorRef: React.RefObject<{ clear: () => void }>;
    brushEditorRef: React.RefObject<{ clear: () => void, undo: () => void, redo: () => void }>;
    canvaObjects: SourceImage[];
    canvaObjectTransforms: ObjectTransform[];
    setCanvaObjectTransforms: React.Dispatch<React.SetStateAction<ObjectTransform[]>>;
    selectedCanvaObjectIndex: number | null;
    setSelectedCanvaObjectIndex: React.Dispatch<React.SetStateAction<number | null>>;
    isCanvaLayoutLocked: boolean;
    editSubMode?: EditSubMode;
    editBox: BoundingBox | null;
    setEditBox: (box: BoundingBox | null) => void;
    videoHistory?: HistoryItem[];
    onDeleteGeneratedImage?: (url: string) => void;
}

// Added setSelectedImage to the destructured props
export const GalleryPanel: React.FC<GalleryPanelProps> = ({
    isLoading, loadingMessage, activeTab, generatedVideoUrl, generatedImages, generatedPrompts, selectedImage, sourceImage,
    brushSize, setBrushSize, setSelectedImage, setMaskImage, onAreaSelected, setFullscreenImage,
    brushEditorRef, isSelectingArea, isZoomedEditing, setIsZoomedEditing, areaSelectorRef, videoHistory = [],
    onDeleteGeneratedImage
}) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);

    const sourceDataUrl = sourceImage ? sourceImageToDataUrl(sourceImage) : null;
    const isGeneratedResult = selectedImage && sourceDataUrl && selectedImage !== sourceDataUrl;
    const imageToShow = isGeneratedResult ? selectedImage : sourceDataUrl;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="relative mb-10">
                        <Icon name="camera" className="w-24 h-24 text-orange-500 animate-pulse" />
                    </div>
                    <h3 className={`text-2xl font-black ${theme.textMain} tracking-tight uppercase`}>
                        {loadingMessage || t('loadingMessageDefault')}
                    </h3>
                </div>
            );
        }

        if (activeTab === 'video') {
            return (
                <div className="flex flex-col h-full gap-8">
                    <div className="flex-grow flex flex-col bg-[#1c1c1c] rounded-3xl border border-white/5 p-6 shadow-2xl relative min-h-[450px]">
                        <h3 className="text-white text-xs font-black uppercase tracking-widest border-b border-white/5 pb-4 mb-6">Kết Quả</h3>
                        <div className="flex-grow flex items-center justify-center bg-black/40 rounded-2xl overflow-hidden relative border border-white/5">
                            {generatedVideoUrl ? (
                                <video src={generatedVideoUrl} controls className="max-w-full max-h-full" autoPlay loop />
                            ) : (
                                <div className="text-center opacity-30 flex flex-col items-center gap-4">
                                    <Icon name="video-camera" className="w-20 h-20 text-slate-600" />
                                    <p className="text-sm font-black uppercase tracking-widest text-slate-500">Video sẽ xuất hiện ở đây.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        if (imageToShow || generatedPrompts) {
            return (
                <div className="flex flex-col h-full animate-fade-in relative group">
                    <div className="flex-grow flex flex-col items-center justify-center relative bg-black/40 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl min-h-[550px]" ref={containerRef}>
                        <div className="relative w-full h-full flex items-center justify-center p-4">
                            <img 
                                src={imageToShow} 
                                className={`object-contain transition-all duration-500 max-w-full rounded-2xl ${isZoomedEditing ? 'max-h-[85vh] scale-[1.05]' : 'max-h-[75vh]'}`} 
                            />
                            {sourceImage && (
                                <div className="absolute inset-0 z-10 pointer-events-auto">
                                    {activeTab === 'cameraAngle' && isSelectingArea && (
                                        <AreaSelector sourceImage={sourceImage} onAreaSelected={onAreaSelected} ref={areaSelectorRef} />
                                    )}
                                    {activeTab === 'edit' && isZoomedEditing && !isGeneratedResult && (
                                        <BrushEditor ref={brushEditorRef} sourceImage={sourceImage} onMaskReady={setMaskImage} brushSize={brushSize} />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Floating Action Toolbar */}
                        {imageToShow && !isZoomedEditing && (
                            <div className="absolute top-8 right-8 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 z-30">
                                <button 
                                    onClick={() => setFullscreenImage(imageToShow)}
                                    className="p-4 bg-slate-900/90 backdrop-blur-md text-white/70 hover:text-white rounded-2xl shadow-2xl border border-white/10 hover:bg-orange-600 transition-all hover:scale-110"
                                    title={t('fullscreen')}
                                >
                                    <Icon name="arrows-pointing-out" className="w-6 h-6" />
                                </button>
                                
                                {isGeneratedResult && (
                                    <>
                                        <a 
                                            href={imageToShow} 
                                            download={`aicomplex-render-${Date.now()}.png`}
                                            className="p-4 bg-slate-900/90 backdrop-blur-md text-white/70 hover:text-white rounded-2xl shadow-2xl border border-white/10 hover:bg-orange-600 transition-all flex items-center justify-center hover:scale-110"
                                            title={t('downloadImage')}
                                        >
                                            <Icon name="download" className="w-6 h-6" />
                                        </a>
                                        <button 
                                            onClick={() => onDeleteGeneratedImage?.(imageToShow)}
                                            className="p-4 bg-slate-900/90 backdrop-blur-md text-red-500/70 hover:text-red-500 rounded-2xl shadow-2xl border border-white/10 hover:bg-red-500/20 transition-all hover:scale-110"
                                            title={t('delete')}
                                        >
                                            <Icon name="trash" className="w-6 h-6" />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Multiple Results Preview */}
                    {generatedImages.length > 1 && (
                        <div className="flex gap-4 mt-6 overflow-x-auto pb-4 thin-scrollbar justify-center">
                            {generatedImages.map((img, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setSelectedImage(img)}
                                    className={`relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden cursor-pointer border-4 transition-all ${selectedImage === img ? 'border-orange-500 scale-105 shadow-xl' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt={`Result ${idx + 1}`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        return <EmptyState activeTab={activeTab} />;
    };
    
    return (
        <div className={`w-full ${theme.panelBg} p-6 rounded-[2.5rem] shadow-2xl border ${theme.border} min-h-[60vh] lg:min-h-0`}>
            <div className='h-full max-h-[85vh] overflow-y-auto pr-2 thin-scrollbar'>
                {renderContent()}
            </div>
        </div>
    );
};
