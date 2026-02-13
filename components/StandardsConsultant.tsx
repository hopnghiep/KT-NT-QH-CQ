
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { consultStandards } from '../services/geminiService';

export const StandardsConsultant: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [buildingType, setBuildingType] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleConsult = async () => {
        if (!buildingType.trim()) {
            alert(t('standardsPlaceholder'));
            return;
        }
        setIsLoading(true);
        setResult(null);
        try {
            const analysis = await consultStandards(buildingType);
            setResult(analysis);
        } catch (error) {
            alert("Đã xảy ra lỗi khi tra cứu tiêu chuẩn.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in w-full h-full flex flex-col pb-10">
            {/* Header Area */}
            <div className={`flex items-center gap-4 mb-6 ${theme.panelBg} p-4 rounded-2xl border ${theme.border} shadow-lg`}>
                <div className="bg-[#1c1c1c] p-3 rounded-xl border border-white/10 flex items-center justify-center">
                    <Icon name="bookmark" className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex flex-col">
                    <h2 className={`text-xl font-black tracking-tight ${theme.textMain} uppercase`}>{t('standardsTitle')}</h2>
                    <p className={`text-xs ${theme.textSub} font-medium`}>{t('standardsDesc')}</p>
                </div>
            </div>

            {/* Content Area */}
            <div className={`flex-grow bg-[#050505] rounded-3xl border ${theme.border} shadow-2xl relative overflow-hidden flex flex-col`}>
                {isLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center">
                        <Icon name="sparkles" className="w-20 h-20 animate-spin text-orange-500 mb-8" />
                        <p className="text-xl font-black text-orange-500 tracking-widest uppercase animate-pulse">{t('consulting')}</p>
                    </div>
                ) : result ? (
                    <div className="flex-grow p-10 overflow-y-auto thin-scrollbar">
                        <div className="max-w-4xl mx-auto prose prose-invert prose-orange">
                            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/5 whitespace-pre-wrap text-slate-300 leading-relaxed text-sm shadow-inner">
                                {result}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-10">
                        <div className="w-32 h-32 bg-slate-900 rounded-[3rem] flex items-center justify-center mb-10 border border-white/5 opacity-50">
                            <Icon name="globe" className="w-16 h-16 text-slate-700" />
                        </div>
                        <h3 className={`text-2xl font-black tracking-tighter ${theme.textSub} uppercase`}>{t('standardsEmptyHeader')}</h3>
                    </div>
                )}

                {/* Bottom Search Bar */}
                <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                    <div className="max-w-5xl mx-auto flex gap-4">
                        <div className="relative flex-grow group">
                            <input 
                                type="text"
                                value={buildingType}
                                onChange={(e) => setBuildingType(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleConsult()}
                                placeholder={t('standardsPlaceholder')}
                                className={`w-full ${theme.inputBg} ${theme.textMain} py-4 px-6 rounded-2xl text-sm border border-white/10 outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 shadow-inner transition-all`}
                            />
                        </div>
                        <button 
                            onClick={handleConsult} 
                            disabled={isLoading || !buildingType.trim()}
                            className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-20 disabled:grayscale"
                        >
                            {t('consultAi')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
