
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SourceImage, ObjectTransform, ImageSize, AspectRatio } from '../types';

// Helper to convert SourceImage to GenAI part
const sourceImageToPart = (image: SourceImage) => ({
  inlineData: {
    data: image.base64,
    mimeType: image.mimeType
  }
});

/**
 * generateVideo: Generates a video using Veo model.
 */
export const generateVideo = async (
    sourceImage: SourceImage,
    prompt: string,
    model: string = 'veo-3.1-fast-generate-preview',
    setLoadingMessage: (msg: string) => void,
    endImage?: SourceImage | null
): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    setLoadingMessage("Starting video generation...");
    let operation = await ai.models.generateVideos({
        model: model,
        prompt: prompt,
        image: {
            imageBytes: sourceImage.base64,
            mimeType: sourceImage.mimeType
        },
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9',
            ...(endImage ? {
                lastFrame: {
                    imageBytes: endImage.base64,
                    mimeType: endImage.mimeType
                }
            } : {})
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        setLoadingMessage("AI đang kiến tạo cảnh quay của bạn...");
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;
    
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
};

export const generateImages = async (
    sourceImage: SourceImage | null,
    prompt: string,
    count: number = 1,
    referenceImage: SourceImage | null = null,
    aspectRatio: AspectRatio = '1:1',
    language: string = 'vi',
    negativePrompt?: string,
    model: string = 'gemini-2.5-flash-image',
    imageSize: ImageSize = '1K'
): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [{ text: prompt }];
    if (sourceImage) parts.push(sourceImageToPart(sourceImage));
    if (referenceImage) parts.push(sourceImageToPart(referenceImage));
    if (negativePrompt) parts.push({ text: `Negative prompt: ${negativePrompt}` });

    const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
            imageConfig: {
                aspectRatio: (aspectRatio === 'auto' ? '1:1' : aspectRatio) as any,
                ...(model.includes('pro') ? { imageSize } : {})
            }
        }
    });

    const images: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            }
        }
    }
    return images;
};

export const editImage = async (
    sourceImage: SourceImage,
    maskImage: SourceImage,
    prompt: string,
    count: number = 1,
    referenceImage: SourceImage | null = null,
    language: string = 'vi'
): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [{ text: prompt }, sourceImageToPart(sourceImage), sourceImageToPart(maskImage)];
    if (referenceImage) parts.push(sourceImageToPart(referenceImage));
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts } });
    const images: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
    }
    return images;
};

export const mergeImages = async (image1: SourceImage, image2: SourceImage, prompt: string, count: number = 1): Promise<string[]> => {
    return generateImages(image1, prompt, count, image2);
};

export const improvePrompt = async (prompt: string, language: string = 'vi'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Tối ưu hóa prompt kiến trúc sau: ${prompt}`
    });
    return response.text || prompt;
};

export const generatePromptFromImage = async (image: SourceImage, language: string = 'vi', type: string = 'exterior'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: `Mô tả chi tiết ảnh ${type} này để dùng làm prompt AI.` }, sourceImageToPart(image)] }
    });
    return response.text || "";
};

export const generatePromptFromKeywords = async (keywords: string, language: string = 'vi', type: string = 'exterior'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Viết prompt kiến trúc từ từ khóa: ${keywords}`
    });
    return response.text || keywords;
};

export const classifyImageType = async (image: SourceImage): Promise<'interior' | 'exterior'> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: "Trả lời 'interior' hoặc 'exterior'." }, sourceImageToPart(image)] }
    });
    return response.text?.toLowerCase().includes('interior') ? 'interior' : 'exterior';
};

export const placeAndRenderFurniture = async (room: SourceImage, items: any[], count: number, lang: string): Promise<string[]> => {
    return generateImages(room, "Place and render furniture realistically", count);
};

export const generateArchitecturalPrompts = async (image: SourceImage, language: string, extra?: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const promptText = `Hãy phân tích hình ảnh kiến trúc này và tạo ra 20 prompt chuyên nghiệp dùng cho Midjourney/Stable Diffusion. 
    YÊU CẦU:
    - Mỗi prompt phải hiển thị cả 2 ngôn ngữ: Bản gốc tiếng Anh (để dùng cho AI tạo ảnh) và bản dịch tiếng Việt tương ứng ngay bên dưới hoặc bên cạnh.
    - Tập trung vào chi tiết: phong cách kiến trúc, vật liệu xây dựng, ánh sáng cinematic, góc máy nhiếp ảnh kiến trúc, và bối cảnh môi trường.
    - Định dạng dễ đọc, ví dụ: "1. [English Prompt] - [Bản dịch tiếng Việt]".
    ${extra ? `Yêu cầu bổ sung từ người dùng: ${extra}` : ''}`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: promptText }, sourceImageToPart(image)] }
    });
    return response.text || "";
};

export const generatePromptFromPlan = async (image: SourceImage, lang: string): Promise<string> => generatePromptFromImage(image, lang, 'plan');
export const analyzePlanStyle = async (image: SourceImage, lang: string): Promise<string> => "Phân tích phong cách mặt bằng...";
export const generateMoodboard = async (src: SourceImage, p: string, ref: any, c: number, l: string): Promise<string[]> => generateImages(src, p, c, ref);
export const applyLighting = async (src: SourceImage, p: string, c: number, l: string): Promise<string[]> => generateImages(src, p, c);
export const generateVideoScriptPrompt = async (src: SourceImage, u: string, l: string): Promise<string> => "Video script...";
export const extendView = async (src: SourceImage, r: any, c: number, l: string): Promise<string[]> => generateImages(src, "Extend view", c);
export const generateStyleChangePrompt = async (src: SourceImage, u: string, l: string): Promise<string> => "Style change prompt...";
export const analyzeCharacterImage = async (src: SourceImage, l: string): Promise<string> => "Phân tích nhân vật...";
export const analyzeSketchupModel = async (f: any, r: string, l: string): Promise<string> => "Phân tích Sketchup...";
export const analyzeExistingState = async (i: SourceImage, l: string): Promise<string> => "Phân tích hiện trạng...";
export const critiqueArchitecturalPlan = async (d: any, l: string): Promise<string> => "Phản biện kiến trúc...";
export const consultFengShui = async (i: any, b: string, d: string): Promise<string> => "Tư vấn phong thủy...";
export const generateFengShuiImage = async (i: SourceImage, b: string, d: string): Promise<string | null> => null;
export const consultStandards = async (b: string): Promise<string> => "Tra cứu tiêu chuẩn...";
export const generateDesignMission = async (d: any): Promise<string> => "Nhiệm vụ thiết kế...";
