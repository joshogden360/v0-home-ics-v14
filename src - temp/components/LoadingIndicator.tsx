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
import {ProcessingStatusAtom, UploadProgressAtom} from '../state/atoms';

export function LoadingIndicator() {
  const [processingStatus] = useAtom(ProcessingStatusAtom);
  const [uploadProgress] = useAtom(UploadProgressAtom);

  if (processingStatus === 'idle') {
    return null;
  }

  return (
    <div className="absolute top-0 left-0 w-full z-10 bg-black bg-opacity-10 flex justify-center items-start pt-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex flex-col items-center">
          <div className="mb-2 text-center font-semibold">
            {processingStatus === 'uploading' && 'Uploading image...'}
            {processingStatus === 'processing' && 'Processing image...'}
            {processingStatus === 'complete' && 'Processing complete'}
          </div>
          
          {processingStatus !== 'complete' && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${processingStatus === 'uploading' ? uploadProgress : 50}%`,
                  transitionProperty: 'width',
                }}
              ></div>
            </div>
          )}
          
          {processingStatus === 'complete' && (
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          )}
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {processingStatus === 'uploading' && `${Math.round(uploadProgress)}% uploaded`}
            {processingStatus === 'processing' && 'Analyzing image content...'}
            {processingStatus === 'complete' && 'Ready to view results'}
          </div>
        </div>
      </div>
    </div>
  );
} 