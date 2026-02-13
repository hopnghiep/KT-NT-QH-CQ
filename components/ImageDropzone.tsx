
import React, { useState, useRef } from 'react';
import type { SourceImage } from '../types';

interface ImageDropzoneProps {
  onImageUpload?: (image: SourceImage) => void;
  onImagesUpload?: (images: SourceImage[]) => void;
  children: React.ReactNode;
  className?: string;
  multiple?: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onImageUpload, onImagesUpload, children, className, multiple = false }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: File[]) => {
        if (!files || files.length === 0) return;

        const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
        const validFiles = files.filter(file => supportedTypes.includes(file.type));
        
        if (validFiles.length === 0) {
            alert("Vui lòng sử dụng định dạng hỗ trợ (PNG, JPG, WEBP, PDF).");
            return;
        }

        if (multiple && onImagesUpload) {
            const imagePromises: Promise<SourceImage>[] = validFiles.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const base64 = (e.target?.result as string)?.split(',')[1];
                        if (base64) {
                            resolve({ base64, mimeType: file.type });
                        } else {
                            reject(new Error(`Không thể đọc file: ${file.name}`));
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(imagePromises)
                .then(images => {
                    if (images.length > 0) {
                        onImagesUpload(images);
                    }
                })
                .catch(err => {
                    console.error("Lỗi xử lý file:", err);
                    alert("Đã xảy ra lỗi khi xử lý tệp tin.");
                });

        } else if (onImageUpload) {
            const file = validFiles[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = (e.target?.result as string)?.split(',')[1];
                if (base64) {
                    onImageUpload({ base64, mimeType: file.type });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            handleFiles(Array.from(event.target.files));
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDraggingOver(false);
        if (event.dataTransfer.files) {
            handleFiles(Array.from(event.dataTransfer.files));
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
        const items = event.clipboardData.items;
        const files: File[] = [];
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1 || items[i].type === 'application/pdf') {
                const blob = items[i].getAsFile();
                if (blob) files.push(blob);
            }
        }
        
        if (files.length > 0) {
            event.preventDefault();
            handleFiles(files);
        }
    };
    
    return (
        <>
            <div
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
                className={`${className} outline-none focus:ring-2 focus:ring-orange-500/50 transition-all ${isDraggingOver ? 'border-orange-500 bg-slate-700/50 scale-[0.99]' : ''}`}
            >
                {children}
            </div>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp, application/pdf" 
                multiple={multiple} 
            />
        </>
    );
};
