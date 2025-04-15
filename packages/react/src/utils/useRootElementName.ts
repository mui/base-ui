'use client';
import * as React from 'react';
import { useEnhancedEffect } from './useEnhancedEffect';
import { warn } from './warn';

interface UseRootElementNameParameters {
  /**
   * The HTML element expected to be rendered, for example 'div', 'button' etc
   * @default ''
   */
  rootElementName?: keyof HTMLElementTagNameMap;
}

interface UseRootElementNameReturnValue {
  /**
   * The HTML element expected to be rendered, for example 'div', 'button' etc
   * @default ''
   */
  rootElementName: string;
  updateRootElementName: (element: HTMLElement | null) => void;
}

/**
 * Use this function determine the host element correctly on the server (in a SSR context, for example Next.js)
 */
export function useRootElementName(
  parameters: UseRootElementNameParameters,
): UseRootElementNameReturnValue {
  const { rootElementName: rootElementNameProp = '' } = parameters;

  const [rootElementName, setRootElementName] = React.useState<string>(
    rootElementNameProp.toUpperCase(),
  );

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEnhancedEffect(() => {
      if (rootElementNameProp && rootElementName !== rootElementNameProp.toUpperCase()) {
        warn(
          `useRootElementName expected the '${rootElementNameProp}' element, but a '${rootElementName.toLowerCase()}' was rendered instead`,
          'This may cause hydration issues in an SSR context, for example in a Next.js app',
        );
      }
    }, [rootElementNameProp, rootElementName]);
  }

  const updateRootElementName = React.useCallback((element: HTMLElement | null) => {
    setRootElementName(element?.tagName ?? '');
  }, []);

  return { rootElementName, updateRootElementName };
}
