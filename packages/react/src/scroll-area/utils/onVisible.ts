/**
 * Executes a callback when an element becomes visible.
 */
export function onVisible(element: HTMLElement, callback: () => void) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio > 0) {
        callback();
        observer.disconnect();
      }
    });
  });
  observer.observe(element);
  return () => {
    observer.disconnect();
  };
}
