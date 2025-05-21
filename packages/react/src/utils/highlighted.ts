const dataAttribute = 'data-highlighted';

export function addHighlight(ref: React.RefObject<HTMLElement | null>) {
  ref.current?.setAttribute(dataAttribute, '');
}

export function removeHighlight(ref: React.RefObject<HTMLElement | null>) {
  ref.current?.removeAttribute(dataAttribute);
}

export function hasHighlight(ref: React.RefObject<HTMLElement | null>) {
  return ref.current?.hasAttribute(dataAttribute);
}
