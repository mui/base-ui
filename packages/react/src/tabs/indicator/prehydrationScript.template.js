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

  if (!isHTMLElement(indicator) || !isHTMLElement(activeTab) || !isHTMLElement(tabsList)) {
    return;
  }

  if (!activeTab.offsetWidth || !tabsList.offsetWidth) {
    return;
  }

  function isHTMLElement(element) {
    return element instanceof HTMLElement;
  }

  function getCssDimensions(element) {
    const css = getComputedStyle(element);
    const cssWidth = parseFloat(css.width) || 0;
    const cssHeight = parseFloat(css.height) || 0;
    const shouldFallback =
      Math.round(cssWidth) !== element.offsetWidth ||
      Math.round(cssHeight) !== element.offsetHeight;

    return shouldFallback ? [element.offsetWidth, element.offsetHeight] : [cssWidth, cssHeight];
  }

  function getElementOffset(element) {
    let offsetParent = element.offsetParent;

    if (!offsetParent) {
      return null;
    }

    let offsetLeft = element.offsetLeft;
    let offsetTop = element.offsetTop;

    while (offsetParent) {
      if (!isHTMLElement(offsetParent)) {
        return null;
      }

      offsetLeft += offsetParent.offsetLeft + offsetParent.clientLeft;
      offsetTop += offsetParent.offsetTop + offsetParent.clientTop;
      offsetParent = offsetParent.offsetParent;
    }

    return [offsetLeft, offsetTop];
  }

  function hasTransform(element) {
    const style = getComputedStyle(element);

    return (
      style.transform !== 'none' ||
      (!!style.translate && style.translate !== 'none') ||
      (!!style.rotate && style.rotate !== 'none') ||
      (!!style.scale && style.scale !== 'none')
    );
  }

  function getIndicatorOffset(element, ancestor) {
    // Measure both the visual rectangle and the layout offset chain. DOMRects keep
    // fractional offsets, but 3D transforms can skew their projected coordinates.
    const elementOffset = getElementOffset(element);
    const ancestorOffset = getElementOffset(ancestor);
    const [ancestorWidth, ancestorHeight] = getCssDimensions(ancestor);
    const elementRect = element.getBoundingClientRect();
    const ancestorRect = ancestor.getBoundingClientRect();
    const scaleX = ancestorWidth > 0 ? ancestorRect.width / ancestorWidth : 1;
    const scaleY = ancestorHeight > 0 ? ancestorRect.height / ancestorHeight : 1;

    // Convert the visual rect delta back into the tab list's content box. This
    // preserves sub-pixel positioning and handles normal 2D scale transforms.
    const rectOffset =
      scaleX > Number.EPSILON && scaleY > Number.EPSILON
        ? [
            (elementRect.left - ancestorRect.left) / scaleX +
              ancestor.scrollLeft -
              ancestor.clientLeft,
            (elementRect.top - ancestorRect.top) / scaleY + ancestor.scrollTop - ancestor.clientTop,
          ]
        : [element.offsetLeft, element.offsetTop];

    if (!elementOffset || !ancestorOffset) {
      return rectOffset;
    }

    // The offset chain is layout-based, so it remains stable when 3D transforms
    // distort getBoundingClientRect().
    const layoutOffset = [
      elementOffset[0] - ancestorOffset[0] - ancestor.clientLeft,
      elementOffset[1] - ancestorOffset[1] - ancestor.clientTop,
    ];

    // Prefer the fractional rect result when it matches layout within rounding noise.
    // If the tab itself is transformed, keep following its visual position. Otherwise,
    // a larger mismatch means projection skew, so fall back to layout.
    return hasTransform(element) ||
      (Math.abs(rectOffset[0] - layoutOffset[0]) <= 1 &&
        Math.abs(rectOffset[1] - layoutOffset[1]) <= 1)
      ? rectOffset
      : layoutOffset;
  }

  const [width, height] = getCssDimensions(activeTab);
  const [left, top] = getIndicatorOffset(activeTab, tabsList);
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
