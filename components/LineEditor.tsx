
import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import type { SourceImage } from '../types';

interface LineEditorProps {
  sourceImage: SourceImage;
  onMaskReady: (mask: SourceImage | null) => void;
  brushSize: number;
}

interface Point {
  x: number;
  y: number;
}

export const LineEditor = forwardRef<{ clear: () => void }, LineEditorProps>(({ sourceImage, onMaskReady, brushSize }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentEndPoint, setCurrentEndPoint] = useState<Point | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const clear = () => {
    setStartPoint(null);
    setCurrentEndPoint(null);
    onMaskReady(null);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    }

    const maskCanvas = maskCanvasRef.current;
    if (maskCanvas) {
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskCtx.fillStyle = '#000000';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      }
    }
  };

  useImperativeHandle(ref, () => ({
    clear
  }));

  useEffect(() => {
    const img = new Image();
    img.src = `data:${sourceImage.mimeType};base64,${sourceImage.base64}`;
    img.onload = () => {
      const { naturalWidth, naturalHeight } = img;
      setImageSize({ width: naturalWidth, height: naturalHeight });
      
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = naturalWidth;
        canvas.height = naturalHeight;
      }
      
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = naturalWidth;
      maskCanvas.height = naturalHeight;
      const maskCtx = maskCanvas.getContext('2d');
      if (maskCtx) {
        maskCtx.fillStyle = '#000000';
        maskCtx.fillRect(0, 0, naturalWidth, naturalHeight);
      }
      maskCanvasRef.current = maskCanvas;
      
      clear();
    };
  }, [sourceImage]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    if (coords) {
      setStartPoint(coords);
      setCurrentEndPoint(coords);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (startPoint) {
      setCurrentEndPoint(getCanvasCoordinates(e));
    }
  };

  const handleMouseUp = () => {
    if (startPoint && currentEndPoint && maskCanvasRef.current) {
      const maskCtx = maskCanvasRef.current.getContext('2d');
      const visibleCtx = canvasRef.current?.getContext('2d');
      
      if (maskCtx && visibleCtx) {
        const drawLine = (ctx: CanvasRenderingContext2D, color: string) => {
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(currentEndPoint.x, currentEndPoint.y);
            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.stroke();
        };

        drawLine(maskCtx, '#FFFFFF');
        drawLine(visibleCtx, 'rgba(220, 38, 38, 0.7)');

        const base64 = maskCanvasRef.current.toDataURL('image/png').split(',')[1];
        onMaskReady({ base64, mimeType: 'image/png' });
      }
    }
    setStartPoint(null);
    setCurrentEndPoint(null);
  };

  return (
    <div className="absolute inset-0 w-full h-full cursor-crosshair">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full"
      />
      {startPoint && currentEndPoint && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
            style={{ width: '100%', height: '100%' }}
          >
              <line 
                x1={startPoint.x} 
                y1={startPoint.y} 
                x2={currentEndPoint.x} 
                y2={currentEndPoint.y} 
                stroke="rgba(220, 38, 38, 0.5)" 
                strokeWidth={brushSize} 
                strokeLinecap="round" 
              />
          </svg>
      )}
    </div>
  );
});
