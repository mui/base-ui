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

  if (activeTab.offsetWidth === 0 || list.offsetWidth === 0) {
    return;
  }

  const direction = getComputedStyle(list).direction;

  const left = activeTab.offsetLeft - list.clientLeft;
  const right =
    direction === 'ltr'
      ? list.scrollWidth - activeTab.offsetLeft - activeTab.offsetWidth - list.clientLeft
      : activeTab.offsetLeft - list.clientLeft;
  const top = activeTab.offsetTop - list.clientTop;
  const bottom = list.scrollHeight - activeTab.offsetTop - activeTab.offsetHeight - list.clientTop;
  const width = activeTab.offsetWidth;
  const height = activeTab.offsetHeight;

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
