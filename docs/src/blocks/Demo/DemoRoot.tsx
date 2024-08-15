'use client';

import * as React from 'react';
import { DemoVariant, DemoFile } from './types';
import { CodeDisplay, DemoContext } from './DemoContext';

export function DemoRoot(props: DemoRoot.Props) {
  const { variants, children, ...other } = props;

  if (variants.length === 0) {
    throw new Error('No demo variants provided');
  }

  const [selectedVariant, selectVariant] = React.useState(variants[0]);
  const [codeDisplay, setCodeDisplay] = React.useState<CodeDisplay>('preview');
  const [selectedFile, selectFile] = React.useState<DemoFile>(selectedVariant.files[0]);

  React.useEffect(() => {
    selectFile(selectedVariant.files[0]);
  }, [selectedVariant]);

  const contextValue: DemoContext = React.useMemo(
    () => ({
      variants,
      state: {
        selectedVariant,
        codeDisplay,
        selectedFile,
      },
      selectVariant,
      selectFile,
      setCodeDisplay,
      copySource: () => {},
      reset: () => {},
      resetFocus: () => {},
    }),
    [selectedVariant, selectedFile, codeDisplay, variants],
  );

  return (
    <DemoContext.Provider value={contextValue}>
      <div {...other}>{children}</div>
    </DemoContext.Provider>
  );
}

export namespace DemoRoot {
  export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    variants: DemoVariant[];
    children: React.ReactNode;
  }
}
