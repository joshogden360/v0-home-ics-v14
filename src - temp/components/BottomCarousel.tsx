/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {useAtom} from 'jotai';
import {
  UploadedImagesAtom,
  CurrentImageIndexAtom,
  ImageSrcAtom,
  IsUploadedImageAtom,
  ShareStream,
} from '../state/atoms';
import {useResetState} from '../hooks/hooks';

export function BottomCarousel() {
  const [uploadedImages, setUploadedImages] = useAtom(UploadedImagesAtom);
  const [currentIndex, setCurrentIndex] = useAtom(CurrentImageIndexAtom);
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setShareStream] = useAtom(ShareStream);

  const resetState = useResetState();

  const handleSelectImage = (index: number) => {
    if (index >= 0 && index < uploadedImages.length) {
      setCurrentIndex(index);
      setImageSrc(uploadedImages[index].src);
      setShareStream(null);
    }
  };

  const handleDeleteImage = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    
    if (newImages.length === 0) {
      setImageSrc(null);
      setCurrentIndex(0);
      setIsUploadedImage(false);
      resetState();
    } else {
      let newIndex = currentIndex;
      if (currentIndex === index) {
        newIndex = Math.max(0, index - 1);
      } else if (currentIndex > index) {
        newIndex = currentIndex - 1;
      }
      newIndex = Math.min(newIndex, newImages.length - 1);
      
      setCurrentIndex(newIndex);
      setImageSrc(newImages[newIndex].src);
      setShareStream(null);
    }
  };

  if (uploadedImages.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-2 shadow-md">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <h3 className="text-white text-xs font-medium">
          Filmstrip ({uploadedImages.length})
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-gray-300 text-xs">
            {currentIndex + 1} / {uploadedImages.length}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 scrollbar-corner-gray-800">
        {uploadedImages.map((image, index) => (
          <div
            key={image.id || index}
            className={`relative flex-shrink-0 cursor-pointer group transition-all duration-200 rounded-lg overflow-hidden shadow border-2 ${
              index === currentIndex 
                ? 'border-blue-500 ring-2 ring-blue-500/50 ring-offset-2 ring-offset-gray-800' 
                : 'border-gray-600 opacity-70 hover:opacity-100 hover:shadow-md hover:border-gray-400'
            }`}
            style={{ width: '5rem', height: '5rem' }}
            onClick={() => handleSelectImage(index)}
          >
            <img 
              src={image.src} 
              alt={image.name}
              className="w-full h-full object-cover bg-gray-700"
            />
            
            {index === currentIndex && (
              <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}

            <button
              onClick={(e) => handleDeleteImage(index, e)}
              className="absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center shadow-sm hover:bg-red-700"
              title="Delete Image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div 
              className={`absolute bottom-0 left-0 right-0 px-1 py-0.5 text-xs font-medium text-center transition-opacity duration-150 ${
                index === currentIndex ? 'bg-blue-600 text-white' : 'bg-black/60 text-white group-hover:opacity-100 opacity-0'
              }`}
            >
              {image.name.length > 10 ? `${image.name.substring(0,8)}...` : image.name} | {index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 