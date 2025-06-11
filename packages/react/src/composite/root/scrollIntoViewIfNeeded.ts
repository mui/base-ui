import type { TextDirection } from '../../direction-provider/DirectionContext';

export function scrollIntoViewIfNeeded(
  scrollContainer: HTMLElement | null,
  element: HTMLElement | null,
  direction: TextDirection,
  orientation: 'horizontal' | 'vertical' | 'both',
) {
  if (!scrollContainer || !element) {
    return;
  }

  let targetX = scrollContainer.scrollLeft;
  let targetY = scrollContainer.scrollTop;

  const isOverflowingX = scrollContainer.clientWidth < scrollContainer.scrollWidth;
  const isOverflowingY = scrollContainer.clientHeight < scrollContainer.scrollHeight;

  const scrollContainerRect = scrollContainer.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  const side = direction === 'ltr' ? 'left' : 'right';
  const offsetX = elementRect[side] - scrollContainerRect[side];

  if (isOverflowingX && orientation !== 'vertical') {
    if (
      direction === 'ltr' &&
      element.offsetLeft + element.offsetWidth > scrollContainer.clientWidth
    ) {
      targetX = offsetX + element.offsetWidth - scrollContainer.clientWidth;
    }

    if (direction === 'rtl' && element.offsetLeft < scrollContainer.scrollLeft) {
      targetX = offsetX - element.offsetWidth + scrollContainer.clientWidth;
    }
  }

  if (
    isOverflowingY &&
    orientation !== 'horizontal' &&
    element.offsetTop + element.offsetHeight > scrollContainer.clientHeight
  ) {
    const { borderTopWidth } = getStyles(scrollContainer);

    targetY = elementRect.top - scrollContainerRect.top - borderTopWidth;
  }

  scrollContainer.scrollTo({
    left: targetX,
    top: targetY,
    behavior: 'auto',
  });
}

function getStyles(element: HTMLElement) {
  const styles = getComputedStyle(element);

  return {
    borderTopWidth: parseFloat(styles.borderTopWidth),
  };
}
