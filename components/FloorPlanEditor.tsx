
import React, { useState, useRef, useEffect } from 'react';
import type { SourceImage, HistoryItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl } from '../utils';
import { editImage } from '../services/geminiService';
import { BrushEditor } from './BrushEditor';
import { ImageEditor } from './ImageEditor';

interface FloorPlanEditorProps {
    onBack: () => void;
    addImageToLibrary: (imageDataUrl: string) => Promise<void>;
    addHistoryItem: (item: Omit<HistoryItem, 'id'>) => Promise<void>;
}

const BeforeAfterSlider: React.FC<{ before: string; after: string }> = ({ before, after }) => {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
  
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const newSliderPos = (x / rect.width) * 100;
        setSliderPos(Math.max(0, Math.min(100, newSliderPos)));
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const newSliderPos = (x / rect.width) * 100;
        setSliderPos(Math.max(0, Math.min(100, newSliderPos)));
    };
  
    return (
        <div 
            ref={containerRef}
            className="relative w-full h-full select-none overflow-hidden rounded-xl border border-white/10 shadow-2xl"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
        >
            <img src={before} alt="Original" className="absolute inset-0 w-full h-full object-contain bg-slate-900" />
            <div className="absolute inset-0 w-full h-full overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                <img src={after} alt="Edited" className="absolute inset-0 w-full h-full object-contain bg-slate-900" />
            </div>
            <div className="absolute inset-y-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ left: `${sliderPos}%` }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-2xl border-4 border-slate-800">
                    <Icon name="arrows-pointing-out" className="w-5 h-5 text-slate-800 rotate-90" />
                </div>
            </div>
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">Sửa đổi</div>
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">Nguyên bản</div>
        </div>
    );
};

