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

  // Keep in sync with `hasDistortingTransform.ts`.
  function hasDistortingTransform(element) {
    let node = element;
    while (node != null) {
      const transform = getComputedStyle(node).transform;
      if (transform && transform !== 'none') {
        const matrix = new DOMMatrix(transform);
        if (!matrix.is2D || Math.abs(matrix.b) > 1e-6 || Math.abs(matrix.c) > 1e-6) {
          return true;
        }
      }
      node = node.parentElement;
    }
    return false;
  }

  if (activeTab != null && tabsList != null) {
    const { width: computedWidth, height: computedHeight } = getCssDimensions(activeTab);
    const { width: tabsListWidth, height: tabsListHeight } = getCssDimensions(tabsList);
    const tabRect = activeTab.getBoundingClientRect();
    const tabsListRect = tabsList.getBoundingClientRect();
    const scaleX = tabsListWidth > 0 ? tabsListRect.width / tabsListWidth : 1;
    const scaleY = tabsListHeight > 0 ? tabsListRect.height / tabsListHeight : 1;
    const hasNonZeroScale = Math.abs(scaleX) > Number.EPSILON && Math.abs(scaleY) > Number.EPSILON;
    const scaleDeviates = Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01;
    const useOffsetPath = !hasNonZeroScale || (scaleDeviates && hasDistortingTransform(activeTab));

    if (useOffsetPath) {
      left = activeTab.offsetLeft;
      top = activeTab.offsetTop;
    } else {
      const tabLeftDelta = tabRect.left - tabsListRect.left;
      const tabTopDelta = tabRect.top - tabsListRect.top;

      left = tabLeftDelta / scaleX + tabsList.scrollLeft - tabsList.clientLeft;
      top = tabTopDelta / scaleY + tabsList.scrollTop - tabsList.clientTop;
    }

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
