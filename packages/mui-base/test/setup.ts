/* eslint-disable */

globalThis.requestAnimationFrame = (cb) => {
  cb(0);
  return 0;
};

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
