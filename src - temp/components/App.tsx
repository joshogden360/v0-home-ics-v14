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

import React, {useEffect, useState} from 'react';
import {useAtom} from 'jotai';
import {Content} from './Content';
import {LoadingIndicator} from './LoadingIndicator';
import {MainToolbar} from './MainToolbar';
import {BottomCarousel} from './BottomCarousel';
import {RightPanelInventory} from './RightPanelInventory';
import {SideNavbar} from './SideNavbar';
import {
  BumpSessionAtom,
  ImageSrcAtom,
  InitFinishedAtom,
  IsUploadedImageAtom,
  ShowInventoryAtom,
  DetectTypeAtom,
  UploadedImagesAtom,
  ShareStream,
  InventoryItemsAtom,
  LeftPanelExpandedAtom,
  RightPanelExpandedAtom,
} from '../state/atoms';

function App() {
  const [imageSrc, setImageSrc] = useAtom(ImageSrcAtom);
  const [initFinished, setInitFinished] = useState(false);
  const [, setBumpSession] = useAtom(BumpSessionAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [showInventory] = useAtom(ShowInventoryAtom);
  const [stream] = useAtom(ShareStream);
  const [, setShareStream] = useAtom(ShareStream);
  const [, setDetectType] = useAtom(DetectTypeAtom);
  const [, setUploadedImages] = useAtom(UploadedImagesAtom);
  const [inventoryItems] = useAtom(InventoryItemsAtom);
  const [leftPanelExpanded] = useAtom(LeftPanelExpandedAtom);
  const [rightPanelExpanded] = useAtom(RightPanelExpandedAtom);

  // Simple static title component
  const StaticTitle = () => (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-white font-ui mb-4">The Itemizer</h1>
      <p className="text-base font-medium text-slate-300 font-ui">
        Itemize and organize with ease.
      </p>
    </div>
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    setDetectType('2D bounding boxes');
  }, [setDetectType]);

  // Initialize the app
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitFinished(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const generateImageId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const imagePromises = Array.from(files).map((file, index) => {
          return new Promise<{id: string, src: string, name: string}>((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              resolve({
                id: `${Date.now()}-${index}`,
                src: event.target?.result as string,
                name: file.name
              });
            };
            reader.readAsDataURL(file);
          });
        });

        Promise.all(imagePromises).then((images) => {
          const imagesWithDates = images.map(img => ({
            ...img,
            uploadDate: new Date().toISOString()
          }));
          setUploadedImages(imagesWithDates);
          if (images.length > 0) {
            setImageSrc(images[0].src);
            setIsUploadedImage(true);
            setShareStream(null);
            setBumpSession((prev) => prev + 1);
            
            // Auto-trigger object detection after a short delay
            setTimeout(() => {
              const findItemsButton = document.querySelector('button[title="Detect Items in Image"]') as HTMLButtonElement;
              if (findItemsButton && !findItemsButton.disabled) {
                findItemsButton.click();
              }
            }, 500);
          }
        });
      }
    };
    input.click();
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageSrcResult = e.target?.result as string;
          const imageData = {
            id: generateImageId(),
            src: imageSrcResult,
            name: file.name || 'Camera capture ' + new Date().toLocaleTimeString(),
            uploadDate: new Date().toISOString(),
          };
          
          setUploadedImages(prev => [...prev, imageData]);
          setImageSrc(imageSrcResult);
          setIsUploadedImage(true);
          setShareStream(null);
          setBumpSession((prev) => prev + 1);
          
          // Auto-trigger object detection after a short delay
          setTimeout(() => {
            const findItemsButton = document.querySelector('button[title="Detect Items in Image"]') as HTMLButtonElement;
            if (findItemsButton && !findItemsButton.disabled) {
              findItemsButton.click();
            }
          }, 500);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const TakePhotoIconSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const UploadPhotosIconSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden flex flex-col">
      {/* Check if we have uploaded images */}
      {!imageSrc ? (
        /* Landing Page */
        <div className="h-full flex items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-blue-900 opacity-90"></div>
          <div className="relative max-w-3xl mx-auto px-8 text-center">
            <div className="mb-16">
              <StaticTitle />
              <div className="w-20 h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto mb-4"></div>
            </div>

            <div className="flex gap-4 justify-center max-w-sm mx-auto">
              {/* Take Photo Button */}
              <div
                onClick={handleCameraCapture}
                className="group cursor-pointer bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-5 hover:from-emerald-500/20 hover:to-emerald-600/20 hover:border-emerald-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/20 aspect-square w-36 flex flex-col items-center justify-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <TakePhotoIconSvg />
                </div>
                <h3 className="text-sm font-semibold text-white font-ui">Take Photo</h3>
              </div>

              {/* Upload Button */}
              <div
                onClick={handleImageUpload}
                className="group cursor-pointer bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-2xl p-5 hover:from-blue-500/20 hover:to-blue-600/20 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 aspect-square w-36 flex flex-col items-center justify-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <UploadPhotosIconSvg />
                </div>
                <h3 className="text-sm font-semibold text-white font-ui">Upload</h3>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Enhanced Trifold Layout */
        <div className="flex h-full w-full">
          {/* Left Panel - Navigation */}
          <div
            className={`transition-all duration-300 ${
              leftPanelExpanded ? 'w-80' : 'w-16'
            } border-r border-slate-700 flex-shrink-0`}
          >
            <SideNavbar />
          </div>

          {/* Main Area */}
          <div className="flex flex-col flex-grow">
            {/* Top Bar */}
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 shadow-sm flex-shrink-0 z-10">
              <MainToolbar />
            </div>

            {/* Main Content Area */}
            <div className="relative overflow-hidden bg-black flex-grow">
              <div className="h-full w-full flex items-center justify-center p-6">
                {initFinished ? <Content /> : null}
                <LoadingIndicator />
              </div>
            </div>

            {/* Bottom Carousel */}
            <div className="border-t border-gray-700">
              <BottomCarousel />
            </div>
          </div>

          {/* Right Panel - Inventory */}
          <div
            className={`transition-all duration-300 ${
              showInventory ? (rightPanelExpanded ? 'w-96' : 'w-16') : 'w-0'
            } border-l border-gray-700 flex-shrink-0 overflow-hidden`}
          >
            <RightPanelInventory />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
