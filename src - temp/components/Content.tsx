/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {useAtom} from 'jotai';
import getStroke from 'perfect-freehand';
import {useCallback, useMemo, useRef, useState, useEffect} from 'react';
import {ResizePayload, useResizeDetector} from 'react-resize-detector';
import {
  ActiveColorAtom,
  BoundingBoxes2DAtom,
  DetectTypeAtom,
  DrawModeAtom,
  ImageSentAtom,
  ImageSrcAtom,
  InventoryItemsAtom,
  LinesAtom,
  RevealOnHoverModeAtom,
  ShareStream,
  ShowInventoryAtom,
  VideoRefAtom,
  UploadedImagesAtom,
  SelectionModeAtom,
  ZoomAtom,
  PanAtom,
  ViewResetAtom,
} from '../state/atoms';
import {lineOptions} from '../utils/consts';
import {getSvgPathFromStroke, saveToInventory} from '../utils/utils';
import { CropModal } from './CropModal';
import { generateItemMetadata, generateUniqueId } from '../utils/utils';

export function Content() {
  const [imageSrc] = useAtom(ImageSrcAtom);
  const [uploadedImages] = useAtom(UploadedImagesAtom);
  const effectiveImageSrc = imageSrc || (uploadedImages.length > 0 ? uploadedImages[0].src : null);
  const [boundingBoxes2D] = useAtom(BoundingBoxes2DAtom);
  const [stream] = useAtom(ShareStream);
  const [detectType] = useAtom(DetectTypeAtom);
  const [videoRef] = useAtom(VideoRefAtom);
  const [, setImageSent] = useAtom(ImageSentAtom);
  const [revealOnHover] = useAtom(RevealOnHoverModeAtom);
  const [, setHoverEntered] = useState(false);
  const [hoveredBox, _setHoveredBox] = useState<number | null>(null);
  const [selectedBoxes, setSelectedBoxes] = useState<Set<number>>(new Set());
  const [drawMode] = useAtom(DrawModeAtom);
  const [lines, setLines] = useAtom(LinesAtom);
  const [activeColor] = useAtom(ActiveColorAtom);
  const [inventoryItems, setInventoryItems] = useAtom(InventoryItemsAtom);
  const [savingBoxIndex, setSavingBoxIndex] = useState<number | null>(null);
  const [, setShowInventory] = useAtom(ShowInventoryAtom);
  const [notification, setNotification] = useState<{type: 'success' | 'warning', message: string} | null>(null);
  
  // Zoom and pan state
  const [zoom, setZoom] = useAtom(ZoomAtom);
  const [pan, setPan] = useAtom(PanAtom);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastPan, setLastPan] = useState({ x: 0, y: 0 });
  const [viewReset] = useAtom(ViewResetAtom);

  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState<any>(null);

  // Item selection mode
  const [selectionMode] = useAtom(SelectionModeAtom);

  // Handling resize and aspect ratios
  const boundingBoxContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerDims, setContainerDims] = useState({
    width: 0,
    height: 0,
  });
  const [activeMediaDimensions, setActiveMediaDimensions] = useState({
    width: 800,
    height: 600,
  });

  const onResize = useCallback((el: ResizePayload) => {
    if (el.width && el.height) {
      setContainerDims({
        width: el.width,
        height: el.height,
      });
    }
  }, []);

  const {ref: containerRef} = useResizeDetector({onResize});
  const downRef = useRef<Boolean>(false);

  const boundingBoxContainer = useMemo(() => {
    // Use fallback dimensions if container hasn't been measured yet
    const containerWidth = containerDims.width || 800;
    const containerHeight = containerDims.height || 600;
    
    const {width, height} = activeMediaDimensions;
    const aspectRatio = width / height;
    const containerAspectRatio = containerWidth / containerHeight;
    
    let result;
    if (aspectRatio < containerAspectRatio) {
      result = {
        height: containerHeight,
        width: containerHeight * aspectRatio,
      };
    } else {
      result = {
        width: containerWidth,
        height: containerWidth / aspectRatio,
      };
    }
    
    return result;
  }, [containerDims, activeMediaDimensions]);

  // Zoom and pan handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSpeed = 0.1;
      const newZoom = Math.max(0.5, Math.min(5, zoom + (e.deltaY > 0 ? -zoomSpeed : zoomSpeed)));
      setZoom(newZoom);
    }
  }, [zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) { // Middle mouse or Ctrl+click
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setLastPan(pan);
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPan({
        x: lastPan.x + deltaX,
        y: lastPan.y + deltaY
      });
    }
  }, [isDragging, dragStart, lastPan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset zoom and pan
  useEffect(() => {
    if (viewReset > 0) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }
  }, [viewReset, setZoom, setPan]);

  // Enhanced box hover detection
  function setHoveredBox(e: React.PointerEvent) {
    if (selectionMode === 'crop' || isDragging) return;
    
    const boxes = document.querySelectorAll('.bbox');
    const dimensionsAndIndex = Array.from(boxes).map((box) => {
      const {top, left, width, height} = box.getBoundingClientRect();
      const originalIndex = parseInt(box.getAttribute('data-original-index') || '0');
      return {
        top,
        left,
        width,
        height,
        index: originalIndex,
      };
    });
    
    const sorted = dimensionsAndIndex.sort(
      (a, b) => a.width * a.height - b.width * b.height,
    );
    
    const {clientX, clientY} = e;
    const found = sorted.find(({top, left, width, height}) => {
      return (
        clientX > left &&
        clientX < left + width &&
        clientY > top &&
        clientY < top + height
      );
    });
    
    if (found) {
      _setHoveredBox(found.index);
    } else {
      _setHoveredBox(null);
    }
  }

  // Enhanced item selection
  const handleBoxClick = useCallback((boxIndex: number, box: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (selectionMode === 'multi') {
      const newSelected = new Set(selectedBoxes);
      if (newSelected.has(boxIndex)) {
        newSelected.delete(boxIndex);
      } else {
        newSelected.add(boxIndex);
      }
      setSelectedBoxes(newSelected);
    } else if (selectionMode === 'crop') {
      setSelectedBox(box);
      setShowCropModal(true);
    } else {
      // Single selection mode - save to inventory
      handleSaveToInventory(box, boxIndex);
    }
  }, [selectionMode, selectedBoxes]);

  // Batch save selected items
  const handleBatchSave = useCallback(async () => {
    if (selectedBoxes.size === 0) return;

    setSavingBoxIndex(-1); // Special index for batch save

    try {
      const itemsToSave = Array.from(selectedBoxes).filter(boxIndex => {
        const box = boundingBoxes2D[boxIndex];
        const isDuplicate = inventoryItems.some(item => item.label === box.label);
        if (isDuplicate) {
          showWarningNotification(`"${box.label}" is already in inventory. Skipping.`);
        }
        return !isDuplicate;
      });

      if (itemsToSave.length === 0) {
        showWarningNotification('All selected items are already in inventory.');
        setSelectedBoxes(new Set());
        return;
      }

      const newItems = await Promise.all(
        itemsToSave.map(async (boxIndex) => {
          const box = boundingBoxes2D[boxIndex];
          return await createInventoryItem(box);
        })
      );

      setInventoryItems(prev => [...prev, ...newItems]);
      setSelectedBoxes(new Set());

      // Show success notification
      showSuccessNotification(`${newItems.length} new item(s) saved to inventory!`);

      // Auto-show inventory if first items
      if (inventoryItems.length === 0) {
        setTimeout(() => setShowInventory(true), 1500);
      }
    } catch (error) {
      console.error('Error saving items:', error);
    } finally {
      setSavingBoxIndex(null);
    }
  }, [selectedBoxes, boundingBoxes2D, inventoryItems.length, setInventoryItems, setShowInventory]);

  // Single item save
  const handleSaveToInventory = useCallback(async (box: any, boxIndex: number) => {
    if (inventoryItems.some(item => item.label === box.label)) {
      showWarningNotification(`${box.label} is already in the inventory.`);
      return;
    }
    setSavingBoxIndex(boxIndex);
    
    try {
      const newItem = await createInventoryItem(box);
      setInventoryItems(prev => [...prev, newItem]);
      
      showSuccessNotification(`${box.label} saved to inventory!`);
      
      if (inventoryItems.length === 0) {
        setTimeout(() => setShowInventory(true), 1500);
      }
    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setSavingBoxIndex(null);
    }
  }, [inventoryItems, setInventoryItems, setShowInventory]);

  // Helper function to create inventory item
  const createInventoryItem = async (box: any) => {
    const inventoryItem = {
      id: generateUniqueId(),
      imageUrl: await cropBoxToImage(box),
      label: box.label,
      category: box.label.split(' ')[0],
      tags: [box.label],
      dateAdded: new Date().toISOString(),
      sourceImageUrl: effectiveImageSrc || undefined,
      notes: '',
      originalBox: box,
      metadata: await generateItemMetadata(effectiveImageSrc || '', box.label),
    };
    return inventoryItem;
  };

  // Helper function to crop box to image
  const cropBoxToImage = async (box: any): Promise<string> => {
    if (!effectiveImageSrc) throw new Error('No source image');
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create canvas context'));
          return;
        }
        
        const cropWidth = Math.round(box.width * img.width);
        const cropHeight = Math.round(box.height * img.height);
        const cropX = Math.round(box.x * img.width);
        const cropY = Math.round(box.y * img.height);
        
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        resolve(canvas.toDataURL('image/png', 1.0));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = effectiveImageSrc;
    });
  };

  // Show success notification
  const showSuccessNotification = (message: string) => {
    setNotification({ type: 'success', message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Show warning notification
  const showWarningNotification = (message: string) => {
    setNotification({ type: 'warning', message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Crop modal save handler
  const handleCropAndSave = async (croppedData: { imageUrl: string; label: string; cropBox: any }) => {
    const inventoryItem = {
      id: generateUniqueId(),
      imageUrl: croppedData.imageUrl,
      label: croppedData.label,
      category: croppedData.label.split(' ')[0],
      tags: [croppedData.label],
      dateAdded: new Date().toISOString(),
      sourceImageUrl: effectiveImageSrc || undefined,
      notes: '',
      originalBox: croppedData.cropBox,
      metadata: await generateItemMetadata(croppedData.imageUrl, croppedData.label),
    };
    
    setInventoryItems(prev => [...prev, inventoryItem]);
    
    if (inventoryItems.length === 0) {
      setTimeout(() => setShowInventory(true), 1500);
    }
    
    showSuccessNotification(`${croppedData.label} saved to inventory!`);
  };

  const transformStyle = {
    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
    transformOrigin: 'center center',
    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      {/* Notification Toast */}
      {notification && (
        <div className="toast toast-end toast-bottom z-[100]">
          <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-warning'} shadow-lg`}>
            <div>
              {notification.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              )}
              <span>{notification.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="absolute bottom-4 left-4 z-50 bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 border border-gray-600 shadow-lg">
        <div className="text-white text-sm font-medium mb-1">Controls</div>
        <div className="text-xs text-gray-300 space-y-0.5">
          <div>• Ctrl+Wheel: Zoom</div>
          <div>• Ctrl+Drag: Pan</div>
          <div>• Click boxes to select</div>
          {selectionMode === 'multi' && <div>• Multi-select mode active</div>}
          {selectionMode === 'crop' && <div>• Crop mode active</div>}
        </div>
      </div>

      {/* Image Container */}
      <div 
        className="w-full h-full flex items-center justify-center bg-black"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div 
          className="relative"
          style={{
            ...transformStyle,
            width: Math.max(boundingBoxContainer.width, 400),
            height: Math.max(boundingBoxContainer.height, 300),
            minWidth: '400px',
            minHeight: '300px'
          }}
        >
          {(!effectiveImageSrc && stream) ? (
            <video
              className="w-full h-full object-contain"
              autoPlay
              onLoadedMetadata={(e) => {
                setActiveMediaDimensions({
                  width: e.currentTarget.videoWidth,
                  height: e.currentTarget.videoHeight,
                });
              }}
              ref={(video) => {
                videoRef.current = video;
                if (video && !video.srcObject) {
                  video.srcObject = stream;
                }
              }}
            />
          ) : (
            effectiveImageSrc && (
              <img
                src={effectiveImageSrc}
                className="w-full h-full object-contain"
                alt="Uploaded image"
                onLoad={(e) => {
                  setActiveMediaDimensions({
                    width: e.currentTarget.naturalWidth,
                    height: e.currentTarget.naturalHeight,
                  });
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              />
            )
          )}

          {/* Bounding Boxes Overlay */}
          <div
            className="absolute inset-0"
            ref={boundingBoxContainerRef}
            onPointerEnter={(e) => {
              if (revealOnHover && !drawMode) {
                setHoverEntered(true);
                setHoveredBox(e);
              }
            }}
            onPointerMove={(e) => {
              if (revealOnHover && !drawMode) {
                setHoverEntered(true);
                setHoveredBox(e);
              }
              if (downRef.current) {
                const parentBounds = boundingBoxContainerRef.current!.getBoundingClientRect();
                setLines((prev) => [
                  ...prev.slice(0, prev.length - 1),
                  [
                    [
                      ...prev[prev.length - 1][0],
                      [
                        (e.clientX - parentBounds.left) / boundingBoxContainer!.width,
                        (e.clientY - parentBounds.top) / boundingBoxContainer!.height,
                      ],
                    ],
                    prev[prev.length - 1][1],
                  ],
                ]);
              }
            }}
            onPointerLeave={(e) => {
              if (revealOnHover && !drawMode) {
                setHoverEntered(false);
                setHoveredBox(e);
              }
            }}
            onPointerDown={(e) => {
              if (drawMode) {
                setImageSent(false);
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                downRef.current = true;
                const parentBounds = boundingBoxContainerRef.current!.getBoundingClientRect();
                setLines((prev) => [
                  ...prev,
                  [
                    [
                      [
                        (e.clientX - parentBounds.left) / boundingBoxContainer!.width,
                        (e.clientY - parentBounds.top) / boundingBoxContainer!.height,
                      ],
                    ],
                    activeColor,
                  ],
                ]);
              }
            }}
            onPointerUp={(e) => {
              if (drawMode) {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
                downRef.current = false;
              }
            }}
          >
            {/* Drawing Lines */}
            {lines.length > 0 && (
              <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {lines.map(([points, color], i) => (
                  <path
                    key={i}
                    d={getSvgPathFromStroke(
                      getStroke(
                        points.map(([x, y]) => [
                          x * boundingBoxContainer!.width,
                          y * boundingBoxContainer!.height,
                          0.5,
                        ]),
                        lineOptions,
                      ),
                    )}
                    fill={color}
                  />
                ))}
              </svg>
            )}

            {/* Enhanced Bounding Boxes */}
            {detectType === '2D bounding boxes' &&
              boundingBoxes2D
                .map((box, i) => ({
                  ...box,
                  index: i,
                  area: box.width * box.height
                }))
                .sort((a, b) => b.area - a.area)
                .map((boxWithIndex) => {
                  const { index: i, area, ...box } = boxWithIndex;
                  const isHovered = i === hoveredBox;
                  const isSelected = selectedBoxes.has(i);
                  const isSaving = savingBoxIndex === i || savingBoxIndex === -1;
                  
                  return (
                    <div
                      key={i}
                      className={`absolute bbox transition-all duration-200 cursor-pointer group`}
                      data-original-index={i}
                      style={{
                        top: box.y * 100 + '%',
                        left: box.x * 100 + '%',
                        width: box.width * 100 + '%',
                        height: box.height * 100 + '%',
                        border: isSelected 
                          ? '3px solid rgb(34, 197, 94)' 
                          : isHovered 
                            ? '3px solid rgb(37, 99, 235)' 
                            : '2px solid rgb(59, 130, 246)',
                        backgroundColor: isSelected
                          ? 'rgba(34, 197, 94, 0.1)'
                          : isHovered 
                            ? 'rgba(59, 130, 246, 0.08)' 
                            : 'transparent',
                        boxShadow: isSelected
                          ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 20px rgba(34, 197, 94, 0.4)'
                          : isHovered 
                            ? 'inset 0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 20px rgba(59, 130, 246, 0.4)' 
                            : 'none',
                        zIndex: isHovered || isSelected ? 100 : Math.floor((1 - area) * 50),
                      }}
                      onMouseEnter={() => _setHoveredBox(i)}
                      onMouseLeave={() => _setHoveredBox(null)}
                      onClick={(e) => handleBoxClick(i, box, e)}
                    >
                      {/* Enhanced Label */}
                      <div className="absolute top-1 left-1 max-w-[calc(100%-8px)]">
                        <div 
                          className={`
                            inline-flex items-center gap-1.5 
                            bg-gray-900/90 backdrop-blur-sm 
                            text-white text-xs font-medium
                            px-2 py-1 rounded
                            shadow-lg
                            transition-all duration-200
                            ${isHovered || isSelected ? 'scale-105' : 'scale-100'}
                          `}
                        >
                          <span className="truncate">{box.label}</span>
                          
                          {/* Selection indicator */}
                          {isSelected && (
                            <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                          
                          {/* Loading indicator */}
                          {isSaving && (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action buttons on hover */}
                      {(isHovered || isSelected) && !isSaving && selectionMode === 'single' && (
                        <div className="absolute bottom-1 right-1">
                          <div className="flex gap-1">
                            <button 
                              className="p-1 hover:bg-white/20 rounded transition-all hover:scale-110 min-w-[24px] min-h-[24px] flex items-center justify-center bg-gray-900/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBox(box);
                                setShowCropModal(true);
                              }}
                              title="Crop and edit"
                            >
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Click hint */}
                      {isHovered && !isSaving && (
                        <div className="absolute bottom-1 left-1">
                          <div className="bg-gray-900/80 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded shadow">
                            {selectionMode === 'single' && 'Click to save'}
                            {selectionMode === 'multi' && (isSelected ? 'Click to deselect' : 'Click to select')}
                            {selectionMode === 'crop' && 'Click to crop'}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
      
      {/* Crop Modal */}
      <CropModal
        isOpen={showCropModal}
        onClose={() => {
          setShowCropModal(false);
          setSelectedBox(null);
        }}
        box={selectedBox}
        onSave={handleCropAndSave}
      />
    </div>
  );
}
