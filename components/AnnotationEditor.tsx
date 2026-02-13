
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { SourceImage } from '../types';

interface Annotation {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  text: string;
  color: string;
}

interface AnnotationEditorProps {
  sourceImage: SourceImage;
  onMaskReady: (mask: SourceImage | null) => void;
  activeColor: string;
}

export const AnnotationEditor = forwardRef<{ clear: () => void, getAnnotatedImage: () => string | null }, AnnotationEditorProps>(({ sourceImage, onMaskReady, activeColor }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStart, setCurrentStart] = useState<{ x: number, y: number } | null>(null);
  const [currentEnd, setCurrentEnd] = useState<{ x: number, y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const clear = () => {
    setAnnotations([]);
    setIsDrawing(false);
    setCurrentStart(null);
    setCurrentEnd(null);
    setEditingId(null);
    onMaskReady(null);
  };

  useImperativeHandle(ref, () => ({
    clear,
    getAnnotatedImage: () => {
      const canvas = canvasRef.current;
      return canvas ? canvas.toDataURL('image/png') : null;
    }
  }));

  useEffect(() => {
    const img = new Image();
    img.src = `data:${sourceImage.mimeType};base64,${sourceImage.base64}`;
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      if (canvasRef.current) {
        canvasRef.current.width = img.naturalWidth;
        canvasRef.current.height = img.naturalHeight;
      }
    };
  }, [sourceImage]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, startX: number, startY: number, endX: number, endY: number, color: string) => {
    const headlen = 20; // length of head in pixels
    const dx = endX - startX;
    const dy = endY - startY;
    const angle = Math.atan2(dy, dx);
    
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Draw line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Draw head
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    annotations.forEach(anno => {
      drawArrow(ctx, anno.startX, anno.startY, anno.endX, anno.endY, anno.color);
      
      if (anno.text) {
        ctx.font = 'bold 24px Inter, sans-serif';
        const textWidth = ctx.measureText(anno.text).width;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(anno.endX + 5, anno.endY - 30, textWidth + 10, 35);
        ctx.fillStyle = anno.color;
        ctx.fillText(anno.text, anno.endX + 10, anno.endY - 5);
      }
    });

    if (isDrawing && currentStart && currentEnd) {
      drawArrow(ctx, currentStart.x, currentStart.y, currentEnd.x, currentEnd.y, activeColor);
    }
    
    // Update mask based on annotations area (simplified as bounding boxes of annotations)
    if (annotations.length > 0) {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const mCtx = maskCanvas.getContext('2d');
        if (mCtx) {
            mCtx.fillStyle = 'black';
            mCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
            mCtx.fillStyle = 'white';
            annotations.forEach(anno => {
                // Create a circular area around the arrow end as the change target
                mCtx.beginPath();
                mCtx.arc(anno.endX, anno.endY, 100, 0, Math.PI * 2);
                mCtx.fill();
            });
            const base64 = maskCanvas.toDataURL('image/png').split(',')[1];
            onMaskReady({ base64, mimeType: 'image/png' });
        }
    }
  }, [annotations, isDrawing, currentStart, currentEnd, activeColor]);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    setCurrentStart(coords);
    setCurrentEnd(coords);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoords(e);
    if (coords) setCurrentEnd(coords);
  };

  const handleEnd = () => {
    if (isDrawing && currentStart && currentEnd) {
      const dist = Math.sqrt(Math.pow(currentEnd.x - currentStart.x, 2) + Math.pow(currentEnd.y - currentStart.y, 2));
      if (dist > 10) {
        const newId = Date.now().toString();
        setAnnotations(prev => [...prev, {
          id: newId,
          startX: currentStart.x,
          startY: currentStart.y,
          endX: currentEnd.x,
          endY: currentEnd.y,
          text: '',
          color: activeColor
        }]);
        setEditingId(newId);
      }
    }
    setIsDrawing(false);
    setCurrentStart(null);
    setCurrentEnd(null);
  };

  const handleTextChange = (id: string, text: string) => {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, text } : a));
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        className="w-full h-full cursor-crosshair"
      />
      {editingId && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-50">
          <div className="bg-[#1c1c1c] border border-white/10 p-6 rounded-2xl shadow-2xl pointer-events-auto w-80 animate-scale-up">
            <p className="text-white font-bold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColor }}></span>
                Nhập ghi chú ý tưởng
            </p>
            <textarea
              autoFocus
              className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-white text-sm h-32 mb-4 focus:outline-none focus:border-orange-500"
              placeholder="VD: Thay đổi vị trí cửa sổ, thêm bệ đá tại đây..."
              value={annotations.find(a => a.id === editingId)?.text || ''}
              onChange={(e) => handleTextChange(editingId, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) setEditingId(null); }}
            />
            <button 
                onClick={() => setEditingId(null)}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all"
            >
              Hoàn tất ghi chú
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
