
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { SourceImage, BoundingBox } from '../types';

interface BrushEditorProps {
  sourceImage: SourceImage;
  onMaskReady: (mask: SourceImage | null) => void;
  brushSize: number;
  clipBox?: BoundingBox | null;
}

interface Point { x: number; y: number; }
interface Stroke { points: Point[]; size: number; }

export const BrushEditor = forwardRef<{ clear: () => void, undo: () => void, redo: () => void }, BrushEditorProps>(({ sourceImage, onMaskReady, brushSize, clipBox }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);

  const redraw = (allStrokes: Stroke[], isClearing: boolean = false) => {
    const canvas = canvasRef.current;
    const visibleCtx = canvas?.getContext('2d');
    const maskCtx = maskCanvasRef.current?.getContext('2d');
    const tempCanvas = tempCanvasRef.current;
    const tempCtx = tempCanvas?.getContext('2d');
    if (!visibleCtx || !canvas || !maskCtx || !tempCtx || !tempCanvas) return;
    
    const width = canvas.width;
    const height = canvas.height;

    // 1. AI Mask (Logic đen trắng cho model)
    tempCtx.clearRect(0, 0, width, height);
    tempCtx.fillStyle = '#000000';
    tempCtx.fillRect(0, 0, width, height);

    tempCtx.save();
    if (clipBox) { tempCtx.beginPath(); tempCtx.rect(clipBox.x, clipBox.y, clipBox.width, clipBox.height); tempCtx.clip(); }
    
    allStrokes.forEach(s => {
        if (s.points.length < 1) return;
        tempCtx.beginPath();
        tempCtx.lineCap = 'round'; tempCtx.lineJoin = 'round'; tempCtx.lineWidth = s.size;
        tempCtx.strokeStyle = '#ffffff'; tempCtx.fillStyle = '#ffffff';

        if (s.points.length === 1) {
            tempCtx.beginPath(); tempCtx.arc(s.points[0].x, s.points[0].y, s.size / 2, 0, Math.PI * 2); tempCtx.fill();
        } else {
            tempCtx.moveTo(s.points[0].x, s.points[0].y);
            for (let i = 1; i < s.points.length; i++) tempCtx.lineTo(s.points[i].x, s.points[i].y);
            tempCtx.stroke();
        }
    });
    tempCtx.restore();

    // 2. UI Overlay (Chỉ vẽ vùng đỏ trên nền trong suốt để nhìn được ảnh gốc bên dưới)
    visibleCtx.clearRect(0, 0, width, height);
    
    visibleCtx.save();
    visibleCtx.globalAlpha = 0.6;
    visibleCtx.lineCap = 'round';
    visibleCtx.lineJoin = 'round';
    visibleCtx.strokeStyle = '#ef4444';
    visibleCtx.fillStyle = '#ef4444';

    if (clipBox) { visibleCtx.beginPath(); visibleCtx.rect(clipBox.x, clipBox.y, clipBox.width, clipBox.height); visibleCtx.clip(); }

    allStrokes.forEach(s => {
        if (s.points.length < 1) return;
        visibleCtx.lineWidth = s.size;
        if (s.points.length === 1) {
            visibleCtx.beginPath(); visibleCtx.arc(s.points[0].x, s.points[0].y, s.size / 2, 0, Math.PI * 2); visibleCtx.fill();
        } else {
            visibleCtx.beginPath();
            visibleCtx.moveTo(s.points[0].x, s.points[0].y);
            for (let i = 1; i < s.points.length; i++) visibleCtx.lineTo(s.points[i].x, s.points[i].y);
            visibleCtx.stroke();
        }
    });
    visibleCtx.restore();

    maskCtx.putImageData(tempCtx.getImageData(0, 0, width, height), 0, 0);
    
    // Chỉ cập nhật mask về ứng dụng nếu có nét vẽ mới hoặc đang thực hiện Clear
    if (allStrokes.length > 0) {
        onMaskReady({ base64: maskCanvasRef.current!.toDataURL('image/png').split(',')[1], mimeType: 'image/png' });
    } else if (isClearing) {
        onMaskReady(null);
    }
  };

  useImperativeHandle(ref, () => ({
    clear() { setStrokes([]); setRedoStack([]); redraw([], true); },
    undo() {
        if (strokes.length === 0) return;
        const last = strokes[strokes.length - 1];
        setRedoStack(prev => [last, ...prev]);
        const rem = strokes.slice(0, -1);
        setStrokes(rem);
        redraw(rem, rem.length === 0);
    },
    redo() {
        if (redoStack.length === 0) return;
        const next = redoStack[0];
        const updated = [...strokes, next];
        setStrokes(updated);
        setRedoStack(prev => prev.slice(1));
        redraw(updated);
    }
  }));

  useEffect(() => {
    const img = new Image();
    img.src = `data:${sourceImage.mimeType};base64,${sourceImage.base64}`;
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      if (canvasRef.current) { canvasRef.current.width = w; canvasRef.current.height = h; }
      const mCanvas = document.createElement('canvas'); mCanvas.width = w; mCanvas.height = h; maskCanvasRef.current = mCanvas;
      const tCanvas = document.createElement('canvas'); tCanvas.width = w; tCanvas.height = h; tempCanvasRef.current = tCanvas;
      // Khi load ảnh mới, KHÔNG gọi redraw([]) để tránh xóa mask cũ trong state cha
      setStrokes([]); setRedoStack([]); 
    };
  }, [sourceImage]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const coords = { x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width), y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height) };
      setIsDrawing(true); setCurrentStroke([coords]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const coords = { x: (e.clientX - rect.left) * (canvasRef.current!.width / rect.width), y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height) };
    const last = currentStroke[currentStroke.length - 1];
    setCurrentStroke(prev => [...prev, coords]);
    
    const visibleCtx = canvasRef.current?.getContext('2d');
    if (visibleCtx && last) {
        visibleCtx.save();
        if (clipBox) { visibleCtx.beginPath(); visibleCtx.rect(clipBox.x, clipBox.y, clipBox.width, clipBox.height); visibleCtx.clip(); }
        visibleCtx.beginPath();
        visibleCtx.moveTo(last.x, last.y); visibleCtx.lineTo(coords.x, coords.y);
        visibleCtx.strokeStyle = 'rgba(239, 68, 68, 0.6)'; visibleCtx.lineWidth = brushSize; visibleCtx.lineCap = 'round';
        visibleCtx.stroke(); visibleCtx.restore();
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    const newStroke: Stroke = { points: currentStroke, size: brushSize };
    const updated = [...strokes, newStroke];
    setStrokes(updated); setRedoStack([]); setIsDrawing(false); setCurrentStroke([]);
    redraw(updated);
  };

  return (
    <div className="absolute inset-0 w-full h-full cursor-crosshair">
      <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} className="w-full h-full" />
    </div>
  );
});
