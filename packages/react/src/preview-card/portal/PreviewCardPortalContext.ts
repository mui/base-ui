import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export const PreviewCardPortalContext = React.createContext<boolean | undefined>(undefined);

export function usePreviewCardPortalContext() {
  const value = useContext(PreviewCardPortalContext);
  if (value === undefined) {
    throw new Error('Base UI: <PreviewCard.Portal> is missing.');
  }
  return value;
}
