
import React, { useState } from 'react';
import type { SourceImage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl } from '../utils';

/**
 * Redesigned control toolbar shown below the main image
 */
const VirtualTourToolbar: React.FC<{
    onNavigate: (prompt: string) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    multiplier: number;
    setMultiplier: (m: number) => void;
    customPrompt: string;
    setCustomPrompt: (p: string) => void;
}> = ({ onNavigate, onUndo, onRedo, canUndo, canRedo, multiplier, setMultiplier, customPrompt, setCustomPrompt }) => {
    const { t } = useLanguage();

    const navButtons = [
        { 
            label: 'Trái', 
            icon: 'arrow-left-circle', 
            basePrompt: 'Architectural render: Rotate camera view {dist} degrees to the left side. Generate new perspective while maintaining lighting, materials, and structural consistency.' 
        },
        { 
            label: 'Phải', 
            icon: 'arrow-right-circle', 
            basePrompt: 'Architectural render: Rotate camera view {dist} degrees to the right side. Generate new perspective while maintaining lighting, materials, and structural consistency.' 
        },
        { 
            label: 'Lên', 
            icon: 'arrow-up-circle', 
            basePrompt: 'Architectural render: Tilt camera view upwards by {dist} degrees to show more of the ceiling or upper structure. Maintain architectural style.' 
        },
        { 
            label: 'Xuống', 
            icon: 'arrow-down-circle', 
            basePrompt: 'Architectural render: Tilt camera view downwards by {dist} degrees to show more of the flooring or ground details. Maintain architectural style.' 
        },
        { 
            label: 'Tiến', 
            icon: 'plus-circle', 
            basePrompt: 'Architectural render: Move camera forward {dist} meters deep into the space. Discover and render new interior or exterior details based on current style.' 
        },
        { 
            label: 'Lùi', 
            icon: 'minus-circle', 
            basePrompt: 'Architectural render: Pull camera back {dist} meters to reveal a wider panoramic view of the architecture and environment.' 
        },
    ];

    const handleNavClick = (btn: typeof navButtons[0]) => {
        let finalPrompt = btn.basePrompt;
        const value = multiplier * 20; 
        finalPrompt = btn.basePrompt.replace('{dist}', value.toString());
        
        if (customPrompt.trim()) {
            finalPrompt += ` Additional request: ${customPrompt.trim()}`;
        }
        
        onNavigate(finalPrompt);
    };

    return (
        <div className="flex flex-col gap-5 w-full max-w-5xl mx-auto px-4">
            {/* Top Row: Prompt Input - Full Width for better editing */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-1.5 rounded-2xl flex items-center w-full shadow-inner overflow-hidden">
                <div className="pl-4 pr-3 text-orange-500">
                    <Icon name="sparkles" className="w-5 h-5" />
                </div>
                <input 
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Nhập thêm yêu cầu kiến tạo (VD: Thay đổi vật liệu sàn, thêm cây xanh, đổi màu tường...)"
                    className="flex-grow bg-transparent text-white text-xs font-bold py-3 outline-none placeholder:text-slate-600 tracking-tight"
                />
                {customPrompt && (
                    <button 
                        onClick={() => setCustomPrompt('')}
                        className="p-2 text-slate-500 hover:text-white transition-colors mr-1"
                    >
                        <Icon name="x-circle" className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Bottom Row: Navigation & Multiplier - Spread out */}
            <div className="flex flex-wrap items-center justify-between gap-6">
                {/* 1. Undo/Redo & Navigation Cluster */}
                <div className="flex items-center bg-[#1e293b]/90 backdrop-blur-md rounded-2xl px-5 py-2.5 gap-4 border border-white/10 shadow-xl">
                    <div className="flex items-center gap-1.5 mr-2">
                        <button 
                            onClick={onUndo} 
                            disabled={!canUndo} 
                            className="p-2 text-white/40 hover:text-white disabled:opacity-10 transition-all"
                            title="Quay lại"
                        >
                            <Icon name="arrow-uturn-left" className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={onRedo} 
                            disabled={!canRedo} 
                            className="p-2 text-white/40 hover:text-white disabled:opacity-10 transition-all"
                            title="Tiếp tục"
                        >
                            <Icon name="arrow-uturn-right" className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                    
                    <div className="flex items-center gap-4">
                        {navButtons.map(btn => (
                            <button 
                                key={btn.label} 
                                onClick={() => handleNavClick(btn)} 
                                className="text-white/60 hover:text-orange-500 transition-all hover:scale-125 active:scale-95 group relative" 
                                title={`${btn.label} (x${multiplier})`}
                            >
                                <Icon name={btn.icon} className="w-7 h-7" />
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-slate-500">{btn.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 2. Multiplier Control Cluster */}
                <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-2.5 flex items-center gap-4 border border-white/5 shadow-xl">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Hệ số di chuyển:</span>
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map(m => (
                            <button
                                key={m}
                                onClick={() => setMultiplier(m)}
                                className={`w-9 h-9 rounded-xl text-xs font-black transition-all flex items-center justify-center border ${
                                    multiplier === m 
                                    ? 'bg-orange-600 text-white border-orange-500 shadow-lg scale-105' 
                                    : 'text-slate-400 bg-white/5 border-transparent hover:text-white hover:bg-white/10'
                                }`}
                            >
                                x{m}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface VirtualTourCreatorProps {
    onBack: () => void;
    isLoading: boolean;
    sourceImage: SourceImage | null;
    virtualTourHistory: string[];
    virtualTourIndex: number;
    handleVirtualTourNavigation: (prompt: string) => void;
    handleUndo: () => void;
    handleRedo: () => void;
    handleVirtualTourHistorySelect: (index: number) => void;
    setFullscreenImage: (url: string | null) => void;
    handleVirtualTourImageUpload: (image: SourceImage | null) => void;
}

export const VirtualTourCreator: React.FC<VirtualTourCreatorProps> = ({
    isLoading,
    sourceImage,
    virtualTourHistory,
    virtualTourIndex,
    handleVirtualTourNavigation,
    handleUndo,
    handleRedo,
    handleVirtualTourHistorySelect,
    setFullscreenImage,
    handleVirtualTourImageUpload,
}) => {
    const { t } = useLanguage();
    const [multiplier, setMultiplier] = useState(1);
    const [customPrompt, setCustomPrompt] = useState('');
    const currentTourImage = virtualTourHistory[virtualTourIndex];
    
    return (
        <div className="flex flex-col h-full animate-fade-in text-left">
            {/* Header section */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => window.history.back()} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all">
                    <Icon name="arrow-uturn-left" className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-600/20 rounded-xl border border-orange-500/30">
                        <Icon name="globe" className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                        <h2 className="text-white text-lg font-black uppercase tracking-tighter">THAM QUAN ẢO</h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">AI kiến tạo không gian 3D diễn họa theo hướng chỉ định</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[70vh]">
                {/* 1/3 Left Control Panel */}
                <div className="lg:col-span-4 bg-[#1a212c] border border-white/5 p-6 rounded-3xl flex flex-col gap-6 shadow-2xl h-max">
                    <section>
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-white text-sm font-black uppercase tracking-tighter">1. ẢNH BẮT ĐẦU</h3>
                            <a 
                                href="https://pinterest.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-1.5 text-[9px] font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest"
                            >
                                <Icon name="pinterest" className="w-3.5 h-3.5" />
                                FINDONPINTEREST
                            </a>
                        </div>
                        <p className="text-slate-500 text-[10px] font-bold italic mb-6">Tải ảnh render để bắt đầu hành trình tham quan</p>
                        
                        <div className="relative">
                            {sourceImage ? (
                                <div className="space-y-4">
                                    <div className="bg-black/40 border border-white/10 rounded-2xl p-2 shadow-inner aspect-[4/3] flex items-center justify-center overflow-hidden">
                                        <img src={sourceImageToDataUrl(sourceImage)} alt="Start" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <button 
                                        onClick={() => handleVirtualTourImageUpload(null)} 
                                        className="flex items-center gap-2 text-red-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        <Icon name="trash" className="w-4 h-4" />
                                        XÓA ẢNH GỐC
                                    </button>
                                </div>
                            ) : (
                                <ImageDropzone onImageUpload={handleVirtualTourImageUpload} className="w-full aspect-[4/3] border-2 border-dashed border-white/10 bg-black/20 rounded-3xl flex flex-col items-center justify-center text-center text-slate-600 hover:bg-white/5 hover:border-orange-500/30 transition-all cursor-pointer shadow-inner group">
                                    <Icon name="arrow-up-tray" className="w-8 h-8 mb-2 opacity-30 group-hover:scale-110 transition-transform" />
                                    <p className="text-xs font-black uppercase tracking-widest">Tải ảnh render bắt đầu</p>
                                </ImageDropzone>
                            )}
                        </div>
                    </section>

                    <div className="p-4 bg-orange-600/5 rounded-2xl border border-orange-500/10">
                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Icon name="sparkles" className="w-3.5 h-3.5" />
                            Gợi ý tham quan:
                        </p>
                        <ul className="text-[10px] text-slate-400 space-y-1.5 list-disc pl-4 italic leading-relaxed">
                            <li>Chọn <b>x2, x3</b> để tăng bước nhảy không gian.</li>
                            <li>Sử dụng <b>ô nhập văn bản</b> để tùy biến chi tiết.</li>
                            <li>Dùng các <b>nút điều hướng</b> để AI render góc mới.</li>
                            <li>AI sẽ giữ nguyên phong cách kiến trúc ban đầu.</li>
                        </ul>
                    </div>
                </div>

                {/* 2/3 Right Result Area - Flex Column with controls at bottom */}
                <div className="lg:col-span-8 bg-[#050505] rounded-[2.5rem] border border-white/5 flex flex-col shadow-2xl min-h-[700px] overflow-hidden">
                    {isLoading ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center gap-6 animate-pulse">
                            <div className="w-20 h-20 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                            <div className="flex flex-col items-center">
                                <p className="text-orange-500 font-black text-base uppercase tracking-[0.3em] mb-1">AI Đang kiến tạo phối cảnh...</p>
                                <p className="text-slate-600 text-[11px] uppercase font-bold tracking-widest italic">Công nghệ Generative AI đang xử lý góc nhìn 3D</p>
                            </div>
                        </div>
                    ) : !currentTourImage ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center opacity-20">
                            <Icon name="globe" className="w-24 h-24 mx-auto text-slate-500 mb-6" />
                            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Khu vực hiển thị diễn họa tham quan</p>
                        </div>
                    ) : (
                        <>
                            {/* Main Image Viewport - Full View */}
                            <div className="flex-grow relative w-full flex items-center justify-center p-6 group overflow-hidden">
                                <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-[0_30px_120px_rgba(0,0,0,1)] border border-white/5">
                                    <img 
                                        src={currentTourImage} 
                                        alt="Virtual tour view" 
                                        className="max-w-full max-h-[75vh] object-contain transition-all duration-700"
                                    />

                                    {/* Right Side Stacked Icons (Fullscreen & Download) - Stays absolute on image corner */}
                                    <div className="absolute top-6 right-6 flex flex-col gap-3 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => setFullscreenImage(currentTourImage)}
                                            className="p-3.5 bg-slate-900/90 backdrop-blur-md text-white/70 hover:text-white rounded-xl shadow-lg border border-white/5 hover:bg-orange-600 transition-all"
                                            title="Toàn màn hình"
                                        >
                                            <Icon name="arrows-pointing-out" className="w-5 h-5" />
                                        </button>
                                        <a 
                                            href={currentTourImage} 
                                            download={`virtual-tour-${Date.now()}.png`}
                                            className="p-3.5 bg-slate-900/90 backdrop-blur-md text-white/70 hover:text-white rounded-xl shadow-lg border border-white/5 hover:bg-orange-600 transition-all flex items-center justify-center"
                                            title="Tải về"
                                        >
                                            <Icon name="download" className="w-5 h-5" />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Control Bar Area - Below the image */}
                            <div className="bg-[#0a0a0a] border-t border-white/5 p-8 w-full shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                                <VirtualTourToolbar
                                    onNavigate={handleVirtualTourNavigation}
                                    onUndo={handleUndo}
                                    onRedo={handleRedo}
                                    canUndo={virtualTourIndex > 0}
                                    canRedo={virtualTourIndex < virtualTourHistory.length - 1}
                                    multiplier={multiplier}
                                    setMultiplier={setMultiplier}
                                    customPrompt={customPrompt}
                                    setCustomPrompt={setCustomPrompt}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom history row */}
            <div className="mt-10">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                        <Icon name="clock" className="w-4 h-4 text-slate-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hành trình tham quan (Lịch sử)</span>
                    </div>
                    {virtualTourHistory.length > 0 && (
                        <button 
                            onClick={() => handleVirtualTourImageUpload(null)}
                            className="text-[9px] font-black text-red-500/60 hover:text-red-500 uppercase tracking-widest transition-colors"
                        >
                            XÓA LỊCH SỬ
                        </button>
                    )}
                </div>
                <div className="bg-[#141414] border border-white/5 rounded-[2rem] p-8 shadow-2xl flex items-center justify-center overflow-x-auto thin-scrollbar min-h-[140px]">
                    {virtualTourHistory.length > 0 ? (
                        <div className="flex gap-5 w-full">
                            {virtualTourHistory.map((img, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => handleVirtualTourHistorySelect(idx)}
                                    className={`relative flex-shrink-0 w-28 aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 transition-all ${virtualTourIndex === idx ? 'border-orange-600 scale-105 shadow-2xl z-10' : 'border-transparent opacity-30 hover:opacity-100 hover:scale-105'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt={`View ${idx}`} />
                                    <div className="absolute top-2 right-2 text-[9px] font-black text-white bg-black/60 px-1.5 py-0.5 rounded-md shadow-lg border border-white/10">#{idx + 1}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center opacity-20">
                            <Icon name="clock" className="w-10 h-10 mb-2 text-slate-600" />
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic">Chưa có lịch sử.</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Fixed Action Sparkle Button */}
            <button 
                onClick={() => handleVirtualTourNavigation('Architectural render: Generate a new detailed perspective view in high quality, cinematic lighting, maintaining the same building style and materials.')}
                disabled={isLoading || !sourceImage}
                className="fixed bottom-10 right-10 w-16 h-16 bg-orange-600 hover:bg-orange-500 text-white rounded-full shadow-[0_20px_50px_rgba(234,88,12,0.5)] flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-[100] border-4 border-[#0a0a0a]"
            >
                <Icon name="sparkles" className="w-8 h-8" />
            </button>
        </div>
    );
};
