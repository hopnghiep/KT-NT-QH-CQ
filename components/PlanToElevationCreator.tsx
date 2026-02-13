
import React, { useState, useEffect } from 'react';
import type { HistoryItem, SourceImage, ImageSize } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { generateImages } from '../services/geminiService';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl } from '../utils';

interface PlanToElevationCreatorProps {
    onBack: () => void;
    addImageToLibrary: (imageDataUrl: string) => Promise<void>;
    addHistoryItem: (item: Omit<HistoryItem, 'id'>) => Promise<void>;
}

export const PlanToElevationCreator: React.FC<PlanToElevationCreatorProps> = ({ onBack, addImageToLibrary, addHistoryItem }) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();

    const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
    const [prompt, setPrompt] = useState('');
    const [elevationType, setElevationType] = useState('Mặt đứng chính (Main Elevation)');
    const [imageCount, setImageCount] = useState(2);
    const [imageSize, setImageSize] = useState<ImageSize>('1K');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (generatedImages.length > 0 && !selectedImage) {
            setSelectedImage(generatedImages[0]);
        }
    }, [generatedImages, selectedImage]);

    const elevationOptions = [
        "Mặt đứng chính (Main Elevation)",
        "Mặt đứng sau (Rear Elevation)",
        "Mặt đứng bên trái (Left Side Elevation)",
        "Mặt đứng bên phải (Right Side Elevation)",
        "Mặt đứng phối cảnh (Perspective Elevation)",
        "Mặt đứng kỹ thuật (Technical Elevation)"
    ];

    const promptSuggestions = [
        { label: "Hiện đại & Kính", value: "phong cách hiện đại, sử dụng mảng kính lớn, hệ lam nhôm, tông màu trung tính" },
        { label: "Tối giản (Minimalist)", value: "phong cách tối giản, hình khối sạch sẽ, vật liệu bê tông trần và gỗ" },
        { label: "Tân cổ điển", value: "phong cách tân cổ điển, phào chỉ tinh tế, cột đối xứng, tông màu trắng kem" },
        { label: "Xanh (Eco-friendly)", value: "kiến trúc xanh, nhiều cây xạnh bao phủ ban công, vật liệu thân thiện môi trường" }
    ];

    const handleGenerate = async () => {
        if (!sourceImage) {
            alert("Vui lòng tải lên ảnh 2D Plan.");
            return;
        }

        setIsLoading(true);
        setGeneratedImages([]);
        setSelectedImage(null);

        try {
            const finalPrompt = `Act as a professional architect. Generate a high-quality ${elevationType} based on this floor plan. Architectural style: ${prompt || 'Modern and professional'}. Technical drawing style with realistic materials and professional lighting. Clean lines and correct proportions.`;

            const results = await generateImages(
                sourceImage,
                finalPrompt,
                imageCount,
                null,
                '16:9',
                language as 'vi' | 'en',
                undefined,
                'gemini-3-pro-image-preview',
                imageSize
            );

            if (results.length > 0) {
                setGeneratedImages(results);
                setSelectedImage(results[0]);
                results.forEach(img => addImageToLibrary(img));
                await addHistoryItem({
                    tab: 'planToElevation',
                    sourceImage,
                    referenceImage: null,
                    prompt: `[Elevation] ${elevationType}: ${prompt}`,
                    negativePrompt: '',
                    imageCount,
                    generatedImages: results,
                    generatedPrompts: null,
                });
            } else {
                alert(t('alertGenerationFailed'));
            }
        } catch (error) {
            console.error("Elevation generation failed:", error);
            alert(t('alertGenerationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in text-left">
            <div className="mb-6">
                <h2 className="text-white text-xl font-black uppercase tracking-tight">TẠO MẶT ĐỨNG TỪ 2D PLAN</h2>
                <p className="text-slate-400 text-sm mt-1 font-medium">Dựa trên bản vẽ mặt bằng 2D để tạo ra các bản vẽ mặt đứng kiến trúc chuyên nghiệp.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow pb-12">
                <div className="lg:col-span-5 bg-[#2a2d33] border border-slate-700/50 rounded-xl p-6 flex flex-col gap-5 shadow-2xl overflow-y-auto thin-scrollbar max-h-[85vh]">
                    <h3 className="text-white text-sm font-black uppercase tracking-widest border-b border-white/5 pb-3">1. DỮ LIỆU ĐẦU VÀO</h3>
                    
                    <div className="space-y-5">
                        <div className="relative group">
                            {sourceImage ? (
                                <div className="relative aspect-video bg-black/40 rounded-lg overflow-hidden border border-slate-600 shadow-inner p-2">
                                    <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-contain" />
                                    <button onClick={() => setSourceImage(null)} className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-full transition-all shadow-lg z-10">
                                        <Icon name="trash" className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <ImageDropzone onImageUpload={setSourceImage} className="w-full h-48 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 hover:border-orange-500/50 transition-all cursor-pointer shadow-inner">
                                    <div className="text-sm font-bold text-slate-300">Ảnh 2D Plan (Mặt bằng)</div>
                                    <div className="text-[10px] mt-1 opacity-60 uppercase tracking-widest">PNG, JPG, WEBP</div>
                                </ImageDropzone>
                            )}
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">HƯỚNG MẶT ĐỨNG</label>
                            <div className="relative">
                                <select 
                                    value={elevationType}
                                    onChange={(e) => setElevationType(e.target.value)}
                                    className="w-full bg-[#34383f] border border-slate-700 rounded-lg p-2.5 text-sm text-white appearance-none outline-none focus:border-orange-500 shadow-inner"
                                >
                                    {elevationOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <Icon name="arrow-down-circle" className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">MÔ TẢ PHONG CÁCH</label>
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ví dụ: phong cách hiện đại, sử dụng mảng kính lớn và hệ lam gỗ..."
                                className="w-full bg-[#34383f] border border-slate-700 rounded-xl p-4 text-sm text-white resize-none h-32 focus:outline-none focus:border-orange-500 transition-all shadow-inner placeholder:text-slate-500"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 px-1">GỢI Ý PHONG CÁCH:</label>
                            <div className="grid grid-cols-2 gap-2">
                                {promptSuggestions.map((item) => (
                                    <button 
                                        key={item.label}
                                        onClick={() => setPrompt(item.value)}
                                        className="text-left px-3 py-2 bg-[#3a3f47] hover:bg-[#464c56] border border-slate-700/50 rounded-lg text-[10px] font-bold text-slate-300 transition-all active:scale-[0.98]"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('imageCount')}</label>
                                <div className="flex items-center justify-between bg-[#34383f] rounded-lg border border-slate-700 p-1">
                                    <button onClick={() => setImageCount(Math.max(1, imageCount - 1))} className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 text-white">-</button>
                                    <span className="text-sm font-bold text-white">{imageCount}</span>
                                    <button onClick={() => setImageCount(Math.min(4, imageCount + 1))} className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 text-white">+</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">KÍCH THƯỚC</label>
                                <select 
                                    value={imageSize} 
                                    onChange={(e) => setImageSize(e.target.value as ImageSize)} 
                                    className="w-full bg-[#34383f] border border-slate-700 rounded-lg p-2 text-sm text-white outline-none"
                                >
                                    <option value="1K">1K</option>
                                    <option value="2K">2K</option>
                                    <option value="4K">4K</option>
                                </select>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading || !sourceImage}
                            className="w-full py-4 bg-[#8b8b8b] hover:bg-[#a1a1a1] text-[#1a1a1a] rounded-xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 shadow-xl mt-4"
                        >
                            <Icon name="sparkles" className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            {isLoading ? 'Đang thực hiện...' : 'THỰC HIỆN'}
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-7 bg-[#2a2d33] border border-slate-700/50 rounded-xl p-6 flex flex-col gap-5 shadow-2xl h-[85vh]">
                    <h3 className="text-white text-sm font-black uppercase tracking-widest border-b border-white/5 pb-3">2. KẾT QUẢ</h3>
                    
                    <div className="flex-grow bg-[#1c1c1c] rounded-lg border border-slate-700 flex items-center justify-center p-4 relative group overflow-hidden shadow-inner">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-4 animate-pulse">
                                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                                <p className="text-orange-500 font-black text-xs uppercase tracking-widest">Đang khởi tạo mặt đứng...</p>
                            </div>
                        ) : selectedImage ? (
                            <div className="relative w-full h-full flex items-center justify-center animate-fade-in">
                                <img src={selectedImage} className="max-w-full max-h-full object-contain rounded shadow-2xl" />
                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                    <a href={selectedImage} download={`elevation-${Date.now()}.png`} className="p-3 bg-orange-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                                        <Icon name="download" className="w-6 h-6" />
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center max-w-xs space-y-4 opacity-40">
                                <Icon name="camera" className="w-16 h-16 mx-auto text-slate-600" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] leading-relaxed">
                                    KẾT QUẢ SẼ XUẤT HIỆN Ở ĐÂY SAU KHI BẠN THỰC HIỆN TÁC VỤ.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
