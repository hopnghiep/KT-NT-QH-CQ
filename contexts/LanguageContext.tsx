
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { translations } from '../locales/translations';

type Language = 'vi' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: string, ...args: any[]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('vi');

    const t = useCallback((key: string, ...args: any[]): string => {
        // FIX: Cast translations to any to fix indexing error when language is 'en'
        const langTranslations = (translations as any)[language];
        const keys = key.split('.');
        let result: any = langTranslations;

        for (const k of keys) {
            result = result?.[k];
            if (result === undefined) {
                // Fallback to English if translation is missing
                // FIX: Cast translations to any to fix "Property 'en' does not exist on type '{ vi: any; }'" error
                let fallbackResult: any = (translations as any).en;
                for (const fk of keys) {
                    fallbackResult = fallbackResult?.[fk];
                    if (fallbackResult === undefined) return key; // Return key if not found in either language
                }
                result = fallbackResult;
                break;
            }
        }
        
        if (typeof result === 'string' && args.length > 0) {
            return result.replace(/{(\d+)}/g, (match, number) => {
                return typeof args[number] !== 'undefined' ? args[number] : match;
            });
        }
        
        return result || key;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
