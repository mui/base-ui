'use client';
import * as React from 'react';

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

  const updateRootElementName = React.useCallback((element: HTMLElement | null) => {
    setRootElementName(element?.tagName ?? '');
  }, []);

  return { rootElementName, updateRootElementName };
}
