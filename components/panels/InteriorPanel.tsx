
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

export const InteriorPanel: React.FC<any> = ({
    sourceImage, setSourceImage, referenceImage, setReferenceImage, prompt, setPrompt,
    imageCount, setImageCount, aspectRatio, setAspectRatio, handleSourceImageUpload,
    imageSize, setImageSize, onTabChange, activeTab
}) => {
    const { language, t } = useLanguage();
    const { theme } = useTheme();
    const {
        interiorRoomTypes, interiorStyles, interiorLighting, ASPECT_RATIO_LABELS
    } = (translations[language] as any).constants;
    
    const [selectedReferenceCategory, setSelectedReferenceCategory] = useState<'building' | 'house' | 'villa'>('house');
    const [customSpace, setCustomSpace] = useState(() => localStorage.getItem('aicomplex_custom_space_interior') || '');
    const [savedSpaces, setSavedSpaces] = useState<string[]>(() => JSON.parse(localStorage.getItem('aicomplex_saved_spaces_interior') || '[]'));
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [isGeneratingPromptFromText, setIsGeneratingPromptFromText] = useState(false);
    const [isProcessingReference, setIsProcessingReference] = useState(false);
    const imageType = 'interior';

    useEffect(() => {
        localStorage.setItem('aicomplex_custom_space_interior', customSpace);
    }, [customSpace]);

    useEffect(() => {
        localStorage.setItem('aicomplex_saved_spaces_interior', JSON.stringify(savedSpaces));
    }, [savedSpaces]);

    const getPinterestLink = (isReference: boolean = false) => {
        let query = "";
        if (customSpace.trim()) {
            query = `${customSpace.trim()} interior design ${isReference ? 'photography' : 'sketch'}`;
        } else {
            const queries: Record<string, string> = {
                building: "modern office commercial interior design",
                house: "modern residential home interior design",
                villa: "luxury villa interior architecture"
            };
            query = queries[selectedReferenceCategory] || (isReference ? "interior design photography" : "interior sketch blueprint");
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
            else newPrompt = newPrompt.trim() === '' ? selectedPrompt : `${newPrompt}, ${selectedPrompt}`;
            return newPrompt;
        });
    };
    
    return (
        <div className="space-y-6">
            <section className="space-y-3 mb-6">
                {/* Điều hướng mục chính */}
                <div className="flex bg-[#2a2d33] p-1 rounded-lg border border-white/5">
                    <button 
                        onClick={() => onTabChange('create')} 
                        className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'create' ? 'text-orange-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        NGOẠI THẤT
                    </button>
                    <button 
                        onClick={() => onTabChange('interior')} 
                        className={`flex-1 py-2.5 text-[10px] font-black uppercase rounded-lg transition-all ${activeTab === 'interior' ? 'text-orange-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        NỘI THẤT
                    </button>
                </div>

                {/* Chọn đối tượng */}
                <div className="flex gap-2">
                    {['building', 'house', 'villa'].map((cat) => (
                        <button 
                            key={cat}
                            onClick={() => setSelectedReferenceCategory(cat as any)}
                            className={`flex-1 py-2.5 text-[11px] font-black uppercase rounded-lg border transition-all ${selectedReferenceCategory === cat ? 'text-orange-500 border-orange-500/50 bg-white/5 shadow-md' : 'bg-white/5 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </section>

            <section>
                <div className={`mb-5 p-3 rounded-lg border ${theme.border} bg-black/10`}>
                    <div className="flex justify-between items-center mb-2">
                        <label className={`block text-[10px] uppercase tracking-wider font-bold ${theme.textSub} px-1`}>{t('customSpaceLabel')}</label>
                        {customSpace.trim() && (
                            <button onClick={handleSaveSpace} className="text-[10px] font-bold text-orange-400 hover:text-orange-300 transition-colors uppercase flex items-center gap-1">
                                <Icon name="plus-circle" className="w-3 h-3" />
                                {t('saveSpace')}
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <ExpandableTextarea 
                            value={customSpace}
                            onChange={(e) => setCustomSpace(e.target.value)}
                            placeholder={t('customSpacePlaceholder')}
                            minHeight="h-[60px]"
                            expandedHeight="h-40"
                            className="w-full"
                        />
                        {customSpace && (
                            <button 
                                onClick={() => setCustomSpace('')}
                                className="absolute right-3 top-3 text-slate-500 hover:text-red-400 transition-colors"
                            >
                                <Icon name="x-circle" className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    
                    {savedSpaces.length > 0 && (
                        <div className="mt-4">
                            <p className={`text-[10px] font-bold ${theme.textSub} mb-2 uppercase border-b ${theme.border} pb-1`}>{t('savedSpacesLabel')}</p>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 thin-scrollbar">
                                {savedSpaces.map((space, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => setCustomSpace(space)}
                                        className={`group relative flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg text-[10px] cursor-pointer transition-all border ${customSpace === space ? 'bg-orange-600/20 border-orange-500 text-orange-400 font-bold' : `${theme.inputBg} ${theme.border} ${theme.textSub} hover:border-slate-500`}`}
                                    >
                                        <span className="truncate max-w-[120px]">{space}</span>
                                        <button 
                                            onClick={(e) => handleDeleteSavedSpace(e, space)} 
                                            className="ml-1 p-0.5 rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                                            title={t('delete')}
                                        >
                                            <Icon name="x-circle" className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mb-3">
                    <h3 className={`font-semibold ${theme.textMain}`}>1. {t('uploadImageOptional')}</h3>
                    <a 
                        href={getPinterestLink(false)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-white hover:opacity-80 transition-opacity"
                    >
                        <Icon name="pinterest" className="w-3.5 h-3.5 text-[#E60023]" />
                        {t('findOnPinterest')}
                    </a>
                </div>
                <p className={`text-xs ${theme.textSub} -mt-2 mb-3`}>{t('handDrawnHint')}</p>
                {sourceImage ? (
                  <div className='space-y-3'>
                      <ImageDropzone onImageUpload={handleSourceImageUpload} className="cursor-pointer rounded-lg"><div className='bg-black/30 rounded-lg p-2'><img src={sourceImageToDataUrl(sourceImage)} alt="Source" className="w-full h-auto object-contain rounded" /></div></ImageDropzone>
                      <button onClick={() => setSourceImage(null)} className='text-red-400 hover:text-red-500 text-sm px-3 py-1.5 rounded-md hover:bg-red-500/10'>{t('delete')}</button>
                  </div>
                ) : (
                  <ImageDropzone onImageUpload={handleSourceImageUpload} className={`w-full h-40 border-2 border-dashed ${theme.border} rounded-lg flex items-center justify-center text-center ${theme.textSub} text-sm cursor-pointer`}>
                      <div><p>{t('dropzoneHint')}</p><p className="text-xs mt-1 opacity-70">{t('dropzoneFormats')}</p></div>
                  </ImageDropzone>
                )}
                <AppLinksManager />
            </section>

            <section>
                <div className="flex justify-between items-center mb-2">
                  <h3 className={`font-semibold ${theme.textMain}`}>2. {t('referenceImage')}</h3>
                  <div className="flex items-center gap-3">
                      <a 
                          href={getPinterestLink(true)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] text-white hover:opacity-80 transition-opacity"
                      >
                          <Icon name="pinterest" className="w-3.5 h-3.5 text-[#E60023]" />
                          {t('findOnPinterest')}
                      </a>
                  </div>
                </div>
                <p className={`text-xs ${theme.textSub} mb-3`}>{t('referenceImageHelp')}</p>
                {isProcessingReference ? (
                    <div className={`w-full h-32 border-2 border-dashed ${theme.border} rounded-lg flex items-center justify-center text-center ${theme.textSub} text-sm`}>
                        <p>{t('processingImage')}</p>
                    </div>
                ) : referenceImage ? (
                  <div className="relative group">
                    <ImageDropzone onImageUpload={handleReferenceImageUpload} className="cursor-pointer rounded-lg"><div className='bg-black/30 rounded-lg p-2'><img src={sourceImageToDataUrl(referenceImage)} alt="Reference" className="w-full h-auto object-contain rounded" /></div></ImageDropzone>
                    <button onClick={() => setReferenceImage(null)} className="absolute top-3 right-3 bg-black/60 rounded-full text-white hover:bg-black/80 p-1 opacity-0 group-hover:opacity-100 z-10"><Icon name="x-circle" className="w-5 h-5" /></button>
                  </div>
                ) : <ImageDropzone onImageUpload={handleReferenceImageUpload} className={`w-full h-32 border-2 border-dashed ${theme.border} rounded-lg flex items-center justify-center text-center ${theme.textSub} text-sm cursor-pointer`}><p>{t('dropzoneHint')}</p></ImageDropzone>}
            </section>

            <section>
                <PromptInput 
                    prompt={prompt} 
                    setPrompt={setPrompt} 
                    placeholder={t('promptPlaceholder.create')} 
                    label="3. Prompt"
                />
                <div className="mt-3 space-y-2">
                  <p className={`text-xs ${theme.textSub} mb-1`}>{t('addFromPresets')}</p>
                  <select onChange={(e) => handlePromptSelect(e.target.value, interiorRoomTypes)} value="" className={`w-full ${theme.inputBg} ${theme.textMain} p-3 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none border ${theme.border}`} style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}><option value="" disabled>{t('roomType')}</option>{interiorRoomTypes.map((p: string) => <option key={p} value={p}>{p}</option>)}</select>
                  <select onChange={(e) => handlePromptSelect(e.target.value, interiorStyles)} value="" className={`w-full ${theme.inputBg} ${theme.textMain} p-3 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none border ${theme.border}`} style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}><option value="" disabled>{t('style')}</option>{interiorStyles.map((p: string) => <option key={p} value={p}>{p}</option>)}</select>
                  <select onChange={(e) => handlePromptSelect(e.target.value, interiorLighting)} value="" className={`w-full ${theme.inputBg} ${theme.textMain} p-3 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none border ${theme.border}`} style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}><option value="" disabled>{t('lighting')}</option>{interiorLighting.map((p: string) => <option key={p} value={p}>{p}</option>)}</select>
                </div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button 
                        onClick={handleGeneratePrompt} 
                        disabled={!sourceImage || isGeneratingPrompt || isGeneratingPromptFromText}
                        className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-lg ${theme.buttonSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Icon name="sparkles" className={`w-5 h-5 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                        {isGeneratingPrompt ? t('generating') : t('generateFromImage')}
                    </button>
                    <button 
                        onClick={handleGeneratePromptFromKeywords} 
                        disabled={!prompt || isGeneratingPromptFromText || isGeneratingPrompt}
                        className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-lg ${theme.buttonSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Icon name="sparkles" className={`w-5 h-5 ${isGeneratingPromptFromText ? 'animate-spin' : ''}`} />
                        {isGeneratingPromptFromText ? t('generating') : t('generateFromPromptText')}
                    </button>
                </div>
            </section>

             <section>
                <h3 className={`font-semibold ${theme.textMain} mb-2`}>4. {t('aspectRatio')}</h3>
                <p className={`text-xs ${theme.textSub} mb-3`}>{t('aspectRatioHelp')}</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                    {ASPECT_RATIO_OPTIONS.map(ratio => (
                        <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`py-2 px-2 text-center rounded-md border ${aspectRatio === ratio ? 'bg-orange-600 text-white font-semibold border-orange-500' : `${theme.inputBg} ${theme.textMain} hover:bg-white/10 ${theme.border}`}`}>{ASPECT_RATIO_LABELS[ratio]}</button>
                    ))}
                </div>
              </section>

              <section>
                  <h3 className={`font-semibold ${theme.textMain} mb-2`}>5. {t('imageCount')}</h3>
                  <div className={`flex items-center justify-between ${theme.inputBg} rounded-md p-2 border ${theme.border}`}>
                      <button onClick={() => setImageCount((c: number) => Math.max(1, c - 1))} className={`px-4 py-2 rounded text-xl font-bold ${theme.buttonSecondary} ${theme.textMain}`}>-</button>
                      <span className={`text-lg font-semibold ${theme.textMain}`}>{imageCount}</span>
                      <button onClick={() => setImageCount((c: number) => Math.min(10, c + 1))} className={`px-4 py-2 rounded text-xl font-bold ${theme.buttonSecondary} ${theme.textMain}`}>+</button>
                  </div>
              </section>
        </div>
    );
};
