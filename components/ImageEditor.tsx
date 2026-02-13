
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { SourceImage } from '../types';

interface ImageEditorProps {
  sourceImage: SourceImage;
  onMaskReady: (mask: SourceImage | null) => void;
  strokeWidth: number;
}

interface Point { x: number; y: number; }
interface Shape { points: Point[]; }

const CLOSING_THRESHOLD = 20;

export const ImageEditor = forwardRef<{ clear: () => void, undo: () => void, redo: () => void }, ImageEditorProps>(({ sourceImage, onMaskReady, strokeWidth }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [redoStack, setRedoStack] = useState<Shape[]>([]);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);

  const redraw = (allShapes: Shape[], activePoints: Point[], isClearing: boolean = false) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const maskCtx = maskCanvasRef.current?.getContext('2d');
    const tempCanvas = tempCanvasRef.current;
    const tempCtx = tempCanvas?.getContext('2d');
    
    if (!ctx || !canvas || !maskCtx || !tempCtx || !tempCanvas) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. AI Mask (Logic đen trắng cho model)
    tempCtx.clearRect(0, 0, width, height);
    tempCtx.fillStyle = '#000000';
    tempCtx.fillRect(0, 0, width, height);

    allShapes.forEach(shape => {
        if (shape.points.length < 3) return;
        tempCtx.save();
        tempCtx.beginPath();
        tempCtx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) tempCtx.lineTo(shape.points[i].x, shape.points[i].y);
        tempCtx.closePath();
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fill();
        tempCtx.restore();
    });

    // 2. UI Rendering (Chỉ vẽ vùng đỏ trên nền trong suốt)
    ctx.clearRect(0, 0, width, height);
    
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#ef4444';

    allShapes.forEach(shape => {
        if (shape.points.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) ctx.lineTo(shape.points[i].x, shape.points[i].y);
        ctx.closePath();
        ctx.fill();
    });
    ctx.restore();

    // 3. Đường viền và điểm chốt
    ctx.save();
    allShapes.forEach(shape => {
        if (shape.points.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) ctx.lineTo(shape.points[i].x, shape.points[i].y);
        ctx.closePath();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    });

    if (activePoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(activePoints[0].x, activePoints[0].y);
        for (let i = 1; i < activePoints.length; i++) ctx.lineTo(activePoints[i].x, activePoints[i].y);
        if (cursorPos) {
            ctx.lineTo(cursorPos.x, cursorPos.y);
            ctx.setLineDash([8, 8]);
            ctx.strokeStyle = '#f97316';
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
        activePoints.forEach((p, idx) => {
            ctx.beginPath(); ctx.arc(p.x, p.y, strokeWidth + 4, 0, Math.PI * 2);
            ctx.fillStyle = idx === 0 ? '#22c55e' : '#ef4444';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();
        });
    }
    ctx.restore();

    maskCtx.putImageData(tempCtx.getImageData(0, 0, width, height), 0, 0);
    
    if (allShapes.length > 0) {
        onMaskReady({ base64: maskCanvasRef.current!.toDataURL('image/png').split(',')[1], mimeType: 'image/png' });
    } else if (isClearing) {
        onMaskReady(null);
    }
  };

  useImperativeHandle(ref, () => ({
    clear() { setShapes([]); setCurrentPoints([]); setRedoStack([]); redraw([], [], true); },
    undo() {
        if (shapes.length === 0) return;
        const last = shapes[shapes.length - 1];
        setRedoStack(prev => [last, ...prev]);
        const rem = shapes.slice(0, -1);
        setShapes(rem);
        redraw(rem, [], rem.length === 0);
    },
    redo() {
        if (redoStack.length === 0) return;
        const next = redoStack[0];
        const updated = [...shapes, next];
        setShapes(updated);
        setRedoStack(prev => prev.slice(1));
        redraw(updated, []);
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
      setShapes([]); setCurrentPoints([]); 
      // Không gọi redraw([]) để bảo lưu mask hiện có trong state cha
    };
  }, [sourceImage]);

  useEffect(() => { 
    // Chỉ redraw khi có thay đổi thực sự từ user
    if (shapes.length > 0 || currentPoints.length > 0) {
        redraw(shapes, currentPoints); 
    }
  }, [shapes, currentPoints, cursorPos]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const coords = { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * (canvasRef.current!.height / rect.height) };
    
    if (currentPoints.length >= 3) {
      const dist = Math.sqrt(Math.pow(coords.x - currentPoints[0].x, 2) + Math.pow(coords.y - currentPoints[0].y, 2));
      if (dist < (CLOSING_THRESHOLD * scaleX)) {
        const newShape: Shape = { points: [...currentPoints] };
        const updatedShapes = [...shapes, newShape];
        setShapes(updatedShapes);
        setCurrentPoints([]); setRedoStack([]); redraw(updatedShapes, []);
        return;
      }
    }
    setCurrentPoints(prev => [...prev, coords]);
  };

  return (
    <div className="absolute inset-0 w-full h-full cursor-crosshair">
      <canvas ref={canvasRef} onClick={handleCanvasClick} onMouseMove={(e) => { 
          const rect = e.currentTarget.getBoundingClientRect(); 
          setCursorPos({ x: (e.clientX - rect.left) * (e.currentTarget.width / rect.width), y: (e.clientY - rect.top) * (e.currentTarget.height / rect.height) }); 
      }} onMouseLeave={() => setCursorPos(null)} className="w-full h-full" />
    </div>
  );
});
