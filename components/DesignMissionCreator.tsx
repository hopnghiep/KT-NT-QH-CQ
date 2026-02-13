
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { generateDesignMission, generateImages } from '../services/geminiService';
import type { HistoryItem } from '../types';

interface DesignMissionCreatorProps {
    onBack: () => void;
    addImageToLibrary?: (imageDataUrl: string) => Promise<void>;
    addHistoryItem?: (item: Omit<HistoryItem, 'id'>) => Promise<void>;
}

export const DesignMissionCreator: React.FC<DesignMissionCreatorProps> = ({ onBack, addImageToLibrary, addHistoryItem }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    
    const [buildingType, setBuildingType] = useState('Biệt thự');
    const [style, setStyle] = useState('Hiện đại');
    const [floors, setFloors] = useState('2');
    const [area, setArea] = useState('150m²');
    const [mainIdea, setMainIdea] = useState('Vd: Ngôi nhà cho gia đình 3 thế hệ, ưu tiên không gian xanh và kết nối.');
    const [functionalReq, setFunctionalReq] = useState('Tầng 1: Gara, Phòng khách, Bếp, 1 WC. Tầng 2: 2 Phòng ngủ (1 master), Phòng thờ, 2 WC.');
    
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [planImage, setPlanImage] = useState<string | null>(null);
    const [history, setHistory] = useState<{id: string, title: string, content: string}[]>([]);

    const buildingTypes = ['Biệt thự', 'Nhà phố', 'Căn hộ chung cư', 'Văn phòng', 'Quán cafe', 'Nhà hàng', 'Khách sạn'];
    const styles = ['Hiện đại', 'Tối giản', 'Tân cổ điển', 'Indochine', 'Bắc Âu', 'Công nghiệp', 'Wabi Sabi'];

    const handleGenerate = async () => {
        setIsLoading(true);
        setResult(null);
        setPlanImage(null);
        try {
            const mission = await generateDesignMission({
                buildingType,
                style,
                floors,
                area,
                mainIdea,
                functionalReq
            });
            setResult(mission);
            
            // Add to local history
            const newHistoryItem = {
                id: Date.now().toString(),
                title: `${buildingType} ${style} - ${area}`,
                content: mission
            };
            setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
        } catch (error) {
            alert("Đã xảy ra lỗi khi tạo nhiệm vụ thiết kế.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateFloorPlan = async () => {
        if (!result) return;
        setIsGeneratingPlan(true);
        try {
            const floorPlanPrompt = `Act as a professional architect. Based on the following architectural Design Mission, generate a high-quality technical 2D architectural floor plan.
            The plan must strictly follow the functional requirements, design ideas (ventilation, lighting), and material directions mentioned in the text.
            
            DESIGN MISSION:
            ${result}
            
            OUTPUT REQUIREMENTS:
            - Professional 2D technical floor plan.
            - Clean black lines on a white background.
            - Includes architectural symbols, furniture placement, and annotations for rooms.
            - Ensure efficient traffic flow and natural ventilation as per mission.
            - Aspect ratio 16:9.`;

            const results = await generateImages(
                null,
                floorPlanPrompt,
                1,
                null,
                '16:9',
                'vi',
                undefined,
                'gemini-3-pro-image-preview',
                '1K'
            );

            if (results.length > 0) {
                setPlanImage(results[0]);
                if (addImageToLibrary) await addImageToLibrary(results[0]);
                if (addHistoryItem) {
                    await addHistoryItem({
                        tab: 'designMission',
                        sourceImage: null,
                        referenceImage: null,
                        prompt: `[Auto Plan] Based on mission: ${buildingType} ${style}`,
                        negativePrompt: '',
                        imageCount: 1,
                        generatedImages: results,
                        generatedPrompts: null,
                    });
                }
            } else {
                alert("Không thể tạo mặt bằng lúc này.");
            }
        } catch (error) {
            console.error("Floor plan generation from mission failed:", error);
            alert("Đã xảy ra lỗi khi tạo mặt bằng.");
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleRestoreHistory = (content: string) => {
        setResult(content);
        setPlanImage(null);
    };

    return (
        <div className="animate-fade-in w-full h-full flex flex-col pb-10">
            {/* Header Area */}
            <div className={`flex items-center gap-4 mb-6 ${theme.panelBg} p-4 rounded-2xl border ${theme.border} shadow-lg`}>
                <div className="bg-[#1c1c1c] p-3 rounded-xl border border-white/10 flex items-center justify-center">
                    <Icon name="pencil-swoosh" className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex flex-col">
                    <h2 className={`text-xl font-black tracking-tight ${theme.textMain} uppercase`}>THIẾT KẾ MẶT BẰNG TỪ YÊU CẦU THIẾT KẾ</h2>
                    <p className={`text-xs ${theme.textSub} font-medium`}>Nhập yêu cầu thiết kế vào AI để tạo ra ý tưởng thiết kế và sơ đồ công năng.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow overflow-hidden">
                {/* Left Panel: Form */}
                <div className={`lg:col-span-4 flex flex-col gap-6 overflow-y-auto thin-scrollbar pr-2`}>
                    <div className={`${theme.panelBg} p-6 rounded-2xl border ${theme.border} shadow-xl flex flex-col gap-5`}>
                        <h3 className={`font-black text-xs uppercase tracking-widest ${theme.textMain} border-b ${theme.border} pb-3`}>1. YÊU CẦU THIẾT KẾ</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">LOẠI CÔNG TRÌNH</label>
                                <select 
                                    value={buildingType}
                                    onChange={(e) => setBuildingType(e.target.value)}
                                    className={`w-full ${theme.inputBg} ${theme.textMain} p-3 rounded-xl text-sm border ${theme.border} outline-none focus:border-orange-500 appearance-none`}
                                    style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 1rem center/1.5em 1.5em no-repeat`}}
                                >
                                    {buildingTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">PHONG CÁCH</label>
                                <select 
                                    value={style}
                                    onChange={(e) => setStyle(e.target.value)}
                                    className={`w-full ${theme.inputBg} ${theme.textMain} p-3 rounded-xl text-sm border ${theme.border} outline-none focus:border-orange-500 appearance-none`}
                                    style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 1rem center/1.5em 1.5em no-repeat`}}
                                >
                                    {styles.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">SỐ TẦNG</label>
                                    <input 
                                        type="text"
                                        value={floors}
                                        onChange={(e) => setFloors(e.target.value)}
                                        className={`w-full ${theme.inputBg} ${theme.textMain} p-3 rounded-xl text-sm border ${theme.border} outline-none focus:border-orange-500`}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">DIỆN TÍCH</label>
                                    <input 
                                        type="text"
                                        value={area}
                                        onChange={(e) => setArea(e.target.value)}
                                        className={`w-full ${theme.inputBg} ${theme.textMain} p-3 rounded-xl text-sm border ${theme.border} outline-none focus:border-orange-500`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">MÔ TẢ Ý TƯỞNG CHÍNH</label>
                                <textarea 
                                    value={mainIdea}
                                    onChange={(e) => setMainIdea(e.target.value)}
                                    placeholder="Mô tả ý tưởng sơ bộ..."
                                    className={`w-full ${theme.inputBg} ${theme.textMain} p-4 rounded-xl text-xs border ${theme.border} h-24 resize-none outline-none focus:border-orange-500 shadow-inner`}
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">YÊU CẦU CÔNG NĂNG CHI TIẾT</label>
                                <textarea 
                                    value={functionalReq}
                                    onChange={(e) => setFunctionalReq(e.target.value)}
                                    placeholder="Chi tiết từng tầng..."
                                    className={`w-full ${theme.inputBg} ${theme.textMain} p-4 rounded-xl text-xs border ${theme.border} h-32 resize-none outline-none focus:border-orange-500 shadow-inner`}
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading}
                            className="w-full bg-white text-black font-black py-4 px-4 rounded-xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50 hover:bg-slate-100"
                        >
                            {isLoading ? <Icon name="sparkles" className="w-5 h-5 animate-spin" /> : <Icon name="sparkles" className="w-5 h-5" />}
                            TẠO Ý TƯỞNG THIẾT KẾ
                        </button>
                    </div>

                    {/* History Section */}
                    <div className={`${theme.panelBg} p-6 rounded-2xl border ${theme.border} shadow-xl flex flex-col gap-4`}>
                         <h3 className={`font-black text-xs uppercase tracking-widest ${theme.textSub} flex items-center gap-2`}>
                            <Icon name="clock" className="w-4 h-4" />
                            LỊCH SỬ THIẾT KẾ
                         </h3>
                         <div className="space-y-2">
                             {history.length > 0 ? history.map(item => (
                                 <button 
                                    key={item.id}
                                    onClick={() => handleRestoreHistory(item.content)}
                                    className="w-full text-left p-3 rounded-xl bg-black/20 border border-white/5 hover:border-orange-500/30 transition-all group"
                                 >
                                     <p className="text-[11px] font-bold text-slate-400 group-hover:text-white truncate uppercase tracking-tighter">{item.title}</p>
                                 </button>
                             )) : (
                                <div className="py-4 text-center border-2 border-dashed border-white/5 rounded-xl">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">CHƯA CÓ LỊCH SỬ THIẾT KẾ.</p>
                                </div>
                             )}
                         </div>
                    </div>
                </div>

                {/* Right Panel: Output */}
                <div className={`lg:col-span-8 bg-[#050505] rounded-[2.5rem] border ${theme.border} shadow-2xl relative overflow-hidden flex flex-col h-full`}>
                    {isLoading ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center">
                            <Icon name="sparkles" className="w-20 h-20 animate-spin text-orange-500 mb-8" />
                            <p className="text-xl font-black text-orange-500 tracking-widest uppercase animate-pulse">ĐANG PHÁC THẢO Ý TƯỞNG...</p>
                        </div>
                    ) : result ? (
                        <div className="flex-grow flex flex-col p-10 overflow-hidden">
                            <div className="flex-grow overflow-y-auto thin-scrollbar mb-6">
                                <div className="max-w-4xl mx-auto prose prose-invert prose-orange">
                                    <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5 whitespace-pre-wrap text-slate-300 leading-relaxed text-sm shadow-inner relative group">
                                        {result}
                                    </div>
                                </div>

                                {/* Plan Output (if generated) */}
                                {planImage && (
                                    <div className="mt-8 max-w-4xl mx-auto animate-fade-in">
                                        <div className="relative group rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-black/40">
                                            <img src={planImage} alt="Generated Plan" className="w-full h-auto object-contain" />
                                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a href={planImage} download={`plan-from-mission-${Date.now()}.png`} className="p-3 bg-orange-600 text-white rounded-full hover:scale-110 transition-transform shadow-lg">
                                                    <Icon name="download" className="w-5 h-5" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Toolbar */}
                            <div className="flex justify-center gap-4 animate-scale-up">
                                <button 
                                    onClick={handleGenerateFloorPlan}
                                    disabled={isGeneratingPlan}
                                    className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
                                >
                                    {isGeneratingPlan ? <Icon name="sparkles" className="w-5 h-5 animate-spin" /> : <Icon name="sparkles" className="w-5 h-5" />}
                                    TẠO MẶT BẰNG TỪ Ý TƯỞNG
                                </button>
                                
                                {planImage && (
                                    <button 
                                        onClick={() => window.open(planImage, '_blank')}
                                        className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95 flex items-center gap-3 border border-white/5"
                                    >
                                        <Icon name="arrows-pointing-out" className="w-5 h-5" />
                                        XEM TOÀN MÀN HÌNH
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-10">
                            <div className="w-32 h-32 bg-slate-900 rounded-[3rem] flex items-center justify-center mb-10 border border-white/5 opacity-50">
                                <Icon name="sparkles" className="w-16 h-16 text-slate-700" />
                            </div>
                            <h3 className={`text-2xl font-black tracking-tighter ${theme.textSub} uppercase`}>KẾT QUẢ THIẾT KẾ SẼ ĐƯỢC HIỂN THỊ Ở ĐÂY.</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
