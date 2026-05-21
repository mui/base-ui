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
      const css = getComputedStyle(node);
      const transform = css.transform;
      if (transform && transform !== 'none') {
        const matrix = new DOMMatrix(transform);
        if (
          !matrix.is2D ||
          Math.abs(matrix.b) > 1e-6 ||
          Math.abs(matrix.c) > 1e-6 ||
          matrix.a < -1e-6 ||
          matrix.d < -1e-6
        ) {
          return true;
        }
      }
      if (hasDistortingTransformLonghand(css)) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  /**
   * Checks transform longhands that aren't reflected in the computed `transform` matrix.
   * `rotate` can be an axis-angle value (`x y z angle`), so the last angle token is used.
   */
  function hasDistortingTransformLonghand(css) {
    const rotate = css.getPropertyValue('rotate').trim();
    const angles = rotate.match(/-?(?:\d+|\d*\.\d+)(?:e[-+]?\d+)?(?:deg|rad|grad|turn)/gi);
    const angle = angles && angles[angles.length - 1];

    return (
      (rotate !== '' &&
        rotate !== 'none' &&
        (angle == null || Math.abs(parseFloat(angle)) > 1e-6)) ||
      parseFloat(css.getPropertyValue('perspective')) > 0
    );
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
    const { width: tabsListWidth, height: tabsListHeight } = getCssDimensions(tabsList);
    const tabRect = activeTab.getBoundingClientRect();
    const tabsListRect = tabsList.getBoundingClientRect();
    const scaleX = tabsListWidth > 0 ? tabsListRect.width / tabsListWidth : 1;
    const scaleY = tabsListHeight > 0 ? tabsListRect.height / tabsListHeight : 1;
    const hasNonZeroScale = Math.abs(scaleX) > Number.EPSILON && Math.abs(scaleY) > Number.EPSILON;
    const useOffsetPath = !hasNonZeroScale || hasDistortingTransform(activeTab);

    if (useOffsetPath) {
      const offset = getLayoutOffset(activeTab, tabsList);
      left = offset.left;
      top = offset.top;
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
