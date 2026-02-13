
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl } from '../utils';
import { consultFengShui, generateFengShuiImage } from '../services/geminiService';
import type { SourceImage } from '../types';

interface FengShuiToolProps {
    onBack: () => void;
    setFullscreenImage?: (url: string | null) => void;
}

export const FengShuiTool: React.FC<FengShuiToolProps> = ({ onBack, setFullscreenImage }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
    const [birthYear, setBirthYear] = useState('');
    const [currentDirection, setCurrentDirection] = useState('Đông / East');
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [fengShuiImage, setFengShuiImage] = useState<string | null>(null);

    const directions = [
        'Đông / East', 'Tây / West', 'Nam / South', 'Bắc / North',
        'Đông Nam / South East', 'Đông Bắc / North East', 
        'Tây Nam / South West', 'Tây Bắc / North West'
    ];

    const handleConsult = async () => {
        if (!birthYear) {
            alert("Vui lòng nhập năm sinh của gia chủ.");
            return;
        }
        setIsLoading(true);
        setResult(null);
        setFengShuiImage(null);
        try {
            const analysis = await consultFengShui(sourceImage, birthYear, currentDirection);
            setResult(analysis);
        } catch (error) {
            alert("Đã xảy ra lỗi khi tư vấn phong thủy.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!sourceImage) return;
        setIsGeneratingImage(true);
        try {
            const img = await generateFengShuiImage(sourceImage, birthYear, currentDirection);
            if (img) {
                setFengShuiImage(img);
            } else {
                alert("Không thể tạo hình ảnh lúc này.");
            }
        } catch (error) {
            alert("Đã xảy ra lỗi khi tạo hình ảnh phong thủy.");
        } finally {
            setIsGeneratingImage(false);
        }
    };

    const handleRefresh = () => {
        setSourceImage(null);
        setBirthYear('');
        setCurrentDirection('Đông / East');
        setResult(null);
        setFengShuiImage(null);
    };

    return (
        <div className="animate-fade-in w-full pb-10">
            <div className={`flex items-center justify-between mb-6 ${theme.panelBg} p-4 rounded-xl border ${theme.border} shadow-lg`}>
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2.5 rounded-full bg-slate-800 hover:bg-orange-600/20 text-slate-300 hover:text-orange-400 transition-all border border-slate-700 shadow-lg">
                        <Icon name="arrow-uturn-left" className="w-5 h-5" />
                    </button>
                    <div className="w-px h-8 bg-slate-700 mx-1"></div>
                    <div className="flex items-center gap-4">
                        <div className="bg-amber-600/20 p-2 rounded-full border border-amber-500/30">
                            <Icon name="sparkles" className="w-6 h-6 text-amber-500" />
                        </div>
                        <div>
                            <h2 className={`text-xl md:text-2xl font-bold ${theme.textMain}`}>Tư vấn Phong thủy AI</h2>
                            <p className={`text-xs md:text-sm ${theme.textSub}`}>Phân tích cung mệnh và mặt bằng kiến trúc chuyên sâu.</p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all uppercase tracking-widest"
                >
                    <Icon name="arrow-path" className="w-4 h-4" />
                    LÀM MỚI
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className={`lg:col-span-4 ${theme.panelBg} p-6 rounded-xl border ${theme.border} h-max shadow-2xl flex flex-col gap-6`}>
                    <section>
                        <h3 className={`font-black text-xs uppercase tracking-widest ${theme.textMain} mb-3`}>1. Năm sinh gia chủ</h3>
                        <input 
                            type="number"
                            value={birthYear}
                            onChange={(e) => setBirthYear(e.target.value)}
                            placeholder="VD: 1985"
                            className={`w-full ${theme.inputBg} ${theme.textMain} p-3 rounded-xl text-sm border ${theme.border} outline-none focus:border-amber-500 shadow-inner`}
                        />
                    </section>

                    <section>
                        <h3 className={`font-black text-xs uppercase tracking-widest ${theme.textMain} mb-3`}>2. Hướng nhà hiện tại / Current house direction</h3>
                        <div className="relative">
                            <select 
                                value={currentDirection}
                                onChange={(e) => setCurrentDirection(e.target.value)}
                                className={`w-full ${theme.inputBg} ${theme.textMain} p-3 rounded-xl text-sm border ${theme.border} outline-none focus:border-amber-500 appearance-none shadow-inner pr-10`}
                                style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 1rem center/1.5em 1.5em no-repeat`}}
                            >
                                {directions.map(dir => <option key={dir} value={dir}>{dir}</option>)}
                            </select>
                        </div>
                    </section>

                    <section>
                        <h3 className={`font-black text-xs uppercase tracking-widest ${theme.textMain} mb-3`}>3. Mặt bằng / Hiện trạng (Tùy chọn)</h3>
                        {sourceImage ? (
                            <div className='relative group bg-black/40 rounded-xl p-2 border border-slate-700/50 shadow-inner'>
                                <img src={sourceImageToDataUrl(sourceImage)} alt="Plan" className="w-full h-auto max-h-48 object-contain rounded-lg" />
                                <button onClick={() => setSourceImage(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Icon name="trash" className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <ImageDropzone onImageUpload={setSourceImage} className={`w-full h-32 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-center ${theme.textSub} text-sm cursor-pointer hover:bg-white/5`}>
                                <Icon name="arrow-up-tray" className="w-6 h-6 mb-1 opacity-30" />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">Tải bản vẽ khu đất</span>
                            </ImageDropzone>
                        )}
                    </section>

                    <button 
                        onClick={handleConsult} 
                        disabled={isLoading || !birthYear}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-4 px-4 rounded-xl flex items-center justify-center gap-3 disabled:bg-slate-700 shadow-xl transition-all active:scale-95"
                    >
                        {isLoading ? <Icon name="sparkles" className="w-6 h-6 animate-spin" /> : <Icon name="sparkles" className="w-6 h-6" />}
                        PHÂN TÍCH PHONG THỦY
                    </button>
                </div>

                <div className={`lg:col-span-8 bg-[#050505] rounded-2xl min-h-[60vh] flex flex-col border ${theme.border} shadow-2xl relative overflow-hidden`}>
                    {isLoading ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center">
                            <Icon name="sparkles" className="w-20 h-20 animate-spin text-amber-500 mb-8" />
                            <p className="text-xl font-black text-amber-500 tracking-widest uppercase">Đang gieo quẻ...</p>
                        </div>
                    ) : result ? (
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-8 md:p-12 overflow-y-auto flex-grow thin-scrollbar">
                                <div className="prose prose-invert prose-amber max-w-none">
                                    <h3 className="text-2xl font-black text-amber-500 mb-6 border-b border-amber-500/20 pb-4 flex items-center gap-3">
                                        <Icon name="sparkles" className="w-8 h-8" />
                                        KẾT QUẢ TƯ VẤN PHONG THỦY
                                    </h3>
                                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 whitespace-pre-wrap text-slate-300 leading-relaxed text-sm shadow-inner mb-8">
                                        {result}
                                    </div>
                                    
                                    {sourceImage && (
                                        <div className="flex flex-col gap-6 animate-fade-in">
                                            <div className="flex justify-center">
                                                <button 
                                                    onClick={handleGenerateImage}
                                                    disabled={isGeneratingImage}
                                                    className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                                >
                                                    {isGeneratingImage ? <Icon name="sparkles" className="w-5 h-5 animate-spin" /> : <Icon name="camera" className="w-5 h-5" />}
                                                    Tạo hình ảnh có thước Lỗ Ban
                                                </button>
                                            </div>

                                            {isGeneratingImage && (
                                                <div className="flex flex-col items-center gap-4 py-10 animate-pulse">
                                                    <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                                                    <p className="text-orange-500 font-black text-xs uppercase tracking-widest">Đang vẽ thước Lỗ Ban lên mặt bằng...</p>
                                                </div>
                                            )}

                                            {fengShuiImage && (
                                                <div className="relative group max-w-2xl mx-auto rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40">
                                                    <img src={fengShuiImage} alt="Lu Ban Overlay" className="w-full h-auto object-contain" />
                                                    <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        <button 
                                                            onClick={() => setFullscreenImage?.(fengShuiImage)}
                                                            className="p-3 bg-slate-800/90 backdrop-blur-md text-white rounded-full shadow-lg hover:bg-orange-600 transition-all"
                                                            title="Xem toàn màn hình"
                                                        >
                                                            <Icon name="arrows-pointing-out" className="w-6 h-6" />
                                                        </button>
                                                        <a href={fengShuiImage} download={`phong-thuy-lo-ban-${Date.now()}.png`} className="p-3 bg-orange-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                                                            <Icon name="download" className="w-6 h-6" />
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center">
                            <Icon name="sparkles" className="w-24 h-24 text-slate-800 opacity-20 mb-8" />
                            <h3 className="text-2xl font-black text-slate-600 uppercase tracking-tighter">Bảng tư vấn Phong thủy</h3>
                            <p className="text-slate-700 mt-2">Nhập năm sinh và tải ảnh mặt bằng để nhận tư vấn từ AI.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
