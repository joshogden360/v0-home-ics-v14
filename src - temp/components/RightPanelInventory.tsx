/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {useAtom} from 'jotai';
import {useState} from 'react';
import {
  InventoryItemsAtom,
  RightPanelExpandedAtom,
  ShowInventoryAtom,
} from '../state/atoms';
import {InventoryItemType} from '../types/types';
import { CropModal } from './CropModal';

export function RightPanelInventory() {
  const [inventoryItems, setInventoryItems] = useAtom(InventoryItemsAtom);
  const [rightPanelExpanded, setRightPanelExpanded] = useAtom(RightPanelExpandedAtom);
  const [, setShowInventory] = useAtom(ShowInventoryAtom);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropItem, setCropItem] = useState<InventoryItemType | null>(null);

  const categories = [...new Set(inventoryItems.map(item => item.category).filter(Boolean))];
  
  const filteredItems = inventoryItems.filter(item => {
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesSearch = !searchTerm || 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const handleDeleteItem = (id: string) => {
    setInventoryItems(prev => prev.filter(item => item.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<InventoryItemType>) => {
    setInventoryItems(prev => 
      prev.map(item => item.id === id ? {...item, ...updates} : item)
    );
  };

  const handleCropSave = (croppedData: { imageUrl: string; label: string; cropBox: any }) => {
    if (cropItem) {
      handleUpdateItem(cropItem.id, {
        imageUrl: croppedData.imageUrl,
        label: croppedData.label,
        originalBox: croppedData.cropBox,
      });
    }
    setShowCropModal(false);
    setCropItem(null);
  };

  return (
    <>
      <div className="h-full bg-gray-800 text-white border-l border-gray-700 flex flex-col shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
          {rightPanelExpanded ? (
            <>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Inventory</h2>
                  <p className="text-xs text-gray-300">{inventoryItems.length} items</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setRightPanelExpanded(false)}
                  className="btn btn-ghost btn-xs btn-square text-gray-300 hover:text-white hover:bg-gray-700"
                  title="Collapse Panel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowInventory(false)}
                  className="btn btn-ghost btn-xs btn-square text-gray-300 hover:text-white hover:bg-gray-700"
                  title="Close Inventory"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col items-center gap-2 py-2">
              <button
                onClick={() => setRightPanelExpanded(true)}
                className="btn btn-ghost btn-square btn-sm text-white hover:bg-gray-700"
                title="Expand Inventory Panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
              {inventoryItems.length > 0 && (
                <div className="badge bg-blue-600 text-white border-blue-500 badge-sm font-semibold">{inventoryItems.length}</div>
              )}
            </div>
          )}
        </div>

        {rightPanelExpanded && (
          <>
            {/* Search and Filters */}
            <div className="p-3 border-b border-gray-700 flex-shrink-0 space-y-2">
              <input
                type="text"
                placeholder="Search items..."
                className="input input-bordered input-sm w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex gap-2">
                <select
                  className="select select-bordered select-sm w-full bg-gray-700 border-gray-600 text-white focus:border-blue-500"
                  value={filterCategory || ''}
                  onChange={(e) => setFilterCategory(e.target.value || null)}
                >
                  <option value="">All Categories</option>
                  {categories.map((category, i) => (
                    <option key={i} value={category as string}>{category}</option>
                  ))}
                </select>
                {(searchTerm || filterCategory) && (
                  <button
                    onClick={() => { setSearchTerm(''); setFilterCategory(null); }}
                    className="btn btn-ghost btn-xs"
                    title="Clear filters"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              {filteredItems.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8 px-2">
                  {inventoryItems.length === 0 
                    ? "No items yet. Detect objects with AI to add them here."
                    : "No items match your search filters."}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredItems.map((item) => (
                    <EnhancedInventoryCard
                      key={item.id}
                      item={item}
                      onDelete={handleDeleteItem}
                      onUpdate={handleUpdateItem}
                      isEditing={editingItemId === item.id}
                      onStartEdit={() => setEditingItemId(item.id)}
                      onStopEdit={() => setEditingItemId(null)}
                      onCrop={() => { setCropItem(item); setShowCropModal(true); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Crop Modal */}
      {showCropModal && cropItem && (
        <CropModal
          isOpen={showCropModal}
          onClose={() => {setShowCropModal(false); setCropItem(null);}}
          box={cropItem.originalBox}
          onSave={handleCropSave}
        />
      )}
    </>
  );
}

interface EnhancedInventoryCardProps {
  item: InventoryItemType;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<InventoryItemType>) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onCrop: () => void;
}

function EnhancedInventoryCard({ item, onDelete, onUpdate, isEditing, onStartEdit, onStopEdit, onCrop }: EnhancedInventoryCardProps) {
  const [editState, setEditState] = useState({
    label: item.label,
    category: item.category || '',
    notes: item.notes || ''
  });
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    onUpdate(item.id, editState);
    onStopEdit();
  };

  const handleCancel = () => {
    setEditState({
      label: item.label,
      category: item.category || '',
      notes: item.notes || ''
    });
    onStopEdit();
  };

  const handleAddTag = () => {
    if (newTag && !item.tags?.includes(newTag)) {
      onUpdate(item.id, { tags: [...(item.tags || []), newTag] });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdate(item.id, { tags: item.tags?.filter(t => t !== tagToRemove) });
  };

  if (isEditing) {
    return (
      <div className="bg-gray-700 border border-blue-500 rounded-lg p-3 shadow-lg relative">
        {/* Editing Form */}
        <div className="space-y-3">
          <input
            type="text"
            value={editState.label}
            onChange={(e) => setEditState({...editState, label: e.target.value})}
            className="input input-sm w-full bg-gray-800 border-gray-600"
            placeholder="Item Name"
          />
          <input
            type="text"
            value={editState.category}
            onChange={(e) => setEditState({...editState, category: e.target.value})}
            className="input input-sm w-full bg-gray-800 border-gray-600"
            placeholder="Category"
          />
          <textarea
            value={editState.notes}
            onChange={(e) => setEditState({...editState, notes: e.target.value})}
            className="textarea textarea-sm w-full bg-gray-800 border-gray-600"
            placeholder="Notes..."
            rows={2}
          ></textarea>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button onClick={handleCancel} className="btn btn-xs btn-ghost">Cancel</button>
          <button onClick={handleSave} className="btn btn-xs btn-primary">Save</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg p-3 transition-all group relative">
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 bg-black rounded-md overflow-hidden flex-shrink-0 border border-gray-600 relative">
          <img
            src={item.imageUrl}
            alt={item.label}
            className="w-full h-full object-cover"
          />
          <button onClick={onCrop} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19M4.879 4.879L9.757 9.757" /></svg>
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors whitespace-normal">
            {item.label}
          </h4>
          {item.category && (
            <p className="text-xs text-blue-300 mt-0.5">{item.category}</p>
          )}
          <p className="text-xs text-gray-400 mt-1 italic whitespace-normal">
            {item.notes || 'No notes.'}
          </p>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-2">
        <div className="flex flex-wrap gap-1">
          {item.tags?.map((tag, i) => (
            <span key={i} className="badge bg-blue-900/50 text-blue-300 border-blue-800/50 badge-sm">
              {tag}
              <button onClick={() => handleRemoveTag(tag)} className="ml-1 opacity-50 hover:opacity-100">x</button>
            </span>
          ))}
        </div>
        <div className="mt-1 flex gap-1">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            className="input input-xs w-full bg-gray-800 border-gray-600"
            placeholder="Add tag..."
          />
          <button onClick={handleAddTag} className="btn btn-xs btn-square btn-primary">+</button>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onStartEdit} className="btn btn-xs btn-square btn-ghost text-gray-300 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg></button>
        <button onClick={() => onDelete(item.id)} className="btn btn-xs btn-square btn-ghost text-gray-300 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-right">
        {new Date(item.dateAdded).toLocaleString()}
      </p>
    </div>
  );
} 