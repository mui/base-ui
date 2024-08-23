'use client';

import * as React from 'react';
import copy from 'clipboard-copy';
import { useDemoContext } from './DemoContext';

export const DemoSourceCopy = React.forwardRef<HTMLButtonElement, DemoSourceCopy.Props>(
  function DemoSource(props, forwardedRef) {
    const { onCopied, onError, onClick, ...other } = props;

    const {
      state: { selectedFile },
    } = useDemoContext();

    const handleClick = React.useCallback(
      async (event: React.MouseEvent<HTMLButtonElement>) => {
        try {
          await copy(selectedFile.content);
          onCopied?.();
        } catch (error) {
          onError?.(error);
        }

        onClick?.(event);
      },
      [onCopied, onError, selectedFile, onClick],
    );

    if (!selectedFile) {
      return null;
    }

    return <button ref={forwardedRef} type="button" {...other} onClick={handleClick} />;
  },
);

export namespace DemoSourceCopy {
  export interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    onCopied?: () => void;
    onError?: (error: unknown) => void;
  }
}
