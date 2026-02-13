
import React, { useState, useEffect } from 'react';
import type { ImageSize, HistoryItem, SourceImage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { generateImages } from '../services/geminiService';
import { translations } from '../locales/translations';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl } from '../utils';

interface BuildingSectionCreatorProps {
    onBack: () => void;
    addImageToLibrary: (imageDataUrl: string) => Promise<void>;
    addHistoryItem: (item: Omit<HistoryItem, 'id'>) => Promise<void>;
}

export const BuildingSectionCreator: React.FC<BuildingSectionCreatorProps> = ({ onBack, addImageToLibrary, addHistoryItem }) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    
    const currentLangData = (translations[language] || translations['vi']) as any;
    const planStylePrompts = (currentLangData.constants && currentLangData.constants.planStylePrompts) || [];

    const [floorCount, setFloorCount] = useState(1);
    const [hasMezzanine, setHasMezzanine] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState(planStylePrompts[0] || 'phong cách hiện đại');
    const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
    const [customReq, setCustomReq] = useState('');

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

    const handleGenerate = async () => {
        setIsLoading(true);
        setGeneratedImages([]);
        setSelectedImage(null);

        try {
            const sectionPromptTemplate = t('buildingSectionPrompt');
            const mezzanineText = hasMezzanine ? `(có tầng lửng)` : '';
            
            const finalPrompt = sectionPromptTemplate
                .replace('{0}', floorCount.toString())
                .replace('{1}', selectedStyle)
                .replace('{2}', `${mezzanineText}. ${customReq}`);
            
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
                    tab: 'utilities',
                    sourceImage: sourceImage,
                    referenceImage: null,
                    prompt: `[Building Section] ${floorCount} Flr ${mezzanineText} - ${selectedStyle}`,
                    negativePrompt: '',
                    imageCount,
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
        <div className={`${theme.panelBg} p-5 rounded-xl border ${theme.border} animate-fade-in`}>
            <div className="flex items-center gap-4 mb-8 border-b border-slate-700 pb-4">
                <button 
                    onClick={onBack} 
                    className="p-2.5 rounded-full bg-slate-800 hover:bg-orange-600/20 text-slate-300 hover:text-orange-400 transition-all duration-300 border border-slate-700 hover:border-orange-500/50 shadow-lg"
                    title={t('backToUtilities')}
                >
                    <Icon name="arrow-uturn-left" className="w-5 h-5" />
                </button>
                <div className="w-px h-8 bg-slate-700 mx-1"></div>
                <div className="flex items-center gap-4">
                    <Icon name="clipboard" className="w-8 h-8 text-orange-500" />
                    <div>
                        <h2 className={`text-2xl font-bold ${theme.textMain}`}>{t('buildingSectionTitle')}</h2>
                        <p className={`text-sm ${theme.textSub}`}>{t('buildingSectionDesc')}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-5 max-h-[75vh] overflow-y-auto thin-scrollbar pr-2">
                    <section>
                        <h3 className={`font-semibold ${theme.textMain} text-xs mb-3 uppercase tracking-wider`}>1. {t('upload2dPlan')} (Tùy chọn)</h3>
                        {sourceImage ? (
                            <div className='space-y-3'>
                                <ImageDropzone onImageUpload={setSourceImage} className="cursor-pointer rounded-lg">
                                    <div className='bg-black/30 rounded-lg p-2'>
                                        <img src={sourceImageToDataUrl(sourceImage)} alt="Plan" className="w-full h-auto object-contain rounded" />
                                    </div>
                                </ImageDropzone>
                                <button onClick={() => setSourceImage(null)} className='text-red-400 hover:text-red-500 text-xs px-3 py-1.5 rounded-md hover:bg-red-500/10'>{t('delete')}</button>
                            </div>
                        ) : (
                            <ImageDropzone onImageUpload={setSourceImage} className={`w-full h-32 border-2 border-dashed ${theme.border} rounded-lg flex items-center justify-center text-center ${theme.textSub} text-sm cursor-pointer`}>
                                <div><p>{t('dropzoneHint')}</p></div>
                            </ImageDropzone>
                        )}
                    </section>

                    <section className="p-3 bg-black/10 rounded-lg border border-slate-700/50">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className={`font-semibold ${theme.textMain} text-xs uppercase tracking-wider`}>{t('floorPlanFloors')}</h3>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    checked={hasMezzanine}
                                    onChange={(e) => setHasMezzanine(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-600 text-orange-600 focus:ring-orange-500 bg-slate-800"
                                />
                                <span className={`text-xs font-bold ${hasMezzanine ? 'text-orange-400' : 'text-slate-400'} group-hover:text-slate-200 transition-colors`}>
                                    {t('floorPlanMezzanine')}
                                </span>
                            </label>
                        </div>
                        <select 
                            value={floorCount} 
                            onChange={(e) => setFloorCount(Number(e.target.value))} 
                            className={`w-full ${theme.inputBg} ${theme.textMain} p-2.5 rounded-md text-sm border ${theme.border} outline-none focus:ring-1 focus:ring-orange-500 appearance-none`}
                        >
                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Floor' : 'Floors'}</option>)}
                        </select>
                    </section>

                    <section>
                        <h3 className={`font-semibold ${theme.textMain} text-xs mb-1.5 uppercase tracking-wider`}>{t('style')}</h3>
                        <select 
                            value={selectedStyle} 
                            onChange={(e) => setSelectedStyle(e.target.value)} 
                            className={`w-full ${theme.inputBg} ${theme.textMain} p-2.5 rounded-md text-sm border ${theme.border} outline-none focus:ring-1 focus:ring-orange-500 appearance-none`}
                        >
                            {planStylePrompts.map((p: string) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </section>

                    <section>
                        <h3 className={`font-semibold ${theme.textMain} text-xs mb-1.5 uppercase tracking-wider`}>{t('floorPlanCustomReq')}</h3>
                        <textarea 
                            value={customReq}
                            onChange={(e) => setCustomReq(e.target.value)}
                            placeholder={t('floorPlanCustomReqPlaceholder')}
                            className={`w-full ${theme.inputBg} ${theme.textMain} p-2.5 rounded-md text-sm border ${theme.border} h-20 resize-none outline-none focus:ring-1 focus:ring-orange-500`}
                        />
                    </section>

                    <section className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                        <div>
                            <h3 className={`font-semibold ${theme.textMain} text-xs mb-1.5 uppercase tracking-wider`}>{t('imageCount')}</h3>
                            <div className={`flex items-center justify-between ${theme.inputBg} rounded-md p-1 border ${theme.border}`}>
                                <button onClick={() => setImageCount(Math.max(1, imageCount - 1))} className={`px-2 py-1 rounded font-bold ${theme.buttonSecondary} text-xs`}>-</button>
                                <span className={`font-semibold ${theme.textMain} text-sm`}>{imageCount}</span>
                                <button onClick={() => setImageCount(Math.min(4, imageCount + 1))} className={`px-2 py-1 rounded font-bold ${theme.buttonSecondary} text-xs`}>+</button>
                            </div>
                        </div>
                        <div>
                            <h3 className={`font-semibold ${theme.textMain} text-xs mb-1.5 uppercase tracking-wider`}>{t('imageSize')}</h3>
                            <select 
                                value={imageSize} 
                                onChange={(e) => setImageSize(e.target.value as ImageSize)} 
                                className={`w-full ${theme.inputBg} ${theme.textMain} p-2 rounded-md text-xs border ${theme.border} outline-none`}
                            >
                                <option value="1K">1K</option>
                                <option value="2K">2K</option>
                                <option value="4K">4K</option>
                            </select>
                        </div>
                    </section>

                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading} 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed text-base shadow-xl transition-all active:scale-[0.98]"
                    >
                        {isLoading ? <Icon name="sparkles" className="w-5 h-5 animate-spin" /> : <Icon name="sparkles" className="w-5 h-5" />}
                        {isLoading ? t('generating') : t('createImage')}
                    </button>
                </div>

                <div className={`lg:col-span-8 ${theme.inputBg} rounded-lg min-h-[60vh] flex items-center justify-center p-4 border ${theme.border} shadow-inner`}>
                    {isLoading ? (
                        <div className={`text-center ${theme.textSub} animate-pulse`}>
                            <Icon name="sparkles" className="w-16 h-16 animate-spin text-orange-500 mx-auto mb-6" />
                            <p className="text-lg font-medium">{t('generatingBuildingSection')}</p>
                        </div>
                    ) : generatedImages.length > 0 && selectedImage ? (
                       <div className="flex flex-col h-full w-full">
                            <div className="flex-grow flex items-center justify-center relative group bg-black/40 rounded-lg overflow-hidden border border-slate-700/50 shadow-2xl">
                                <img src={selectedImage} alt="Section Result" className="max-w-full max-h-[65vh] object-contain" />
                                <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <a href={selectedImage} download={`section-${Date.now()}.png`} className="bg-slate-800/90 backdrop-blur-md border border-slate-600 hover:bg-orange-600 text-white p-3 rounded-full inline-flex shadow-xl" title={t('downloadImage')}>
                                        <Icon name="download" className="w-6 h-6" />
                                    </a>
                                </div>
                            </div>
                            {generatedImages.length > 1 && (
                                <div className={`flex-shrink-0 mt-6 grid grid-cols-${Math.min(generatedImages.length, 4)} gap-4 px-2`}>
                                    {generatedImages.map((image, index) => (
                                        <div 
                                            key={index} 
                                            className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-300 h-28 border-2 ${selectedImage === image ? 'border-orange-500 scale-105 shadow-lg z-10' : 'border-transparent opacity-60 hover:opacity-100'}`} 
                                            onClick={() => setSelectedImage(image)}
                                        >
                                            <img src={image} alt={`Variant ${index + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`text-center ${theme.textSub} py-12 px-6 border-2 border-dashed ${theme.border} rounded-xl max-w-sm`}>
                            <Icon name="clipboard" className="w-20 h-20 mx-auto mb-6 opacity-10" />
                            <h3 className={`text-2xl font-bold ${theme.textMain} mb-2`}>{t('buildingSectionEmptyHeader')}</h3>
                            <p className="text-sm leading-relaxed">{t('buildingSectionEmptyText')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
