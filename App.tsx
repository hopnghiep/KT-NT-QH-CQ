
import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { SourceImage, HistoryItem, ActiveTab, AspectRatio, EditSubMode, ObjectTransform, BoundingBox, ImageSize, UserPassword } from './types';
import { generateImages, editImage, generateVideo, mergeImages, generatePromptFromImage, placeAndRenderFurniture, generateArchitecturalPrompts, generatePromptFromPlan, analyzePlanStyle, generateMoodboard, applyLighting, generateVideoScriptPrompt, extendView, generateStyleChangePrompt, analyzeCharacterImage } from './services/geminiService';
import { sourceImageToDataUrl, copyToClipboard, dataUrlToSourceImage, cropImage, compositeImage } from './utils';
import { useHistory } from './hooks/useHistory';
import { useLibrary } from './hooks/useLibrary';
import { useLanguage } from './contexts/LanguageContext';
import { useTheme } from './contexts/ThemeContext';
import { translations } from './locales/translations';

import { WelcomeScreen } from './components/WelcomeScreen';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TopNav, MainCategory } from './components/TopNav';
import { ControlPanel } from './components/ControlPanel';
import { GalleryPanel } from './components/GalleryPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { FullscreenViewer } from './components/FullscreenViewer';
import { UtilitiesView } from './components/UtilitiesView';
import { LibraryView } from './components/LibraryView';
import { FloorPlanGenerator } from './components/FloorPlanGenerator';
import { BlueprintCreator } from './components/BlueprintCreator';
import { VirtualTourCreator } from './components/VirtualTourCreator';
import { ExtendViewCreator } from './components/ExtendViewCreator';
import { FengShuiTool } from './components/FengShuiTool';
import { LightingCreator } from './components/LightingCreator';
import { CreativeFusionCreator } from './components/CreativeFusionCreator';
import { ChangeStyleCreator } from './components/ChangeStyleCreator';
import { StandardsConsultant } from './components/StandardsConsultant';
import { SectionTo3DCreator } from './components/SectionTo3DCreator';
import { PlanToElevationCreator } from './components/PlanToElevationCreator';
import { DesignMissionCreator } from './components/DesignMissionCreator';
import { PlanToPerspectiveCreator } from './components/PlanToPerspectiveCreator';
import { CameraAngleView } from './components/CameraAngleView';
import { GeminiChat } from './components/GeminiChat';
import { PromptGeneratorView } from './components/PromptGeneratorView';

