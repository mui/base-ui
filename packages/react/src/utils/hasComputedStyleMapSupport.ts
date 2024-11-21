'use client';

let node: HTMLElement | null = null;

let cachedHasComputedStyleMapSupport: boolean | undefined;

/**
 * Detect if Element: computedStyleMap() is supported as a more performant
 * alternative to getComputedStyles()
 * Only Firefox does not have support as of Nov 2024.
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/computedStyleMap
 */
export function hasComputedStyleMapSupport() {
  if (node == null) {
    node = document.createElement('div');
  }

  if (cachedHasComputedStyleMapSupport === undefined) {
    cachedHasComputedStyleMapSupport = node.computedStyleMap !== undefined;
  }
  return cachedHasComputedStyleMapSupport;
}
