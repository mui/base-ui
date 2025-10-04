export interface CalculateTextareaHeightResult {
  outerHeightStyle: number;
  isOverflowing: boolean;
  rowsOccupied: number;
}

/**
 * Calculate the desired outer height, whether content is overflowing and the rows occupied
 * for an auto-resizing textarea. This mirrors the logic previously embedded inside
 * Textarea.tsx so the layout effect can stay concise.
 */
export function calculateTextareaHeight(
  el: HTMLTextAreaElement,
  hidden: HTMLTextAreaElement,
  placeholder?: string,
  minRows?: number,
  maxRows?: number,
): CalculateTextareaHeightResult | null {
  if (!el || !hidden) {
    return null;
  }

  const getStyleValue = (str: string) => parseInt(str, 10) || 0;

  const computedStyle = getComputedStyle(el);

  let width = computedStyle.width;
  if (!width || width === '0px') {
    const rect = el.getBoundingClientRect();
    width = rect.width ? `${rect.width}px` : width;
  }

  if (!width || width === '0px') {
    return null;
  }

  const styleToCopy: string[] = [];
  for (let i = 0; i < computedStyle.length; i += 1) {
    const cssName = computedStyle[i];
    if (!cssName) {
      continue;
    }

    if (
      cssName.includes('box-sizing') ||
      cssName.includes('width') ||
      cssName.includes('padding') ||
      cssName.includes('border') ||
      cssName.includes('font') ||
      cssName.includes('letter-spacing') ||
      cssName.includes('text-transform') ||
      cssName.includes('text-indent') ||
      cssName.includes('line-height') ||
      cssName.includes('white-space')
    ) {
      styleToCopy.push(cssName);
    }
  }

  hidden.style.width = width;
  for (const propName of styleToCopy) {
    hidden.style.setProperty(propName, computedStyle.getPropertyValue(propName));
  }

  hidden.style.whiteSpace =
    computedStyle.whiteSpace === 'pre-wrap' || computedStyle.whiteSpace === 'pre-line'
      ? computedStyle.whiteSpace
      : 'pre-wrap';

  hidden.value = el.value || placeholder || 'x';
  if (hidden.value.slice(-1) === '\n') {
    // Certain fonts which overflow the line height will cause the textarea
    // to report a different scrollHeight depending on whether the last line
    // is empty. Make it non-empty to avoid this issue.
    hidden.value += ' ';
  }

  const boxSizing = computedStyle.boxSizing;
  const paddingTop = getStyleValue(computedStyle.paddingTop);
  const paddingBottom = getStyleValue(computedStyle.paddingBottom);
  const padding = paddingTop + paddingBottom;
  const border =
    getStyleValue(computedStyle.borderBottomWidth) + getStyleValue(computedStyle.borderTopWidth);

  const innerScrollHeight = hidden.scrollHeight;

  hidden.value = 'x';
  const singleRowScrollHeight = hidden.scrollHeight || 1;
  const singleRowContentHeight = Math.max(singleRowScrollHeight - padding, 1);

  const currentContentHeight = Math.max(innerScrollHeight - padding, 0);

  let desiredContentHeight = currentContentHeight;
  if (minRows) {
    desiredContentHeight = Math.max(Number(minRows) * singleRowContentHeight, desiredContentHeight);
  }
  if (maxRows) {
    desiredContentHeight = Math.min(Number(maxRows) * singleRowContentHeight, desiredContentHeight);
  }
  desiredContentHeight = Math.max(desiredContentHeight, singleRowContentHeight);

  const outerHeightStyle =
    boxSizing === 'border-box' ? desiredContentHeight + padding + border : desiredContentHeight;

  const isOverflowing = currentContentHeight > desiredContentHeight + 1;

  const rowsOccupied = currentContentHeight / singleRowContentHeight;

  return {
    outerHeightStyle,
    isOverflowing,
    rowsOccupied,
  };
}

export default calculateTextareaHeight;
