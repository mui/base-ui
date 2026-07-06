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

  // When the active tab carries its own transform, the layout offset below can't reflect
  // its visual position, and the hydrated component may follow it. Skip the pre-hydration
  // paint and let the component position the indicator on hydration; this avoids painting
  // at the wrong spot and then jumping. Keep this in sync with `TabsIndicator.tsx`.
  const activeTabStyle = getComputedStyle(activeTab);
  if (
    activeTabStyle.transform !== 'none' ||
    activeTabStyle.translate !== 'none' ||
    activeTabStyle.rotate !== 'none' ||
    activeTabStyle.scale !== 'none'
  ) {
    return;
  }

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

  const { width, height } = getCssDimensions(activeTab);

  // Unlike `TabsIndicator.tsx`, only the transform-immune layout offsets are used here.
  // They are off by ~1px of `offsetLeft`/`offsetTop` rounding, but the component
  // recomputes the variables with sub-pixel precision as soon as React hydrates.
  //
  // Clamp to the content box: a rounded-up offset could otherwise overshoot the tab
  // list's scrollable extent and trigger a transient scrollbar before hydration. The
  // clamp is a no-op when the active tab doesn't define the edge (e.g. trailing list
  // padding), and it also keeps `--active-tab-right`/`--active-tab-bottom` >= 0.
  const layoutOffset = getLayoutOffset(activeTab, tabsList);
  const left = Math.min(layoutOffset.left, tabsList.scrollWidth - width);
  const top = Math.min(layoutOffset.top, tabsList.scrollHeight - height);

  const right = tabsList.scrollWidth - left - width;
  const bottom = tabsList.scrollHeight - top - height;

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
