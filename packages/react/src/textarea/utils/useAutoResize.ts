'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerWindow } from '@base-ui/utils/owner';
import { detectFieldSizing } from './detectFieldSizing';

export interface UseAutoResizeParameters {
  /**
   * Whether auto-resize is enabled.
   */
  enabled: boolean;
  /**
   * Minimum number of rows to display.
   */
  minRows: number;
  /**
   * Maximum number of rows to display. When exceeded, the textarea scrolls.
   */
  maxRows: number | undefined;
  /**
   * Ref to the textarea element.
   */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

/**
 * Measures the height of a single row by temporarily setting the textarea
 * content to a single character and reading the scroll height.
 */
function measureRowHeight(textarea: HTMLTextAreaElement): number {
  const prevValue = textarea.value;
  const prevHeight = textarea.style.height;
  const prevOverflow = textarea.style.overflow;

  textarea.style.height = '0';
  textarea.style.overflow = 'hidden';
  textarea.value = 'x';

  const styles = getComputedStyle(textarea);
  const paddingTop = parseFloat(styles.paddingTop);
  const paddingBottom = parseFloat(styles.paddingBottom);
  const rowHeight = textarea.scrollHeight - paddingTop - paddingBottom;

  textarea.value = prevValue;
  textarea.style.height = prevHeight;
  textarea.style.overflow = prevOverflow;

  return rowHeight;
}

/**
 * Syncs the textarea height to its content. Uses `field-sizing: content` where
 * supported and falls back to JS measurement.
 */
export function useAutoResize(params: UseAutoResizeParameters) {
  const { enabled, minRows, maxRows, textareaRef } = params;

  const hasFieldSizing = detectFieldSizing();
  const needsJsFallback = enabled && !hasFieldSizing;

  const syncHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const rowHeight = measureRowHeight(textarea);
    const minHeight = rowHeight * minRows;
    const maxHeight = maxRows != null ? rowHeight * maxRows : undefined;

    const styles = getComputedStyle(textarea);
    const borderTop = parseFloat(styles.borderTopWidth);
    const borderBottom = parseFloat(styles.borderBottomWidth);
    const paddingTop = parseFloat(styles.paddingTop);
    const paddingBottom = parseFloat(styles.paddingBottom);
    const isBorderBox = styles.boxSizing === 'border-box';

    // Reset height to measure natural scroll height
    textarea.style.height = '0';
    textarea.style.overflow = 'hidden';
    let contentHeight = textarea.scrollHeight;

    if (isBorderBox) {
      contentHeight += borderTop + borderBottom;
    } else {
      contentHeight -= paddingTop + paddingBottom;
    }

    const adjustedMinHeight = isBorderBox
      ? minHeight + paddingTop + paddingBottom + borderTop + borderBottom
      : minHeight;

    const height = Math.max(contentHeight, adjustedMinHeight);

    if (maxHeight != null) {
      const adjustedMaxHeight = isBorderBox
        ? maxHeight + paddingTop + paddingBottom + borderTop + borderBottom
        : maxHeight;
      if (height >= adjustedMaxHeight) {
        textarea.style.height = `${adjustedMaxHeight}px`;
        textarea.style.overflow = '';
        return;
      }
    }

    textarea.style.height = `${height}px`;
    textarea.style.overflow = 'hidden';
  }, [textareaRef, minRows, maxRows]);

  // Sync height on mount and when value changes
  useIsoLayoutEffect(() => {
    if (!needsJsFallback) {
      return;
    }

    syncHeight();
  });

  // Sync height on window resize
  React.useEffect(() => {
    if (!needsJsFallback) {
      return undefined;
    }

    const textarea = textareaRef.current;
    if (!textarea) {
      return undefined;
    }

    const win = ownerWindow(textarea);

    const handleResize = () => {
      syncHeight();
    };

    win.addEventListener('resize', handleResize);
    return () => {
      win.removeEventListener('resize', handleResize);
    };
  }, [needsJsFallback, textareaRef, syncHeight]);

  // Sync height after fonts load
  React.useEffect(() => {
    if (!needsJsFallback) {
      return;
    }

    document.fonts?.ready.then(() => {
      syncHeight();
    });
  }, [needsJsFallback, syncHeight]);

  /**
   * Returns style props to apply to the textarea.
   * When field-sizing is supported, returns the CSS property.
   * When using JS fallback, returns min/max constraints.
   */
  const getTextareaStyles = React.useCallback((): React.CSSProperties => {
    if (!enabled) {
      return {};
    }

    if (hasFieldSizing) {
      return {
        fieldSizing: 'content',
      } as React.CSSProperties;
    }

    // JS fallback styles are set imperatively by syncHeight
    return {
      resize: 'none',
    };
  }, [enabled, hasFieldSizing]);

  return {
    syncHeight,
    getTextareaStyles,
  };
}
