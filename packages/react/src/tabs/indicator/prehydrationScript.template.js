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

  const direction = getComputedStyle(tabsList).direction;
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

  if (activeTab != null && tabsList != null) {
    const { width: computedWidth, height: computedHeight } = getCssDimensions(activeTab);
    const { width: tabsListWidth, height: tabsListHeight } = getCssDimensions(tabsList);
    const tabRect = activeTab.getBoundingClientRect();
    const tabsListRect = tabsList.getBoundingClientRect();
    const scaleX = tabsListWidth > 0 ? tabsListRect.width / tabsListWidth : 1;
    const scaleY = tabsListHeight > 0 ? tabsListRect.height / tabsListHeight : 1;

    left = (tabRect.left - tabsListRect.left + tabsList.scrollLeft - tabsList.clientLeft) / scaleX;
    top = (tabRect.top - tabsListRect.top + tabsList.scrollTop - tabsList.clientTop) / scaleY;
    width = computedWidth;
    height = computedHeight;

    right =
      direction === 'ltr'
        ? tabsList.scrollWidth - left - width - tabsList.clientLeft
        : left - tabsList.clientLeft;
    bottom = tabsList.scrollHeight - top - height - tabsList.clientTop;
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
