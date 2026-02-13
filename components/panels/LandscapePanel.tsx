
import React, { useState, useEffect } from 'react';
import { Icon } from '../icons';
import { ImageDropzone } from '../ImageDropzone';
import { generatePromptFromImage, generatePromptFromKeywords } from '../../services/geminiService';
import { sourceImageToDataUrl } from '../../utils';
import { ASPECT_RATIO_OPTIONS } from '../../constants';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { translations } from '../../locales/translations';
import { ExpandableTextarea, PromptInput, AppLinksManager } from '../shared/ControlCommon';
import type { SourceImage, ImageSize } from '../../types';

export const LandscapePanel: React.FC<any> = ({
    sourceImage, setSourceImage, referenceImage, setReferenceImage, prompt, setPrompt,
    imageCount, setImageCount, aspectRatio, setAspectRatio, handleSourceImageUpload,
    imageSize, setImageSize, onRefreshPrompt
}) => {
    const { language, t } = useLanguage();
    const { theme } = useTheme();
    const {
        landscapeTypes, landscapeStyles, ASPECT_RATIO_LABELS
    } = (translations[language] as any).constants;
    
    const [selectedLandscapeType, setSelectedLandscapeType] = useState(landscapeTypes[0]?.value || '');
    const [selectedLandscapeStyle, setSelectedLandscapeStyle] = useState(landscapeStyles[0]?.value || '');
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

    // Xây dựng prompt landscape chuyên sâu
    useEffect(() => {
        if (!prompt || prompt === t('promptInitial') || prompt === '') {
            updateFinalPrompt(selectedLandscapeType, selectedLandscapeStyle);
        }
    }, [selectedLandscapeType, selectedLandscapeStyle]);

    const updateFinalPrompt = (typeVal: string, styleVal: string) => {
        const typeLabel = landscapeTypes.find((t: any) => t.value === typeVal)?.display || 'Landscape';
        const styleLabel = landscapeStyles.find((s: any) => s.value === styleVal)?.display || 'Realistic';
        
        const engineeredTemplate = t('landscapePrompt')
            .replace('{0}', styleVal)
            .replace('{1}', typeVal);
        
        setPrompt(engineeredTemplate);
    };

    const handleGeneratePrompt = async () => {
        if (!sourceImage) {
            alert(t('alertUploadSource'));
            return;
        }
        setIsGeneratingPrompt(true);
        try {
            const newPrompt = await generatePromptFromImage(sourceImage, language, 'exterior');
            setPrompt(newPrompt);
        } catch (error) {
            alert(t('alertGenerationFailed'));
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    return (
        <div className="space-y-6 text-left">
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h3 className={`font-semibold ${theme.textMain}`}>1. {t('uploadImage')}</h3>
                    <a 
                        href="https://www.pinterest.com/search/pins/?q=landscape%20architecture%20visualization" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                    >
                        <Icon name="pinterest" className="w-3.5 h-3.5 text-[#E60023]" />
                        {t('findOnPinterest')}
                    </a>
                </div>
                <p className={`text-xs ${theme.textSub} -mt-2 mb-3`}>{t('handDrawnHint')}</p>
                {sourceImage ? (
                  <div className='space-y-3'>
                      <ImageDropzone onImageUpload={handleSourceImageUpload} className="cursor-pointer rounded-lg">
                        <div className='bg-black/30 rounded-lg p-2'>
                            <img src={sourceImageToDataUrl(sourceImage)} alt="Source" className="w-full h-auto object-contain rounded" />
                        </div>
                      </ImageDropzone>
                      <button onClick={() => setSourceImage(null)} className='text-red-400 hover:text-red-500 text-sm px-3 py-1.5 rounded-md hover:bg-red-500/10'>{t('delete')}</button>
                  </div>
                ) : (
                  <ImageDropzone onImageUpload={handleSourceImageUpload} className={`w-full h-40 border-2 border-dashed ${theme.border} rounded-lg flex items-center justify-center text-center ${theme.textSub} text-sm cursor-pointer`}>
                      <div><p>{t('dropzoneHint')}</p><p className="text-xs mt-1 opacity-70">{t('dropzoneFormats')}</p></div>
                  </ImageDropzone>
                )}
                <AppLinksManager />
            </section>

            <section className="space-y-3">
                <h3 className={`font-semibold ${theme.textMain} text-xs uppercase tracking-wider`}>2. {t('chooseGoal')}</h3>
                
                <div>
                    <label className={`block text-[10px] font-black uppercase text-slate-500 mb-1 px-1`}>{t('landscapeType')}</label>
                    <select 
                        value={selectedLandscapeType} 
                        onChange={(e) => setSelectedLandscapeType(e.target.value)}
                        className={`w-full ${theme.inputBg} ${theme.textMain} p-2.5 rounded-md text-sm border ${theme.border} outline-none focus:ring-1 focus:ring-orange-500 appearance-none`}
                        style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}
                    >
                        {landscapeTypes.map((type: any) => <option key={type.value} value={type.value}>{type.display}</option>)}
                    </select>
                </div>

                <div>
                    <label className={`block text-[10px] font-black uppercase text-slate-500 mb-1 px-1`}>{t('landscapeStyle')}</label>
                    <select 
                        value={selectedLandscapeStyle} 
                        onChange={(e) => setSelectedLandscapeStyle(e.target.value)}
                        className={`w-full ${theme.inputBg} ${theme.textMain} p-2.5 rounded-md text-sm border ${theme.border} outline-none focus:ring-1 focus:ring-orange-500 appearance-none`}
                        style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}
                    >
                        {landscapeStyles.map((style: any) => <option key={style.value} value={style.value}>{style.display}</option>)}
                    </select>
                </div>
            </section>

            <section>
                <PromptInput 
                    prompt={prompt} 
                    setPrompt={setPrompt} 
                    placeholder="..." 
                    label="3. Prompt"
                    onRefresh={onRefreshPrompt}
                />
                <button 
                    onClick={handleGeneratePrompt} 
                    disabled={!sourceImage || isGeneratingPrompt}
                    className={`mt-3 w-full flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-lg ${theme.buttonSecondary} text-xs disabled:opacity-50`}
                >
                    <Icon name="sparkles" className={`w-4 h-4 ${isGeneratingPrompt ? 'animate-spin' : ''}`} />
                    {isGeneratingPrompt ? t('generating') : t('generateFromImage')}
                </button>
            </section>

            <section className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                <div>
                    <h3 className={`font-semibold ${theme.textMain} text-xs mb-2 uppercase`}>{t('imageCount')}</h3>
                    <div className={`flex items-center justify-between ${theme.inputBg} rounded-md p-1 border ${theme.border}`}>
                        <button onClick={() => setImageCount((c: number) => Math.max(1, c - 1))} className={`px-2 py-1 rounded font-bold ${theme.buttonSecondary}`}>-</button>
                        <span className={`font-semibold ${theme.textMain}`}>{imageCount}</span>
                        <button onClick={() => setImageCount((c: number) => Math.min(4, c + 1))} className={`px-2 py-1 rounded font-bold ${theme.buttonSecondary}`}>+</button>
                    </div>
                </div>
                <div>
                    <h3 className={`font-semibold ${theme.textMain} text-xs mb-2 uppercase`}>{t('imageSize')}</h3>
                    <select 
                        value={imageSize} 
                        onChange={(e) => setImageSize(e.target.value as ImageSize)} 
                        className={`w-full ${theme.inputBg} ${theme.textMain} p-2 rounded-md text-xs border ${theme.border} outline-none appearance-none`}
                        style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.5rem center/1.5em 1.5em no-repeat`}}
                    >
                        <option value="1K">1K</option>
                        <option value="2K">2K</option>
                        <option value="4K">4K</option>
                    </select>
                </div>
            </section>
        </div>
    );
};
