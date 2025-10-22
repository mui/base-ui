(function prehydration() {
  const indicator = document.currentScript.previousElementSibling;
  if (!indicator) {
    return;
  }

  const list = indicator.closest('[role="tablist"]');
  if (!list) {
    return;
  }

  const selectedTab = list.querySelector('[data-selected]');
  if (!selectedTab) {
    return;
  }

  if (selectedTab.offsetWidth === 0 || list.offsetWidth === 0) {
    return;
  }

  const direction = getComputedStyle(list).direction;

  const left = selectedTab.offsetLeft - list.clientLeft;
  const { width: rectWidth, height: rectHeight } = selectedTab.getBoundingClientRect();
  const width = Math.floor(rectWidth);
  const height = Math.floor(rectHeight);
  const right =
    direction === 'ltr'
      ? list.scrollWidth - selectedTab.offsetLeft - width - list.clientLeft
      : selectedTab.offsetLeft - list.clientLeft;
  const top = selectedTab.offsetTop - list.clientTop;
  const bottom = list.scrollHeight - selectedTab.offsetTop - height - list.clientTop;

  function setProp(name, value) {
    indicator.style.setProperty(`--selected-tab-${name}`, `${value}px`);
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
