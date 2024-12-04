export function hideGetAnimationsProperty() {
  const original = HTMLElement.prototype.getAnimations;
  Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
    value: undefined,
    configurable: true,
    writable: true,
  });

  return () => {
    Object.defineProperty(HTMLElement.prototype, 'getAnimations', {
      value: original,
      configurable: true,
      writable: true,
    });
  };
}
