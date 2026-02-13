
import React, { useState, useEffect } from 'react';
import { Icon } from '../icons';
import { ImageDropzone } from '../ImageDropzone';
import { sourceImageToDataUrl } from '../../utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { translations } from '../../locales/translations';
import { PromptInput } from '../shared/ControlCommon';
import type { SourceImage } from '../../types';

export const VideoPanel: React.FC<any> = ({ 
    sourceImage, setSourceImage, sourceImage2, setSourceImage2, prompt, setPrompt, 
    videoAspectRatio, setVideoAspectRatio, videoCameraAngle, setVideoCameraAngle,
    videoStyle, setVideoStyle, videoPreset, setVideoPreset,
    videoCustomParams, setVideoCustomParams,
    handleGeneration, isLoading
}) => {
    const { language } = useLanguage();
    const { theme } = useTheme();
    const v = (translations[language] as any).constants.videoTool;

    const handleMotionClick = (motion: string) => {
        setPrompt((prev: string) => prev ? `${prev}, ${motion}` : motion);
    };

    return (
        <div className="space-y-6 animate-fade-in text-left">
            {/* 1. Khung Hình Đầu & Cuối */}
            <section className="bg-black/20 p-4 rounded-2xl border border-white/5 shadow-inner">
                <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    {v.labels.frames}
                </h3>
                <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                        <div className="bg-black/40 border-2 border-dashed border-white/10 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/50 transition-all overflow-hidden relative group">
                            {sourceImage ? (
                                <>
                                    <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-cover" />
                                    <button onClick={() => setSourceImage(null)} className="absolute top-1 right-1 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Icon name="trash" className="w-3 h-3 text-white"/></button>
                                </>
                            ) : (
                                <ImageDropzone onImageUpload={setSourceImage} className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase leading-tight">{v.labels.startFrame}</span>
                                    <Icon name="plus-circle" className="w-5 h-5 text-slate-600 mt-2" />
                                </ImageDropzone>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="bg-black/40 border-2 border-dashed border-white/10 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-orange-500/50 transition-all overflow-hidden relative group">
                            {sourceImage2 ? (
                                <>
                                    <img src={sourceImageToDataUrl(sourceImage2)} className="w-full h-full object-cover" />
                                    <button onClick={() => setSourceImage2(null)} className="absolute top-1 right-1 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Icon name="trash" className="w-3 h-3 text-white"/></button>
                                </>
                            ) : (
                                <ImageDropzone onImageUpload={setSourceImage2} className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase leading-tight">{v.labels.endFrame}</span>
                                    <Icon name="plus-circle" className="w-5 h-5 text-slate-600 mt-2" />
                                </ImageDropzone>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Mô Tả Video & Gợi ý */}
            <section className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    {v.labels.description}
                </h3>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="a cinematic drone shot of a modern villa by the sea at sunset"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white h-24 resize-none focus:outline-none focus:border-orange-500/50 shadow-inner"
                />
                
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{v.labels.motionSuggestions}</p>
                    <div className="space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Icon name="globe" className="w-3 h-3" /> {v.labels.exterior}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {v.motions.exterior.map((m: any) => (
                                <button key={m.display} onClick={() => handleMotionClick(m.value)} className="px-3 py-1.5 bg-white/5 hover:bg-orange-600/20 border border-white/5 hover:border-orange-500/50 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg transition-all">{m.display}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-2">
                            <Icon name="sparkles" className="w-3 h-3" /> {v.labels.interior}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {v.motions.interior.map((m: any) => (
                                <button key={m.display} onClick={() => handleMotionClick(m.value)} className="px-3 py-1.5 bg-white/5 hover:bg-orange-600/20 border border-white/5 hover:border-orange-500/50 text-slate-300 hover:text-white text-[10px] font-bold rounded-lg transition-all">{m.display}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Tùy Chỉnh Kỹ Thuật */}
            <section className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-white text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                    {v.labels.technical}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase px-1">Tỉ Lệ Khung Hình</label>
                        <select value={videoAspectRatio} onChange={(e) => setVideoAspectRatio(e.target.value)} className="w-full bg-[#252525] border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-orange-500 appearance-none shadow-sm">
                            {v.technical.ratios.map((r: string) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase px-1">Góc Quay Phim</label>
                        <select value={videoCameraAngle} onChange={(e) => setVideoCameraAngle(e.target.value)} className="w-full bg-[#252525] border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-orange-500 appearance-none shadow-sm">
                            {v.technical.angles.map((a: string) => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase px-1">Phong Cách Phim</label>
                        <select value={videoStyle} onChange={(e) => setVideoStyle(e.target.value)} className="w-full bg-[#252525] border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-orange-500 appearance-none shadow-sm">
                            {v.technical.styles.map((s: string) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase px-1">Preset Máy Ảnh</label>
                        <select value={videoPreset} onChange={(e) => setVideoPreset(e.target.value)} className="w-full bg-[#252525] border border-white/5 rounded-xl p-2.5 text-xs text-white outline-none focus:border-orange-500 appearance-none shadow-sm">
                            {v.technical.presets.map((p: string) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase px-1">{v.labels.customParams}</label>
                        <textarea 
                            value={videoCustomParams}
                            onChange={(e) => setVideoCustomParams(e.target.value)}
                            placeholder="35mm lens, f/1.8, slow shutter..."
                            className="w-full bg-[#252525] border border-white/5 rounded-xl p-2.5 text-xs text-white resize-none h-16 focus:outline-none focus:border-orange-500 shadow-inner"
                        />
                    </div>
                </div>
            </section>

            {/* 4. Prompt Cuối Cùng & 5. Tạo Video */}
            <div className="space-y-4">
                <section className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                        {v.labels.preview}
                    </h3>
                    <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[10px] text-slate-400 font-mono space-y-1 leading-relaxed">
                        <p>Bối cảnh: {sourceImage ? 'Ảnh bắt đầu' : 'Không có'}</p>
                        <p>Mô tả: <span className="text-orange-400">"{prompt || 'cinematic architectural video'}"</span></p>
                        <p>Thông số: {videoAspectRatio} | {videoCameraAngle}</p>
                    </div>
                </section>

                <button 
                    onClick={handleGeneration}
                    disabled={isLoading || !sourceImage}
                    className="w-full py-4 bg-[#e2e2e2] hover:bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-30 text-sm uppercase tracking-widest h-16"
                >
                    {isLoading ? <Icon name="sparkles" className="w-6 h-6 animate-spin" /> : <Icon name="sparkles" className="w-6 h-6" />}
                    {v.labels.generate}
                </button>
            </div>
        </div>
    );
};

// FIX: Implement missing exported components to resolve import errors in ControlPanel.tsx

/**
 * CameraAnglePanel: Basic uploader for Camera Angle tab.
 */
export const CameraAnglePanel: React.FC<any> = ({ sourceImage, setSourceImage, prompt, setPrompt, onRefreshPrompt }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    return (
        <div className="space-y-4 text-left">
            <section>
                <h3 className={`font-semibold ${theme.textMain} text-xs uppercase tracking-wider mb-2 px-1`}>1. Tải ảnh lên (Tùy chọn)</h3>
                {sourceImage ? (
                    <div className="relative group aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 p-2 shadow-inner">
                        <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-contain" />
                        <button onClick={() => setSourceImage(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Icon name="trash" className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <ImageDropzone onImageUpload={setSourceImage} className="w-full h-32 border-2 border-dashed border-white/10 bg-[#1a1e25] rounded-xl flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 cursor-pointer shadow-inner">
                        <p className="text-[10px] font-bold">{t('dropzoneHint')}</p>
                    </ImageDropzone>
                )}
            </section>
            <PromptInput prompt={prompt} setPrompt={setPrompt} placeholder="..." label="2. Angle Description" onRefresh={onRefreshPrompt} />
        </div>
    );
};

/**
 * EditPanel: Specialized controls for Inpainting and Merging modes.
 */
export const EditPanel: React.FC<any> = ({ 
    sourceImage, setSourceImage, sourceImage2, setSourceImage2, prompt, setPrompt, 
    editSubMode, setEditSubMode, onRefreshPrompt, handleGeneration, isLoading
}) => {
    const { t } = useLanguage();
    const { theme } = useTheme();

    return (
        <div className="space-y-6 text-left">
            <section className="bg-[#1c222d] p-1 rounded-xl border border-white/5">
                <div className="grid grid-cols-2 gap-1">
                    <button onClick={() => setEditSubMode('inpaint')} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${editSubMode === 'inpaint' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Inpaint</button>
                    <button onClick={() => setEditSubMode('smartEdit')} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${editSubMode === 'smartEdit' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Smart Edit</button>
                    <button onClick={() => setEditSubMode('mergeHouse')} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${editSubMode === 'mergeHouse' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Merge</button>
                    <button onClick={() => setEditSubMode('canva')} className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${editSubMode === 'canva' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>Canva Mix</button>
                </div>
            </section>

            <section className="space-y-4">
                <div>
                    <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-2 px-1">1. {t('uploadImage')}</h3>
                    {sourceImage ? (
                        <div className="relative group aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 p-2 shadow-inner">
                            <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-contain" />
                            <button onClick={() => setSourceImage(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Icon name="trash" className="w-4 h-4" /></button>
                        </div>
                    ) : (
                        <ImageDropzone onImageUpload={setSourceImage} className="w-full h-32 border-2 border-dashed border-white/10 bg-[#1a1e25] rounded-xl flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 cursor-pointer shadow-inner">
                            <p className="text-[10px] font-bold">{t('dropzoneHint')}</p>
                        </ImageDropzone>
                    )}
                </div>

                {['mergeHouse', 'mergeMaterial', 'mergeFurniture'].includes(editSubMode) && (
                    <div>
                        <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-2 px-1">2. Target Image</h3>
                        {sourceImage2 ? (
                            <div className="relative group aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 p-2 shadow-inner">
                                <img src={sourceImageToDataUrl(sourceImage2)} className="w-full h-full object-contain" />
                                <button onClick={() => setSourceImage2(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Icon name="trash" className="w-4 h-4" /></button>
                            </div>
                        ) : (
                            <ImageDropzone onImageUpload={setSourceImage2} className="w-full h-32 border-2 border-dashed border-white/10 bg-[#1a1e25] rounded-xl flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 cursor-pointer shadow-inner">
                                <p className="text-[10px] font-bold">{t('dropzoneHint')}</p>
                            </ImageDropzone>
                        )}
                    </div>
                )}
            </section>

            <PromptInput prompt={prompt} setPrompt={setPrompt} placeholder={t('promptPlaceholder.edit')} label="Prompt" onRefresh={onRefreshPrompt} />

            <button 
                onClick={handleGeneration}
                disabled={isLoading || !sourceImage}
                className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 text-xs uppercase tracking-widest"
            >
                {isLoading ? <Icon name="sparkles" className="w-5 h-5 animate-spin" /> : <Icon name="sparkles" className="w-5 h-5" />}
                Render Edit
            </button>
        </div>
    );
};

/**
 * PlanTo3dPanel: Simple panel for converting plans to 3D.
 */
export const PlanTo3dPanel: React.FC<any> = ({ sourceImage, setSourceImage, prompt, setPrompt, onRefreshPrompt }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    return (
        <div className="space-y-4 text-left">
            <section>
                <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-2 px-1">1. Tải lên Mặt bằng (Plan)</h3>
                {sourceImage ? (
                    <div className="relative group aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 p-2 shadow-inner">
                        <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-contain" />
                        <button onClick={() => setSourceImage(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Icon name="trash" className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <ImageDropzone onImageUpload={setSourceImage} className="w-full h-32 border-2 border-dashed border-white/10 bg-[#1a1e25] rounded-xl flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 cursor-pointer shadow-inner">
                        <p className="text-[10px] font-bold">{t('dropzoneHint')}</p>
                    </ImageDropzone>
                )}
            </section>
            <PromptInput prompt={prompt} setPrompt={setPrompt} placeholder="..." label="2. Phong cách mong muốn" onRefresh={onRefreshPrompt} />
        </div>
    );
};

/**
 * CanvaPanel: Panel for Canva Mix mode.
 */
export const CanvaPanel: React.FC<any> = ({ sourceImage, setSourceImage, canvaObjects, setCanvaObjects, isLoading }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();

    const handleAddCanvaObject = (img: SourceImage) => {
        setCanvaObjects((prev: SourceImage[]) => [...prev, img]);
    };

    return (
        <div className="space-y-6 text-left">
            <section>
                <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-2 px-1">1. Background Image</h3>
                {sourceImage ? (
                    <div className="relative group aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 p-2 shadow-inner">
                        <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-contain" />
                        <button onClick={() => setSourceImage(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Icon name="trash" className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <ImageDropzone onImageUpload={setSourceImage} className="w-full h-32 border-2 border-dashed border-white/10 bg-[#1a1e25] rounded-xl flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 cursor-pointer shadow-inner">
                        <p className="text-[10px] font-bold">{t('dropzoneHint')}</p>
                    </ImageDropzone>
                )}
            </section>

            <section>
                <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-2 px-1">2. Decor Objects</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {canvaObjects.map((obj: SourceImage, idx: number) => (
                        <div key={idx} className="relative aspect-square bg-black/40 rounded-lg border border-white/5 p-1 overflow-hidden group shadow-inner">
                            <img src={sourceImageToDataUrl(obj)} className="w-full h-full object-cover" />
                            <button onClick={() => setCanvaObjects((prev: SourceImage[]) => prev.filter((_, i) => i !== idx))} className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100"><Icon name="trash" className="w-3 h-3"/></button>
                        </div>
                    ))}
                    <ImageDropzone onImageUpload={handleAddCanvaObject} className="aspect-square border-2 border-dashed border-white/10 bg-[#1a1e25] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 shadow-inner">
                        <Icon name="plus-circle" className="w-5 h-5 text-slate-500" />
                    </ImageDropzone>
                </div>
            </section>
        </div>
    );
};

/**
 * PromptGenPanel: Panel for generating prompts from images.
 */
export const PromptGenPanel: React.FC<any> = ({ sourceImage, setSourceImage }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    return (
        <div className="space-y-4 text-left">
            <section>
                <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-2 px-1">Chọn ảnh để phân tích prompt</h3>
                {sourceImage ? (
                    <div className="relative group aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 p-2 shadow-inner">
                        <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-contain" />
                        <button onClick={() => setSourceImage(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Icon name="trash" className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <ImageDropzone onImageUpload={setSourceImage} className="w-full h-32 border-2 border-dashed border-white/10 bg-[#1a1e25] rounded-xl flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 cursor-pointer shadow-inner">
                        <p className="text-[10px] font-bold">{t('dropzoneHint')}</p>
                    </ImageDropzone>
                )}
            </section>
        </div>
    );
};

/**
 * SectionPanel: Panel for creating 3D sections.
 */
export const SectionPanel: React.FC<any> = ({ sourceImage, setSourceImage, prompt, setPrompt, onRefreshPrompt }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    return (
        <div className="space-y-4 text-left">
            <section>
                <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-2 px-1">1. Tải lên 2D Plan</h3>
                {sourceImage ? (
                    <div className="relative group aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 p-2 shadow-inner">
                        <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-contain" />
                        <button onClick={() => setSourceImage(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Icon name="trash" className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <ImageDropzone onImageUpload={setSourceImage} className="w-full h-32 border-2 border-dashed border-white/10 bg-[#1a1e25] rounded-xl flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 cursor-pointer shadow-inner">
                        <p className="text-[10px] font-bold">{t('dropzoneHint')}</p>
                    </ImageDropzone>
                )}
            </section>
            <PromptInput prompt={prompt} setPrompt={setPrompt} placeholder="..." label="2. Yêu cầu chi tiết" onRefresh={onRefreshPrompt} />
        </div>
    );
};

/**
 * PhotoToSketchPanel: Panel for Photo to Sketch conversion.
 */
export const PhotoToSketchPanel: React.FC<any> = ({ sourceImage, setSourceImage }) => {
    const { t } = useLanguage();
    const { theme } = useTheme();
    return (
        <div className="space-y-4 text-left">
            <section>
                <h3 className="text-white text-[11px] font-black uppercase tracking-widest mb-2 px-1">1. Tải lên ảnh chụp</h3>
                {sourceImage ? (
                    <div className="relative group aspect-video bg-black/40 rounded-xl overflow-hidden border border-white/5 p-2 shadow-inner">
                        <img src={sourceImageToDataUrl(sourceImage)} className="w-full h-full object-contain" />
                        <button onClick={() => setSourceImage(null)} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Icon name="trash" className="w-4 h-4" /></button>
                    </div>
                ) : (
                    <ImageDropzone onImageUpload={setSourceImage} className="w-full h-32 border-2 border-dashed border-white/10 bg-[#1a1e25] rounded-xl flex flex-col items-center justify-center text-center text-slate-500 hover:bg-white/5 cursor-pointer shadow-inner">
                        <p className="text-[10px] font-bold">{t('dropzoneHint')}</p>
                    </ImageDropzone>
                )}
            </section>
        </div>
    );
};
