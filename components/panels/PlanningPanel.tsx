
import React, { useState, useEffect } from 'react';
import { Icon } from '../icons';
import { ImageDropzone } from '../ImageDropzone';
import { generatePromptFromImage, generatePromptFromKeywords } from '../../services/geminiService';
import { sourceImageToDataUrl, padImageToAspectRatio } from '../../utils';
import { ASPECT_RATIO_OPTIONS } from '../../constants';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { translations } from '../../locales/translations';
import { ExpandableTextarea, PromptInput, AppLinksManager } from '../shared/ControlCommon';
import type { SourceImage, ImageSize } from '../../types';

export const PlanningPanel: React.FC<any> = ({
    sourceImage, setSourceImage, referenceImage, setReferenceImage, prompt, setPrompt,
    imageCount, setImageCount, aspectRatio, setAspectRatio, handleSourceImageUpload,
    imageSize, setImageSize, aiModel, onTabChange, activeTab, onRefreshPrompt, handleGeneration, isLoading
}) => {
    const { language, t } = useLanguage();
    const { theme } = useTheme();
    const {
        planningObjects, planningStyles, planningStructures, planningContexts, planningLightings, ASPECT_RATIO_LABELS
    } = (translations[language] as any).constants;
    
    const [selectedCategory, setSelectedCategory] = useState<'đô thị' | 'công viên' | 'resort'>('đô thị');
    const [customSpace, setCustomSpace] = useState(() => localStorage.getItem('aicomplex_custom_space_planning') || '');
    const [savedSpaces, setSavedSpaces] = useState<string[]>(() => JSON.parse(localStorage.getItem('aicomplex_saved_spaces_planning') || '[]'));
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [isGeneratingPromptFromText, setIsGeneratingPromptFromText] = useState(false);
    const [isProcessingReference, setIsProcessingReference] = useState(false);
    
    const imageType = 'planning';

    useEffect(() => {
        localStorage.setItem('aicomplex_custom_space_planning', customSpace);
    }, [customSpace]);

    useEffect(() => {
        localStorage.setItem('aicomplex_saved_spaces_planning', JSON.stringify(savedSpaces));
    }, [savedSpaces]);

    const getPinterestLink = (isReference: boolean = false) => {
        let query = "";
        if (customSpace.trim()) {
            query = `${customSpace.trim()} planning ${isReference ? 'photography' : 'sketch'}`;
        } else {
            const queries: Record<string, string> = {
                'đô thị': "modern urban planning master plan visualization",
                'công viên': "landscape architecture park design masterplan",
                'resort': "luxury resort architecture master plan visualization"
            };
            query = queries[selectedCategory] || (isReference ? "urban planning visualization birdseye" : "urban planning masterplan drawing");
        }
        return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
    };

    const handleSaveSpace = () => {
        if (customSpace.trim() && !savedSpaces.includes(customSpace.trim())) {
            setSavedSpaces([customSpace.trim(), ...savedSpaces].slice(0, 15));
        }
    };

    const handleDeleteSavedSpace = (e: React.MouseEvent, space: string) => {
        e.stopPropagation();
        setSavedSpaces(savedSpaces.filter(s => s !== space));
    };

    const handleGeneratePrompt = async () => {
        if (!sourceImage) {
            alert(t('alertUploadSource'));
            return;
        }
        setIsGeneratingPrompt(true);
        try {
            const newPrompt = await generatePromptFromImage(sourceImage, language, imageType);
            setPrompt(newPrompt);
        } catch (error) {
            alert(t('alertGenerationFailed'));
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    const handleGeneratePromptFromKeywords = async () => {
        if (!prompt) {
            alert(t('alertEnterPrompt'));
            return;
        }
        setIsGeneratingPromptFromText(true);
        try {
            const newPrompt = await generatePromptFromKeywords(prompt, language, imageType);
            setPrompt(newPrompt);
        } catch (error) {
            alert(t('alertGenerationFailed'));
        } finally {
            setIsGeneratingPromptFromText(false);
        }
    };

    const handleReferenceImageUpload = async (newReferenceImage: SourceImage) => {
        if (!sourceImage) {
            setReferenceImage(newReferenceImage);
            return;
        }
        setIsProcessingReference(true);
        try {
            const sourceImg = new Image();
            sourceImg.src = sourceImageToDataUrl(sourceImage);
            await new Promise<void>((resolve, reject) => {
                sourceImg.onload = () => resolve();
                sourceImg.onerror = reject;
            });
            const targetAspectRatio = sourceImg.naturalWidth / sourceImg.naturalHeight;
            const paddedImage = await padImageToAspectRatio(newReferenceImage, targetAspectRatio);
            setReferenceImage(paddedImage);
        } catch (error) {
            console.error("Failed to pad reference image:", error);
            alert("Could not process reference image. Using original.");
            setReferenceImage(newReferenceImage);
        } finally {
            setIsProcessingReference(false);
        }
    };

    const handlePromptSelect = (selectedPrompt: string, categoryPrompts: string[]) => {
        if (!selectedPrompt) return;
        setPrompt((currentPrompt: string) => {
            let existingPrompt = categoryPrompts.find(p => currentPrompt.includes(p));
            let newPrompt = currentPrompt;
            if (existingPrompt) newPrompt = newPrompt.replace(existingPrompt, selectedPrompt);
            else newPrompt = newPrompt.trim() === '' ? selectedPrompt : `${newPrompt} ${selectedPrompt}`;
            return newPrompt;
        });
    };
    
    return (
        <div className="space-y-6 text-left flex flex-col h-full overflow-hidden">
            <div className="space-y-4 flex-shrink-0">
                {/* 1. Category Switcher */}
                <div className="flex bg-[#1c222d] p-1 rounded-lg border border-white/5">
                    <button 
                        onClick={() => onTabChange('create')} 
                        className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-lg transition-all text-slate-400 hover:text-white`}
                    >
                        Kiến trúc
                    </button>
                    <button 
                        onClick={() => onTabChange('interior')} 
                        className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-lg transition-all text-slate-400 hover:text-white`}
                    >
                        Nội thất
                    </button>
                    <button 
                        className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-lg transition-all bg-orange-600 text-white`}
                    >
                        Quy hoạch
                    </button>
                </div>

                {/* 2. Planning Sub-Categories */}
                <div className="flex gap-2">
                    {['đô thị', 'công viên', 'resort'].map((cat) => (
                        <button 
                            key={cat}
                            onClick={() => setSelectedCategory(cat as any)}
                            className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-lg border transition-all ${selectedCategory === cat ? 'bg-orange-600 text-white border-orange-500 shadow-md' : 'bg-[#2a2d33] text-slate-400 border-white/5 hover:text-slate-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* 3. Custom Space Area */}
                <div className="p-3.5 rounded-xl border border-white/10 bg-black/10">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-[11px] uppercase tracking-wider font-black text-slate-500 px-1">THỂ LOẠI / KHÔNG GIAN YÊU CẦU</label>
                    </div>
                    <textarea 
                        value={customSpace}
                        onChange={(e) => setCustomSpace(e.target.value)}
                        placeholder="Ví dụ: Biệt thự vườn, chung cư tân cổ điển, cafe indochine..."
                        className="w-full bg-[#171a1f] border border-white/5 rounded-lg p-3 text-xs text-white h-16 resize-none focus:outline-none focus:border-orange-500 shadow-inner"
                    />
                </div>

                {/* 4. Image Upload 1 */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="font-black text-xs uppercase tracking-widest text-white px-1">1. Tải ảnh lên (Tùy chọn)</h3>
                        <a href={getPinterestLink(false)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-black text-red-500 hover:opacity-80 transition-opacity uppercase tracking-tighter">
                            <Icon name="pinterest" className="w-3 h-3" /> tìm trên pinterest
                        </a>
                    </div>
                    <p className="text-[10px] text-slate-500 -mt-2 px-1 leading-tight">Ưu tiên ảnh vẽ tay, ảnh sketchup không bóng đổ và bao cảnh</p>
                    {sourceImage ? (
                        <div className='relative group aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 p-2'>
                            <img src={sourceImageToDataUrl(sourceImage)} alt="Source" className="w-full h-full object-contain" />
                            <button onClick={() => setSourceImage(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Icon name="trash" className="w-4 h-4" /></button>
                        </div>
                    ) : (
                        <ImageDropzone onImageUpload={handleSourceImageUpload} className="w-full h-32 border-2 border-dashed border-white/10 bg-[#1a1e25] rounded-xl flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 cursor-pointer">
                            <p className="text-[11px] font-bold">Kéo thả, dán (Ctrl+V), hoặc click</p>
                            <p className="text-[10px] mt-1 uppercase tracking-tighter opacity-60">PNG, JPG, WEBP, PDF</p>
                        </ImageDropzone>
                    )}
                    <div className="flex gap-2">
                        <button onClick={() => window.open('https://pinterest.com', '_blank')} className="flex-1 py-2 bg-[#2a2d33] rounded-lg text-[10px] font-black uppercase text-white hover:bg-[#343842] flex items-center justify-center gap-1.5 border border-white/5"><Icon name="pinterest" className="w-3.5 h-3.5" /> Pinterest</button>
                        <button onClick={() => window.open('https://archdaily.com', '_blank')} className="flex-1 py-2 bg-[#2a2d33] rounded-lg text-[10px] font-black uppercase text-white hover:bg-[#343842] flex items-center justify-center gap-1.5 border border-white/5"><Icon name="globe" className="w-3.5 h-3.5" /> ArchDaily</button>
                    </div>
                    <button className="w-max px-4 py-1.5 border border-dashed border-slate-600 rounded-lg text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">+ Thêm link website</button>
                </div>

                {/* 5. Image Upload 2 */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-xs uppercase tracking-widest text-white px-1">2. Ảnh tham chiếu (Style)</h3>
                        <a href={getPinterestLink(true)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-black text-red-500 hover:opacity-80 transition-opacity uppercase tracking-tighter">
                            <Icon name="pinterest" className="w-3 h-3" /> tìm trên pinterest
                        </a>
                    </div>
                    <p className="text-[10px] text-slate-500 -mt-2 px-1 leading-tight">AI sẽ lấy cảm hứng về phong cách, ánh sáng, bối cảnh và vật liệu.</p>
                    {referenceImage ? (
                        <div className="relative group aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 p-2">
                            <img src={sourceImageToDataUrl(referenceImage)} alt="Reference" className="w-full h-full object-contain" />
                            <button onClick={() => setReferenceImage(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Icon name="trash" className="w-4 h-4" /></button>
                        </div>
                    ) : (
                        <ImageDropzone onImageUpload={handleReferenceImageUpload} className="w-full h-24 border-2 border-dashed border-white/10 bg-[#1a1e25] rounded-xl flex items-center justify-center text-center text-slate-500 hover:bg-white/5 cursor-pointer">
                            <p className="text-[10px] font-bold">Kéo thả, dán (Ctrl+V), hoặc click</p>
                        </ImageDropzone>
                    )}
                </div>

                {/* 6. Prompt Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-white tracking-widest">3. PROMPT</span>
                            <div className="flex gap-1.5 ml-2">
                                <button className="p-1.5 text-slate-500 hover:text-white transition-colors" title="Bookmark"><Icon name="bookmark" className="w-4 h-4"/></button>
                                <button className="p-1.5 text-slate-500 hover:text-orange-500 transition-colors" title="Magic"><Icon name="sparkles" className="w-4 h-4"/></button>
                                <button onClick={onRefreshPrompt} className="p-1.5 text-slate-500 hover:text-blue-500 transition-colors" title="Refresh"><Icon name="arrow-path" className="w-4 h-4"/></button>
                                <button className="p-1.5 text-slate-500 hover:text-green-500 transition-colors" title="Copy"><Icon name="clipboard" className="w-4 h-4"/></button>
                                <button className="p-1.5 text-slate-500 hover:text-amber-500 transition-colors" title="Upload"><Icon name="arrow-up-tray" className="w-4 h-4"/></button>
                                <button onClick={() => setPrompt('')} className="p-1.5 text-slate-500 hover:text-red-500 transition-colors" title="Trash"><Icon name="trash" className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-[#171a1f] border border-white/10 rounded-xl p-4 text-xs text-white h-24 resize-none focus:outline-none focus:border-orange-500 shadow-inner font-medium leading-relaxed"
                    />
                    
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-tighter px-1">Hoặc chọn prompt có sẵn để thêm vào:</p>
                        <select onChange={(e) => handlePromptSelect(e.target.value, planningObjects)} value="" className="w-full bg-[#2a2d33] border border-white/5 rounded-lg p-2.5 text-[11px] text-slate-300 outline-none focus:border-orange-500 appearance-none shadow-sm" style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.75rem center/1.5em 1.5em no-repeat`}}>
                            <option value="" disabled>Đối tượng</option>
                            {planningObjects.map((p: string) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select onChange={(e) => handlePromptSelect(e.target.value, planningStyles)} value="" className="w-full bg-[#2a2d33] border border-white/5 rounded-lg p-2.5 text-[11px] text-slate-300 outline-none focus:border-orange-500 appearance-none shadow-sm" style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.75rem center/1.5em 1.5em no-repeat`}}>
                            <option value="" disabled>Phong cách</option>
                            {planningStyles.map((p: string) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select onChange={(e) => handlePromptSelect(e.target.value, planningStructures)} value="" className="w-full bg-[#2a2d33] border border-white/5 rounded-lg p-2.5 text-[11px] text-slate-300 outline-none focus:border-orange-500 appearance-none shadow-sm" style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.75rem center/1.5em 1.5em no-repeat`}}>
                            <option value="" disabled>Công trình</option>
                            {planningStructures.map((p: string) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select onChange={(e) => handlePromptSelect(e.target.value, planningContexts)} value="" className="w-full bg-[#2a2d33] border border-white/5 rounded-lg p-2.5 text-[11px] text-slate-300 outline-none focus:border-orange-500 appearance-none shadow-sm" style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.75rem center/1.5em 1.5em no-repeat`}}>
                            <option value="" disabled>Bối cảnh</option>
                            {planningContexts.map((p: string) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <select onChange={(e) => handlePromptSelect(e.target.value, planningLightings)} value="" className="w-full bg-[#2a2d33] border border-white/5 rounded-lg p-2.5 text-[11px] text-slate-300 outline-none focus:border-orange-500 appearance-none shadow-sm" style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.75rem center/1.5em 1.5em no-repeat`}}>
                            <option value="" disabled>Ánh sáng</option>
                            {planningLightings.map((p: string) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <button 
                            onClick={handleGeneratePrompt} 
                            disabled={!sourceImage || isGeneratingPrompt}
                            className="flex items-center justify-center gap-2 py-3.5 bg-[#2a2d33] hover:bg-[#3d424e] border border-white/5 text-white font-black text-[10px] uppercase tracking-tighter rounded-xl transition-all disabled:opacity-50"
                        >
                            <Icon name="sparkles" className={`w-4 h-4 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                            Prompt từ ảnh
                        </button>
                        <button 
                            onClick={handleGeneratePromptFromKeywords} 
                            disabled={!prompt || isGeneratingPromptFromText}
                            className="flex items-center justify-center gap-2 py-3.5 bg-[#2a2d33] hover:bg-[#3d424e] border border-white/5 text-white font-black text-[10px] uppercase tracking-tighter rounded-xl transition-all disabled:opacity-50"
                        >
                            <Icon name="sparkles" className={`w-4 h-4 ${isGeneratingPromptFromText ? 'animate-spin' : ''}`} />
                            Prompt từ Prompt
                        </button>
                    </div>
                </div>

                {/* 7. Footer Sections (Ratio, Count, Presets, Execute) */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                    <div>
                        <h3 className="font-black text-xs uppercase tracking-widest text-white px-1 mb-1">4. Tỷ lệ khung hình</h3>
                        <p className="text-[10px] text-slate-500 mb-3 px-1 italic">Chỉ có hiệu lực khi không tải lên 'Ảnh gốc'.</p>
                        <div className="grid grid-cols-3 gap-2">
                            {ASPECT_RATIO_OPTIONS.map(ratio => (
                                <button 
                                    key={ratio} 
                                    onClick={() => setAspectRatio(ratio)} 
                                    className={`py-2 px-1 text-center rounded-lg border text-[10px] font-black uppercase transition-all ${aspectRatio === ratio ? 'bg-orange-600 text-white border-orange-500 shadow-md' : 'bg-[#2a2d33] text-slate-400 border-white/5 hover:border-slate-500'}`}
                                >
                                    {ASPECT_RATIO_LABELS[ratio]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-black text-xs uppercase tracking-widest text-white px-1 mb-3">5. Số lượng ảnh</h3>
                        <div className="flex items-center justify-between bg-[#171a1f] rounded-xl p-1.5 border border-white/10 shadow-inner">
                            <button onClick={() => setImageCount(Math.max(1, imageCount - 1))} className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 text-white font-black hover:bg-slate-700 transition-all">-</button>
                            <span className="text-sm font-black text-white">{imageCount}</span>
                            <button onClick={() => setImageCount(Math.min(10, imageCount + 1))} className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-800 text-white font-black hover:bg-slate-700 transition-all">+</button>
                        </div>
                    </div>

                    <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">PRESETS CỦA TÔI</h4>
                            <button className="text-[10px] font-black text-orange-400 hover:text-orange-300 uppercase tracking-tighter flex items-center gap-1">
                                <Icon name="bookmark" className="w-3.5 h-3.5" /> Lưu cấu hình
                            </button>
                        </div>
                        <div className="py-4 text-center border border-dashed border-white/5 rounded-lg">
                            <p className="text-[10px] font-bold text-slate-600 uppercase italic">Chưa có preset nào.</p>
                        </div>
                    </div>

                    <button 
                        onClick={handleGeneration}
                        disabled={isLoading || (!sourceImage && !prompt)}
                        className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white font-black py-4 px-4 rounded-xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:bg-slate-800 disabled:text-slate-600"
                    >
                        <Icon name="camera" className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="text-lg uppercase tracking-[0.2em]">Tạo Ảnh</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
