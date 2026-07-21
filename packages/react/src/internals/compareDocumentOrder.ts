/* eslint-disable no-bitwise */
/**
 * Compares two nodes in document order. Disconnected nodes compare as equal so
 * callers using a stable sort preserve their existing order.
 */
export function compareDocumentOrder(a: Node, b: Node) {
  const position = a.compareDocumentPosition(b);
  if (position === 0 || position & Node.DOCUMENT_POSITION_DISCONNECTED) {
    return 0;
  }

  return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}
