
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ImageSize, HistoryItem, SourceImage } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { analyzeExistingState, critiqueArchitecturalPlan } from '../services/geminiService';
import { translations } from '../locales/translations';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl, dataUrlToSourceImage } from '../utils';
import { AppLinksManager, ExpandableTextarea } from './shared/ControlCommon';
import { generateImages } from '../services/geminiService';

interface FloorPlanGeneratorProps {
    onBack: () => void;
    addImageToLibrary: (imageDataUrl: string) => Promise<void>;
    addHistoryItem: (item: Omit<HistoryItem, 'id'>) => Promise<void>;
}

interface RoomState {
    checked: boolean;
    qty: number;
    selectedFloors: number[];
}

export const FloorPlanGenerator: React.FC<FloorPlanGeneratorProps> = ({ onBack, addImageToLibrary, addHistoryItem }) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    
    const currentLangData = (translations[language] || translations['vi']) as any;
    const checklistConfig = currentLangData.constants.floorPlanChecklist || [];
    const standardAreas = (currentLangData.constants && currentLangData.constants.standardAreas) || {};
    const planStylePrompts = (currentLangData.constants && currentLangData.constants.planStylePrompts) || [];

    // --- State Logic ---
    const [newMissionBrief, setNewMissionBrief] = useState('');
    const [showBriefFullscreen, setShowBriefFullscreen] = useState(false);

    // --- Generator State ---
    const [floorCount, setFloorCount] = useState(1);
    const [hasMezzanine, setHasMezzanine] = useState(false);
    const [hasRooftop, setHasRooftop] = useState(false);
    
    // Initialize checklist state with room names from config to match ALL pyramid rooms
    const [checklistState, setChecklistState] = useState<Record<string, RoomState>>(() => {
        const initial: Record<string, RoomState> = {};
        if (Array.isArray(checklistConfig)) {
            checklistConfig.forEach((group: any) => {
                if (group && Array.isArray(group.rooms)) {
                    group.rooms.forEach((room: string) => {
                        initial[room] = { checked: false, qty: 1, selectedFloors: [1] };
                    });
                }
            });
        }
        return initial;
    });

    const [selectedStyle, setSelectedStyle] = useState(planStylePrompts[0] || 'phong cách hiện đại, tông màu trắng and gỗ');
    
    const [customReq, setCustomReq] = useState(`không tự ý sáng tác thêm hoặc bớt không gian. 
Phương án tuân thủ chính xác hiện trạng ( hình dang , kich thuoc khu đất đã phân tích và sử dụng để tạo phương án mặt bằng
Phương án tuân thủ chính xác cac luu y nhu sau :
- tầng lửng mật độ xây dựng chiếm 60% tầng 1 
- tầng tum mái chỉ xây dựng che cầu thang chiếm mật độ xây dựng 20% của tầng 
-tận dụng tối đa diện tích xây dựng 
- cầu thang rộng 80cm
- chiều cao theo quy định thực tế`);

    // Land Dimensions
    const [landWidth, setLandWidth] = useState('');
    const [landLength, setLandLength] = useState('');
    const [landUnit, setLandUnit] = useState<'m' | 'cm' | 'mm'>('m');

    // Build Dimensions (For T1 / Footprint)
    const [buildWidth, setBuildWidth] = useState('');
    const [buildLength, setBuildLength] = useState('');
    const [buildUnit, setBuildUnit] = useState<'m' | 'cm' | 'mm'>('m');

    const [landRatio, setLandRatio] = useState('');
    const [buildRatio, setBuildRatio] = useState('');
    const [fengShui, setFengShui] = useState('');
    const [entranceDir, setEntranceDir] = useState('');
    const [mainDirection, setMainDirection] = useState('');
    const [existingState, setExistingState] = useState('');
    const [existingStateImage, setExistingStateImage] = useState<SourceImage | null>(null);
    const [isAnalyzingExistingState, setIsAnalyzingExistingState] = useState(false);
    
    // --- History State ---
    const [imageHistory, setImageHistory] = useState<SourceImage[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const activeImage = historyIndex >= 0 ? imageHistory[historyIndex] : null;

    const [referenceImage, setReferenceImage] = useState<SourceImage | null>(null);
    const [imageCount, setImageCount] = useState(2);
    const [imageSize, setImageSize] = useState<ImageSize>('1K');
    const [isLoading, setIsLoading] = useState(false);
    const [isCritiquing, setIsCritiquing] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // --- Summary Computation ---
    const selectedRoomsSummary = useMemo(() => {
        return (Object.entries(checklistState) as [string, RoomState][])
            .filter(([_, data]) => data.checked)
            .map(([name, data]) => ({
                name,
                qty: data.qty,
                floors: data.selectedFloors,
                area: standardAreas[name] || 0
            }));
    }, [checklistState, standardAreas]);

    const [lastGeneratedParams, setLastGeneratedParams] = useState<string>('');
    const currentParamsHash = useMemo(() => {
        return JSON.stringify({ 
            floorCount, hasMezzanine, hasRooftop, newMissionBrief, selectedStyle, customReq, 
            landWidth, landLength, buildWidth, buildLength, checklistState
        });
    }, [floorCount, hasMezzanine, hasRooftop, newMissionBrief, selectedStyle, customReq, landWidth, landLength, buildWidth, buildLength, checklistState]);

    const isUpdate = useMemo(() => {
        return generatedImages.length > 0 && lastGeneratedParams !== currentParamsHash;
    }, [generatedImages, lastGeneratedParams, currentParamsHash]);

    // --- Calculations ---
    const toM2 = (val: number, unit: string) => {
        if (unit === 'cm') return val / 10000;
        if (unit === 'mm') return val / 1000000;
        return val;
    };

    const landArea = useMemo(() => {
        const w = parseFloat(landWidth || '0');
        const l = parseFloat(landLength || '0');
        if (w <= 0 || l <= 0) return 0;
        return toM2(w * l, landUnit);
    }, [landWidth, landLength, landUnit]);

    const buildAreaT1 = useMemo(() => {
        const w = parseFloat(buildWidth || '0');
        const l = parseFloat(buildLength || '0');
        if (w <= 0 || l <= 0) return 0;
        return toM2(w * l, buildUnit);
    }, [buildWidth, buildLength, buildUnit]);

    const floorAreas = useMemo(() => {
        const areaMap: Record<number, number> = {};
        for (let i = 1; i <= floorCount; i++) areaMap[i] = buildAreaT1; 
        return areaMap;
    }, [floorCount, buildAreaT1]);

    const grandTotalArea = useMemo(() => {
        return (Object.values(floorAreas) as number[]).reduce((sum, current) => sum + current, 0);
    }, [floorAreas]);

    const planningMetrics = useMemo(() => {
        const density = landArea > 0 ? (buildAreaT1 / landArea) * 100 : 0;
        const far = landArea > 0 ? (grandTotalArea / landArea) : 0;
        return { density, far };
    }, [landArea, buildAreaT1, grandTotalArea]);

    // Sync history to active image
    useEffect(() => {
        if (activeImage) {
            const url = sourceImageToDataUrl(activeImage);
            setSelectedImage(url);
            setGeneratedImages([url]);
        } else if (generatedImages.length === 0) {
            setSelectedImage(null);
            setGeneratedImages([]);
        }
    }, [activeImage]);

    const addToHistory = (img: SourceImage) => {
        const nextHistory = imageHistory.slice(0, historyIndex + 1);
        setImageHistory([...nextHistory, img]);
        setHistoryIndex(nextHistory.length);
    };

    const handleUndo = () => { if (historyIndex > 0) setHistoryIndex(prev => prev - 1); };
    const handleRedo = () => { if (historyIndex < imageHistory.length - 1) setHistoryIndex(prev => prev + 1); };

    const handleChecklistChange = (room: string, checked: boolean) => {
        setChecklistState(prev => ({
            ...prev,
            [room]: { ...prev[room], checked }
        }));
    };

    const handleQtyChange = (room: string, qty: number) => {
        setChecklistState(prev => ({
            ...prev,
            [room]: { ...prev[room], qty: Math.max(1, qty) }
        }));
    };

    const toggleFloorSelection = (room: string, floor: number) => {
        setChecklistState(prev => {
            const currentFloors = prev[room].selectedFloors || [];
            const newFloors = currentFloors.includes(floor)
                ? currentFloors.filter(f => f !== floor)
                : [...currentFloors, floor].sort((a, b) => a - b);
            return {
                ...prev,
                [room]: { ...prev[room], selectedFloors: newFloors.length === 0 ? [1] : newFloors }
            };
        });
    };

    const handleAnalyzeExistingState = async () => {
        if (!existingStateImage) return;
        setIsAnalyzingExistingState(true);
        try {
            const result = await analyzeExistingState(existingStateImage, language as 'vi' | 'en');
            setExistingState(result);
            const dataMatch = result.match(/\[DATA\]([\s\S]*?)\[\/DATA\]/i);
            if (dataMatch) {
                const dataStr = dataMatch[1];
                const width = dataStr.match(/WIDTH:\s*(\d+(?:\.\d+)?)/i)?.[1];
                const length = dataStr.match(/LENGTH:\s*(\d+(?:\.\d+)?)/i)?.[1];
                const direction = dataStr.match(/DIRECTION:\s*([^|\n\r]+)/i)?.[1];
                const entrance = dataStr.match(/ENTRANCE:\s*([^|\n\r]+)/i)?.[1];
                if (width) setLandWidth(width);
                if (length) setLandLength(length);
                if (direction) setMainDirection(direction.trim());
                if (entrance) setEntranceDir(entrance.trim());
            }
        } catch (error) { alert(t('alertGenerationFailed')); } finally { setIsAnalyzingExistingState(false); }
    };

    const handleOpenAnalysisInNewTab = () => {
        if (!existingState) return;
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(`<html><head><title>Phân tích Hiện trạng</title></head><body><pre>${existingState}</pre></body></html>`);
            newWindow.document.close();
        }
    };

    const handleCritique = async () => {
        setIsCritiquing(true);
        try {
            const result = await critiqueArchitecturalPlan({
                landSize: `${landWidth}x${landLength}${landUnit}`,
                buildSize: `${buildWidth}x${buildLength}${buildUnit}`,
                rooms: selectedRoomsSummary.map(r => `${r.name} (x${r.qty})`).join(', ') || "Phân tích yêu cầu từ thuyết minh",
                style: selectedStyle,
                customReq: customReq
            }, language as 'vi' | 'en');
            setNewMissionBrief(result);
        } catch (error) { alert("Lỗi phân tích kiến trúc."); } finally { setIsCritiquing(false); }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setLastGeneratedParams(currentParamsHash);
        try {
            const floorPlanPromptTemplate = t('floorPlanPrompt');
            const roomsBrief = selectedRoomsSummary.length > 0
                ? "Danh sách phòng: " + selectedRoomsSummary.map(r => `${r.name} (SL:${r.qty}, Tầng:${r.floors.join(',')})`).join(', ')
                : newMissionBrief.trim() ? `Phân tích: ${newMissionBrief}` : 'Thiết kế tối ưu theo phong cách hiện đại.';
            
            let additionalFloors = '';
            if (hasMezzanine) additionalFloors += '(có tầng lửng)';
            if (hasRooftop) additionalFloors += (additionalFloors ? ' và ' : '') + '(có tầng tum mái)';

            const planningSummary = `Land area ${landArea.toFixed(1)}m2, Building area ${buildAreaT1.toFixed(1)}m2, Density ${planningMetrics.density.toFixed(1)}%, FAR ${planningMetrics.far.toFixed(2)}.`;
            const finalPrompt = floorPlanPromptTemplate
                .replace('{0}', floorCount.toString())
                .replace('{1}', selectedStyle)
                .replace('{2}', roomsBrief + ". " + planningSummary)
                .replace('{3}', 'Không gian giao thông, sảnh đón, bao cảnh sân vườn theo tỷ lệ')
                .replace('{4}', customReq)
                .replace('{5}', `${landWidth}x${landLength}${landUnit}`)
                .replace('{6}', fengShui || 'Chuẩn phong thủy')
                .replace('{7}', entranceDir || 'Chính diện')
                .replace('{8}', `${buildWidth}x${buildLength}${buildUnit}`)
                .replace('{9}', additionalFloors)
                .replace('{11}', landRatio || '1:1').replace('{12}', buildRatio || 'Tự do').replace('{13}', existingState || 'Trống').replace('{14}', mainDirection || 'Chưa xác định');
            
            const contextImage = activeImage || existingStateImage || null;
            const results = await generateImages(contextImage, finalPrompt, imageCount, referenceImage, '16:9', language as 'vi' | 'en', undefined, 'gemini-3-pro-image-preview', imageSize);
            if (results.length > 0) {
                const firstImg = dataUrlToSourceImage(results[0]);
                if (firstImg) addToHistory(firstImg);
                setGeneratedImages(results);
                setSelectedImage(results[0]);
                results.forEach(img => addImageToLibrary(img));
                await addHistoryItem({
                    tab: 'utilities', sourceImage: contextImage, referenceImage: referenceImage,
                    prompt: `[2D Floor Plan] Style: ${selectedStyle}, Density: ${planningMetrics.density.toFixed(1)}%`,
                    negativePrompt: '', imageCount, generatedImages: results, generatedPrompts: null,
                });
            } else { alert(t('alertGenerationFailed')); }
        } catch (error) { alert(t('alertGenerationFailed')); } finally { setIsLoading(false); }
    };

    const handleOpenImageExternal = (img: SourceImage) => { window.open(sourceImageToDataUrl(img), '_blank'); };

    return (
        <div className={`${theme.panelBg} p-5 rounded-xl border ${theme.border} animate-fade-in`}>
            {/* Fullscreen Brief Overlay */}
            {showBriefFullscreen && (
                <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex flex-col p-10 animate-fade-in overflow-hidden">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h2 className="text-orange-500 text-2xl font-black uppercase tracking-widest">PHÂN TÍCH THUYẾT MINH CHI TIẾT</h2>
                        <button onClick={() => setShowBriefFullscreen(false)} className="text-white/60 hover:text-white transition-colors"><Icon name="x-circle" className="w-10 h-10" /></button>
                    </div>
                    <div className="flex-grow overflow-y-auto thin-scrollbar bg-white/5 rounded-3xl p-10 border border-white/10 shadow-2xl text-slate-200 text-lg leading-relaxed whitespace-pre-wrap font-medium">{newMissionBrief}</div>
                </div>
            )}

            {/* Header Control Area */}
            <div className={`mb-8 p-6 rounded-2xl border ${theme.border} bg-orange-600/5 backdrop-blur-xl shadow-2xl relative overflow-hidden`}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-600/20 rounded-xl border border-orange-500/30"><Icon name="sparkles" className="w-8 h-8 text-orange-500" /></div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-orange-500">PHÂN TÍCH NHIỆM VỤ THIẾT KẾ</h3>
                            <p className="text-xs text-slate-400 font-medium">Mô hình tháp công năng & Quy chuẩn quy hoạch</p>
                        </div>
                    </div>
                    <button onClick={onBack} className="p-2.5 rounded-full bg-slate-800 hover:bg-orange-600/20 text-slate-300 hover:text-orange-400 transition-all border border-slate-700 shadow-lg"><Icon name="arrow-uturn-left" className="w-6 h-6" /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    <div className="md:col-span-12 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">{t('floorPlanFloors')}</label>
                                <div className="flex flex-col gap-2">
                                    <select value={floorCount} onChange={(e) => setFloorCount(Number(e.target.value))} className={`w-full ${theme.inputBg} ${theme.textMain} h-[46px] px-3 rounded-xl text-xs border ${theme.border} outline-none`}>
                                        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Tầng</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <button onClick={() => setHasMezzanine(!hasMezzanine)} className={`flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all ${hasMezzanine ? 'bg-orange-600/20 border-orange-500 text-orange-400' : `bg-black/20 ${theme.border} text-slate-500`}`}>{t('floorPlanMezzanine')}</button>
                                        <button onClick={() => setHasRooftop(!hasRooftop)} className={`flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all ${hasRooftop ? 'bg-orange-600/20 border-orange-500 text-orange-400' : `bg-black/20 ${theme.border} text-slate-500`}`}>{t('floorPlanRooftop')}</button>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-8">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block px-1">Phân tích thiết kế (Briefing)</label>
                                <div className="flex gap-2 h-[84px]">
                                    <div className="flex-grow relative group cursor-zoom-in" onClick={() => newMissionBrief.trim() && setShowBriefFullscreen(true)}>
                                        <ExpandableTextarea value={newMissionBrief} onChange={(e) => setNewMissionBrief(e.target.value)} placeholder="..." minHeight="h-full" expandedHeight="h-48" className="w-full font-medium" />
                                    </div>
                                    <button onClick={handleCritique} disabled={isCritiquing || !landWidth || !landLength} className="w-32 h-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 disabled:opacity-50">
                                        <Icon name="sparkles" className={`w-6 h-6 ${isCritiquing ? 'animate-spin' : ''}`} />
                                        <span className="text-[10px] font-black uppercase tracking-tighter leading-tight text-center">PHÂN TÍCH NHIỆM VỤ</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side: Parameters & Checklist */}
                <div className="lg:col-span-4 space-y-6 max-h-[80vh] overflow-y-auto thin-scrollbar pr-3">
                    
                    {/* Planning Params */}
                    <section className={`p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-4 shadow-inner`}>
                        <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-2 border-b border-blue-500/20 pb-2">{t('floorPlanPlanningParamsTitle')}</h4>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1.5 px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t('floorPlanLandAreaLabel')}</label>
                                    <span className="text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded">{landArea.toFixed(1)} m²</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input type="text" value={landWidth} onChange={(e) => setLandWidth(e.target.value)} placeholder="Rộng" className={`flex-1 ${theme.inputBg} ${theme.textMain} p-2.5 rounded-xl text-xs border border-blue-500/20 outline-none focus:border-blue-500/50 shadow-inner`} />
                                    <span className="text-slate-600 font-bold">×</span>
                                    <input type="text" value={landLength} onChange={(e) => setLandLength(e.target.value)} placeholder="Dài" className={`flex-1 ${theme.inputBg} ${theme.textMain} p-2.5 rounded-xl text-xs border border-blue-500/20 outline-none focus:border-blue-500/50 shadow-inner`} />
                                    <select value={landUnit} onChange={(e) => setLandUnit(e.target.value as any)} className="bg-slate-800 text-[10px] text-orange-400 font-black p-2 rounded-xl border border-blue-500/20">
                                        <option value="m">m</option><option value="cm">cm</option><option value="mm">mm</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1.5 px-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{t('floorPlanBuildAreaLabel')}</label>
                                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">{buildAreaT1.toFixed(1)} m²</span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <input type="text" value={buildWidth} onChange={(e) => setBuildWidth(e.target.value)} placeholder="Rộng" className={`flex-1 ${theme.inputBg} ${theme.textMain} p-2.5 rounded-xl text-xs border border-blue-500/20 outline-none focus:border-blue-500/50 shadow-inner`} />
                                    <span className="text-slate-600 font-bold">×</span>
                                    <input type="text" value={buildLength} onChange={(e) => setBuildLength(e.target.value)} placeholder="Dài" className={`flex-1 ${theme.inputBg} ${theme.textMain} p-2.5 rounded-xl text-xs border border-blue-500/20 outline-none focus:border-blue-500/50 shadow-inner`} />
                                    <select value={buildUnit} onChange={(e) => setBuildUnit(e.target.value as any)} className="bg-slate-800 text-[10px] text-orange-400 font-black p-2 rounded-xl border border-blue-500/20">
                                        <option value="m">m</option><option value="cm">cm</option><option value="mm">mm</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-4 border-t border-blue-500/10 pt-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter px-1">{t('floorPlanMainDirection')}</label>
                                <input type="text" value={mainDirection} onChange={(e) => setMainDirection(e.target.value)} placeholder="..." className={`w-full ${theme.inputBg} ${theme.textMain} p-2 rounded-xl text-[11px] border border-blue-500/10 outline-none focus:border-blue-500/30`} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter px-1">{t('floorPlanEntrance')}</label>
                                <input type="text" value={entranceDir} onChange={(e) => setEntranceDir(e.target.value)} placeholder="..." className={`w-full ${theme.inputBg} ${theme.textMain} p-2 rounded-xl text-[11px] border border-blue-500/10 outline-none focus:border-blue-500/30`} />
                            </div>
                        </div>

                        <div className="space-y-1 mt-3">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter px-1">{t('floorPlanFengShui')}</label>
                            <input type="text" value={fengShui} onChange={(e) => setFengShui(e.target.value)} placeholder="..." className={`w-full ${theme.inputBg} ${theme.textMain} p-2 rounded-xl text-[11px] border border-blue-500/10 outline-none focus:border-blue-500/30`} />
                        </div>

                        <div className="space-y-1 mt-3">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter px-1">{t('floorPlanExistingState')}</label>
                                <div className="flex items-center gap-2">
                                    {existingStateImage && (
                                        <button onClick={handleAnalyzeExistingState} disabled={isAnalyzingExistingState} className="text-[8px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 uppercase bg-orange-500/10 px-1.5 py-0.5 rounded">
                                            <Icon name="sparkles" className={`w-2.5 h-2.5 ${isAnalyzingExistingState ? 'animate-spin' : ''}`} />
                                            {isAnalyzingExistingState ? t('analyzingExistingState') : t('analyzeExistingState')}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <textarea value={existingState} onChange={(e) => setExistingState(e.target.value)} placeholder="..." className={`w-full ${theme.inputBg} ${theme.textMain} p-2 rounded-xl text-[11px] border border-blue-500/10 h-16 resize-none outline-none focus:border-blue-500/30 shadow-inner`} />
                            <div className="mt-2">
                                {existingStateImage ? (
                                    <div className="relative group aspect-video bg-black/40 rounded-xl overflow-hidden border border-slate-700/50">
                                        <img src={sourceImageToDataUrl(existingStateImage)} className="w-full h-full object-contain cursor-zoom-in" onClick={() => handleOpenImageExternal(existingStateImage)}/>
                                        <button onClick={() => setExistingStateImage(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg"><Icon name="trash" className="w-4 h-4" /></button>
                                    </div>
                                ) : (
                                    <ImageDropzone onImageUpload={setExistingStateImage} className="w-full h-24 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-center text-slate-600 hover:bg-white/5 cursor-pointer shadow-inner">
                                        <Icon name="arrow-up-tray" className="w-6 h-6 mb-1 opacity-30" />
                                        <span className="text-[9px] font-bold uppercase tracking-tighter">Tải sơ đồ hiện trạng</span>
                                    </ImageDropzone>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Area Summary Card */}
                    <div className={`p-4 rounded-xl border border-slate-700 bg-slate-800/20 space-y-4 shadow-xl`}>
                         <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                             <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Icon name="clipboard" className="w-4 h-4" />{t('floorPlanGrandTotalArea')}</h4>
                             <span className="text-sm font-black text-white bg-slate-700 px-3 py-1 rounded-lg">{(grandTotalArea as number).toFixed(1)} m²</span>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="bg-black/30 p-3 rounded-2xl border border-white/5 shadow-lg flex flex-col items-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-tighter">{t('floorPlanDensityLabel')}</p>
                                <p className="text-lg font-black text-orange-500">{planningMetrics.density.toFixed(1)}%</p>
                             </div>
                             <div className="bg-black/30 p-3 rounded-2xl border border-white/5 shadow-lg flex flex-col items-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-tighter">{t('floorPlanFarLabel')}</p>
                                <p className="text-lg font-black text-cyan-500">{planningMetrics.far.toFixed(2)}</p>
                             </div>
                         </div>
                    </div>

                    {/* Summary Table */}
                    {selectedRoomsSummary.length > 0 && (
                        <section className="p-4 rounded-xl border border-orange-500/30 bg-orange-600/5 shadow-xl animate-scale-up">
                            <h4 className="text-[11px] font-black text-orange-400 uppercase tracking-widest mb-3 border-b border-orange-500/20 pb-2">
                                {t('floorPlanSummaryTitle')}
                            </h4>
                            <div className="max-h-60 overflow-y-auto thin-scrollbar">
                                <table className="w-full text-left text-[10px]">
                                    <thead>
                                        <tr className="text-slate-500 uppercase font-black border-b border-white/5">
                                            <th className="pb-2">Tên Phòng</th>
                                            <th className="pb-2 text-center">SL</th>
                                            <th className="pb-2 text-right">Tầng</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRoomsSummary.map((item, idx) => (
                                            <tr key={idx} className="border-b border-white/5 last:border-0">
                                                <td className="py-2 text-slate-200 font-bold">{item.name}</td>
                                                <td className="py-2 text-center text-orange-500 font-black">{item.qty}</td>
                                                <td className="py-2 text-right text-slate-400 font-mono">
                                                    <div className="flex justify-end gap-1">
                                                        {item.floors.map(f => <span key={f} className="w-4 h-4 bg-slate-800 rounded flex items-center justify-center font-black text-[8px] text-white border border-white/5">{f}</span>)}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Functional Pyramid Checklist */}
                    <section className={`p-4 rounded-xl border ${theme.border} bg-black/20 space-y-4 shadow-xl`}>
                        <h3 className="text-orange-500 font-black text-xs tracking-widest uppercase flex items-center gap-2">
                            <Icon name="sparkles" className="w-4 h-4" />
                            {t('floorPlanChecklistTitle')}
                        </h3>
                        
                        {checklistConfig.map((group: any, gIdx: number) => {
                            const groupColors = ["text-red-500", "text-yellow-500", "text-green-500", "text-blue-500", "text-purple-500"];
                            const colorClass = groupColors[gIdx] || "text-slate-300";
                            return (
                                <div key={gIdx} className="space-y-2">
                                    <h4 className={`text-[10px] font-black ${colorClass} bg-white/5 px-2 py-1.5 rounded flex items-center gap-2 border-l-2 border-current`}>
                                        {group.level}
                                    </h4>
                                    <div className="flex flex-col gap-1.5">
                                        {group.rooms.map((room: string) => (
                                            <div key={room} className={`p-3 rounded-2xl border transition-all ${checklistState[room]?.checked ? 'bg-orange-600/10 border-orange-500/30' : 'bg-black/20 border-transparent hover:bg-white/5'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox" checked={checklistState[room]?.checked} onChange={(e) => handleChecklistChange(room, e.target.checked)} className="w-5 h-5 rounded-md border-slate-600 text-orange-600 bg-slate-800" />
                                                    <div className="flex-grow min-w-0">
                                                        <p className={`text-xs font-black truncate ${checklistState[room]?.checked ? 'text-white' : 'text-slate-500'}`}>{room}</p>
                                                    </div>
                                                    {checklistState[room]?.checked && (
                                                        <div className="flex items-center gap-2">
                                                            {/* Floor Selection */}
                                                            <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5 shadow-inner">
                                                                {Array.from({ length: floorCount }, (_, i) => i + 1).map(f => (
                                                                    <button key={f} onClick={() => toggleFloorSelection(room, f)} className={`w-6 h-6 rounded-lg text-[9px] font-black transition-all ${checklistState[room].selectedFloors.includes(f) ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}>{f}</button>
                                                                ))}
                                                            </div>
                                                            {/* Quantity Control */}
                                                            <div className="flex items-center bg-slate-900 rounded-xl border border-white/5 overflow-hidden">
                                                                <button onClick={() => handleQtyChange(room, checklistState[room].qty - 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white">-</button>
                                                                <span className="w-6 text-center text-[11px] font-black text-white">{checklistState[room].qty}</span>
                                                                <button onClick={() => handleQtyChange(room, checklistState[room].qty + 1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white">+</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </section>

                    <section className="pt-2">
                        <h3 className={`font-black ${theme.textMain} text-[11px] mb-2 uppercase tracking-widest px-1`}>PHONG CÁCH</h3>
                        <select 
                            value={selectedStyle} 
                            onChange={(e) => setSelectedStyle(e.target.value)} 
                            className={`w-full ${theme.inputBg} ${theme.textMain} p-3.5 rounded-xl text-xs border ${theme.border} outline-none focus:border-orange-500 shadow-inner appearance-none`} 
                            style={{ background: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e") right 0.75rem center/1.5em 1.5em no-repeat`}}
                        >
                            {planStylePrompts.map((p: string) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </section>

                    <section>
                        <h3 className={`font-semibold ${theme.textMain} text-xs mb-1.5 uppercase tracking-wider`}>{t('floorPlanCustomReq')}</h3>
                        <textarea value={customReq} onChange={(e) => setCustomReq(e.target.value)} placeholder="..." className={`w-full ${theme.inputBg} ${theme.textMain} p-4 rounded-2xl text-xs border ${theme.border} h-40 resize-none outline-none focus:border-orange-500 shadow-inner`} />
                    </section>

                    <button onClick={handleGenerate} disabled={isLoading} className="w-full font-black py-5 px-4 rounded-3xl flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-700 text-white disabled:bg-slate-600 text-lg shadow-[0_15px_40px_rgba(234,88,12,0.4)] transition-all active:scale-95 group">
                        {isLoading ? <Icon name="sparkles" className="w-7 h-7 animate-spin" /> : <Icon name="sparkles" className="w-7 h-7 group-hover:scale-110 transition-transform" />}
                        TẠO MẶT BẰNG
                    </button>
                </div>

                {/* Main Results View */}
                <div className={`lg:col-span-8 ${theme.inputBg} rounded-[2.5rem] min-h-[60vh] flex flex-col p-8 border ${theme.border} shadow-2xl bg-[#050505] relative overflow-hidden`}>
                    {isLoading ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center">
                            <Icon name="sparkles" className="w-32 h-32 animate-spin text-orange-500 mx-auto" />
                            <p className="text-3xl font-black uppercase tracking-[0.3em] text-orange-500 animate-pulse">{t('generating')}</p>
                        </div>
                    ) : selectedImage ? (
                       <div className="flex flex-col h-full w-full">
                            <div className="flex-grow flex items-center justify-center relative group bg-black/40 rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl">
                                <img src={selectedImage} alt="Result" className="max-w-full max-h-[65vh] object-contain pointer-events-none" />
                                <div className="absolute top-8 right-8 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 z-[100]">
                                    <div className="flex items-center gap-3">
                                        <button onClick={handleUndo} disabled={historyIndex <= 0} className="bg-slate-800/95 backdrop-blur-md text-white p-4 rounded-full shadow-2xl hover:scale-110 hover:bg-orange-600 disabled:opacity-20 transition-all"><Icon name="arrow-uturn-left" className="w-6 h-6" /></button>
                                        <button onClick={handleRedo} disabled={historyIndex >= imageHistory.length - 1} className="bg-slate-800/95 backdrop-blur-md text-white p-4 rounded-full shadow-2xl hover:scale-110 hover:bg-orange-600 disabled:opacity-20 transition-all"><Icon name="arrow-uturn-right" className="w-6 h-6" /></button>
                                    </div>
                                    <a href={selectedImage} download={`plan-${Date.now()}.png`} className="bg-orange-600 text-white p-5 rounded-full shadow-[0_15px_30px_rgba(234,88,12,0.5)] hover:scale-110 transition-transform flex items-center justify-center"><Icon name="download" className="w-7 h-7" /></a>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-10">
                            <Icon name="sparkles" className="w-16 h-16 text-slate-700 opacity-30" />
                            <h3 className={`text-2xl font-black tracking-tighter ${theme.textSub} uppercase`}>{t('floorPlanEmptyHeader')}</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
