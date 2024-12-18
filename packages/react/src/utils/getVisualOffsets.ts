import { ownerWindow } from './owner';

export function getVisualOffsets(doc: Document) {
  const win = ownerWindow(doc);
  const vV = win.visualViewport;
  return {
    x: Math.floor(vV?.offsetLeft || 0),
    y: Math.floor(vV?.offsetTop || 0),
  };
}
