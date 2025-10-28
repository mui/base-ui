(function prehydration() {
  const indicator = document.currentScript.previousElementSibling;
  if (!indicator) {
    return;
  }

  const list = indicator.closest('[role="tablist"]');
  if (!list) {
    return;
  }

  const activeTab = list.querySelector('[data-active]');
  if (!activeTab) {
    return;
  }

  if (activeTab.offsetWidth === 0 || list.offsetWidth === 0) {
    return;
  }

  const direction = getComputedStyle(list).direction;

  const left = activeTab.offsetLeft - list.clientLeft;
  const { width: rectWidth, height: rectHeight } = activeTab.getBoundingClientRect();
  const width = Math.floor(rectWidth);
  const height = Math.floor(rectHeight);
  const right =
    direction === 'ltr'
      ? list.scrollWidth - activeTab.offsetLeft - width - list.clientLeft
      : activeTab.offsetLeft - list.clientLeft;
  const top = activeTab.offsetTop - list.clientTop;
  const bottom = list.scrollHeight - activeTab.offsetTop - height - list.clientTop;

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
