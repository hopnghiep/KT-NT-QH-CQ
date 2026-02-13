
import React, { useState, useEffect } from 'react';
import { Icon } from '../icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { improvePrompt } from '../../services/geminiService';

export const ExpandableTextarea: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
    expandedHeight?: string;
    disabled?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}> = ({ value, onChange, placeholder, className, minHeight = "h-20", expandedHeight = "h-64", disabled = false, onFocus, onBlur }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { theme } = useTheme();

    return (
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            onFocus={() => {
                setIsExpanded(true);
                onFocus?.();
            }}
            onBlur={() => {
                setIsExpanded(false);
                onBlur?.();
            }}
            className={`${className} transition-all duration-300 ease-in-out ${isExpanded ? expandedHeight : minHeight} ${theme.inputBg} ${theme.textMain} p-3 rounded-md resize-none text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none border ${theme.border} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
    );
};

export const PromptInput: React.FC<{ prompt: string, setPrompt: (value: any) => void, placeholder: string, disabled?: boolean, label?: string, onRefresh?: () => void }> = ({ prompt, setPrompt, placeholder, disabled = false, label, onRefresh }) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const [isImproving, setIsImproving] = useState(false);
    const [showSavedPrompts, setShowSavedPrompts] = useState(false);
    const [savedPrompts, setSavedPrompts] = useState<string[]>(() => {
        const saved = localStorage.getItem('aicomplex_custom_saved_prompts');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('aicomplex_custom_saved_prompts', JSON.stringify(savedPrompts));
    }, [savedPrompts]);
    
    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setPrompt((p: string) => p ? `${p} ${text}` : text);
        } catch (err: any) {
            console.warn('Clipboard access denied or blocked by permission policy:', err);
            alert(language === 'vi' 
                ? "Không thể truy cập clipboard do chính sách bảo mật của trình duyệt. Vui lòng sử dụng Ctrl+V (hoặc Cmd+V) để dán trực tiếp vào ô nhập liệu."
                : "Cannot access clipboard due to browser security policy. Please use Ctrl+V (or Cmd+V) to paste directly into the input field."
            );
        }
    };

    const handleClearPrompt = () => {
        setPrompt('');
    };

    const handleSaveCurrentPrompt = () => {
        if (!prompt || prompt.trim() === '') return;
        const cleanPrompt = prompt.trim();
        if (savedPrompts.includes(cleanPrompt)) return;
        setSavedPrompts([cleanPrompt, ...savedPrompts].slice(0, 20));
        setShowSavedPrompts(true);
    };

    const handleDeleteSavedPrompt = (e: React.MouseEvent, p: string) => {
        e.stopPropagation();
        setSavedPrompts(savedPrompts.filter(item => item !== p));
    };

    const handleMagicPrompt = async () => {
        if (!prompt || prompt.trim() === '' || isImproving) return;
        
        setIsImproving(true);
        const originalPrompt = prompt;
        setPrompt(t('expandingPrompt'));
        
        try {
            const expanded = await improvePrompt(originalPrompt, language as 'vi' | 'en');
            setPrompt(expanded);
        } catch (error) {
            console.error("Magic Prompt failed:", error);
            setPrompt(originalPrompt);
            alert(t('alertGenerationFailed'));
        } finally {
            setIsImproving(false);
        }
    };

    return (
        <div className="relative">
            <div className="flex justify-between items-center mb-3">
                <h3 className={`font-black text-xs uppercase tracking-widest ${theme.textMain}`}>{label || t('prompt')}</h3>
                <div className="flex items-center gap-1.5">
                    {!disabled && (
                        <>
                            <button 
                                onClick={() => setShowSavedPrompts(!showSavedPrompts)}
                                title={t('savedPromptsLabel')}
                                className={`${theme.textSub} ${showSavedPrompts ? 'text-orange-400 bg-orange-500/10' : 'hover:text-orange-400 hover:bg-white/5'} p-2 transition-all rounded-xl flex items-center gap-1.5`}
                            >
                                <Icon name="bookmark" className="w-8 h-8"/>
                                {savedPrompts.length > 0 && <span className="text-[10px] bg-orange-600 text-white rounded-full w-4 h-4 flex items-center justify-center font-black">{savedPrompts.length}</span>}
                            </button>

                            <button 
                                onClick={handleMagicPrompt} 
                                disabled={isImproving || !prompt}
                                title={t('magicPrompt')} 
                                className={`${theme.textSub} hover:text-orange-400 p-2 transition-all rounded-xl hover:bg-orange-500/10 disabled:opacity-30 flex items-center gap-2`}
                            >
                                <Icon name="sparkles" className={`w-8 h-8 ${isImproving ? 'animate-spin' : ''}`}/>
                                <span className="text-[10px] font-black uppercase tracking-tighter hidden sm:inline">Magic</span>
                            </button>
                            <div className="w-px h-5 bg-slate-700 mx-1"></div>
                            
                            <button 
                                onClick={onRefresh}
                                title={t('reset')} 
                                className={`${theme.textSub} hover:text-blue-400 p-2 transition-all rounded-xl hover:bg-white/5`}
                            >
                                <Icon name="arrow-path" className="w-8 h-8"/>
                            </button>

                            <button onClick={handlePaste} title="Paste" className={`${theme.textSub} hover:text-blue-400 p-2 transition-colors rounded-xl hover:bg-white/5`}>
                                <Icon name="paste" className="w-8 h-8"/>
                            </button>
                            
                            {prompt && (
                                <>
                                    <button 
                                        onClick={handleSaveCurrentPrompt} 
                                        title={t('savePrompt')} 
                                        className="text-slate-500 hover:text-orange-500 p-2 transition-colors rounded-xl hover:bg-orange-500/10"
                                    >
                                        <Icon name="floppy" className="w-8 h-8"/>
                                    </button>
                                    <button 
                                        onClick={handleClearPrompt} 
                                        title={t('delete')} 
                                        className="text-slate-500 hover:text-red-500 p-2 transition-colors rounded-xl hover:bg-red-500/10"
                                    >
                                        <Icon name="trash" className="w-8 h-8"/>
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showSavedPrompts && savedPrompts.length > 0 && (
                <div className={`absolute bottom-full mb-3 left-0 right-0 z-[100] max-h-60 overflow-y-auto thin-scrollbar ${theme.panelBg} border ${theme.border} rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-3 animate-scale-up backdrop-blur-xl`}>
                    <div className="flex justify-between items-center px-2 py-1.5 mb-2 border-b border-slate-700/50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('savedPromptsLabel')}</span>
                        <button onClick={() => setShowSavedPrompts(false)} className="text-slate-500 hover:text-white"><Icon name="x-circle" className="w-5 h-5"/></button>
                    </div>
                    <div className="space-y-1.5">
                        {savedPrompts.map((p, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => { setPrompt(p); setShowSavedPrompts(false); }}
                                className={`group flex items-center justify-between gap-3 p-2.5 rounded-xl cursor-pointer text-xs transition-all ${theme.inputBg} hover:bg-white/10 border border-transparent hover:border-slate-600`}
                            >
                                <p className="truncate flex-grow text-slate-300 group-hover:text-white leading-relaxed">{p}</p>
                                <button 
                                    onClick={(e) => handleDeleteSavedPrompt(e, p)}
                                    className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Icon name="trash" className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ExpandableTextarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={placeholder}
                disabled={disabled || isImproving}
                minHeight="h-28"
                expandedHeight="h-72"
                className="w-full shadow-inner ring-1 ring-white/5"
            />
        </div>
    );
};

export const AppLinksManager: React.FC = () => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    
    const [apps, setApps] = useState<{ name: string; link: string }[]>(() => {
        const saved = localStorage.getItem('aicomplex_website_links');
        if (saved) return JSON.parse(saved);
        return [
            { name: 'Pinterest', link: 'https://pinterest.com' },
            { name: 'ArchDaily', link: 'https://archdaily.com' }
        ];
    });
    
    const [showInput, setShowInput] = useState(false);
    const [newName, setNewName] = useState('');
    const [newLink, setNewLink] = useState('');

    const APP_SUGGESTIONS = [
        { name: 'Pinterest', link: 'https://pinterest.com' },
        { name: 'Behance', link: 'https://behance.net' },
        { name: 'ArchDaily', link: 'https://archdaily.com' },
        { name: 'Dezeen', link: 'https://dezeen.com' },
    ];

    useEffect(() => {
        localStorage.setItem('aicomplex_website_links', JSON.stringify(apps));
    }, [apps]);

    const handleAddApp = (name: string = newName, link: string = newLink) => {
        if (name.trim() && link.trim()) {
            if (apps.some(a => a.link === link)) return;
            setApps([...apps, { name: name.trim(), link: link.trim() }]);
            setNewName('');
            setNewLink('');
            setShowInput(false);
        }
    };

    const handleDeleteApp = (index: number) => {
        setApps(apps.filter((_, i) => i !== index));
    };

    const handleOpenApp = (link: string) => {
        window.open(link, '_blank');
    };

    return (
        <div className="mt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
                {apps.map((app, idx) => (
                    <div key={idx} className="group relative flex items-center">
                        <button 
                            onClick={() => handleOpenApp(app.link)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5 ${theme.inputBg} ${theme.border} ${theme.textMain} hover:border-orange-500 hover:text-orange-400 shadow-sm`}
                            title={app.link}
                        >
                            <Icon name="globe" className="w-4 h-4" />
                            {app.name}
                        </button>
                        <button 
                            onClick={() => handleDeleteApp(idx)}
                            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <Icon name="x-circle" className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <button 
                    onClick={() => setShowInput(!showInput)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border border-dashed transition-all flex items-center gap-1.5 ${theme.textSub} hover:${theme.textMain} hover:border-slate-500`}
                >
                    <Icon name="plus-circle" className="w-4 h-4" />
                    {t('addDrawingApp')}
                </button>
            </div>

            {showInput && (
                <div className={`p-3 rounded-lg border ${theme.border} bg-black/20 animate-fade-in space-y-3`}>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Gợi ý website</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {APP_SUGGESTIONS.map((suggestion) => (
                                <button
                                    key={suggestion.name}
                                    onClick={() => handleAddApp(suggestion.name, suggestion.link)}
                                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 flex items-center gap-1"
                                >
                                    <Icon name="plus-circle" className="w-3 h-3" />
                                    {suggestion.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <input 
                            type="text" 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder={t('appNamePlaceholder')}
                            className={`w-full ${theme.inputBg} ${theme.textMain} px-3 py-1.5 rounded text-xs border ${theme.border} outline-none focus:border-orange-500`}
                        />
                        <input 
                            type="text" 
                            value={newLink}
                            onChange={(e) => setNewLink(e.target.value)}
                            placeholder={t('appLinkPlaceholder')}
                            className={`w-full ${theme.inputBg} ${theme.textMain} px-3 py-1.5 rounded text-xs border ${theme.border} outline-none focus:border-orange-500`}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleAddApp()}
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold py-1.5 rounded transition-colors"
                        >
                            Lưu Link
                        </button>
                        <button 
                            onClick={() => setShowInput(false)}
                            className={`flex-1 ${theme.buttonSecondary} text-[10px] font-bold py-1.5 rounded transition-colors`}
                        >
                            {t('cancel')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
