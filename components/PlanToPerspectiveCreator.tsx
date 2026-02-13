
import React, { useState, useEffect } from 'react';
import type { HistoryItem, SourceImage, ImageSize } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Icon } from './icons';
import { generateImages } from '../services/geminiService';
import { ImageDropzone } from './ImageDropzone';
import { sourceImageToDataUrl } from '../utils';
import { GoogleGenAI } from "@google/genai";

interface PlanToPerspectiveCreatorProps {
    onBack: () => void;
    addImageToLibrary: (imageDataUrl: string) => Promise<void>;
    addHistoryItem: (item: Omit<HistoryItem, 'id'>) => Promise<void>;
}

export const PlanToPerspectiveCreator: React.FC<PlanToPerspectiveCreatorProps> = ({ onBack, addImageToLibrary, addHistoryItem }) => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();

    const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
    const [referenceImage, setReferenceImage] = useState<SourceImage | null>(null);
    const [viewVector, setViewVector] = useState('-Y (Hướng chính diện)');
    const [creativityPercent, setCreativityPercent] = useState(10);
    const [isMultiView, setIsMultiView] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState('Hiện đại (Modern)');
    const [customPrompt, setCustomPrompt] = useState('');
    const [planAnalysis, setPlanAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [imageCount, setImageCount] = useState(1);
    const [imageSize, setImageSize] = useState<ImageSize>('1K');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [analysisText, setAnalysisText] = useState<string>('');

    const viewVectorOptions = [
        "-Y (Hướng chính diện - Nhìn từ dưới lên)",
        "+Y (Hướng mặt sau - Nhìn từ trên xuống)",
        "+X (Hướng cạnh phải - Nhìn từ phải sang trái)",
        "-X (Hướng cạnh trái - Nhìn từ trái sang phải)",
        "X+, Y- (Góc 3/4 trước - phải)",
        "X-, Y- (Góc 3/4 trước - trái)",
        "X+, Y+ (Góc 3/4 sau - phải)",
        "Góc chim bay (Bird's eye view - Phối cảnh tổng thể)"
    ];

    const styleOptions = [
        "Modern (Hiện đại)",
        "Minimalist (Tối giản)",
        "Tropical (Nhiệt đới)",
        "Indochine (Đông Dương)",
        "Japandi",
        "Neoclassic (Tân cổ điển)",
        "Parametric (Vị lai)",
        "Industrial (Công nghiệp)"
    ];

    const handleAnalyzePlan = async () => {
        if (!sourceImage) return;
        setIsAnalyzing(true);
        setPlanAnalysis("");
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const analysisPrompt = `Bạn là chuyên gia kiến trúc cấp cao. Hãy phân tích bản vẽ mặt bằng này kết hợp với các tham số thiết kế sau để đề xuất phương án 3D:
            - Tỷ lệ sáng tạo facade: ${creativityPercent}%
            - Hướng nhìn chủ đạo: ${isMultiView ? 'Đa hướng (3 góc phối cảnh)' : viewVector}
            - Chế độ xuất hình: ${isMultiView ? 'Multi-view (3 hình)' : 'Góc đơn'}
            - Phong cách kiến trúc: ${selectedStyle}
            - Yêu cầu bổ sung: ${customPrompt || 'Không có'}

            Hãy trình bày tóm tắt:
            1. Phân tích cấu trúc mặt bằng (vị trí cột, tường, giao thông).
            2. Cách áp dụng phong cách ${selectedStyle} vào hình khối công trình.
            3. Cách xử lý facade dựa trên giới hạn sáng tạo ${creativityPercent}% so với bản gốc.
            4. Dự kiến hiệu quả ánh sáng và vật liệu cho góc nhìn ${isMultiView ? 'tổng thể' : viewVector}.
            
            Yêu cầu: Trả về kết quả súc tích, chuyên nghiệp bằng tiếng Việt.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } },
                        { text: analysisPrompt }
                    ]
                }
            });
            setPlanAnalysis(response.text || "");
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Không thể phân tích kiến trúc lúc này.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerate = async () => {
        if (!sourceImage) {
            alert("Vui lòng tải lên ảnh 2D Plan.");
            return;
        }

        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await window.aistudio.openSelectKey();
            }
        }

        setIsLoading(true);
        setGeneratedImages([]);
        setSelectedImage(null);
        setAnalysisText('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const systemInstruction = `BẠN LÀ AI KIẾN TRÚC SƯ CHUYÊN PHÂN TÍCH MẶT BẰNG 2D VÀ TẠO PHỐI CẢNH 3D SIÊU THỰC.
            
            QUY TRÌNH XỬ LÝ:
            1. PHÂN TÍCH MẶT BẰNG: Nhận diện cấu trúc tường, cột, cửa và công năng. Mặc định cao độ 3.6m/tầng.
            2. XÁC LẬP GÓC NHÌN: Thiết lập camera theo vector người dùng cung cấp (Hệ trục XY). Chiều cao mắt người 1.6m-1.8m.
            3. TÁI TẠO 3D: Dựng khối chính xác từ mặt bằng.
            4. SÁNG TẠO KIỂM SOÁT: Cải tiến facade/chi tiết nhưng KHÔNG thay đổi bố cục quá ${creativityPercent}% so với bản gốc.
            5. DIỄN HỌA: Áp dụng vật liệu, ánh sáng theo phong cách yêu cầu.

            YÊU CẦU ĐẦU RA (BẮT BUỘC):
            - TRẢ VỀ HÌNH ẢNH: Phối cảnh 3D chất lượng cao.
            - TRẢ VỀ VĂN BẢN (THUYẾT MINH): 
               + Phân tích kiến trúc & công năng.
               + Giải trình góc nhìn phối cảnh theo hệ trục.
               + Các điểm cải tiến đề xuất (giới hạn ${creativityPercent}%).
            
            NGÔN NGỮ: TIẾNG VIỆT CHUYÊN NGÀNH KIẾN TRÚC.`;

            const actualVectors = isMultiView 
                ? [viewVector, "X+, Y- (Góc 3/4 trước - phải)", "Góc chim bay (Bird's eye view - Phối cảnh tổng thể)"] 
                : Array(imageCount).fill(viewVector);

            const allResults: string[] = [];
            let fullAnalysis = '';

            for (const vector of actualVectors) {
                const userContent = `YÊU CẦU RENDER PHỐI CẢNH 3D:
                - Dữ liệu phân tích mặt bằng: ${planAnalysis || 'Bám sát cấu trúc mặt bằng gốc.'}
                - Hướng nhìn (Vector XY): ${vector}
                - Phong cách thiết kế: ${selectedStyle}
                - Yêu cầu bổ sung: ${customPrompt || 'Tối ưu hóa ánh sáng và vật liệu thực tế.'}`;

                const parts: any[] = [
                    { inlineData: { data: sourceImage.base64, mimeType: sourceImage.mimeType } }
                ];
                if (referenceImage) {
                    parts.push({ inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType } });
                }
                parts.push({ text: userContent });

                const response = await ai.models.generateContent({
                    model: 'gemini-3-pro-image-preview',
                    contents: { parts },
                    config: {
                        systemInstruction,
                        imageConfig: {
                            aspectRatio: '16:9',
                            imageSize
                        }
                    }
                });

                if (response.candidates && response.candidates.length > 0) {
                    const candidate = response.candidates[0];
                    if (candidate.content && candidate.content.parts) {
                        candidate.content.parts.forEach(part => {
                            if (part.inlineData) {
                                allResults.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                            } else if (part.text) {
                                fullAnalysis += part.text + "\n\n---\n\n";
                            }
                        });
                    }
                }
            }

            if (allResults.length > 0) {
                setGeneratedImages(allResults);
                setSelectedImage(allResults[0]);
                setAnalysisText(fullAnalysis.trim());
                allResults.forEach(img => addImageToLibrary(img));
                
                await addHistoryItem({
                    tab: 'planToPerspectiveDesign',
                    sourceImage,
                    referenceImage: referenceImage,
                    prompt: `[Architect AI] ${isMultiView ? 'Multi-view (3)' : 'Single'} Mode, Creativity: ${creativityPercent}%, Style: ${selectedStyle}`,
                    negativePrompt: '',
                    imageCount: allResults.length,
                    generatedImages: allResults,
                    generatedPrompts: fullAnalysis.trim(),
                });
            } else {
                if (fullAnalysis.trim()) {
                    setAnalysisText(fullAnalysis.trim());
                    alert("AI không thể tạo hình ảnh cho yêu cầu này. Xem thuyết minh bên dưới.");
                } else {
                    alert(t('alertGenerationFailed'));
                }
            }
        } catch (error: any) {
            console.error("Perspective generation failed:", error);
            alert(t('alertGenerationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    const displayImageUrl = selectedImage || (sourceImage ? sourceImageToDataUrl(sourceImage) : null);

    return (
        <div className="flex flex-col h-full animate-fade-in text-left">
            <div className="mb-6 flex items-center justify-between px-1">
                <div>
                    <h2 className="text-white text-xl font-black uppercase tracking-tight">AI KIẾN TRÚC SƯ: 2D PLAN TO 3D PERSPECTIVE</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow pb-12">
                <div className="lg:col-span-4 bg-[#2a2d33] border border-slate-700/50 rounded-xl p-6 flex flex-col gap-5 shadow-2xl overflow-y-auto thin-scrollbar max-h-[85vh]">
                    <h3 className="text-white text-sm font-black uppercase tracking-widest border-b border-white/5 pb-3">CẤU HÌNH KIẾN TRÚC</h3>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">MẶT BẰNG GỐC (PLAN)</label>
                            {sourceImage ? (
                                <div className="relative aspect-video bg-black/40 rounded-lg overflow-hidden border border-slate-600 shadow-inner p-2 group">
                                    <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-contain" />
                                    <button onClick={() => { setSourceImage(null); setSelectedImage(null); setPlanAnalysis(""); }} className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-full transition-all shadow-lg z-10">
                                        <Icon name="trash" className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <ImageDropzone onImageUpload={setSourceImage} className="w-full h-32 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 hover:border-orange-500/50 transition-all cursor-pointer shadow-inner">
                                    <Icon name="arrow-up-tray" className="w-6 h-6 mb-2 opacity-30" />
                                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">Tải mặt bằng cần phân tích</div>
                                </ImageDropzone>
                            )}
                        </div>

                        {sourceImage && (
                            <div className="p-3.5 bg-black/20 rounded-xl border border-white/5 space-y-3 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest px-1">PHÂN TÍCH KIẾN TRÚC</label>
                                    <button 
                                        onClick={handleAnalyzePlan} 
                                        disabled={isAnalyzing}
                                        className="text-[10px] font-bold text-white bg-orange-600 hover:bg-orange-500 px-3 py-1 rounded-full transition-all disabled:opacity-50 shadow-md"
                                    >
                                        {isAnalyzing ? "Đang xử lý..." : planAnalysis ? "Cập nhật lại" : "Phân tích tự động"}
                                    </button>
                                </div>
                                <textarea 
                                    value={planAnalysis}
                                    onChange={(e) => setPlanAnalysis(e.target.value)}
                                    placeholder="Click nút 'Phân tích tự động' để AI đọc mặt bằng..."
                                    className="w-full bg-[#1a1c1e] border border-slate-700/50 rounded-lg p-3 text-[11px] text-slate-300 resize-none h-28 focus:outline-none focus:border-orange-500 shadow-inner italic font-medium leading-relaxed"
                                />
                            </div>
                        )}

                        <div className="p-3.5 bg-black/20 rounded-xl border border-white/5 space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">TỶ LỆ SÁNG TẠO FACADE</label>
                                <span className="text-xs font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">{creativityPercent}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="10" step="1" value={creativityPercent} 
                                onChange={(e) => setCreativityPercent(Number(e.target.value))}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-600 shadow-inner"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CHẾ ĐỘ XUẤT HÌNH</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setIsMultiView(false)} className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${!isMultiView ? 'bg-orange-600 text-white border-orange-500 shadow-lg' : 'bg-slate-800/50 text-slate-500 border-white/5 hover:border-slate-600'}`}>Góc đơn</button>
                                <button onClick={() => setIsMultiView(true)} className={`py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${isMultiView ? 'bg-orange-600 text-white border-orange-500 shadow-lg' : 'bg-slate-800/50 text-slate-500 border-white/5 hover:border-slate-600'}`}>3 góc nhìn (Auto)</button>
                            </div>
                        </div>

                        {!isMultiView && (
                            <div className="animate-fade-in space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">HƯỚNG NHÌN (VECTOR XY)</label>
                                    <select value={viewVector} onChange={(e) => setViewVector(e.target.value)} className="w-full bg-[#34383f] border border-slate-700 rounded-lg p-3 text-sm text-white outline-none focus:border-orange-500">
                                        {viewVectorOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">BIẾN THỂ</label>
                                    <div className="flex items-center justify-between bg-[#34383f] rounded-lg border border-slate-700 p-1">
                                        <button onClick={() => setImageCount(Math.max(1, imageCount - 1))} className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 text-white">-</button>
                                        <span className="text-sm font-black text-white">{imageCount}</span>
                                        <button onClick={() => setImageCount(Math.min(4, imageCount + 1))} className="w-8 h-8 flex items-center justify-center rounded bg-slate-700 text-white">+</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">PHONG CÁCH</label>
                            <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)} className="w-full bg-[#34383f] border border-slate-700 rounded-lg p-3 text-sm text-white outline-none focus:border-orange-500">
                                {styleOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>

                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading || !sourceImage}
                            className="w-full py-4.5 bg-[#8b8b8b] hover:bg-orange-600 text-[#1a1a1a] hover:text-white rounded-xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-30 shadow-xl mt-4 border border-white/5 h-16"
                        >
                            {isLoading ? <Icon name="sparkles" className="w-6 h-6 animate-spin" /> : <Icon name="sparkles" className="w-6 h-6" />}
                            DỰNG PHỐI CẢNH 3D
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-8 flex flex-col gap-6 h-[85vh]">
                    <div className="flex-grow bg-[#2a2d33] border border-slate-700/50 rounded-xl p-6 flex flex-col gap-5 shadow-2xl relative overflow-hidden">
                        <h3 className="text-white text-sm font-black uppercase tracking-widest border-b border-white/5 pb-3">KẾT QUẢ PHỐI CẢNH</h3>
                        
                        <div className="flex-grow bg-[#1c1c1c] rounded-lg border border-slate-700 flex items-center justify-center p-4 relative group overflow-hidden shadow-inner">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-6 animate-pulse">
                                    <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                                    <p className="text-orange-500 font-black text-xs uppercase tracking-widest">Đang dựng phối cảnh...</p>
                                </div>
                            ) : displayImageUrl ? (
                                <div className="relative w-full h-full flex items-center justify-center animate-fade-in">
                                    <img src={displayImageUrl} className={`max-w-full max-h-full object-contain rounded shadow-[0_30px_70px_rgba(0,0,0,0.8)] ${!selectedImage ? 'opacity-40' : ''}`} />
                                    {selectedImage && (
                                        <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <a href={selectedImage} download={`perspective-3d-${Date.now()}.png`} className="p-4 bg-orange-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center">
                                                <Icon name="download" className="w-6 h-6" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center opacity-30">
                                    <Icon name="camera" className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">PHỐI CẢNH SẼ HIỂN THỊ TẠI ĐÂY.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {(analysisText || isLoading) && (
                        <div className="bg-[#1c1c1c] border border-slate-700/50 rounded-xl p-5 shadow-2xl h-48 flex flex-col">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">THUYẾT MINH PHÂN TÍCH</h4>
                            <div className="flex-grow overflow-y-auto thin-scrollbar text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-wrap italic bg-black/20 p-3 rounded-lg border border-white/5">
                                {isLoading ? "Đang tổng hợp dữ liệu..." : analysisText || "Chưa có thuyết minh."}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
