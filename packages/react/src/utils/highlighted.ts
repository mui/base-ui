const styleHook = 'data-highlighted';

export function addHighlight(ref: React.RefObject<HTMLElement | null>) {
  ref.current?.setAttribute(styleHook, '');
}

export function removeHighlight(ref: React.RefObject<HTMLElement | null>) {
  ref.current?.removeAttribute(styleHook);
}

export function hasHighlight(ref: React.RefObject<HTMLElement | null>) {
  return ref.current?.hasAttribute(styleHook);
}
