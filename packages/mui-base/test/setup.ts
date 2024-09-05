globalThis.requestAnimationFrame = (cb) => {
  cb(0);
  return 0;
};
