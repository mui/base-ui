type ElementFromPointRoot = Node & Partial<Pick<Document, 'elementFromPoint'>>;

// `Document.elementFromPoint` retargets shadow content to the shadow host, which then fails
// `contains()` checks against a popup inside that shadow root, so callers pass `getRootNode()`
// (a document or a shadow root) rather than `ownerDocument()`.
export function getElementAtPoint(
  root: ElementFromPointRoot | null | undefined,
  x: number,
  y: number,
) {
  return typeof root?.elementFromPoint === 'function' ? root.elementFromPoint(x, y) : null;
}
