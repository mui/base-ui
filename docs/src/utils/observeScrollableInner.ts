// Observe whether the inner node is scrollable and set a "[data-scrollable]"
// attribute on the parent node. We are rawdogging the DOM changes here to skip unnecessary renders.
export function observeScrollableInner(node: HTMLElement | null) {
  if (!node) {
    return;
  }

  const inner = node.children[0] as HTMLElement;
  const observer = new ResizeObserver(() => {
    if (inner.scrollWidth > inner.offsetWidth) {
      node.setAttribute('data-scrollable', '');
    } else {
      node.removeAttribute('data-scrollable');
    }
  });

  if (inner) {
    observer.observe(inner);
  } else {
    console.warn('Expected to find an inner element');
  }
}
