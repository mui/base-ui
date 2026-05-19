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

  function getElementOffset(element) {
    let offsetLeft = element.offsetLeft;
    let offsetTop = element.offsetTop;
    let offsetParent = element.offsetParent;

    while (offsetParent) {
      offsetLeft += offsetParent.offsetLeft + offsetParent.clientLeft;
      offsetTop += offsetParent.offsetTop + offsetParent.clientTop;
      offsetParent = offsetParent.offsetParent;
    }

    return {
      left: offsetLeft,
      top: offsetTop,
    };
  }

  function getRelativeLayoutOffset(element, ancestor) {
    const elementOffset = getElementOffset(element);
    const ancestorOffset = getElementOffset(ancestor);

    return {
      left: elementOffset.left - ancestorOffset.left - ancestor.clientLeft,
      top: elementOffset.top - ancestorOffset.top - ancestor.clientTop,
    };
  }

  if (activeTab != null && tabsList != null) {
    const { width: computedWidth, height: computedHeight } = getCssDimensions(activeTab);
    const layoutOffset = getRelativeLayoutOffset(activeTab, tabsList);

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
