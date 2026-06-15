'use client';

import * as React from 'react';

export interface DropzoneRootContextValue {
  disabled: boolean;
  setInputElement: (node: HTMLInputElement | null) => void;
}

export const DropzoneRootContext = React.createContext<DropzoneRootContextValue | undefined>(
  undefined,
);

export function useDropzoneRootContext(): DropzoneRootContextValue {
  const context = React.useContext(DropzoneRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: DropzoneRootContext is missing. Dropzone parts must be placed within <Dropzone.Root>.',
    );
  }

  return context;
}
