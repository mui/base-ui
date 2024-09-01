'use client';

import * as React from 'react';
import { DemoVariant, DemoFile } from './types';
import { DemoContext } from './DemoContext';

export function DemoRoot(props: DemoRoot.Props) {
  const { variants, children, ...other } = props;

  if (variants.length === 0) {
    throw new Error('No demo variants provided');
  }

  const [selectedVariant, selectVariant] = React.useState(variants[0]);
  const [selectedFile, selectFile] = React.useState<DemoFile>(selectedVariant.files[0]);

  React.useEffect(() => {
    selectFile(selectedVariant.files[0]);
  }, [selectedVariant]);

  const contextValue: DemoContext = React.useMemo(
    () =>
      ({
        variants,
        selectedVariant,
        selectedFile,
        selectVariant,
        selectFile,
      }) satisfies DemoContext,
    [selectedVariant, selectedFile, variants],
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
