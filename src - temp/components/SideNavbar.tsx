/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useAtom } from 'jotai';
import {
  ImageSrcAtom,
  UploadedImagesAtom,
  ShowInventoryAtom,
  CurrentImageIndexAtom,
  InventoryItemsAtom,
  IsUploadedImageAtom,
  LeftPanelExpandedAtom,
  ShareStream
} from '../state/atoms';
import { useResetState } from '../hooks/hooks';

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const ImagesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const InventoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);

export function SideNavbar() {
  const [, setImageSrc] = useAtom(ImageSrcAtom);
  const [, setUploadedImages] = useAtom(UploadedImagesAtom);
  const resetState = useResetState();
  const [, setIsUploadedImage] = useAtom(IsUploadedImageAtom);
  const [, setShareStream] = useAtom(ShareStream);
  const [showInventory, setShowInventory] = useAtom(ShowInventoryAtom);
  const [inventoryItems] = useAtom(InventoryItemsAtom);
  const [, setCurrentImageIndex] = useAtom(CurrentImageIndexAtom);
  const [leftPanelExpanded, setLeftPanelExpanded] = useAtom(LeftPanelExpandedAtom);

  const handleHomeClick = () => {
    setImageSrc(null);
    setUploadedImages([]);
    resetState();
    setIsUploadedImage(false);
    setShareStream(null);
    setShowInventory(false);
    setCurrentImageIndex(0);
  };

  return (
    <div className="h-full bg-slate-900 text-white flex flex-col border-r border-slate-700 shadow-xl font-ui transition-all duration-300 relative">
      {/* Collapse/Expand Toggle - Better positioned */}
      <div className="absolute top-4 right-3 z-10">
        <button
          onClick={() => setLeftPanelExpanded(!leftPanelExpanded)}
          className="btn btn-ghost btn-circle btn-sm text-slate-300 hover:text-white hover:bg-slate-700/50 backdrop-blur-sm border border-slate-600/30 shadow-lg transition-all duration-200"
          title={leftPanelExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${leftPanelExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* App Title */}
      {leftPanelExpanded && (
        <div className="mb-8 pt-16 px-6 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">The Itemizer</h1>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mx-auto mt-3"></div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-grow space-y-3 ${leftPanelExpanded ? 'px-6 mt-16' : 'px-2 mt-20'}`}>
        <button
          onClick={handleHomeClick}
          className={`nav-button group flex items-center w-full text-left text-slate-300 hover:text-white hover:bg-slate-700/30 rounded-lg p-3 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:text-white ${
            leftPanelExpanded ? 'gap-4' : 'justify-center'
          }`}
          title="Home"
        >
          <HomeIcon />
          {leftPanelExpanded && <span className="text-base font-medium">Home</span>}
        </button>
        
        <button
          onClick={() => setShowInventory(!showInventory)}
          className={`nav-button group flex items-center w-full text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 relative rounded-lg p-3 ${
            showInventory 
              ? 'text-blue-400 bg-blue-600/20 border border-blue-500/30' 
              : 'text-slate-300 hover:text-white hover:bg-slate-700/30'
          } ${leftPanelExpanded ? 'gap-4' : 'justify-center'}`}
          title="Inventory"
        >
          <InventoryIcon />
          {leftPanelExpanded && (
            <div className="flex items-center justify-between w-full">
              <span className="text-base font-medium">Inventory</span>
              {inventoryItems.length > 0 && (
                <span className="badge bg-blue-600 text-white border-blue-500 badge-sm font-semibold">
                  {inventoryItems.length}
                </span>
              )}
            </div>
          )}
          {!leftPanelExpanded && inventoryItems.length > 0 && (
            <div className="absolute -top-1 -right-1 badge bg-blue-600 text-white border-blue-500 badge-xs font-semibold">
              {inventoryItems.length}
            </div>
          )}
        </button>
      </nav>


    </div>
  );
} 