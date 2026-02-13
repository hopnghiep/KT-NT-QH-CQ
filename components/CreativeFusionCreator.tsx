
import React, { useState, useEffect } from 'react';
import type { SourceImage, ImageSize, HistoryItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl, padImageToAspectRatio } from '../utils';
import { generateImages } from '../services/geminiService';

interface CreativeFusionCreatorProps {
    onBack: () => void;
    addImageToLibrary: (imageDataUrl: string) => Promise<void>;
    addHistoryItem: (item: Omit<HistoryItem, 'id'>) => Promise<void>;
}

export const CreativeFusionCreator: React.FC<CreativeFusionCreatorProps> = ({ onBack, addImageToLibrary, addHistoryItem }) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
    const [referenceImage, setReferenceImage] = useState<SourceImage | null>(null);
    const [imageCount, setImageCount] = useState(2);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        if (generatedImages.length > 0 && !selectedImage) {
            setSelectedImage(generatedImages[0]);
        }
    }, [generatedImages, selectedImage]);

    const handleGenerate = async () => {
        if (!sourceImage || !referenceImage) {
            alert("Vui lòng tải lên cả ảnh phác thảo và ảnh tham chiếu.");
            return;
        }

        setIsLoading(true);
        setGeneratedImages([]);
        setSelectedImage(null);

        try {
            const fusionPrompt = t('creativeFusionPrompt');
            const results = await generateImages(
                sourceImage,
                fusionPrompt,
                imageCount,
                referenceImage,
                '4:3',
                language as 'vi' | 'en',
                undefined,
                'gemini-2.5-flash-image'
            );

            if (results.length > 0) {
                setGeneratedImages(results);
                setSelectedImage(results[0]);
                results.forEach(img => addImageToLibrary(img));
                await addHistoryItem({
                    tab: 'utilities',
                    sourceImage,
                    sourceImage2: referenceImage,
                    referenceImage: referenceImage,
                    prompt: `[Creative Fusion] ${fusionPrompt.substring(0, 50)}...`,
                    negativePrompt: '',
                    imageCount,
                    generatedImages: results,
                    generatedPrompts: null,
                });
            } else {
                alert(t('alertGenerationFailed'));
            }
        } catch (error) {
            console.error("Fusion generation failed:", error);
            alert(t('alertGenerationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleReferenceUpload = async (img: SourceImage) => {
        if (sourceImage) {
            const sourceImg = new Image();
            sourceImg.src = sourceImageToDataUrl(sourceImage);
            await new Promise((resolve) => sourceImg.onload = resolve);
            const ratio = sourceImg.naturalWidth / sourceImg.naturalHeight;
            const padded = await padImageToAspectRatio(img, ratio);
            setReferenceImage(padded);
        } else {
            setReferenceImage(img);
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
                    <Icon name="sparkles" className="w-8 h-8 text-orange-500" />
                    <div>
                        <h2 className={`text-2xl font-bold ${theme.textMain}`}>{t('creativeFusionTitle')}</h2>
                        <p className={`text-sm ${theme.textSub}`}>{t('creativeFusionDesc')}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-6">
                    <section>
                        <h3 className={`font-semibold ${theme.textMain} mb-3`}>1. {t('upload2dPlan')} (Sketch)</h3>
                        {sourceImage ? (
                          <div className='space-y-3'>
                              <ImageDropzone onImageUpload={setSourceImage} className="cursor-pointer rounded-lg">
                                <div className='bg-black/30 rounded-lg p-2'><img src={sourceImageToDataUrl(sourceImage)} alt="Sketch" className="w-full h-auto object-contain rounded" /></div>
                              </ImageDropzone>
                              <button onClick={() => setSourceImage(null)} className='text-red-400 hover:text-red-500 text-sm px-3 py-1.5 rounded-md hover:bg-red-500/10'>{t('delete')}</button>
                          </div>
                        ) : (
                          <ImageDropzone onImageUpload={setSourceImage} className={`w-full h-40 border-2 border-dashed ${theme.border} rounded-lg flex items-center justify-center text-center ${theme.textSub} text-sm cursor-pointer`}>
                              <div><p>{t('dropzoneHint')}</p><p className="text-xs mt-1 opacity-70">Sketch / Line-art</p></div>
                          </ImageDropzone>
                        )}
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-3">
                            <h3 className={`font-semibold ${theme.textMain}`}>2. {t('referenceImage')} (Mood)</h3>
                            <a 
                                href="https://www.pinterest.com/search/pins/?q=modern%20architecture%20lighting%20mood" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                            >
                                <Icon name="pinterest" className="w-3.5 h-3.5 text-[#E60023]" />
                                {t('findOnPinterest')}
                            </a>
                        </div>
                        {referenceImage ? (
                          <div className='space-y-3'>
                              <ImageDropzone onImageUpload={handleReferenceUpload} className="cursor-pointer rounded-lg">
                                <div className='bg-black/30 rounded-lg p-2'><img src={sourceImageToDataUrl(referenceImage)} alt="Reference" className="w-full h-auto object-contain rounded" /></div>
                              </ImageDropzone>
                              <button onClick={() => setReferenceImage(null)} className='text-red-400 hover:text-red-500 text-sm px-3 py-1.5 rounded-md hover:bg-red-500/10'>{t('delete')}</button>
                          </div>
                        ) : (
                          <ImageDropzone onImageUpload={handleReferenceUpload} className={`w-full h-40 border-2 border-dashed ${theme.border} rounded-lg flex items-center justify-center text-center ${theme.textSub} text-sm cursor-pointer`}>
                              <div><p>{t('dropzoneHint')}</p><p className="text-xs mt-1 opacity-70">Lighting / Mood</p></div>
                          </ImageDropzone>
                        )}
                    </section>

                    <section>
                        <h3 className={`font-semibold ${theme.textMain} mb-2`}>{t('imageCount')}</h3>
                        <div className={`flex items-center justify-between ${theme.inputBg} rounded-md p-2 border ${theme.border}`}>
                            <button onClick={() => setImageCount(Math.max(1, imageCount - 1))} className={`px-4 py-2 rounded text-xl font-bold ${theme.buttonSecondary} ${theme.textMain}`}>-</button>
                            <span className={`text-lg font-semibold ${theme.textMain}`}>{imageCount}</span>
                            <button onClick={() => setImageCount(Math.min(4, imageCount + 1))} className={`px-4 py-2 rounded text-xl font-bold ${theme.buttonSecondary} ${theme.textMain}`}>+</button>
                        </div>
                    </section>

                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading || !sourceImage || !referenceImage} 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed text-base"
                    >
                        {isLoading ? <Icon name="sparkles" className="w-5 h-5 animate-spin" /> : <Icon name="sparkles" className="w-5 h-5" />}
                        {isLoading ? t('generating') : "Hòa trộn sáng tạo"}
                    </button>
                </div>

                <div className={`lg:col-span-8 ${theme.inputBg} rounded-lg min-h-[60vh] flex items-center justify-center p-4 border ${theme.border}`}>
                    {isLoading ? (
                        <div className={`text-center ${theme.textSub}`}>
                            <Icon name="sparkles" className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                            <p>Đang hòa trộn cấu trúc và linh hồn ảnh...</p>
                        </div>
                    ) : generatedImages.length > 0 && selectedImage ? (
                       <div className="flex flex-col h-full w-full">
                            <div className="flex-grow flex items-center justify-center relative group bg-black/40 rounded-lg overflow-hidden">
                                <img src={selectedImage} alt="Fusion Result" className="max-w-full max-h-[65vh] object-contain shadow-2xl" />
                                <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <a href={selectedImage} download={`fusion-${Date.now()}.png`} className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 hover:bg-slate-700 text-white p-2.5 rounded-full inline-flex" title={t('downloadImage')}>
                                        <Icon name="download" className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                            {generatedImages.length > 1 && (
                                <div className={`flex-shrink-0 mt-4 grid grid-cols-${Math.min(generatedImages.length, 4)} gap-2`}>
                                    {generatedImages.map((image, index) => (
                                        <div key={index} className={`relative cursor-pointer rounded-md overflow-hidden transition-all duration-200 h-28 ${selectedImage === image ? 'ring-2 ring-orange-500' : 'opacity-60 hover:opacity-100'}`} onClick={() => setSelectedImage(image)}>
                                            <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={`text-center ${theme.textSub}`}>
                            <Icon name="sparkles" className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <h3 className={`text-xl font-semibold ${theme.textMain}`}>{t('emptyStateHeader')}</h3>
                            <p className="mt-2">{t('emptyStateText')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
