type Touches = Array<Pick<Touch, 'identifier' | 'clientX' | 'clientY'>>;

export function createTouches(touches: Touches) {
  return {
    changedTouches: touches.map(
      (touch) =>
        new Touch({
          target: document.body,
          ...touch,
        }),
    ),
  };
}

export function getHorizontalSliderRect(width = 100) {
  return {
    width,
    height: 10,
    bottom: 10,
    left: 0,
    x: 0,
    y: 0,
    top: 0,
    right: width,
    toJSON() {},
  };
}
