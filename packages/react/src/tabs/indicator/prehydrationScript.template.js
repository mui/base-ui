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
  if (!activeTab || activeTab.offsetWidth === 0 || tabsList.offsetWidth === 0) {
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

  const { width: tabsListWidth, height: tabsListHeight } = getCssDimensions(tabsList);
  const tabRect = activeTab.getBoundingClientRect();
  const tabsListRect = tabsList.getBoundingClientRect();
  const scaleX = tabsListWidth > 0 ? tabsListRect.width / tabsListWidth : 1;
  const scaleY = tabsListHeight > 0 ? tabsListRect.height / tabsListHeight : 1;

  let left = activeTab.offsetLeft;
  let top = activeTab.offsetTop;
  let width = activeTab.offsetWidth;
  let height = activeTab.offsetHeight;

  if (Math.abs(scaleX) > Number.EPSILON && Math.abs(scaleY) > Number.EPSILON) {
    left = (tabRect.left - tabsListRect.left) / scaleX + tabsList.scrollLeft - tabsList.clientLeft;
    top = (tabRect.top - tabsListRect.top) / scaleY + tabsList.scrollTop - tabsList.clientTop;
    width = tabRect.width / scaleX;
    height = tabRect.height / scaleY;
  }

  const props = {
    left,
    right: tabsList.scrollWidth - left - width,
    top,
    bottom: tabsList.scrollHeight - top - height,
    width,
    height,
  };

  for (const name in props) {
    indicator.style.setProperty(`--active-tab-${name}`, `${props[name]}px`);
  }

  if (width > 0 && height > 0) {
    indicator.removeAttribute('hidden');
  }
})();
