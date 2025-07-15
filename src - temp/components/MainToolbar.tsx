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
import {
    SelectionModeAtom,
    ZoomAtom,
    PanAtom,
    ViewResetAtom,
} from '../state/atoms';
import { Prompt } from './Prompt';

export function MainToolbar() {
    const [selectionMode, setSelectionMode] = useAtom(SelectionModeAtom);
    const [zoom, setZoom] = useAtom(ZoomAtom);
    const [, setPan] = useAtom(PanAtom);
    const [, resetView] = useAtom(ViewResetAtom);

    return (
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 shadow-sm flex-shrink-0 z-10 flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <Prompt />
            </div>
            <div className="flex items-center gap-4">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">Zoom</span>
                    <span className="text-gray-300 text-xs">{Math.round(zoom * 100)}%</span>
                    <button
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                        className="btn btn-xs bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                        title="Zoom Out"
                    >
                        −
                    </button>
                    <button
                        onClick={() => {
                            setZoom(1);
                            setPan({ x: 0, y: 0 });
                            resetView(c => c + 1);
                        }}
                        className="btn btn-xs bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                        title="Reset View"
                    >
                        ⌂
                    </button>
                    <button
                        onClick={() => setZoom(Math.min(5, zoom + 0.25))}
                        className="btn btn-xs bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                        title="Zoom In"
                    >
                        +
                    </button>
                </div>

                {/* Selection Mode Controls */}
                <div className="flex items-center gap-2">
                    <div className="text-white text-sm font-medium">Selection</div>
                    <div className="flex gap-1">
                        <button
                        onClick={() => setSelectionMode('single')}
                        className={`btn btn-xs text-white border-gray-600 ${
                            selectionMode === 'single' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title="Single Select"
                        >
                        Single
                        </button>
                        <button
                        onClick={() => setSelectionMode('multi')}
                        className={`btn btn-xs text-white border-gray-600 ${
                            selectionMode === 'multi' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title="Multi Select"
                        >
                        Multi
                        </button>
                        <button
                        onClick={() => setSelectionMode('crop')}
                        className={`btn btn-xs text-white border-gray-600 ${
                            selectionMode === 'crop' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                        title="Crop Mode"
                        >
                        Crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
