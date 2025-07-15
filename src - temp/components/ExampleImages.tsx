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
import {useRef} from 'react';
import {
  ImageSrcAtom,
  IsUploadedImageAtom,
  ProcessingStatusAtom,
  UploadProgressAtom,
  ShareStream
} from '../state/atoms';
import {imageOptions} from '../utils/consts';
import {useResetState} from '../hooks/hooks';

export function ExampleImages() {
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setProcessingStatus] = useAtom(ProcessingStatusAtom);
  const [, setUploadProgress] = useAtom(UploadProgressAtom);
  const [, setShareStream] = useAtom(ShareStream);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resetState = useResetState();
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setProcessingStatus('uploading');
    setUploadProgress(0);
    
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };
    
    reader.onload = () => {
      setUploadProgress(100);
      setImageSrc(reader.result as string);
      setIsUploadedImage(true);
      setShareStream(null);
      resetState();
      
      // Show complete status for 1 second before setting to idle
      setTimeout(() => {
        setProcessingStatus('complete');
        setTimeout(() => {
          setProcessingStatus('idle');
        }, 1000);
      }, 500);
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      setProcessingStatus('idle');
    };
    
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="flex flex-col gap-3 shrink-0 w-[190px]">
      <div className="flex flex-wrap items-start gap-3">
        {imageOptions.map((image) => (
          <button
            key={image}
            className="p-0 w-[56px] h-[56px] relative overflow-hidden"
            onClick={() => {
              setIsUploadedImage(false);
              setImageSrc(image);
              setShareStream(null);
              resetState();
            }}>
            <img
              src={image}
              className="absolute left-0 top-0 w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
      
      <div className="w-full">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn btn-primary w-full gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          Upload Image
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    </div>
  );
}
