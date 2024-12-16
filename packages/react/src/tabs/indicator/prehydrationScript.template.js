(function prehydration() {
  const indicator = document.currentScript.previousElementSibling;
  if (!indicator) {
    return;
  }

  const list = indicator.closest('[role="tablist"]');
  if (!list) {
    return;
  }

  const activeTab = list.querySelector('[data-selected]');
  if (!activeTab) {
    return;
  }

  const {
    left: tabLeft,
    right: tabRight,
    top: tabTop,
    bottom: tabBottom,
    width: tabWidth,
  } = activeTab.getBoundingClientRect();

  const {
    left: listLeft,
    right: listRight,
    top: listTop,
    bottom: listBottom,
    width: listWidth,
  } = list.getBoundingClientRect();

  if (tabWidth === 0 || listWidth === 0) {
    return;
  }

  const left = tabLeft - listLeft;
  const right = listRight - tabRight;
  const top = tabTop - listTop;
  const bottom = listBottom - tabBottom;
  const width = tabRight - tabLeft;
  const height = tabBottom - tabTop;

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
