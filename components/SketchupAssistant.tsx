
import React, { useState } from 'react';
import type { SourceImage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { ImageDropzone } from './ImageDropzone';
import { analyzeSketchupModel } from '../services/geminiService';

interface SketchupAssistantProps {
    onBack: () => void;
}

export const SketchupAssistant: React.FC<SketchupAssistantProps> = ({ onBack }) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const [file, setFile] = useState<SourceImage | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [userRequest, setUserRequest] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);

    // Custom dropzone for SKP files
    const handleSkpDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    const processFile = (f: File) => {
        if (!f.name.toLowerCase().endsWith('.skp') && !f.type.startsWith('image/')) {
            alert("Vui lòng tải lên file .skp hoặc hình ảnh model.");
            return;
        }
        setFileName(f.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = (e.target?.result as string)?.split(',')[1];
            if (base64) {
                setFile({ base64, mimeType: f.type || 'application/octet-stream' });
            }
        };
        reader.readAsDataURL(f);
    };

    const handleAnalyze = async () => {
        if (!file || !userRequest) return;
        setIsLoading(true);
        setAnalysisResult(null);
        
        // If it's a .skp file, the API won't accept it as inlineData.
        // We augment the prompt with the filename context.
        let augmentedRequest = userRequest;
        if (file.mimeType === 'application/octet-stream' || fileName.toLowerCase().endsWith('.skp')) {
            augmentedRequest = `[Context: User uploaded a SketchUp file named "${fileName}"]\n${userRequest}`;
        }

        try {
            const result = await analyzeSketchupModel(file, augmentedRequest, language as 'vi' | 'en');
            setAnalysisResult(result);
        } catch (error) {
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
                >
                    <Icon name="arrow-uturn-left" className="w-5 h-5" />
                </button>
                <div className="w-px h-8 bg-slate-700 mx-1"></div>
                <div className="flex items-center gap-4">
                    <Icon name="cpu-chip" className="w-8 h-8 text-orange-500" />
                    <div>
                        <h2 className={`text-2xl font-bold ${theme.textMain}`}>{t('sketchupAssistantTitle')}</h2>
                        <p className={`text-sm ${theme.textSub}`}>{t('sketchupAssistantDesc')}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-6">
                    <section>
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className={`font-semibold ${theme.textMain}`}>{t('uploadSkpHelp')}</h3>
                            <a 
                                href="https://www.pinterest.com/search/pins/?q=sketchup%20model%20architecture%203d" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                            >
                                <Icon name="pinterest" className="w-3 h-3 text-[#E60023]" />
                                {t('findOnPinterest')}
                            </a>
                        </div>
                        <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleSkpDrop}
                            className={`w-full h-40 border-2 border-dashed ${theme.border} rounded-lg flex flex-col items-center justify-center text-center ${theme.textSub} text-sm cursor-pointer hover:bg-white/5 transition-colors relative`}
                        >
                            <input 
                                type="file" 
                                accept=".skp,image/*" 
                                onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <div className="p-4 flex flex-col items-center">
                                    <Icon name="clipboard" className="w-10 h-10 text-orange-500 mb-2" />
                                    <p className="font-bold text-orange-400 truncate max-w-[200px]">{fileName}</p>
                                    <button onClick={(e) => {e.stopPropagation(); setFile(null); setFileName('');}} className="text-xs text-red-400 mt-2 hover:underline">{t('delete')}</button>
                                </div>
                            ) : (
                                <div>
                                    <Icon name="plus-circle" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p>{t('dropzoneHint')}</p>
                                    <p className="text-[10px] opacity-60 mt-1">SKP, PNG, JPG</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <h3 className={`font-semibold ${theme.textMain} mb-2`}>{t('describeIssueLabel')}</h3>
                        <textarea
                            value={userRequest}
                            onChange={(e) => setUserRequest(e.target.value)}
                            placeholder={t('promptPlaceholder.sketchupAssistant')}
                            className={`w-full ${theme.inputBg} ${theme.textMain} p-3 rounded-md h-32 resize-none text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none border ${theme.border}`}
                        />
                    </section>

                    <button 
                        onClick={handleAnalyze} 
                        disabled={isLoading || !file || !userRequest} 
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed text-base"
                    >
                        {isLoading ? <Icon name="sparkles" className="w-5 h-5 animate-spin" /> : <Icon name="sparkles" className="w-5 h-5" />}
                        {isLoading ? t('generating') : t('analyzeSkpButton')}
                    </button>
                </div>

                <div className={`lg:col-span-8 ${theme.inputBg} rounded-lg min-h-[60vh] flex flex-col p-6 border ${theme.border} overflow-y-auto max-h-[80vh] thin-scrollbar`}>
                    {isLoading ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-slate-400">
                            <Icon name="sparkles" className="w-12 h-12 animate-spin text-orange-500 mb-4" />
                            <p>{t('analyzingSkp')}</p>
                        </div>
                    ) : analysisResult ? (
                        <div className="prose prose-invert max-w-none">
                            <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                                <Icon name="sparkles" className="w-5 h-5" />
                                {t('skpAnalysisResultHeader')}
                            </h3>
                            <div className={`p-4 bg-black/30 rounded-lg border ${theme.border} whitespace-pre-wrap text-slate-200 text-sm leading-relaxed`}>
                                {analysisResult}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-slate-500">
                            <Icon name="cpu-chip" className="w-16 h-16 opacity-20 mb-4" />
                            <h3 className="text-xl font-semibold opacity-50">{t('skpAssistantEmptyHeader')}</h3>
                            <p className="mt-2 opacity-50">{t('skpAssistantEmptyText')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
