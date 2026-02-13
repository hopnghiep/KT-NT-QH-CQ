
import React, { useState } from 'react';
import type { SourceImage, HistoryItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl } from '../utils';
import { generateArchitecturalPrompts, analyzeCharacterImage } from '../services/geminiService';

interface PromptGeneratorViewProps {
    onBack: () => void;
    addImageToLibrary: (imageDataUrl: string) => Promise<void>;
    addHistoryItem: (item: Omit<HistoryItem, 'id'>) => Promise<void>;
    copyToClipboard: (text: string) => void;
}

export const PromptGeneratorView: React.FC<PromptGeneratorViewProps> = ({ 
    addImageToLibrary, 
    addHistoryItem,
    copyToClipboard
}) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();

    const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
    const [characterImage, setCharacterImage] = useState<SourceImage | null>(null);
    const [characterDescription, setCharacterDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedPrompts, setGeneratedPrompts] = useState<string | null>(null);
    const [isAnalyzingCharacter, setIsAnalyzingCharacter] = useState(false);

    const handleRefresh = () => {
        setSourceImage(null);
        setCharacterImage(null);
        setCharacterDescription('');
        setGeneratedPrompts(null);
        setIsLoading(false);
    };

    const handleCharacterUpload = async (img: SourceImage) => {
        setCharacterImage(img);
        setIsAnalyzingCharacter(true);
        try {
            // Tự động phân tích nhân vật để hỗ trợ tạo prompt nếu muốn
            const description = await analyzeCharacterImage(img, language as 'vi' | 'en');
            setCharacterDescription(prev => prev ? `${prev}\n${description}` : description);
        } catch (error) {
            console.error("Character analysis failed:", error);
        } finally {
            setIsAnalyzingCharacter(false);
        }
    };

    const handleGenerate = async () => {
        if (!sourceImage) {
            alert(t('alertNoSourceForPrompt'));
            return;
        }

        setIsLoading(true);
        setGeneratedPrompts(null);

        try {
            const contextText = characterDescription.trim() ? `\nNhân vật/Bối cảnh: ${characterDescription}` : "";
            const prompts = await generateArchitecturalPrompts(sourceImage, language, contextText);
            setGeneratedPrompts(prompts);
            
            await addHistoryItem({
                tab: 'prompt',
                sourceImage,
                sourceImage2: characterImage || null,
                referenceImage: null,
                prompt: "Phân tích prompt chuyên nghiệp song ngữ từ ảnh",
                negativePrompt: '',
                imageCount: 0,
                generatedImages: [],
                generatedPrompts: prompts,
            });
        } catch (error) {
            console.error("Prompt generation failed:", error);
            alert(t('alertGenerationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in text-left">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-[85vh]">
                
                {/* 1/3 Cột điều khiển trái */}
                <div className="lg:col-span-4 bg-[#1a1c22] p-5 flex flex-col gap-6 border-r border-white/5 shadow-2xl overflow-y-auto thin-scrollbar">
                    
                    {/* Toolbar trên cùng */}
                    <div className="flex justify-between items-center bg-[#252830] p-1.5 rounded-xl border border-white/5">
                        <div className="flex items-center gap-1">
                            <button className="p-2 rounded-lg text-slate-600 hover:text-white transition-all opacity-40">
                                <Icon name="arrow-uturn-left" className="w-5 h-5" />
                            </button>
                            <button className="p-2 rounded-lg text-slate-600 hover:text-white transition-all opacity-40">
                                <Icon name="arrow-uturn-right" className="w-5 h-5" />
                            </button>
                        </div>
                        <button 
                            onClick={handleRefresh}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black text-slate-300 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest"
                        >
                            <Icon name="arrow-path" className="w-4 h-4" />
                            LÀM MỚI
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Mục 1: Tải ảnh gốc */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white text-sm font-black uppercase tracking-tighter flex items-baseline gap-1">
                                    1. TẢI ẢNH LÊN ĐỂ PHÂN TÍCH
                                </h3>
                                <a href="https://pinterest.com" target="_blank" className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-red-500 transition-colors uppercase">
                                    <Icon name="pinterest" className="w-3.5 h-3.5 text-red-600" />
                                    tìm trên pinterest
                                </a>
                            </div>
                            
                            {sourceImage ? (
                                <div className="relative aspect-video bg-black/40 rounded-2xl overflow-hidden border border-white/10 p-2 shadow-inner group">
                                    <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-contain" />
                                    <button 
                                        onClick={() => setSourceImage(null)} 
                                        className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full transition-all shadow-lg z-10 opacity-0 group-hover:opacity-100"
                                    >
                                        <Icon name="trash" className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <ImageDropzone onImageUpload={setSourceImage} className="w-full h-32 border-2 border-dashed border-white/10 bg-[#252830]/50 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 hover:border-orange-500/30 transition-all cursor-pointer shadow-inner">
                                    <p className="text-xs font-black text-slate-400">Kéo thả, dán (Ctrl+V), hoặc click</p>
                                </ImageDropzone>
                            )}
                            <p className="mt-3 text-[10px] text-slate-500 font-medium leading-relaxed italic px-1">
                                AI sẽ phân tích ảnh và tạo ra 20 prompt nhiếp ảnh chuyên nghiệp song ngữ Anh - Việt.
                            </p>
                        </div>

                        {/* Mục 2: Nhân vật & Bối cảnh */}
                        <div>
                            <h3 className="text-white text-sm font-black uppercase tracking-tighter mb-4">
                                2. NHÂN VẬT & BỐI CẢNH (TÙY CHỌN)
                            </h3>
                            
                            <div className="space-y-4">
                                {characterImage ? (
                                    <div className="relative aspect-[16/6] bg-black/40 rounded-xl overflow-hidden border border-white/10 p-2 group">
                                        <img src={sourceImageToDataUrl(characterImage)} className="w-full h-full object-contain" />
                                        <button 
                                            onClick={() => setCharacterImage(null)} 
                                            className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full transition-all shadow-lg z-10 opacity-0 group-hover:opacity-100"
                                        >
                                            <Icon name="trash" className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <ImageDropzone onImageUpload={handleCharacterUpload} className="w-full h-20 border-2 border-dashed border-white/5 bg-[#252830]/30 rounded-2xl flex flex-col items-center justify-center text-center text-slate-600 hover:bg-white/5 transition-all cursor-pointer">
                                        <p className="text-[10px] font-black uppercase tracking-wider">Tải ảnh nhân vật</p>
                                    </ImageDropzone>
                                )}

                                <textarea 
                                    value={characterDescription}
                                    onChange={(e) => setCharacterDescription(e.target.value)}
                                    placeholder="Mô tả thêm về nhân vật hoặc yêu cầu bổ sung..."
                                    className="w-full bg-[#111317] border border-white/5 rounded-2xl p-4 text-xs text-slate-300 h-24 resize-none outline-none focus:border-orange-500/50 shadow-inner placeholder:text-slate-600 font-medium"
                                />
                            </div>
                        </div>

                        {/* Mục 3: Presets */}
                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">PRESETS CỦA TÔI</h4>
                                <button className="text-[10px] font-black text-orange-500 hover:text-orange-400 uppercase flex items-center gap-1 transition-colors">
                                    <Icon name="floppy" className="w-3.5 h-3.5" />
                                    Lưu cấu hình
                                </button>
                            </div>
                            <div className="py-2 px-1">
                                <p className="text-[10px] font-bold text-slate-700 italic">Chưa có preset nào được lưu.</p>
                            </div>
                        </div>

                        {/* Nút Tạo Prompt */}
                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading || !sourceImage}
                            className="w-full py-4 bg-[#3d4452] hover:bg-orange-600 text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-20 shadow-2xl rounded-2xl border border-white/5 h-16"
                        >
                            <Icon name="camera" className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                            Tạo Prompt
                        </button>
                    </div>
                </div>

                {/* 2/3 Vùng kết quả phải */}
                <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 shadow-2xl relative flex flex-col overflow-hidden rounded-r-3xl">
                    <div className="flex-grow flex flex-col p-8 md:p-12 overflow-hidden">
                        <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
                            <h3 className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-4">
                                <span className="w-2.5 h-2.5 bg-orange-600 rounded-full shadow-[0_0_15px_rgba(234,88,12,0.6)] animate-pulse"></span>
                                KẾT QUẢ PHÂN TÍCH PROMPT SONG NGỮ
                            </h3>
                            {generatedPrompts && (
                                <button 
                                    onClick={() => copyToClipboard(generatedPrompts)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-orange-600 text-white rounded-full text-[10px] font-black uppercase transition-all shadow-xl border border-white/10 hover:border-orange-500 active:scale-95"
                                >
                                    <Icon name="clipboard" className="w-4 h-4" />
                                    SAO CHÉP TOÀN BỘ
                                </button>
                            )}
                        </div>

                        <div className="flex-grow bg-black/50 rounded-[2.5rem] border border-white/5 shadow-inner p-10 overflow-y-auto thin-scrollbar relative group">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-center gap-8 animate-fade-in">
                                    <div className="relative">
                                        <div className="w-28 h-28 border-b-4 border-orange-600 rounded-full animate-spin shadow-2xl"></div>
                                        <Icon name="sparkles" className="w-12 h-12 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-white text-sm font-black uppercase tracking-[0.4em] animate-pulse">AI Đang phân tích phong cách & dịch thuật...</p>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">Quá trình này có thể mất vài giây</p>
                                    </div>
                                </div>
                            ) : generatedPrompts ? (
                                <div className="prose prose-invert max-w-none animate-fade-in">
                                    <div className="whitespace-pre-wrap text-slate-300 leading-loose text-base font-medium space-y-6">
                                        {generatedPrompts.split('\n').map((line, i) => (
                                            <p key={i} className="hover:text-white transition-colors cursor-text selection:bg-orange-500/30 p-2 rounded hover:bg-white/5 border-l-2 border-transparent hover:border-orange-500/50 pl-4">{line}</p>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-10">
                                    <Icon name="sparkles" className="w-32 h-32 text-slate-600 mb-8" />
                                    <p className="text-2xl font-black text-slate-500 uppercase tracking-[0.3em] leading-tight text-center">
                                        Danh sách prompt<br/>song ngữ Anh - Việt
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
