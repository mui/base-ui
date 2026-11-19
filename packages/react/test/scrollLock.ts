/**
 * Whether Base UI's scroll lock is active on the given document.
 */
export function isScrollLocked(doc: Document = document) {
  return (
    doc.documentElement.style.overflow === 'hidden' ||
    doc.documentElement.hasAttribute('data-base-ui-scroll-locked') ||
    doc.body.style.overflow === 'hidden'
  );
}
