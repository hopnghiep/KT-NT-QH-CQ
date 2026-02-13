
import React from 'react';
import { Icon } from './icons';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl } from '../utils';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { translations } from '../locales/translations';

interface CameraAngleViewProps {
    sourceImage: any;
    setSourceImage: (img: any) => void;
    referenceImage: any;
    setReferenceImage: (img: any) => void;
    prompt: string;
    setPrompt: (p: string) => void;
    generatedImages: string[];
    isLoading: boolean;
    selectedImage: string | null;
    setSelectedImage: (img: string) => void;
    setFullscreenImage: (img: string) => void;
    handleGeneration: () => void;
}

export const CameraAngleView: React.FC<CameraAngleViewProps> = ({
    sourceImage, setSourceImage, referenceImage, setReferenceImage, prompt, setPrompt, generatedImages, isLoading, selectedImage, setSelectedImage, setFullscreenImage, handleGeneration
}) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const { cameraAnglePrompts, interiorCameraAnglePrompts } = (translations[language] as any).constants;

    const handleAngleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value) {
            setPrompt(e.target.value);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow pb-12">
                {/* Left Column: Inputs */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto thin-scrollbar pr-2 h-[85vh]">
                    {/* 1. Dữ liệu Đầu Vào */}
                    <div className="bg-[#1c1c1c] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                            <h3 className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                1. Dữ liệu Đầu Vào
                            </h3>
                            <button 
                                onClick={() => { setSourceImage(null); setPrompt(''); }}
                                className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-1"
                            >
                                <Icon name="arrow-path" className="w-3 h-3" />
                                LÀM MỚI
                            </button>
                        </div>
                        {sourceImage ? (
                            <div className="relative aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 p-2 group shadow-inner">
                                <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-contain" />
                                <button onClick={() => setSourceImage(null)} className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-full transition-all shadow-lg z-10 opacity-0 group-hover:opacity-100">
                                    <Icon name="trash" className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <ImageDropzone onImageUpload={setSourceImage} className="w-full h-48 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 hover:border-orange-500/50 transition-all cursor-pointer bg-black/20 shadow-inner group">
                                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <Icon name="arrow-up-tray" className="w-6 h-6 text-slate-500" />
                                </div>
                                <p className="text-xs font-bold text-slate-400">Nhấp hoặc kéo tệp vào đây</p>
                                <p className="text-[10px] mt-1 opacity-40 uppercase tracking-widest">PNG, JPG, WEBP</p>
                            </ImageDropzone>
                        )}
                    </div>

                    {/* 2. Mô Tả (Prompt) */}
                    <div className="bg-[#1c1c1c] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
                        <h3 className="text-white text-sm font-black uppercase tracking-widest border-b border-white/5 pb-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                            2. Mô Tả (Prompt)
                        </h3>
                        
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ví dụ: Chụp từ trên cao xuống 45 độ..."
                            className="w-full bg-[#141414] border border-white/10 rounded-xl p-4 text-sm text-white resize-none h-32 focus:outline-none focus:border-orange-500/50 transition-all shadow-inner font-medium"
                        />

                        {/* Exterior Angles Dropdown */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Góc Chụp Ngoại Thất:</label>
                            <div className="relative">
                                <select 
                                    onChange={handleAngleChange}
                                    value={cameraAnglePrompts.some((p: any) => p.value === prompt) ? prompt : ""}
                                    className="w-full bg-[#252525] border border-white/5 rounded-xl p-3.5 text-xs text-slate-300 font-bold outline-none focus:border-orange-500/50 appearance-none shadow-sm transition-all"
                                    style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 1rem center/1.5em 1.5em no-repeat`}}
                                >
                                    <option value="">-- Chọn góc ngoại thất --</option>
                                    {cameraAnglePrompts.map((btn: any) => (
                                        <option key={btn.display} value={btn.value}>{btn.display}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Interior Angles Dropdown */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Góc Chụp Nội Thất:</label>
                            <div className="relative">
                                <select 
                                    onChange={handleAngleChange}
                                    value={interiorCameraAnglePrompts.some((p: any) => p.value === prompt) ? prompt : ""}
                                    className="w-full bg-[#252525] border border-white/5 rounded-xl p-3.5 text-xs text-slate-300 font-bold outline-none focus:border-orange-500/50 appearance-none shadow-sm transition-all"
                                    style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 1rem center/1.5em 1.5em no-repeat`}}
                                >
                                    <option value="">-- Chọn góc nội thất --</option>
                                    {interiorCameraAnglePrompts.map((btn: any) => (
                                        <option key={btn.display} value={btn.value}>{btn.display}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. Ảnh Tham Khảo (Tùy chọn) */}
                    <div className="bg-[#1c1c1c] border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
                        <h3 className="text-white text-lg font-bold flex items-center gap-2">
                            3. Ảnh Tham Khảo (Tùy chọn)
                        </h3>
                        {referenceImage ? (
                            <div className="relative aspect-square bg-black/40 rounded-xl overflow-hidden border border-white/5 p-2 group shadow-inner">
                                <img src={sourceImageToDataUrl(referenceImage)} className="w-full h-full object-contain" />
                                <button onClick={() => setReferenceImage(null)} className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white p-2 rounded-full transition-all shadow-lg z-10 opacity-0 group-hover:opacity-100">
                                    <Icon name="trash" className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <ImageDropzone onImageUpload={setReferenceImage} className="w-full aspect-square border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 hover:border-orange-500/50 transition-all cursor-pointer bg-black/20 shadow-inner group">
                                <p className="text-sm font-medium text-slate-400 opacity-60">
                                    + Thêm ảnh tham khảo<br/>(Tone/Mood)
                                </p>
                            </ImageDropzone>
                        )}
                    </div>

                    {/* Main Generate Button styled as requested */}
                    <button 
                        onClick={handleGeneration}
                        disabled={isLoading || !sourceImage}
                        className="w-full h-14 bg-[#34383f] hover:bg-[#464c56] text-slate-200 font-bold rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all active:scale-95 disabled:bg-slate-800/50 disabled:text-slate-600 mt-2 border border-white/5"
                    >
                        <Icon name="sparkles" className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'ĐANG TẠO...' : 'Bắt Đầu Render'}
                    </button>
                </div>

                {/* Right Column: Result */}
                <div className="lg:col-span-8 bg-[#1c1c1c] border border-white/5 rounded-2xl p-8 flex flex-col gap-6 shadow-2xl h-[85vh] relative overflow-hidden">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h3 className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                            Kết Quả Render
                        </h3>
                    </div>
                    
                    <div className="flex-grow bg-[#0f0f0f] rounded-2xl border border-white/5 flex items-center justify-center p-4 relative group shadow-inner">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-6 animate-pulse">
                                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                                <p className="text-orange-500 font-black text-xs uppercase tracking-widest">Đang khởi tạo...</p>
                            </div>
                        ) : selectedImage ? (
                            <div className="relative w-full h-full flex items-center justify-center animate-fade-in">
                                <img src={selectedImage} className="max-w-full max-h-full object-contain rounded-xl shadow-[0_30px_90px_rgba(0,0,0,0.8)]" />
                                <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                    <button onClick={() => setFullscreenImage(selectedImage)} className="p-4 bg-slate-800/90 backdrop-blur-md text-white rounded-2xl shadow-lg hover:bg-orange-600 transition-all hover:scale-110">
                                        <Icon name="arrows-pointing-out" className="w-6 h-6" />
                                    </button>
                                    <a href={selectedImage} download={`render-angle-${Date.now()}.png`} className="p-4 bg-orange-600 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform">
                                        <Icon name="download" className="w-6 h-6" />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center opacity-30 animate-fade-in max-w-xs">
                                <Icon name="camera" className="w-20 h-20 mx-auto text-slate-700 mb-6" />
                                <p className="text-sm font-black text-slate-500 uppercase tracking-widest leading-relaxed">Hình ảnh được tạo sẽ xuất hiện ở đây sau khi render.</p>
                            </div>
                        )}
                    </div>

                    {/* Thumbnail list if multiple */}
                    {generatedImages.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-2 justify-center h-24 scrollbar-hide">
                            {generatedImages.map((img, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setSelectedImage(img)}
                                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer border-4 transition-all ${selectedImage === img ? 'border-orange-500 scale-105 shadow-xl z-10' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
