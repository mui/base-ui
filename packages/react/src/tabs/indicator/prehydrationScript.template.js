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

  function position() {
    let left = 0;
    let right = 0;
    let top = 0;
    let bottom = 0;

    const { width: computedWidth, height: computedHeight } = getCssDimensions(activeTab);
    const { width: tabsListWidth, height: tabsListHeight } = getCssDimensions(tabsList);
    const tabRect = activeTab.getBoundingClientRect();
    const tabsListRect = tabsList.getBoundingClientRect();
    const scaleX = tabsListWidth > 0 ? tabsListRect.width / tabsListWidth : 1;
    const scaleY = tabsListHeight > 0 ? tabsListRect.height / tabsListHeight : 1;
    const hasNonZeroScale = Math.abs(scaleX) > Number.EPSILON && Math.abs(scaleY) > Number.EPSILON;

    if (hasNonZeroScale) {
      const tabLeftDelta = tabRect.left - tabsListRect.left;
      const tabTopDelta = tabRect.top - tabsListRect.top;

      left = tabLeftDelta / scaleX + tabsList.scrollLeft - tabsList.clientLeft;
      top = tabTopDelta / scaleY + tabsList.scrollTop - tabsList.clientTop;
    } else {
      left = activeTab.offsetLeft;
      top = activeTab.offsetTop;
    }

    const width = computedWidth;
    const height = computedHeight;
    right = tabsList.scrollWidth - left - width;
    bottom = tabsList.scrollHeight - top - height;

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
  }

  if (activeTab.offsetWidth === 0 || tabsList.offsetWidth === 0) {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    let timeout, observer;
    function stop() {
      observer.disconnect();
      clearTimeout(timeout);
    }

    observer = new ResizeObserver(() => {
      if (!indicator.isConnected || !indicator.hasAttribute('hidden')) {
        // Hydration got there first.
        stop();
        return;
      }

      if (activeTab.offsetWidth > 0 && tabsList.offsetWidth > 0) {
        stop();
        position();
      }
    });

    observer.observe(tabsList);
    // Bounded lifetime so the observer can't retain the subtree forever if it's
    // removed while still 0×0 (no resize fires to trigger self-disconnect).
    timeout = setTimeout(stop, 10000);
    return;
  }

  position();
})();
