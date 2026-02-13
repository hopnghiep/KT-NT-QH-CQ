
import React, { useState, useEffect } from 'react';
import type { HistoryItem, SourceImage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { generateImages } from '../services/geminiService';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl } from '../utils';

interface SectionTo3DCreatorProps {
    onBack: () => void;
    addImageToLibrary: (imageDataUrl: string) => Promise<void>;
    addHistoryItem: (item: Omit<HistoryItem, 'id'>) => Promise<void>;
}

export const SectionTo3DCreator: React.FC<SectionTo3DCreatorProps> = ({ onBack, addImageToLibrary, addHistoryItem }) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();

    const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
    const [prompt, setPrompt] = useState('');
    const [sectionType, setSectionType] = useState('Mặt cắt phối cảnh 3D');
    const [citation, setCitation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const sectionTypeOptions = [
        "Mặt cắt phối cảnh 3D",
        "Mặt cắt đứng 2D (Dọc/Ngang)",
        "Mặt cắt AXO kỹ thuật (Technical Axonometric)",
        "Mặt cắt AXO phối cảnh (Rendered Axonometric)",
        "Mặt cắt AXO phối cảnh - xoay 45 độ",
        "Mặt cắt AXO phối cảnh - xoay 90 độ",
        "Mặt cắt AXO phối cảnh - xoay 135 độ",
        "Mặt cắt AXO phối cảnh - xoay 180 độ",
        "Mặt cắt AXO phối cảnh - xoay 225 độ",
        "Mặt cắt AXO phối cảnh - xoay 270 độ"
    ];

    const promptSuggestions = [
        { label: "Hiện đại & Sang trọng", value: "phong cách hiện đại, sang trọng, vật liệu cao cấp, ánh sáng ấm áp" },
        { label: "Tối giản & Wabi-sabi", value: "phong cách tối giản Wabi-sabi, vật liệu tự nhiên, tông màu đất, ánh sáng dịu" },
        { label: "Indochine (Đông Dương)", value: "phong cách Indochine, họa tiết truyền thống, gỗ tối màu, gạch bông" },
        { label: "Tân cổ điển", value: "phong cách tân cổ điển (neoclassic), phào chỉ tinh tế, nội thất cổ điển, ánh sáng chùm" },
        { label: "Sơ đồ (Diagrammatic)", value: "phong cách sơ đồ phân tích (diagrammatic), nét vẽ sạch sẽ, màu sắc phân khu công năng" }
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
            const basePrompt = t('sectionTo3dPrompt');
            const finalPrompt = `${basePrompt}. Loại mặt cắt: ${sectionType}. ${citation ? `Ghi chú trích dẫn: ${citation}.` : ''} Yêu cầu chi tiết: ${prompt || 'Dựng mặt cắt 3D đầy đủ vật dụng và ánh sáng chuyên nghiệp'}`;

            const results = await generateImages(
                sourceImage,
                finalPrompt,
                1,
                null,
                '16:9',
                language as 'vi' | 'en',
                undefined,
                'gemini-3-pro-image-preview',
                '1K'
            );

            if (results.length > 0) {
                setGeneratedImages(results);
                setSelectedImage(results[0]);
                results.forEach(img => addImageToLibrary(img));
                await addHistoryItem({
                    tab: 'sectionTo3d',
                    sourceImage,
                    referenceImage: null,
                    prompt: `[3D Section] ${prompt || sectionType}`,
                    negativePrompt: '',
                    imageCount: 1,
                    generatedImages: results,
                    generatedPrompts: null,
                });
            } else {
                alert(t('alertGenerationFailed'));
            }
        } catch (error) {
            console.error("Section generation failed:", error);
            alert(t('alertGenerationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in text-left">
            {/* Header Section */}
            <div className="mb-6">
                <h2 className="text-white text-xl font-black uppercase tracking-tight">TẠO MẶT CẮT KHÔNG GIAN TỪ 2D PLAN</h2>
                <p className="text-slate-400 text-sm mt-1 font-medium">Từ ảnh 2D plan tạo ra ảnh mặt cắt không gian 3D có đầy đủ vật dụng và có thể thêm chữ trích dẫn.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow pb-12">
                {/* 1. DỮ LIỆU ĐẦU VÀO */}
                <div className="lg:col-span-5 bg-[#2a2d33] border border-slate-700/50 rounded-xl p-6 flex flex-col gap-5 shadow-2xl overflow-y-auto thin-scrollbar max-h-[85vh]">
                    <h3 className="text-white text-sm font-black uppercase tracking-widest border-b border-white/5 pb-3">1. DỮ LIỆU ĐẦU VÀO</h3>
                    
                    <div className="space-y-5">
                        {/* Image Upload */}
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
                                    <div className="text-sm font-bold text-slate-300">Ảnh 2D Plan (có đánh dấu mặt cắt)</div>
                                    <div className="text-[10px] mt-1 opacity-60 uppercase tracking-widest">PNG, JPG, WEBP</div>
                                </ImageDropzone>
                            )}
                        </div>

                        {/* Prompt Description */}
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ví dụ: mặt cắt qua phòng khách, phong cách hiện đại, ánh sáng ban ngày, vật liệu gỗ và bê tông..."
                            className="w-full bg-[#34383f] border border-slate-700 rounded-xl p-4 text-sm text-white resize-none h-32 focus:outline-none focus:border-orange-500 transition-all shadow-inner placeholder:text-slate-500"
                        />

                        {/* Section Type */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">LOẠI MẶT CẮT</label>
                            <div className="relative">
                                <select 
                                    value={sectionType}
                                    onChange={(e) => setSectionType(e.target.value)}
                                    className="w-full bg-[#34383f] border border-slate-700 rounded-lg p-2.5 text-sm text-white appearance-none outline-none focus:border-orange-500 shadow-inner"
                                >
                                    {sectionTypeOptions.map((opt) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <Icon name="arrow-down-circle" className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                            </div>
                        </div>

                        {/* Citation */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">CHỮ TRÍCH DẪN (TÙY CHỌN)</label>
                            <input 
                                type="text"
                                value={citation}
                                onChange={(e) => setCitation(e.target.value)}
                                placeholder="Ví dụ: MẶT CẮT A-A"
                                className="w-full bg-[#34383f] border border-slate-700 rounded-lg p-2.5 text-sm text-white outline-none focus:border-orange-500 shadow-inner placeholder:text-slate-500"
                            />
                        </div>

                        {/* Suggestions */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 px-1">GỢI Ý PROMPT:</label>
                            <div className="flex flex-col gap-2">
                                {promptSuggestions.map((item) => (
                                    <button 
                                        key={item.label}
                                        onClick={() => setPrompt(item.value)}
                                        className="w-full text-left px-4 py-3 bg-[#3a3f47] hover:bg-[#464c56] border border-slate-700/50 rounded-lg text-xs font-bold text-slate-200 transition-all active:scale-[0.98] shadow-sm"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Execute Button */}
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

                {/* 2. KẾT QUẢ */}
                <div className="lg:col-span-7 bg-[#2a2d33] border border-slate-700/50 rounded-xl p-6 flex flex-col gap-5 shadow-2xl h-[85vh]">
                    <h3 className="text-white text-sm font-black uppercase tracking-widest border-b border-white/5 pb-3">2. KẾT QUẢ</h3>
                    
                    <div className="flex-grow bg-[#1c1c1c] rounded-lg border border-slate-700 flex items-center justify-center p-4 relative group overflow-hidden shadow-inner">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-4 animate-pulse">
                                <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                                <p className="text-orange-500 font-black text-xs uppercase tracking-widest">Đang khởi tạo...</p>
                            </div>
                        ) : selectedImage ? (
                            <div className="relative w-full h-full flex items-center justify-center animate-fade-in">
                                <img src={selectedImage} className="max-w-full max-h-full object-contain rounded shadow-2xl" />
                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                    <a href={selectedImage} download={`section-3d-${Date.now()}.png`} className="p-3 bg-orange-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform">
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
            
            {/* Bottom Utility Bar */}
            <div className="flex justify-end p-4">
                <button 
                    onClick={() => { if(window.confirm('Xóa toàn bộ lịch sử?')) setGeneratedImages([]); }}
                    className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-red-400 transition-colors"
                >
                    <Icon name="trash" className="w-3 h-3" />
                    Xóa toàn bộ lịch sử
                </button>
            </div>
        </div>
    );
};
