import { useState, useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import { ImageSrcAtom } from '../state/atoms';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  box: any;
  onSave: (croppedData: { imageUrl: string; label: string; cropBox: any }) => void;
}

export function CropModal({ isOpen, onClose, box, onSave }: CropModalProps) {
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [label, setLabel] = useState(box?.label || '');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [croppedImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cropBox, setCropBox] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 100
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isOpen && box && imageSrc) {
      setLabel(box.label);
      loadAndDrawImage();
    }
  }, [isOpen, box, imageSrc]);

  const loadAndDrawImage = async () => {
    if (!imageSrc || !canvasRef.current || !containerRef.current) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current!;
      const container = containerRef.current!;
      
      // Set canvas size to match container
      const containerRect = container.getBoundingClientRect();
      const scale = Math.min(
        containerRect.width / img.width,
        containerRect.height / img.height
      ) * 0.9;
      
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Initialize crop box from bounding box
      setCropBox({
        x: box.x * canvas.width,
        y: box.y * canvas.height,
        width: box.width * canvas.width,
        height: box.height * canvas.height
      });
      
      drawImage();
    };
    img.src = imageSrc;
  };

  const drawImage = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = imageRef.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Draw darkened overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Clear crop area to show original image
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    ctx.restore();
    
    // Draw crop box border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    
    // Draw resize handles
    const handleSize = 8;
    ctx.fillStyle = '#3b82f6';
    
    // Corners
    ctx.fillRect(cropBox.x - handleSize/2, cropBox.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropBox.x + cropBox.width - handleSize/2, cropBox.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropBox.x - handleSize/2, cropBox.y + cropBox.height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropBox.x + cropBox.width - handleSize/2, cropBox.y + cropBox.height - handleSize/2, handleSize, handleSize);
    
    // Edges
    ctx.fillRect(cropBox.x + cropBox.width/2 - handleSize/2, cropBox.y - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropBox.x + cropBox.width/2 - handleSize/2, cropBox.y + cropBox.height - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropBox.x - handleSize/2, cropBox.y + cropBox.height/2 - handleSize/2, handleSize, handleSize);
    ctx.fillRect(cropBox.x + cropBox.width - handleSize/2, cropBox.y + cropBox.height/2 - handleSize/2, handleSize, handleSize);
  };

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getResizeHandle = (pos: { x: number; y: number }) => {
    const threshold = 10;
    const { x, y, width, height } = cropBox;
    
    if (Math.abs(pos.x - x) < threshold && Math.abs(pos.y - y) < threshold) return 'nw';
    if (Math.abs(pos.x - (x + width)) < threshold && Math.abs(pos.y - y) < threshold) return 'ne';
    if (Math.abs(pos.x - x) < threshold && Math.abs(pos.y - (y + height)) < threshold) return 'sw';
    if (Math.abs(pos.x - (x + width)) < threshold && Math.abs(pos.y - (y + height)) < threshold) return 'se';
    if (Math.abs(pos.x - (x + width/2)) < threshold && Math.abs(pos.y - y) < threshold) return 'n';
    if (Math.abs(pos.x - (x + width/2)) < threshold && Math.abs(pos.y - (y + height)) < threshold) return 's';
    if (Math.abs(pos.x - x) < threshold && Math.abs(pos.y - (y + height/2)) < threshold) return 'w';
    if (Math.abs(pos.x - (x + width)) < threshold && Math.abs(pos.y - (y + height/2)) < threshold) return 'e';
    
    if (pos.x >= x && pos.x <= x + width && pos.y >= y && pos.y <= y + height) return 'move';
    
    return '';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const handle = getResizeHandle(pos);
    
    if (handle === 'move') {
      setIsDragging(true);
      setDragStart({ x: pos.x - cropBox.x, y: pos.y - cropBox.y });
    } else if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setDragStart(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const canvas = canvasRef.current!;
    
    if (isDragging) {
      setCropBox(prev => ({
        ...prev,
        x: Math.max(0, Math.min(canvas.width - prev.width, pos.x - dragStart.x)),
        y: Math.max(0, Math.min(canvas.height - prev.height, pos.y - dragStart.y))
      }));
      drawImage();
    } else if (isResizing) {
      let newBox = { ...cropBox };
      
      switch (resizeHandle) {
        case 'nw':
          newBox.width += newBox.x - pos.x;
          newBox.height += newBox.y - pos.y;
          newBox.x = pos.x;
          newBox.y = pos.y;
          break;
        case 'ne':
          newBox.width = pos.x - newBox.x;
          newBox.height += newBox.y - pos.y;
          newBox.y = pos.y;
          break;
        case 'sw':
          newBox.width += newBox.x - pos.x;
          newBox.height = pos.y - newBox.y;
          newBox.x = pos.x;
          break;
        case 'se':
          newBox.width = pos.x - newBox.x;
          newBox.height = pos.y - newBox.y;
          break;
        case 'n':
          newBox.height += newBox.y - pos.y;
          newBox.y = pos.y;
          break;
        case 's':
          newBox.height = pos.y - newBox.y;
          break;
        case 'w':
          newBox.width += newBox.x - pos.x;
          newBox.x = pos.x;
          break;
        case 'e':
          newBox.width = pos.x - newBox.x;
          break;
      }
      
      // Ensure minimum size
      if (newBox.width > 20 && newBox.height > 20) {
        setCropBox(newBox);
        drawImage();
      }
    } else {
      // Update cursor
      const handle = getResizeHandle(pos);
      const cursors: { [key: string]: string } = {
        'nw': 'nw-resize',
        'ne': 'ne-resize',
        'sw': 'sw-resize',
        'se': 'se-resize',
        'n': 'n-resize',
        's': 's-resize',
        'w': 'w-resize',
        'e': 'e-resize',
        'move': 'move'
      };
      canvas.style.cursor = cursors[handle] || 'default';
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  };

  const handleSave = async () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const img = imageRef.current;
    
    // Create a new canvas for the cropped image
    const cropCanvas = document.createElement('canvas');
    const cropCtx = cropCanvas.getContext('2d')!;
    
    // Calculate actual crop dimensions on original image
    const scaleX = img.width / canvas.width;
    const scaleY = img.height / canvas.height;
    
    const actualCrop = {
      x: cropBox.x * scaleX,
      y: cropBox.y * scaleY,
      width: cropBox.width * scaleX,
      height: cropBox.height * scaleY
    };
    
    cropCanvas.width = actualCrop.width;
    cropCanvas.height = actualCrop.height;
    
    // Draw cropped portion
    cropCtx.drawImage(
      img,
      actualCrop.x, actualCrop.y,
      actualCrop.width, actualCrop.height,
      0, 0,
      actualCrop.width, actualCrop.height
    );
    
    const croppedImageUrl = cropCanvas.toDataURL('image/png', 1.0);
    
    // Convert back to relative coordinates
    const relativeCrop = {
      x: actualCrop.x / img.width,
      y: actualCrop.y / img.height,
      width: actualCrop.width / img.width,
      height: actualCrop.height / img.height,
      label: label
    };
    
    onSave({
      imageUrl: croppedImageUrl,
      label: label,
      cropBox: relativeCrop
    });
    
    onClose();
  };



  const generateTags = async () => {
    setIsGenerating(true);
    // TODO: Call AI to generate tags
    setTimeout(() => {
      setAiTags([label.toLowerCase(), 'item', 'detected']);
      setIsGenerating(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="modal-box bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden text-white border border-gray-600">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Crop & Edit Item</h2>
          <p className="text-sm text-gray-300 mt-1">Adjust the crop area and edit item details</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Canvas for cropping */}
          <div 
            ref={containerRef}
            className="relative bg-black rounded-lg overflow-hidden border border-gray-600"
            style={{
              width: '100%',
              height: '400px',
            }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
            
            {cropBox && (
              <div 
                className="absolute border-2 border-blue-500 bg-blue-500/20"
                style={{
                  left: `${cropBox.x}px`,
                  top: `${cropBox.y}px`,
                  width: `${cropBox.width}px`,
                  height: `${cropBox.height}px`,
                }}
              >
                {/* Resize handles */}
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white cursor-nw-resize"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white cursor-ne-resize"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white cursor-sw-resize"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white cursor-se-resize"></div>
              </div>
            )}
          </div>
          
          {/* Item Details Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text text-white font-medium">Item Name</span>
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="input input-bordered w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  placeholder="Enter item name..."
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text text-white font-medium">Category</span>
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input input-bordered w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  placeholder="e.g., Kitchen, Electronics..."
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text text-white font-medium">Notes</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="textarea textarea-bordered w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text text-white font-medium">AI Generated Tags</span>
                </label>
                <button 
                  onClick={generateTags}
                  className={`btn bg-blue-600 hover:bg-blue-700 text-white border-blue-600 ${isGenerating ? 'loading' : ''}`}
                  disabled={isGenerating || !label}
                >
                  {isGenerating ? 'Generating...' : 'Generate Tags'}
                </button>
                {aiTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {aiTags.map((tag, index) => (
                      <span key={index} className="badge bg-blue-600 text-white border-blue-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text text-white font-medium">Preview</span>
                </label>
                <div className="aspect-square bg-black rounded-lg border border-gray-600 overflow-hidden">
                  {croppedImageUrl ? (
                    <img src={croppedImageUrl} alt="Cropped preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span>Preview will appear here</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-ghost text-gray-300 hover:text-white hover:bg-gray-700">
            Cancel
          </button>
          <button onClick={handleSave} className="btn bg-blue-600 hover:bg-blue-700 text-white border-blue-600">
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
} 