(function prehydration() {
  const indicator = document.currentScript.previousElementSibling;
  if (!indicator) {
    return;
  }

  const tabsList = indicator.closest('[role="tablist"]');
  if (!tabsList) {
    return;
  }

  const activeTab = tabsList.querySelector('[data-active]');
  if (!activeTab) {
    return;
  }

  if (activeTab.offsetWidth === 0 || tabsList.offsetWidth === 0) {
    return;
  }

  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  let width = 0;
  let height = 0;

  function getCssDimensions(element) {
    const css = getComputedStyle(element);
    let cssWidth = parseFloat(css.width) || 0;
    let cssHeight = parseFloat(css.height) || 0;
    const shouldFallback =
      Math.round(cssWidth) !== element.offsetWidth ||
      Math.round(cssHeight) !== element.offsetHeight;

    if (shouldFallback) {
      cssWidth = element.offsetWidth;
      cssHeight = element.offsetHeight;
    }

    return {
      width: cssWidth,
      height: cssHeight,
    };
  }

  function getLayoutOffset(element, ancestor) {
    const elementOffset = getCumulativeOffset(element);
    const ancestorOffset = getCumulativeOffset(ancestor);

    return {
      left: elementOffset.left - ancestorOffset.left - ancestor.clientLeft,
      top: elementOffset.top - ancestorOffset.top - ancestor.clientTop,
    };
  }

  function getCumulativeOffset(element) {
    let offsetLeft = 0;
    let offsetTop = 0;
    let currentElement = element;

    while (currentElement != null) {
      offsetLeft += currentElement.offsetLeft;
      offsetTop += currentElement.offsetTop;

      const offsetParent = currentElement.offsetParent;
      if (offsetParent != null) {
        offsetLeft += offsetParent.clientLeft;
        offsetTop += offsetParent.clientTop;
      }

      currentElement = offsetParent;
    }

    return { left: offsetLeft, top: offsetTop };
  }

  if (activeTab != null && tabsList != null) {
    const { width: computedWidth, height: computedHeight } = getCssDimensions(activeTab);

    // Unlike `TabsIndicator.tsx`, only the transform-immune layout offsets are used here.
    // They can be off by ~1px of `offsetLeft`/`offsetTop` rounding, but the component
    // recomputes the variables with sub-pixel precision as soon as React hydrates.
    const layoutOffset = getLayoutOffset(activeTab, tabsList);
    left = layoutOffset.left;
    top = layoutOffset.top;

    width = computedWidth;
    height = computedHeight;
    right = tabsList.scrollWidth - left - width;
    bottom = tabsList.scrollHeight - top - height;
  }

  function setProp(name, value) {
    indicator.style.setProperty(`--active-tab-${name}`, `${value}px`);
  }

  setProp('left', left);
  setProp('right', right);
  setProp('top', top);
  setProp('bottom', bottom);
  setProp('width', width);
  setProp('height', height);

  if (width > 0 && height > 0) {
    indicator.removeAttribute('hidden');
  }
})();
