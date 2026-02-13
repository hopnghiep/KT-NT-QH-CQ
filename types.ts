
export type EditSubMode = 'inpaint' | 'smartEdit' | 'mergeHouse' | 'mergeMaterial' | 'mergeFurniture' | 'canva';
export type ActiveTab = 'create' | 'interior' | 'cameraAngle' | 'edit' | 'smartEdit' | 'mergeHouse' | 'mergeMaterial' | 'mergeFurniture' | 'planTo3d' | 'video' | 'canva' | 'prompt' | 'utilities' | 'library' | 'planning' | 'landscape' | 'sectionTo3d' | 'photoToSketch' | 'floorPlan' | 'blueprint' | 'virtualTour' | 'extendView' | 'fengShui' | 'lighting' | 'creativeFusion' | 'changeStyle' | 'standards' | 'planToElevation' | 'designMission' | 'planToPerspectiveDesign';
export type AspectRatio = 'auto' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | '2:3' | '3:2' | '21:9';
export type ImageSize = '1K' | '2K' | '4K';
export type Utility = 'moodboard' | 'videoPrompt' | 'lighting' | 'virtualTour' | 'extendView' | 'changeStyle' | 'layout' | 'model' | 'diagram' | 'analyze' | 'trendMoodboard' | 'vr360' | 'blueprint' | 'floorPlan' | 'photoToSketch' | 'creativeFusion' | 'sectionTo3d';

export interface SourceImage {
  base64: string;
  mimeType: string;
}

export interface HistoryItem {
  id: string;
  tab: ActiveTab | 'utilities' | 'trend'; // Keep 'trend' in type for compatibility with old history items
  sourceImage: SourceImage | null;
  sourceImage2?: SourceImage | null;
  referenceImage: SourceImage | null;
  prompt: string;
  negativePrompt?: string;
  imageCount: number;
  generatedImages: string[];
  generatedPrompts?: string | null;
  videoModel?: string;
}

export interface LibraryItem {
  id: string;
  imageData: string; // data URL
}

export interface ObjectTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UserPassword {
  id: string;
  name: string;
  password: string;
}

export interface WelcomeData {
  title: string;
  subtitle: string;
  description: string;
  bgImage: string;
}
