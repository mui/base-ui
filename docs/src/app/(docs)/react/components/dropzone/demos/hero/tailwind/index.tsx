'use client';

import * as React from 'react';
import { Dropzone } from '@base-ui/react/dropzone';

export default function ExampleDropzone() {
  const [files, setFiles] = React.useState<File[]>([]);

  const appendFiles = React.useCallback((nextFiles: File[]) => {
    setFiles((prev) => [...prev, ...nextFiles]);
  }, []);

  return (
    <div className="w-full rounded-xl border border-gray-200 bg-white p-8">
      <Dropzone.Root
        className="block rounded-xl border-2 border-dashed border-gray-400 bg-gray-50 px-6 py-10 text-center transition-colors hover:border-blue-600 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-800 data-dragging:border-blue-600 data-dragging:bg-blue-100 data-disabled:cursor-not-allowed data-disabled:opacity-65"
        onFilesDrop={(droppedFiles) => appendFiles(droppedFiles)}
      >
        <Dropzone.HiddenInput
          className="hidden"
          multiple
          onChange={(event) => {
            const selected = Array.from(event.currentTarget.files ?? []);
            if (selected.length > 0) {
              appendFiles(selected);
            }
            event.currentTarget.value = '';
          }}
        />
        <p className="text-sm font-semibold text-gray-800">Drop files here</p>
        <p className="mt-1 text-xs text-gray-600">or click to open the file picker</p>
      </Dropzone.Root>

      {files.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No files selected yet.</p>
      ) : (
        <ul className="mt-4 list-none space-y-2 p-0">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900"
            >
              {file.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
