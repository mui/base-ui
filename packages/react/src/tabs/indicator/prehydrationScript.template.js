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

  if (activeTab != null && tabsList != null) {
    const tabsListRect = tabsList.getBoundingClientRect();
    const {
      left: tabLeft,
      top: tabTop,
      width: computedWidth,
      height: computedHeight,
    } = activeTab.getBoundingClientRect();

    left = tabLeft - tabsListRect.left + tabsList.scrollLeft - tabsList.clientLeft;
    top = tabTop - tabsListRect.top + tabsList.scrollTop - tabsList.clientTop;
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
