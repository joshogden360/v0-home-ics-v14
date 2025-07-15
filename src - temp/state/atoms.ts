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

import {atom} from 'jotai';
import {
  colors,
  defaultPromptParts,
  defaultPrompts,
} from '../utils/consts';
import {
  BoundingBox2DType,
  BoundingBox3DType,
  BoundingBoxMaskType,
  DetectTypes,
  InventoryItemType,
} from '../types/types';

export const ImageSrcAtom = atom<string | null>(null);

export const ImageSentAtom = atom(false);

export const BoundingBoxes2DAtom = atom<BoundingBox2DType[]>([]);

export const PromptsAtom = atom<Record<DetectTypes, string[]>>({
  ...defaultPromptParts,
});
export const CustomPromptsAtom = atom<Record<DetectTypes, string>>({
  ...defaultPrompts,
});

export type PointingType = {
  point: {
    x: number;
    y: number;
  };
  label: string;
};

export const RevealOnHoverModeAtom = atom<boolean>(true);

export const FOVAtom = atom<number>(60);

export const BoundingBoxes3DAtom = atom<BoundingBox3DType[]>([]);

export const BoundingBoxMasksAtom = atom<BoundingBoxMaskType[]>([]);

export const PointsAtom = atom<PointingType[]>([]);

// export const PromptAtom = atom<string>("main objects");

export const TemperatureAtom = atom<number>(0.5);

export const ShareStream = atom<MediaStream | null>(null);

export const DrawModeAtom = atom<boolean>(false);

export const DetectTypeAtom = atom<DetectTypes>('2D bounding boxes');

export const LinesAtom = atom<[[number, number][], string][]>([]);

export const JsonModeAtom = atom(false);

export const ActiveColorAtom = atom(colors[6]);

export const HoverEnteredAtom = atom(false);

export const HoveredBoxAtom = atom<number | null>(null);

export const VideoRefAtom = atom<{current: HTMLVideoElement | null}>({
  current: null,
});

export const InitFinishedAtom = atom(true);

export const BumpSessionAtom = atom(0);

export const IsUploadedImageAtom = atom(false);

export const SelectionModeAtom = atom<'single' | 'multi' | 'crop'>('single');

export const ZoomAtom = atom(1);
export const PanAtom = atom({ x: 0, y: 0 });
export const ViewResetAtom = atom(0);

// New atoms for loading and inventory features
export const IsLoadingAtom = atom(false);
export const UploadProgressAtom = atom(0);
export const ProcessingStatusAtom = atom<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
export const InventoryItemsAtom = atom<InventoryItemType[]>([]);
export const ShowInventoryAtom = atom(false);

// File carousel atoms
export const UploadedImagesAtom = atom<{id: string, src: string, name: string, uploadDate: string}[]>([]);
export const CurrentImageIndexAtom = atom(0);

// Simplified layout control atoms - IDE-like trifold layout
export const LeftPanelExpandedAtom = atom(true);   // Navigation sidebar (expanded by default)
export const RightPanelExpandedAtom = atom(true);  // Inventory panel (expanded by default)