export default function App() {
  const { language, t } = useLanguage();
  const { theme } = useTheme();
  const [isAppStarted, setIsAppStarted] = useState(false);
  const [mainCategory, setMainCategory] = useState<MainCategory>('design');
  const [activeTab, setActiveTab] = useState<ActiveTab>('standards');

  const [sourceImage, setSourceImage] = useState<SourceImage | null>(null);
  const [sourceImage2, setSourceImage2] = useState<SourceImage | null>(null);
  const [referenceImage, setReferenceImage] = useState<SourceImage | null>(null);
  const [editReferenceImage, setEditReferenceImage] = useState<SourceImage | null>(null);
  const [maskImage, setMaskImage] = useState<SourceImage | null>(null);
  const [prompt, setPrompt] = useState(t('promptInitial'));
  const [negativePrompt, setNegativePrompt] = useState(t('defaultNegativePrompt'));
  const [imageCount, setImageCount] = useState(2);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('auto');
  const [imageSize, setImageSize] = useState<ImageSize>('1K');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<string | null>(null);
  const [promptTabSourceImage, setPromptTabSourceImage] = useState<SourceImage | null>(null);
  const [characterImage, setCharacterImage] = useState<SourceImage | null>(null);
  const [characterDescription, setCharacterDescription] = useState('');
  const [isAnalyzingCharacter, setIsAnalyzingCharacter] = useState(false);
  const [lastUsedPrompt, setLastUsedPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const { history, addHistoryItem, clearHistory } = useHistory();
  const { library, addImageToLibrary, removeImageFromLibrary, justSavedId } = useLibrary();
  const [isEditingMask, setIsEditingMask] = useState(false);
  const [isSelectingArea, setIsSelectingArea] = useState(false);
  const [isZoomedEditing, setIsZoomedEditing] = useState(false);
  const [brushSize, setBrushSize] = useState(40); 
  const [planTo3dMode, setPlanTo3dMode] = useState<'render' | 'colorize' | 'technical'>('render');
  const [editSubMode, setEditSubMode] = useState<EditSubMode>('inpaint');
  const [editTool, setEditTool] = useState<'lasso' | 'brush'>('brush');
  const [selectionMode, setSelectionMode] = useState<'union' | 'subtract'>('union');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [videoModel] = useState('veo-3.1-fast-generate-preview');
  const [aiModel, setAiModel] = useState<string>('gemini-2.5-flash-image');

  // Video generation specific states
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9 (Ngang)');
  const [videoCameraAngle, setVideoCameraAngle] = useState('Drone bay xuyên (Drone fly-through)');
  const [videoStyle, setVideoStyle] = useState('8K Siêu Thực (Photorealistic)');
  const [videoPreset, setVideoPreset] = useState('DSLR Điện ảnh (Xóa phông, 24fps)');
  const [videoCustomParams, setVideoCustomParams] = useState('');

  const [editBox, setEditBox] = useState<BoundingBox | null>(null);

  const [canvaObjects, setCanvaObjects] = useState<SourceImage[]>([]);
  const [canvaObjectTransforms, setCanvaObjectTransforms] = useState<ObjectTransform[]>([]);
  const [selectedCanvaObjectIndex, setSelectedCanvaObjectIndex] = useState<number | null>(null);
  const [isCanvaLayoutLocked, setIsCanvaLayoutLocked] = useState(false);

  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [virtualTourHistory, setVirtualTourHistory] = useState<string[]>([]);
  const [virtualTourIndex, setVirtualTourIndex] = useState(-1);

  const [moodboardSourceImage, setMoodboardSourceImage] = useState<SourceImage | null>(null);
  const [moodboardReferenceImage, setMoodboardReferenceImage] = useState<SourceImage | null>(null);
  const [moodboardPrompt, setMoodboardPrompt] = useState('');
  const [moodboardImageCount, setMoodboardImageCount] = useState(2);
  const [moodboardGeneratedImages, setMoodboardGeneratedImages] = useState<string[]>([]);
  const [moodboardSelectedImage, setMoodboardSelectedImage] = useState<string | null>(null);

  const [lightingSourceImage, setLightingSourceImage] = useState<SourceImage | null>(null);
  const [lightingSelectedPrompts, setLightingSelectedPrompts] = useState<{interior: string; exterior: string}>({ interior: '', exterior: '' });
  const [lightingImageCount, setLightingImageCount] = useState(2);
  const [lightingGeneratedImages, setLightingGeneratedImages] = useState<string[]>([]);
  const [lightingSelectedImage, setLightingSelectedImage] = useState<string | null>(null);

  const [videoPromptSourceImage, setVideoPromptSourceImage] = useState<SourceImage | null>(null);
  const [videoPromptUserPrompt, setVideoPromptUserPrompt] = useState('');
  const [videoPromptGeneratedPrompt, setVideoPromptGeneratedPrompt] = useState<string | null>(null);

  const [extendViewSourceImage, setExtendViewSourceImage] = useState<SourceImage | null>(null);
  const [extendViewAspectRatio, setExtendViewAspectRatio] = useState<AspectRatio>('16:9');
  const [extendViewImageCount, setExtendViewImageCount] = useState(2);
  const [extendViewImageCountCount, setExtendViewImageCountCount] = useState(2);
  const [extendViewGeneratedImages, setExtendViewGeneratedImages] = useState<string[]>([]);
  const [extendViewSelectedImage, setExtendViewSelectedImage] = useState<string | null>(null);

  const [changeStyleSourceImage, setChangeStyleSourceImage] = useState<SourceImage | null>(null);
  const [changeStyleUserPrompt, setChangeStyleUserPrompt] = useState('');
  const [changeStyleGeneratedPrompt, setChangeStyleGeneratedPrompt] = useState<string | null>(null);
  const [changeStyleImageCount, setChangeStyleImageCount] = useState(2);
  const [changeStyleGeneratedImages, setChangeStyleGeneratedImages] = useState<string[]>([]);
  const [changeStyleSelectedImage, setChangeStyleSelectedImage] = useState<string | null>(null);

  const [externalActiveUtility, setExternalActiveUtility] = useState<string | null>(null);

  const lassoEditorRef = useRef<{ clear: () => void, undo: () => void, redo: () => void }>(null);
  const brushEditorRef = useRef<{ clear: () => void, undo: () => void, redo: () => void }>(null);
  const areaSelectorRef = useRef<{ clear: () => void }>(null);
  const isRestoringRef = useRef(false);

  // Security Check: Verify session on tab/state change
  useEffect(() => {
    if (!isAppStarted) return;
    const sessionPwd = localStorage.getItem('aicomplex_current_session');
    const userPwdsRaw = localStorage.getItem('aicomplex_user_pwds');
    const userPwds: UserPassword[] = userPwdsRaw ? JSON.parse(userPwdsRaw) : [];
    
    if (!sessionPwd || !userPwds.some(u => u.password === sessionPwd)) {
      setIsAppStarted(false);
      localStorage.removeItem('aicomplex_current_session');
    }
  }, [activeTab, mainCategory, isAppStarted]);

  const handleRestoreHistory = useCallback((item: HistoryItem) => {
    isRestoringRef.current = true;
    setActiveTab(item.tab as ActiveTab);
    setSourceImage(item.sourceImage);
    setSourceImage2(item.sourceImage2 || null);
    setReferenceImage(item.referenceImage || null);
    setPrompt(item.prompt);
    setNegativePrompt(item.negativePrompt || '');
    setImageCount(item.imageCount);
    setGeneratedImages(item.generatedImages);
    setGeneratedPrompts(item.generatedPrompts || null);
    setSelectedImage(item.generatedImages.length > 0 ? item.generatedImages[0] : null);
    setGeneratedVideoUrl(null);
    setIsZoomedEditing(false);
  }, []);

  const handleUndo = useCallback(() => {
    if (currentHistoryIndex + 1 < history.length) {
      const nextIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(nextIndex);
      handleRestoreHistory(history[nextIndex]);
    }
  }, [currentHistoryIndex, history, handleRestoreHistory]);

  const handleRedo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      const nextIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(nextIndex);
      handleRestoreHistory(history[nextIndex]);
    }
  }, [currentHistoryIndex, history, handleRestoreHistory]);

  const handleMoodboardGeneration = async () => {
    if (!moodboardSourceImage || !moodboardPrompt) return alert(t('alertMoodboard'));
    setIsLoading(true);
    setLoadingMessage(t('generatingMoodboard'));
    try {
      const images = await generateMoodboard(moodboardSourceImage, moodboardPrompt, moodboardReferenceImage, moodboardImageCount, language as 'vi' | 'en');
      setMoodboardGeneratedImages(images);
    } catch (error) {
      alert(t('alertGenerationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLightingGeneration = async () => {
    if (!lightingSourceImage || (!lightingSelectedPrompts.interior && !lightingSelectedPrompts.exterior)) return alert(t('alertLighting'));
    setIsLoading(true);
    setLoadingMessage(t('generatingLighting'));
    try {
      const lightingPrompt = lightingSelectedPrompts.interior || lightingSelectedPrompts.exterior;
      const images = await applyLighting(lightingSourceImage, lightingPrompt, lightingImageCount, language as 'vi' | 'en');
      setLightingGeneratedImages(images);
    } catch (error) {
      alert(t('alertGenerationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVirtualTourImageUpload = (image: SourceImage | null) => {
    if (!image) {
      setVirtualTourHistory([]);
      setVirtualTourIndex(-1);
      setSourceImage(null); // FIX: Clear global sourceImage to trigger UI update
      return;
    }
    const dataUrl = sourceImageToDataUrl(image);
    setVirtualTourHistory([dataUrl]);
    setVirtualTourIndex(0);
    handleSourceImageUpload(image);
  };

  const handleVirtualTourNavigation = async (navPrompt: string) => {
    const currentImgUrl = virtualTourHistory[virtualTourIndex];
    if (!currentImgUrl) return;
    const currentImg = dataUrlToSourceImage(currentImgUrl);
    if (!currentImg) return;
    setIsLoading(true);
    try {
      const results = await generateImages(currentImg, navPrompt, 1, null, '16:9', language as 'vi' | 'en');
      if (results.length > 0) {
        const newHistory = virtualTourHistory.slice(0, virtualTourIndex + 1);
        newHistory.push(results[0]);
        setVirtualTourHistory(newHistory);
        setVirtualTourIndex(newHistory.length - 1);
      }
    } catch (error) {
      alert(t('alertTourFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVirtualTourUndo = () => { if (virtualTourIndex > 0) setVirtualTourIndex(prev => prev - 1); };
  const handleVirtualTourRedo = () => { if (virtualTourIndex < virtualTourHistory.length - 1) setVirtualTourIndex(prev => prev + 1); };
  const handleVirtualTourHistorySelect = (index: number) => { setVirtualTourIndex(index); };

  const handleVideoPromptGeneration = async (srcImg: SourceImage, userP: string) => {
    setIsLoading(true);
    setLoadingMessage(t('generatingVideoPrompt'));
    try {
      const script = await generateVideoScriptPrompt(srcImg, userP, language as 'vi' | 'en');
      setVideoPromptGeneratedPrompt(script);
    } catch (error) {
      alert(t('alertGenerationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendViewGeneration = async () => {
    if (!extendViewSourceImage) return;
    setIsLoading(true);
    setLoadingMessage(t('generatingExtendedView'));
    try {
      const images = await extendView(extendViewSourceImage, extendViewAspectRatio, extendViewImageCount, language as 'vi' | 'en');
      setExtendViewGeneratedImages(images);
    } catch (error) {
      alert(t('alertGenerationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStylePromptGeneration = async () => {
    if (!changeStyleSourceImage || !changeStyleUserPrompt) return alert(t('alertStylePromptGen'));
    setIsLoading(true);
    setLoadingMessage(t('generatingStylePrompt'));
    try {
      const script = await generateStyleChangePrompt(changeStyleSourceImage, changeStyleUserPrompt, language as 'vi' | 'en');
      setChangeStyleGeneratedPrompt(script);
    } catch (error) {
      alert(t('alertGenerationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStyleImageGeneration = async () => {
    if (!changeStyleSourceImage || !changeStyleGeneratedPrompt) return alert(t('alertStyleChange'));
    setIsLoading(true);
    setLoadingMessage(t('generatingStyledImages'));
    try {
      const images = await generateImages(changeStyleSourceImage, changeStyleGeneratedPrompt, changeStyleImageCount, null, '4:3', language as 'vi' | 'en');
      setChangeStyleGeneratedImages(images);
    } catch (error) {
      alert(t('alertGenerationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharacterImageUpload = async (image: SourceImage) => {
    setCharacterImage(image);
    setIsAnalyzingCharacter(true);
    try {
      const description = await analyzeCharacterImage(image, language as 'vi' | 'en');
      setCharacterDescription(description);
    } catch (error) {
      console.error("Failed to analyze character:", error);
    } finally {
      setIsAnalyzingCharacter(false);
    }
  };

  const handleGenerateFromPromptTab = (promptText: string) => {
    if (!promptTabSourceImage) {
      alert(t('alertNoSourceForPrompt'));
      return;
    }
    setSourceImage(promptTabSourceImage);
    setPrompt(promptText);
    setNegativePrompt(t('defaultNegativePrompt'));
    setActiveTab('create');
  };

  const handleDeleteGeneratedImage = useCallback((url: string) => {
    setGeneratedImages(prev => {
        const newList = prev.filter(img => img !== url);
        if (selectedImage === url) {
            setSelectedImage(newList.length > 0 ? newList[0] : null);
        }
        return newList;
    });
  }, [selectedImage]);

  useEffect(() => {
    if (generatedImages.length > 0 && !selectedImage) {
      setSelectedImage(generatedImages[0]);
    }
  }, [generatedImages, selectedImage]);
  
  useEffect(() => {
      const editTabs = ['edit', 'smartEdit', 'mergeHouse', 'mergeMaterial', 'mergeFurniture', 'canva'];
      if (!editTabs.includes(activeTab) || !sourceImage) setIsEditingMask(false);
      if (activeTab !== 'cameraAngle' || !sourceImage) setIsSelectingArea(false);
      if (!editTabs.includes(activeTab)) setIsZoomedEditing(false);
  }, [activeTab, sourceImage]);

  useEffect(() => {
    const needsMask = activeTab === 'edit' || activeTab === 'smartEdit';
    if (needsMask && sourceImage && (editTool === 'lasso' || editSubMode === 'smartEdit' || isZoomedEditing)) {
      setIsEditingMask(true);
    } else {
      setIsEditingMask(false);
    }
  }, [activeTab, sourceImage, editTool, editSubMode, isZoomedEditing]);
  
  useEffect(() => {
    if (isRestoringRef.current) {
        isRestoringRef.current = false;
        return;
    }
    
    // Đồng bộ subMode khi chuyển tab Sidebar
    if (activeTab === 'edit') setEditSubMode('inpaint');
    else if (activeTab === 'smartEdit') setEditSubMode('smartEdit');
    else if (activeTab === 'mergeHouse') setEditSubMode('mergeHouse');
    else if (activeTab === 'mergeMaterial') setEditSubMode('mergeMaterial');
    else if (activeTab === 'mergeFurniture') setEditSubMode('mergeFurniture');
    else if (activeTab === 'canva') setEditSubMode('canva');

    if (activeTab === 'create') {
        setPrompt(t('promptInitial'));
        setNegativePrompt(t('defaultNegativePrompt'));
    } else if (activeTab === 'interior') {
        setPrompt(t('promptInterior'));
        setNegativePrompt(t('defaultNegativePrompt'));
    } else if (activeTab === 'planning') {
        setPrompt(t('promptPlanning'));
        setNegativePrompt(t('defaultNegativePrompt'));
    } else if (activeTab === 'landscape') {
        setNegativePrompt(t('defaultNegativePrompt'));
    } else if (activeTab === 'photoToSketch') {
        setPrompt(t('photoToSketchPrompt'));
        setNegativePrompt('');
    } else if (activeTab === 'sectionTo3d') {
        setPrompt("prompt section to 3d");
        setNegativePrompt('');
    } else if (activeTab === 'planToElevation') {
        setPrompt("");
        setNegativePrompt('');
    } else if (['cameraAngle', 'edit', 'smartEdit', 'mergeHouse', 'mergeMaterial', 'mergeFurniture', 'video', 'canva', 'prompt', 'utilities', 'library', 'floorPlan', 'blueprint', 'virtualTour', 'extendView', 'fengShui', 'lighting', 'creativeFusion', 'changeStyle', 'standards', 'designMission', 'planToPerspectiveDesign'].includes(activeTab)) {
        setPrompt('');
        setNegativePrompt('');
    } else if (activeTab === 'planTo3d') {
        setPrompt(t('promptPlanTo3d'));
        setNegativePrompt('');
        setPlanTo3dMode('render');
    }
    setCurrentHistoryIndex(-1);
    setIsZoomedEditing(false);
  }, [activeTab, t]);

  const handleDeleteSelectedCanvaObject = useCallback(() => {
    if (selectedCanvaObjectIndex === null) return;
    setCanvaObjects(prev => prev.filter((_, i) => i !== selectedCanvaObjectIndex));
    setCanvaObjectTransforms(prev => prev.filter((_, i) => i !== selectedCanvaObjectIndex));
    setSelectedCanvaObjectIndex(null);
  }, [selectedCanvaObjectIndex]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if (activeTab === 'canva' && selectedCanvaObjectIndex !== null && event.key === 'Backspace') {
            event.preventDefault();
            handleDeleteSelectedCanvaObject();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, selectedCanvaObjectIndex, handleDeleteSelectedCanvaObject]);

  const handleSourceImageUpload = (image: SourceImage | null) => {
    if (!image) {
        if(activeTab === 'edit' && (editSubMode === 'canva' || editSubMode === 'smartEdit')) {
          setEditBox(null);
        } else {
          setSourceImage(null);
        }
        setIsZoomedEditing(false);
        return;
    }
    
    if ((activeTab === 'edit' || activeTab === 'canva') && (editSubMode === 'canva' || editSubMode === 'smartEdit')) {
        setCanvaObjects([]);
        setCanvaObjectTransforms([]);
        setSelectedCanvaObjectIndex(null);
        setEditBox(null);
    }

    setSourceImage(image);
    
    if (activeTab === 'prompt') {
      setPromptTabSourceImage(image);
      setGeneratedPrompts(null);
    }
    
    setSourceImage2(null);
    setMaskImage(null);
    setEditReferenceImage(null);
    setIsSelectingArea(false);
    setIsZoomedEditing(false);
    lassoEditorRef.current?.clear();
    brushEditorRef.current?.clear();
    areaSelectorRef.current?.clear();
    
    if (activeTab !== 'prompt') {
        const dataUrl = sourceImageToDataUrl(image);
        setGeneratedImages([dataUrl]);
        setSelectedImage(dataUrl);
    }
    
    setGeneratedVideoUrl(null);
  };

  const handleRefresh = useCallback(() => {
      setSourceImage(null);
      setSourceImage2(null);
      setReferenceImage(null);
      setEditReferenceImage(null);
      setMaskImage(null);
      setGeneratedImages([]);
      setSelectedImage(null);
      setGeneratedVideoUrl(null);
      setGeneratedPrompts(null);
      setEditBox(null);
      setCanvaObjects([]);
      setCanvaObjectTransforms([]);
      setSelectedCanvaObjectIndex(null);
      setCurrentHistoryIndex(-1);
      setIsZoomedEditing(false);
      
      if (activeTab === 'create') {
          setPrompt(t('promptInitial'));
          setNegativePrompt(t('defaultNegativePrompt'));
      } else if (activeTab === 'interior') {
          setPrompt(t('promptInterior'));
          setNegativePrompt(t('defaultNegativePrompt'));
      } else if (activeTab === 'planning') {
          setPrompt(t('promptPlanning'));
          setNegativePrompt(t('defaultNegativePrompt'));
      } else if (activeTab === 'photoToSketch') {
          setPrompt(t('photoToSketchPrompt'));
          setNegativePrompt('');
      } else if (activeTab === 'sectionTo3d') {
          setPrompt("prompt section to 3d");
          setNegativePrompt('');
      } else if (activeTab === 'planToElevation') {
          setPrompt("");
          setNegativePrompt('');
      } else if (activeTab === 'planTo3d') {
          setPrompt(t('promptPlanTo3d'));
      } else {
          setPrompt('');
          setNegativePrompt('');
      }

      lassoEditorRef.current?.clear();
      brushEditorRef.current?.clear();
      areaSelectorRef.current?.clear();
  }, [activeTab, t]);

  const handleAreaSelectedAndGenerate = useCallback(async (croppedAreaImage: SourceImage | null, box?: BoundingBox) => {
    if (editSubMode === 'smartEdit' || activeTab === 'cameraAngle') {
        setEditBox(box || null);
        setIsSelectingArea(false);
        return;
    }

    if (!sourceImage || !croppedAreaImage) return;
    setIsSelectingArea(false);
    setIsLoading(true);
    setGeneratedImages([]);
    setSelectedImage(null);
    setGeneratedVideoUrl(null);
    setLoadingMessage(t('loadingAnalyzingArea'));
    try {
        const images = await generateImages(croppedAreaImage, t('promptCloseUp'), imageCount, null, '4:3', language, undefined, aiModel, imageSize);
        if (images.length > 0) {
            setGeneratedImages(images);
            images.forEach(img => addImageToLibrary(img));
            await addHistoryItem({
                tab: activeTab,
                sourceImage,
                sourceImage2: croppedAreaImage,
                referenceImage: null,
                prompt: t('promptCloseUp'),
                negativePrompt: '',
                imageCount,
                generatedImages: images,
                generatedPrompts: null,
            });
            setCurrentHistoryIndex(0);
        }
    } catch (error: any) {
        alert(t('alertGenerationFailed'));
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [sourceImage, imageCount, activeTab, editSubMode, addHistoryItem, t, language, addImageToLibrary, aiModel, imageSize]);

  const handleGeneration = useCallback(async () => {
    const isEditTab = ['edit', 'smartEdit', 'mergeHouse', 'mergeMaterial', 'mergeFurniture', 'canva'].includes(activeTab);
    
    if (!sourceImage && activeTab !== 'create' && activeTab !== 'interior' && activeTab !== 'planning' && activeTab !== 'landscape' && activeTab !== 'prompt') return alert(t('alertUploadSource'));
    
    if (aiModel === 'gemini-3-pro-image-preview' || activeTab === 'video') {
        if (window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await window.aistudio.openSelectKey();
            }
        }
    }

    if (isEditTab) {
        if (editSubMode === 'inpaint' && !maskImage) return alert(t('alertDrawMask'));
        if (editSubMode === 'smartEdit') {
          if (!editBox) return alert(t('alertSelectSmartBox'));
          if (!maskImage) return alert(t('alertSelectSmartMask'));
        }
        if ((editSubMode === 'mergeHouse' || editSubMode === 'mergeMaterial' || editSubMode === 'mergeFurniture') && !sourceImage2) return alert(t('alertUploadBothImages'));
        if (editSubMode === 'canva' && (canvaObjects.length === 0)) return alert(t('alertUploadDecor'));
    }

    if (!prompt && !['create', 'interior', 'planning', 'landscape', 'edit', 'smartEdit', 'mergeHouse', 'mergeMaterial', 'mergeFurniture', 'cameraAngle', 'video', 'prompt', 'photoToSketch'].includes(activeTab)) return alert(t('alertEnterPrompt'));
    
    setIsLoading(true);
    setIsEditingMask(false);
    setIsSelectingArea(false);
    if (activeTab !== 'prompt') {
      setGeneratedImages([]);
      setSelectedImage(null);
    }
    setGeneratedVideoUrl(null);
    if (activeTab === 'prompt') {
      setGeneratedPrompts(null);
    }
    setLoadingMessage(t('loadingStart'));
    setLastUsedPrompt(prompt);
    try {
      if (activeTab === 'prompt' && sourceImage) {
        setLoadingMessage(t('loadingAnalyzePrompts'));
        const prompts = await generateArchitecturalPrompts(sourceImage, language, characterDescription);
        setGeneratedPrompts(prompts);
        await addHistoryItem({
          tab: 'prompt',
          sourceImage,
          sourceImage2: characterImage || null,
          referenceImage: null,
          prompt: t('promptArchitecturalGenerated'),
          negativePrompt: '',
          imageCount: 0,
          generatedImages: [],
          generatedPrompts: prompts,
        });
        setCurrentHistoryIndex(0);
      } else {
        let finalPrompt = prompt;
        let images: string[] = [];
        
        if (editSubMode === 'canva' && sourceImage) {
            const placements = canvaObjects.map((obj, index) => ({
                image: obj,
                transform: canvaObjectTransforms[index],
            }));
            images = await placeAndRenderFurniture(sourceImage, placements, imageCount, language);
        } else if (sourceImage && isEditTab) {
            if (editSubMode === 'inpaint' && maskImage) {
                images = await editImage(sourceImage, maskImage, finalPrompt, imageCount, editReferenceImage, language);
            } else if (editSubMode === 'smartEdit' && editBox && maskImage) {
                const croppedArea = await cropImage(sourceImage, editBox);
                const croppedMask = await cropImage(maskImage, editBox);
                const localizedResults = await editImage(croppedArea, croppedMask, finalPrompt, imageCount, editReferenceImage, language);
                for (const locImgData of localizedResults) {
                  const locImg = dataUrlToSourceImage(locImgData);
                  if (locImg) {
                    const merged = await compositeImage(sourceImage, locImg, editBox, maskImage, { expansion: 0, edgeBlend: 3 });
                    images.push(sourceImageToDataUrl(merged));
                  }
                }
            } else if (sourceImage2) {
                images = await mergeImages(sourceImage, sourceImage2, finalPrompt, imageCount);
            }
        } else if (['create', 'interior', 'planning', 'landscape', 'photoToSketch', 'cameraAngle'].includes(activeTab)) {
          images = await generateImages(sourceImage, finalPrompt, imageCount, referenceImage, aspectRatio, language, negativePrompt, aiModel, imageSize);
        } else if (activeTab === 'planTo3d' && sourceImage) {
          images = await generateImages(sourceImage, prompt, imageCount, referenceImage, '4:3', language, undefined, aiModel);
        } else if (activeTab === 'sectionTo3d' && sourceImage) {
            images = await generateImages(sourceImage, prompt, imageCount, referenceImage, '4:3', language, undefined, aiModel, imageSize);
        } else if (activeTab === 'planToElevation' && sourceImage) {
            images = await generateImages(sourceImage, prompt, imageCount, referenceImage, '16:9', language, undefined, aiModel, imageSize);
        } else if (activeTab === 'video' && sourceImage) {
          // Combined video prompt
          const videoFinalPrompt = `[Style: ${videoStyle}] [Camera: ${videoCameraAngle}] [Preset: ${videoPreset}] ${prompt}. ${videoCustomParams}`;
          const videoUrl = await generateVideo(sourceImage, videoFinalPrompt, videoModel, setLoadingMessage, sourceImage2);
          setGeneratedVideoUrl(videoUrl);
          if (videoUrl) {
              await addHistoryItem({ 
                  tab: activeTab, 
                  sourceImage, 
                  sourceImage2, 
                  referenceImage: null, 
                  prompt: videoFinalPrompt, 
                  negativePrompt: '', 
                  imageCount: 1, 
                  generatedImages: [videoUrl], 
                  generatedPrompts: null 
              });
          }
        }

        if (images.length > 0) {
          await addHistoryItem({ tab: activeTab, sourceImage, sourceImage2: null, referenceImage: null, prompt: finalPrompt, negativePrompt: '', imageCount, generatedImages: images, generatedPrompts: null });
          setGeneratedImages(images);
          images.forEach(img => addImageToLibrary(img));
          setCurrentHistoryIndex(0);
        }
      }
    } catch (error: any) {
      alert(t('alertGenerationFailed'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setIsZoomedEditing(false);
    }
  }, [sourceImage, sourceImage2, referenceImage, editReferenceImage, maskImage, prompt, negativePrompt, imageCount, aspectRatio, activeTab, planTo3dMode, editSubMode, addHistoryItem, canvaObjects, canvaObjectTransforms, videoModel, t, language, addImageToLibrary, characterImage, characterDescription, aiModel, imageSize, editBox, videoAspectRatio, videoCameraAngle, videoStyle, videoPreset, videoCustomParams]);

  const handleStartApp = (mode: 'free' | 'pro') => { setIsAppStarted(true); if (mode === 'pro') { setAiModel('gemini-3-pro-image-preview'); } else { setAiModel('gemini-2.5-flash-image'); } };
  const isProMode = aiModel === 'gemini-3-pro-image-preview';

  const handleStartEditing = () => { if (!selectedImage) return; const img = dataUrlToSourceImage(selectedImage); if (img) { setSourceImage(img); setMaskImage(null); setEditReferenceImage(null); setActiveTab('edit'); setEditSubMode('inpaint'); setEditTool('brush'); setMainCategory('adjust'); setIsZoomedEditing(true); } };
  const handleSetAsSourceImage = () => { if (!selectedImage) return; const img = dataUrlToSourceImage(selectedImage); if (img) { handleSourceImageUpload(img); } };

  if (!isAppStarted) return <WelcomeScreen onStart={handleStartApp} history={history} />;

  return (
    <div className={`min-h-screen ${theme.appBg} ${theme.textMain} font-sans transition-colors duration-300 flex flex-col h-screen overflow-hidden`}>
        <Header onBack={() => { setIsAppStarted(false); localStorage.removeItem('aicomplex_current_session'); }} isProMode={isProMode} />
        <TopNav activeCategory={mainCategory} onCategoryChange={(cat) => { setMainCategory(cat); if (cat === 'visual') setActiveTab('create'); else if (cat === 'design') setActiveTab('standards'); else if (cat === 'adjust') setActiveTab('edit'); else if (cat === 'utilities') setActiveTab('utilities'); else if (cat === 'fengshui') setActiveTab('fengShui'); }} />
        
        <div className="flex-grow flex overflow-hidden">
            <div className="w-72 flex-shrink-0">
              <Sidebar activeTab={activeTab} onTabChange={setActiveTab} activeCategory={mainCategory} />
            </div>

            <div className="flex-grow overflow-y-auto thin-scrollbar p-8 bg-[#0a0a0a]">
                {activeTab === 'utilities' ? (
                  <UtilitiesView 
                    isProMode={isProMode} externalActiveUtility={externalActiveUtility}
                    sourceImage={sourceImage} prompt={prompt} generatedImages={generatedImages}
                    addImageToLibrary={addImageToLibrary} addHistoryItem={addHistoryItem} onTabChange={setActiveTab}
                    moodboardSourceImage={moodboardSourceImage} setMoodboardSourceImage={setMoodboardSourceImage}
                    moodboardReferenceImage={moodboardReferenceImage} setMoodboardReferenceImage={setMoodboardReferenceImage}
                    moodboardPrompt={moodboardPrompt} setMoodboardPrompt={setMoodboardPrompt}
                    moodboardImageCount={moodboardImageCount} setMoodboardImageCount={setMoodboardImageCount}
                    moodboardGeneratedImages={moodboardGeneratedImages} moodboardSelectedImage={moodboardSelectedImage}
                    setMoodboardSelectedImage={setMoodboardSelectedImage} handleMoodboardGeneration={handleMoodboardGeneration}
                    lightingSourceImage={lightingSourceImage} setLightingSourceImage={setLightingSourceImage}
                    lightingSelectedPrompts={lightingSelectedPrompts} setLightingSelectedPrompts={setLightingSelectedPrompts}
                    lightingImageCount={lightingImageCount} setLightingImageCount={setLightingImageCount}
                    lightingGeneratedImages={lightingGeneratedImages} lightingSelectedImage={lightingSelectedImage}
                    setLightingSelectedImage={setLightingSelectedImage} handleLightingGeneration={handleLightingGeneration}
                    handleVirtualTourImageUpload={handleVirtualTourImageUpload} virtualTourHistory={virtualTourHistory}
                    virtualTourIndex={virtualTourIndex} handleVirtualTourNavigation={handleVirtualTourNavigation}
                    handleUndo={handleVirtualTourUndo} handleRedo={handleVirtualTourRedo}
                    handleVirtualTourHistorySelect={handleVirtualTourHistorySelect}
                    videoPromptSourceImage={videoPromptSourceImage} setVideoPromptSourceImage={setVideoPromptSourceImage}
                    videoPromptUserPrompt={videoPromptUserPrompt} setVideoPromptUserPrompt={setVideoPromptUserPrompt}
                    videoPromptGeneratedPrompt={videoPromptGeneratedPrompt} 
                    handleVideoPromptGeneration={() => videoPromptSourceImage && handleVideoPromptGeneration(videoPromptSourceImage, videoPromptUserPrompt)}
                    extendViewSourceImage={extendViewSourceImage} setExtendViewSourceImage={setExtendViewSourceImage}
                    extendViewAspectRatio={extendViewAspectRatio} setExtendViewAspectRatio={setExtendViewAspectRatio}
                    extendViewImageCount={extendViewImageCount} setExtendViewImageCount={setExtendViewImageCount}
                    extendViewGeneratedImages={extendViewGeneratedImages} extendViewSelectedImage={extendViewSelectedImage}
                    setExtendViewSelectedImage={setExtendViewSelectedImage} handleExtendViewGeneration={handleExtendViewGeneration}
                    changeStyleSourceImage={changeStyleSourceImage} setChangeStyleSourceImage={setChangeStyleSourceImage}
                    changeStyleUserPrompt={changeStyleUserPrompt} setChangeStyleUserPrompt={setChangeStyleUserPrompt}
                    changeStyleGeneratedPrompt={changeStyleGeneratedPrompt} setChangeStyleGeneratedPrompt={setChangeStyleGeneratedPrompt}
                    changeStyleImageCount={changeStyleImageCount} setChangeStyleImageCount={changeStyleImageCount}
                    changeStyleGeneratedImages={changeStyleGeneratedImages} changeStyleSelectedImage={changeStyleSelectedImage}
                    setChangeStyleSelectedImage={setChangeStyleSelectedImage} handleStylePromptGeneration={handleStylePromptGeneration}
                    handleStyleImageGeneration={handleStyleImageGeneration} canvaObjects={canvaObjects}
                    setCanvaObjects={setCanvaObjects} canvaObjectTransforms={canvaObjectTransforms}
                    setCanvaObjectTransforms={setCanvaObjectTransforms} selectedCanvaObjectIndex={selectedCanvaObjectIndex}
                    setSelectedCanvaObjectIndex={setSelectedCanvaObjectIndex} isCanvaLayoutLocked={isCanvaLayoutLocked}
                    setIsCanvaLayoutLocked={setIsCanvaLayoutLocked} handleDeleteSelectedCanvaObject={handleDeleteSelectedCanvaObject}
                    isLoading={isLoading} loadingMessage={loadingMessage} setFullscreenImage={setFullscreenImage}
                    copyToClipboard={copyToClipboard} handleGeneration={handleGeneration} sourceImage2={sourceImage2}
                    setSourceImage2={setSourceImage2} referenceImage={referenceImage} setReferenceImage={setReferenceImage}
                    editReferenceImage={editReferenceImage} setEditReferenceImage={setEditReferenceImage}
                    negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt} imageCount={imageCount}
                    setImageCount={setImageCount} imageSize={imageSize} setImageSize={setImageSize}
                    aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} isSelectingArea={isSelectingArea}
                    setIsSelectingArea={setIsSelectingArea} isZoomedEditing={isZoomedEditing}
                    setIsZoomedEditing={setIsZoomedEditing} areaSelectorRef={areaSelectorRef} editTool={editTool}
                    setEditTool={setEditTool} brushSize={brushSize} setBrushSize={setBrushSize}
                    selectionMode={selectionMode} setSelectionMode={setSelectionMode} lassoEditorRef={lassoEditorRef}
                    brushEditorRef={brushEditorRef} setMaskImage={setMaskImage} editSubMode={editSubMode}
                    setEditSubMode={setEditSubMode} handleSourceImageUpload={handleSourceImageUpload}
                    characterImage={characterImage} setCharacterImage={handleCharacterImageUpload}
                    characterDescription={characterDescription} setCharacterDescription={setCharacterDescription}
                    isAnalyzingCharacter={isAnalyzingCharacter} planTo3dMode={planTo3dMode}
                    setPlanTo3dMode={setPlanTo3dMode} aiModel={aiModel} generatedVideoUrl={generatedVideoUrl}
                    selectedImage={selectedImage} lastUsedPrompt={lastUsedPrompt} isEditingMask={isEditingMask}
                    setSelectedImage={setSelectedImage} onAreaSelected={handleAreaSelectedAndGenerate}
                    handleStartEditing={handleStartEditing} handleSetAsSourceImage={handleSetAsSourceImage}
                    onGenerateFromPrompt={handleGenerateFromPromptTab}
                    onDeleteGeneratedImage={handleDeleteGeneratedImage}
                  />
                ) : activeTab === 'library' ? (
                    <LibraryView images={library} onDelete={removeImageFromLibrary} onUseAsSource={(imageData) => { const img = dataUrlToSourceImage(imageData); handleSourceImageUpload(img); }} onFullscreen={setFullscreenImage} justSavedId={justSavedId} />
                ) : activeTab === 'floorPlan' ? (
                    <FloorPlanGenerator onBack={() => setMainCategory('visual')} addImageToLibrary={addImageToLibrary} addHistoryItem={addHistoryItem} />
                ) : activeTab === 'blueprint' ? (
                    <BlueprintCreator onBack={() => setMainCategory('visual')} addImageToLibrary={addImageToLibrary} addHistoryItem={addHistoryItem} />
                ) : activeTab === 'virtualTour' ? (
                    <VirtualTourCreator onBack={() => setMainCategory('utilities')} isLoading={isLoading} sourceImage={sourceImage} virtualTourHistory={virtualTourHistory} virtualTourIndex={virtualTourIndex} handleVirtualTourNavigation={handleVirtualTourNavigation} handleUndo={handleVirtualTourUndo} handleRedo={handleVirtualTourRedo} handleVirtualTourHistorySelect={handleVirtualTourHistorySelect} setFullscreenImage={setFullscreenImage} handleVirtualTourImageUpload={handleVirtualTourImageUpload} />
                ) : activeTab === 'extendView' ? (
                    <ExtendViewCreator onBack={() => setMainCategory('utilities')} extendViewSourceImage={extendViewSourceImage} setExtendViewSourceImage={setExtendViewSourceImage} extendViewAspectRatio={extendViewAspectRatio} setExtendViewAspectRatio={setExtendViewAspectRatio} extendViewImageCount={extendViewImageCount} setExtendViewImageCount={setExtendViewImageCount} extendViewGeneratedImages={extendViewGeneratedImages} extendViewSelectedImage={extendViewSelectedImage} setExtendViewSelectedImage={setExtendViewSelectedImage} handleExtendViewGeneration={handleExtendViewGeneration} isLoading={isLoading} setFullscreenImage={setFullscreenImage} />
                ) : activeTab === 'fengShui' ? (
                    <FengShuiTool onBack={() => setMainCategory('utilities')} setFullscreenImage={setFullscreenImage} />
                ) : activeTab === 'standards' ? (
                    <StandardsConsultant onBack={() => setMainCategory('design')} />
                ) : activeTab === 'designMission' ? (
                    <DesignMissionCreator onBack={() => setMainCategory('design')} addImageToLibrary={addImageToLibrary} addHistoryItem={addHistoryItem} />
                ) : activeTab === 'planToPerspectiveDesign' ? (
                    <PlanToPerspectiveCreator onBack={() => setMainCategory('design')} addImageToLibrary={addImageToLibrary} addHistoryItem={addHistoryItem} />
                ) : activeTab === 'lighting' ? (
                    <LightingCreator onBack={() => setMainCategory('visual')} lightingSourceImage={lightingSourceImage} setLightingSourceImage={setLightingSourceImage} lightingSelectedPrompts={lightingSelectedPrompts} setLightingSelectedPrompts={setLightingSelectedPrompts} lightingImageCount={lightingImageCount} setLightingImageCount={setLightingImageCount} lightingGeneratedImages={lightingGeneratedImages} lightingSelectedImage={lightingSelectedImage} setLightingSelectedImage={setLightingSelectedImage} handleLightingGeneration={handleLightingGeneration} isLoading={isLoading} />
                ) : activeTab === 'creativeFusion' ? (
                    <CreativeFusionCreator onBack={() => setMainCategory('visual')} addImageToLibrary={addImageToLibrary} addHistoryItem={addHistoryItem} />
                ) : activeTab === 'changeStyle' ? (
                    <ChangeStyleCreator onBack={() => setMainCategory('visual')} changeStyleSourceImage={changeStyleSourceImage} setChangeStyleSourceImage={setChangeStyleSourceImage} changeStyleUserPrompt={changeStyleUserPrompt} setChangeStyleUserPrompt={setChangeStyleUserPrompt} changeStyleGeneratedPrompt={changeStyleGeneratedPrompt} setChangeStyleGeneratedPrompt={setChangeStyleGeneratedPrompt} changeStyleImageCount={changeStyleImageCount} setChangeStyleImageCount={changeStyleImageCount} changeStyleGeneratedImages={changeStyleGeneratedImages} changeStyleSelectedImage={changeStyleSelectedImage} setChangeStyleSelectedImage={setChangeStyleSelectedImage} handleStylePromptGeneration={handleStylePromptGeneration} handleStyleImageGeneration={handleStyleImageGeneration} isLoading={isLoading} loadingMessage={loadingMessage} setFullscreenImage={setFullscreenImage} />
                ) : activeTab === 'sectionTo3d' ? (
                    <SectionTo3DCreator onBack={() => setMainCategory('visual')} addImageToLibrary={addImageToLibrary} addHistoryItem={addHistoryItem} />
                ) : activeTab === 'planToElevation' ? (
                    <PlanToElevationCreator onBack={() => setMainCategory('design')} addImageToLibrary={addImageToLibrary} addHistoryItem={addHistoryItem} />
                ) : activeTab === 'cameraAngle' ? (
                    <div className="col-span-full h-full">
                        <CameraAngleView 
                            sourceImage={sourceImage} setSourceImage={handleSourceImageUpload}
                            referenceImage={referenceImage} setReferenceImage={setReferenceImage}
                            prompt={prompt} setPrompt={setPrompt}
                            generatedImages={generatedImages} isLoading={isLoading}
                            selectedImage={selectedImage} setSelectedImage={setSelectedImage}
                            setFullscreenImage={setFullscreenImage}
                            handleGeneration={handleGeneration}
                        />
                    </div>
                ) : activeTab === 'prompt' ? (
                    <PromptGeneratorView 
                        onBack={() => setMainCategory('utilities')}
                        addImageToLibrary={addImageToLibrary}
                        addHistoryItem={addHistoryItem}
                        copyToClipboard={copyToClipboard}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                        <div className="lg:col-span-4 xl:col-span-3 h-full overflow-y-auto thin-scrollbar pr-2 flex flex-col gap-6">
                            <ControlPanel 
                                activeTab={activeTab} 
                                sourceImage={sourceImage} 
                                setSourceImage={handleSourceImageUpload} 
                                sourceImage2={sourceImage2} 
                                setSourceImage2={setSourceImage2} 
                                referenceImage={referenceImage} 
                                setReferenceImage={setReferenceImage} 
                                editReferenceImage={editReferenceImage} 
                                setEditReferenceImage={setEditReferenceImage} 
                                maskImage={maskImage}
                                setMaskImage={setMaskImage}
                                prompt={prompt} 
                                setPrompt={setPrompt} 
                                negativePrompt={negativePrompt} 
                                setNegativePrompt={setNegativePrompt} 
                                imageCount={imageCount} 
                                setImageCount={setImageCount} 
                                imageSize={imageSize} 
                                setImageSize={setImageSize} 
                                aspectRatio={aspectRatio} 
                                setAspectRatio={setAspectRatio} 
                                handleGeneration={handleGeneration} 
                                handleRefresh={handleRefresh} 
                                handleUndo={handleUndo} 
                                handleRedo={handleRedo} 
                                canUndo={currentHistoryIndex + 1 < history.length} 
                                canRedo={currentHistoryIndex > 0} 
                                isLoading={isLoading} 
                                isSelectingArea={isSelectingArea} 
                                setIsSelectingArea={setIsSelectingArea} 
                                isZoomedEditing={isZoomedEditing}
                                setIsZoomedEditing={setIsZoomedEditing}
                                areaSelectorRef={areaSelectorRef} 
                                editTool={editTool} 
                                setEditTool={setEditTool} 
                                brushSize={brushSize} 
                                setBrushSize={setBrushSize} 
                                selectionMode={selectionMode} 
                                setSelectionMode={setSelectionMode} 
                                lassoEditorRef={lassoEditorRef} 
                                brushEditorRef={brushEditorRef} 
                                editSubMode={editSubMode} 
                                setEditSubMode={(mode: EditSubMode) => {
                                    setEditSubMode(mode);
                                    if (mode === 'inpaint') setActiveTab('edit');
                                    else if (mode === 'smartEdit') setActiveTab('smartEdit');
                                    else if (mode === 'mergeHouse') setActiveTab('mergeHouse');
                                    else if (mode === 'mergeMaterial') setActiveTab('mergeMaterial');
                                    else if (mode === 'mergeFurniture') setActiveTab('mergeFurniture');
                                    else if (mode === 'canva') setActiveTab('canva');
                                }} 
                                handleSourceImageUpload={handleSourceImageUpload} 
                                canvaObjects={canvaObjects} 
                                setCanvaObjects={setCanvaObjects} 
                                canvaObjectTransforms={canvaObjectTransforms} 
                                setCanvaObjectTransforms={setCanvaObjectTransforms} 
                                selectedCanvaObjectIndex={selectedCanvaObjectIndex} 
                                setSelectedCanvaObjectIndex={setSelectedCanvaObjectIndex} 
                                isCanvaLayoutLocked={isCanvaLayoutLocked} 
                                setIsCanvaLayoutLocked={setIsCanvaLayoutLocked} 
                                handleDeleteSelectedCanvaObject={handleDeleteSelectedCanvaObject} 
                                aiModel={aiModel} 
                                onTabChange={setActiveTab} 
                                addImageToLibrary={addImageToLibrary} 
                                addHistoryItem={addHistoryItem} 
                                editBox={editBox} 
                                setEditBox={setEditBox} 
                                planTo3dMode={planTo3dMode}
                                setPlanTo3dMode={setPlanTo3dMode}
                                onRefreshPrompt={handleRefresh}
                                // Video Tool Props
                                videoAspectRatio={videoAspectRatio} setVideoAspectRatio={setVideoAspectRatio}
                                videoCameraAngle={videoCameraAngle} setVideoCameraAngle={setVideoCameraAngle}
                                videoStyle={videoStyle} setVideoStyle={setVideoStyle}
                                videoPreset={videoPreset} setVideoPreset={setVideoPreset}
                                videoCustomParams={videoCustomParams} setVideoCustomParams={setVideoCustomParams}
                            />
                        </div>
                        <div className="lg:col-span-8 xl:col-span-9 h-full flex flex-col overflow-hidden">
                            <div className="flex-grow overflow-y-auto thin-scrollbar">
                                <GalleryPanel 
                                  isLoading={isLoading} 
                                  loadingMessage={loadingMessage} 
                                  imageCount={imageCount} 
                                  activeTab={activeTab} 
                                  generatedVideoUrl={generatedVideoUrl} 
                                  generatedImages={generatedImages} 
                                  generatedPrompts={generatedPrompts} 
                                  selectedImage={selectedImage} 
                                  lastUsedPrompt={lastUsedPrompt} 
                                  sourceImage={sourceImage} 
                                  sourceImage2={sourceImage2} 
                                  isSelectingArea={isSelectingArea} 
                                  isEditingMask={isEditingMask} 
                                  isZoomedEditing={isZoomedEditing} 
                                  setIsZoomedEditing={setIsZoomedEditing} 
                                  editTool={editTool} 
                                  setEditTool={setEditTool} 
                                  brushSize={brushSize} 
                                  setBrushSize={setBrushSize} 
                                  setSelectedImage={setSelectedImage} 
                                  setMaskImage={setMaskImage} 
                                  onAreaSelected={handleAreaSelectedAndGenerate} 
                                  setFullscreenImage={setFullscreenImage} 
                                  handleStartEditing={handleStartEditing} 
                                  handleSetAsSourceImage={handleSetAsSourceImage} 
                                  copyToClipboard={copyToClipboard} 
                                  onGenerateFromPrompt={handleGenerateFromPromptTab} 
                                  areaSelectorRef={areaSelectorRef} 
                                  lassoEditorRef={lassoEditorRef} 
                                  brushEditorRef={brushEditorRef} 
                                  canvaObjects={canvaObjects} 
                                  canvaObjectTransforms={canvaObjectTransforms} 
                                  setCanvaObjectTransforms={setCanvaObjectTransforms} 
                                  selectedCanvaObjectIndex={selectedCanvaObjectIndex} 
                                  setSelectedCanvaObjectIndex={setSelectedCanvaObjectIndex} 
                                  isCanvaLayoutLocked={isCanvaLayoutLocked} 
                                  editSubMode={editSubMode} 
                                  editBox={editBox} 
                                  setEditBox={setEditBox} 
                                  videoHistory={history.filter(h => h.tab === 'video')} 
                                  onDeleteGeneratedImage={handleDeleteGeneratedImage}
                                />
                                <div className="mt-8">
                                    <HistoryPanel history={history} onRestore={handleRestoreHistory} onClear={clearHistory} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        {fullscreenImage && <FullscreenViewer imageUrl={fullscreenImage} onClose={() => setFullscreenImage(null)} />}
        <GeminiChat />
    </div>
  );
}
