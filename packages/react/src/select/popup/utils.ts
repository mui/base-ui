export function clearStyles(element: HTMLElement | null, originalStyles: React.CSSProperties) {
  if (element) {
    Object.assign(element.style, originalStyles);
  }
}

/**
 * The half of `LIST_FUNCTIONAL_STYLES` a virtualizer's scrollport needs in aligned mode.
 *
 * It sets its own `overflow`, and adding the longhand axes on top of that shorthand makes React
 * warn as soon as the mode toggles — removing one while the other is still set is exactly the
 * shorthand/longhand mix it objects to.
 */
export const SCROLLPORT_FUNCTIONAL_STYLES = {
  position: 'relative',
  maxHeight: '100%',
} as const;

export const LIST_FUNCTIONAL_STYLES = {
  position: 'relative',
  maxHeight: '100%',
  overflowX: 'hidden',
  overflowY: 'auto',
} as const;
