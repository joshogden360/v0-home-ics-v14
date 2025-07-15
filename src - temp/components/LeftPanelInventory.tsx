/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import {useAtom} from 'jotai';
import {useState} from 'react';
import {
  InventoryItemsAtom,
  LeftPanelExpandedAtom,
  ShowInventoryAtom,
} from '../state/atoms';
import {InventoryItemType} from '../types/types';

export function LeftPanelInventory() {
  const [inventoryItems, setInventoryItems] = useAtom(InventoryItemsAtom);
  const [leftPanelExpanded, setLeftPanelExpanded] = useAtom(LeftPanelExpandedAtom);
  const [, setShowInventory] = useAtom(ShowInventoryAtom);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
  };

  const handleExpandToFullInventoryModal = () => {
    setShowInventory(true);
  };

  return (
    <div className={`bg-gray-800 text-white border-r border-gray-700 flex-shrink-0 transition-all duration-300 flex flex-col shadow-lg ${
      leftPanelExpanded ? 'w-64 md:w-80' : 'w-14'
    }`}>
      
      {!leftPanelExpanded && (
        <div className="p-2 h-full flex flex-col items-center justify-start gap-3 pt-3">
          <button
            onClick={() => setLeftPanelExpanded(true)}
            className="btn btn-ghost btn-square btn-sm text-white hover:bg-gray-700"
            title="Expand Inventory Panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          
          {inventoryItems.length > 0 && (
            <div className="tooltip tooltip-right" data-tip={`${inventoryItems.length} items`}>
              <div className="badge bg-blue-600 text-white border-blue-500 badge-md font-semibold">{inventoryItems.length}</div>
            </div>
          )}
        </div>
      )}

      {leftPanelExpanded && (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white">Inventory</h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExpandToFullInventoryModal}
                  className="btn btn-ghost btn-xs btn-square text-gray-300 hover:text-white hover:bg-gray-700"
                  title="Open Full Inventory View"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button
                  onClick={() => setLeftPanelExpanded(false)}
                  className="btn btn-ghost btn-xs btn-square text-gray-300 hover:text-white hover:bg-gray-700"
                  title="Collapse Panel"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /> 
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="text-xs text-gray-400">
              {inventoryItems.length} items total
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-3 border-b border-gray-700 flex-shrink-0">
            <input
              type="text"
              placeholder="Search items..."
              className="input input-bordered input-sm w-full mb-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {categories.length > 0 && (
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
            )}
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {filteredItems.length === 0 ? (
              <div className="text-center text-gray-400 text-sm py-8 px-2">
                {inventoryItems.length === 0 
                  ? "No items yet. Detect objects with AI to add them here."
                  : "No items match your search filters."}
              </div>
            ) : (
                filteredItems.map((item) => (
                  <LeftPanelInventoryItem 
                    key={item.id} 
                    item={item} 
                    onDelete={handleDeleteItem}
                  />
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface LeftPanelInventoryItemProps {
  item: InventoryItemType;
  onDelete: (id: string) => void;
}

function LeftPanelInventoryItem({ item, onDelete }: LeftPanelInventoryItemProps) {
  return (
    <div className="card card-compact bg-gray-700/50 hover:bg-gray-700 shadow group transition-all border border-gray-600">
      <div className="card-body p-2">
        <div className="flex items-start gap-2">
          <figure className="w-12 h-12 bg-black rounded-md overflow-hidden flex-shrink-0 border border-gray-600">
            <img 
              src={item.imageUrl} 
              alt={item.label}
              className="w-full h-full object-cover"
            />
          </figure>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate text-white group-hover:text-blue-400 transition-colors">{item.label}</h4>
            {item.category && (
              <p className="text-xs text-gray-300 mt-0.5">{item.category}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">
              Added: {new Date(item.dateAdded).toLocaleDateString([], { year: '2-digit', month: '2-digit', day: '2-digit' })}
            </p>
          </div>
          
          <button
            onClick={() => onDelete(item.id)}
            className="btn btn-error btn-xs btn-square opacity-0 group-hover:opacity-100 transition-opacity hover:btn-error/80"
            title="Delete Item"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.slice(0, 3).map((tag, i) => (
              <div key={i} className="badge bg-blue-600 text-white border-blue-500 badge-xs">
                {tag}
              </div>
            ))}
            {item.tags.length > 3 && (
              <div className="badge bg-gray-600 text-gray-300 border-gray-500 badge-xs">+{item.tags.length - 3}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 