export const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({ onBack, addImageToLibrary, addHistoryItem }) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    
    // Undo/Redo State Logic
    const [imageHistory, setImageHistory] = useState<SourceImage[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const sourceImage = historyIndex >= 0 ? imageHistory[historyIndex] : null;

    const [maskImage, setMaskImage] = useState<SourceImage | null>(null);
    const [prompt, setPrompt] = useState('');
    const [editTool, setEditTool] = useState<'lasso' | 'brush' | 'auto'>('lasso');
    const [selectionMode, setSelectionMode] = useState<'union' | 'subtract'>('union');
    const [brushSize, setBrushSize] = useState(20);
    const [showBrushMenu, setShowBrushMenu] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const lassoRef = useRef<{ clear: () => void }>(null);
    const brushRef = useRef<{ clear: () => void }>(null);

    const addToHistory = (img: SourceImage) => {
        const nextHistory = imageHistory.slice(0, historyIndex + 1);
        setImageHistory([...nextHistory, img]);
        setHistoryIndex(nextHistory.length);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            handleClearAll();
        }
    };

    const handleRedo = () => {
        if (historyIndex < imageHistory.length - 1) {
            setHistoryIndex(prev => prev + 1);
            handleClearAll();
        }
    };

    useEffect(() => {
        if (generatedImages.length > 0 && !selectedImage) {
            setSelectedImage(generatedImages[0]);
        }
    }, [generatedImages, selectedImage]);

    const handleClearAll = () => {
        lassoRef.current?.clear();
        brushRef.current?.clear();
        setMaskImage(null);
    };

    const handleInvert = () => {
        alert("Tính năng Đảo ngược vùng chọn đang được phát triển.");
    };

    const handleGenerate = async () => {
        if (!sourceImage || !maskImage || !prompt) {
            alert("Vui lòng tải ảnh, chọn vùng cần sửa và nhập mô tả.");
            return;
        }

        setIsLoading(true);
        setGeneratedImages([]);
        setSelectedImage(null);

        try {
            const results = await editImage(
                sourceImage,
                maskImage,
                `Act as a professional architect and AutoCAD expert. Edit this 2D floor plan based on the following instruction: ${prompt}. Maintain technical precision, line consistency, and matching symbols. Output a clean technical drawing.`,
                1,
                null,
                language as 'vi' | 'en'
            );

            if (results.length > 0) {
                setGeneratedImages(results);
                setSelectedImage(results[0]);
                results.forEach(img => addImageToLibrary(img));
                await addHistoryItem({
                    tab: 'utilities',
                    sourceImage,
                    sourceImage2: maskImage,
                    referenceImage: null,
                    prompt: `[Floor Plan Edit] ${prompt}`,
                    negativePrompt: '',
                    imageCount: 1,
                    generatedImages: results,
                    generatedPrompts: null,
                });
            } else {
                alert(t('alertGenerationFailed'));
            }
        } catch (error) {
            console.error("Edit failed:", error);
            alert(t('alertGenerationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-[#0a0a0a] flex flex-col animate-fade-in overflow-hidden font-sans">
            {/* Top Navigation */}
            <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#111]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                        <Icon name="pencil-swoosh" className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white text-lg font-bold tracking-tight">{t('floorPlanEditTitle')}</h2>
                        <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">{t('floorPlanEditSelection')}</p>
                    </div>
                </div>
                
                <button 
                    onClick={onBack}
                    className="flex items-center gap-2 px-5 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full text-sm transition-all font-bold"
                >
                    <Icon name="arrow-uturn-left" className="w-4 h-4" />
                    {t('floorPlanEditExit')}
                </button>
            </div>

            {/* Editor Workspace */}
            <div className="flex-grow relative flex items-center justify-center p-6 lg:p-12 overflow-hidden">
                <div className="relative w-full max-w-6xl aspect-[4/3] bg-[#161616] rounded-2xl border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden group">
                    {!sourceImage ? (
                        <ImageDropzone onImageUpload={addToHistory} className="absolute inset-0 flex flex-col items-center justify-center text-white/30 cursor-pointer hover:bg-white/5 transition-colors">
                            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                                <Icon name="arrow-up-tray" className="w-10 h-10 opacity-50" />
                            </div>
                            <p className="text-xl font-bold mb-2">{t('floorPlanEditEmptyText')}</p>
                            <p className="text-sm opacity-50">{t('dropzoneHint')}</p>
                        </ImageDropzone>
                    ) : (
                        <>
                            <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-contain pointer-events-none opacity-90" />
                            <div className="absolute inset-0 z-10">
                                {editTool === 'lasso' && <ImageEditor ref={lassoRef} sourceImage={sourceImage} onMaskReady={setMaskImage} strokeWidth={2} />}
                                {editTool === 'brush' && <BrushEditor ref={brushRef} sourceImage={sourceImage} onMaskReady={setMaskImage} brushSize={brushSize} />}
                            </div>
                        </>
                    )}

                    {/* Toolbar Overlay */}
                    {sourceImage && !isLoading && (
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-5 pointer-events-none w-full">
                            <div className="bg-[#1c1c1c]/95 backdrop-blur-xl border border-white/10 p-1.5 rounded-[22px] flex items-center gap-1 shadow-2xl pointer-events-auto">
                                {/* Undo/Redo Buttons */}
                                <div className="flex items-center gap-1 px-2">
                                    <button 
                                        onClick={handleUndo} 
                                        disabled={historyIndex <= 0}
                                        className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                        title="Undo"
                                    >
                                        <Icon name="arrow-uturn-left" className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={handleRedo} 
                                        disabled={historyIndex >= imageHistory.length - 1}
                                        className="p-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                        title="Redo"
                                    >
                                        <Icon name="arrow-uturn-right" className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="w-px h-6 bg-white/10 mx-1"></div>

                                {/* Lasso Button */}
                                <button 
                                    onClick={() => setEditTool('lasso')}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl transition-all ${editTool === 'lasso' ? 'bg-[#7a5c00] text-[#ffcc00] shadow-inner shadow-black/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Icon name="pencil-swoosh" className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">Lasso</span>
                                </button>
                                
                                {/* Brush Button with Size Dropdown */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setEditTool('brush')}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all ${editTool === 'brush' ? 'bg-white/10 text-white shadow-inner shadow-black/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                    >
                                        <Icon name="sparkles" className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-widest">Brush</span>
                                        <div onClick={(e) => { e.stopPropagation(); setShowBrushMenu(!showBrushMenu); }} className="p-1 hover:bg-white/10 rounded-md ml-1">
                                            <Icon name="arrow-down-circle" className="w-3 h-3 opacity-40" />
                                        </div>
                                    </button>
                                    {showBrushMenu && (
                                        <div className="absolute top-full mt-3 left-0 w-56 bg-[#1c1c1c] border border-white/10 rounded-2xl p-5 shadow-[0_15px_35px_rgba(0,0,0,0.8)] z-30 animate-scale-up">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="text-[10px] uppercase font-black text-white/40 tracking-tighter">Brush Size</p>
                                                <p className="text-[10px] font-mono text-orange-500">{brushSize}px</p>
                                            </div>
                                            <input type="range" min="5" max="150" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-1 bg-white/10 rounded-full appearance-none accent-orange-600 cursor-pointer" />
                                        </div>
                                    )}
                                </div>

                                {/* Auto Button */}
                                <button 
                                    onClick={() => setEditTool('auto')}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl transition-all ${editTool === 'auto' ? 'bg-white/10 text-white shadow-inner shadow-black/20' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Icon name="sparkles" className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">Auto</span>
                                </button>

                                <div className="w-px h-6 bg-white/10 mx-2"></div>

                                {/* Selection Mode */}
                                <div className="flex items-center bg-black/40 rounded-2xl px-3 py-1 ml-1">
                                    <select 
                                        value={selectionMode}
                                        onChange={(e) => setSelectionMode(e.target.value as any)}
                                        className="bg-transparent text-white/80 text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer pr-1 py-1.5"
                                    >
                                        <option value="union" className="bg-[#1c1c1c]">Union</option>
                                        <option value="subtract" className="bg-[#1c1c1c]">Subtract</option>
                                    </select>
                                    <Icon name="arrow-down-circle" className="w-2.5 h-2.5 text-white/30 ml-1" />
                                </div>

                                {/* Invert */}
                                <button onClick={handleInvert} className="px-5 py-2.5 rounded-2xl text-white/80 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                                    Invert
                                </button>

                                {/* Clear All */}
                                <button onClick={handleClearAll} className="px-5 py-2.5 rounded-2xl text-white/80 text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                                    Clear all
                                </button>
                            </div>

                            {/* Circular Hint Box */}
                            <div className="bg-black/90 backdrop-blur-md px-6 py-2.5 rounded-full flex items-center gap-3.5 border border-white/5 shadow-2xl animate-fade-in pointer-events-auto">
                                <span className="text-white/90 text-sm font-bold tracking-tight">{t('floorPlanEditCircleHint')}</span>
                                <button onClick={(e) => (e.currentTarget.parentElement?.remove())} className="text-white/30 hover:text-white transition-colors">
                                    <Icon name="x-circle" className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Panel - Input & Action */}
            <div className="h-40 bg-[#111] border-t border-white/5 flex items-center justify-center px-12 gap-8 shadow-[0_-20px_40px_rgba(0,0,0,0.3)]">
                <div className="flex-grow max-w-5xl flex flex-col gap-4">
                    <div className="flex items-center gap-6">
                        <div className="flex-grow relative group">
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={t('promptPlaceholder.floorPlanEdit')}
                                className="w-full bg-[#1c1c1c] border border-white/10 rounded-2xl p-5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all h-24 shadow-inner"
                            />
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 rounded-lg bg-black/40 text-white/40 hover:text-white hover:bg-orange-600 transition-all"><Icon name="clipboard" className="w-4 h-4"/></button>
                            </div>
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading || !sourceImage || !maskImage || !prompt}
                            className="w-24 h-24 rounded-3xl bg-orange-600 hover:bg-orange-500 text-white flex flex-col items-center justify-center gap-2 disabled:bg-white/5 disabled:text-white/10 transition-all shadow-[0_10px_30px_rgba(234,88,12,0.3)] active:scale-95 flex-shrink-0"
                        >
                            {isLoading ? <Icon name="sparkles" className="w-8 h-8 animate-spin" /> : <Icon name="sparkles" className="w-8 h-8" />}
                            <span className="text-[10px] font-black uppercase tracking-widest">{isLoading ? 'Wait' : 'Render'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Fullscreen Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-b-4 border-orange-600 animate-spin"></div>
                        <Icon name="sparkles" className="w-12 h-12 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <p className="text-white font-black text-2xl mt-12 tracking-widest uppercase animate-pulse">{t('generatingEdit')}</p>
                    <p className="text-white/40 text-sm mt-4 italic max-w-xs text-center">AI đang vẽ lại mặt bằng kỹ thuật theo yêu cầu của bạn...</p>
                </div>
            )}

            {/* Results Comparison Modal */}
            {generatedImages.length > 0 && selectedImage && !isLoading && (
                <div className="fixed inset-0 z-[110] bg-[#0a0a0a] flex flex-col animate-fade-in">
                    {/* Results Top Bar */}
                    <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#111]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                <Icon name="sparkles" className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-white text-lg font-bold tracking-tight">So sánh kết quả</h2>
                        </div>
                        <button onClick={() => setGeneratedImages([])} className="text-white/40 hover:text-white transition-colors">
                            <Icon name="x-circle" className="w-8 h-8"/>
                        </button>
                    </div>

                    {/* Main Comparison Area */}
                    <div className="flex-grow flex flex-col lg:flex-row gap-8 p-10 overflow-hidden">
                        {/* Side by Side Option 1: Slider */}
                        <div className="flex-grow relative h-full">
                            <BeforeAfterSlider 
                                before={sourceImageToDataUrl(sourceImage!)} 
                                after={selectedImage} 
                            />
                        </div>

                        {/* Side Sidebar: Actions */}
                        <div className="lg:w-80 flex flex-col gap-6 flex-shrink-0 overflow-y-auto thin-scrollbar">
                            <div className="bg-[#161616] p-6 rounded-2xl border border-white/5">
                                <h3 className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Lựa chọn</h3>
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => {
                                            const img = { base64: selectedImage.split(',')[1], mimeType: 'image/png' };
                                            addToHistory(img);
                                            setGeneratedImages([]);
                                            handleClearAll();
                                        }}
                                        className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Icon name="pencil-swoosh" className="w-5 h-5"/>
                                        Sửa tiếp trên ảnh này
                                    </button>
                                    <a 
                                        href={selectedImage} 
                                        download={`aicomplex-edit-${Date.now()}.png`}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-all flex items-center justify-center gap-3"
                                    >
                                        <Icon name="download" className="w-5 h-5"/>
                                        Tải về bản vẽ
                                    </a>
                                </div>
                            </div>

                            <div className="bg-[#161616] p-6 rounded-2xl border border-white/5 flex-grow">
                                <h3 className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-4">Mô tả đã dùng</h3>
                                <p className="text-white/70 text-sm leading-relaxed italic">"{prompt}"</p>
                            </div>

                            <button 
                                onClick={() => { setImageHistory([]); setHistoryIndex(-1); setGeneratedImages([]); onBack(); }}
                                className="w-full py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 rounded-xl font-bold transition-all"
                            >
                                Đóng và Thoát
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
