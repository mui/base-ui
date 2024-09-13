/*
 * LICENSE: https://github.com/adobe/react-spectrum/blob/main/LICENSE
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 * -------------------------------------------------------------------------------------------------
 * This code has been modified by Base UI contributors and does not reflect the original version.
 */
import { isIOS } from './detectBrowser';
import { useEnhancedEffect } from './useEnhancedEffect';
import { useId } from './useId';

let originalStyles = {};
let originalBodyOverflow = '';

function chain(...fns: any[]) {
  return () => {
    fns.forEach((fn) => {
      if (typeof fn === 'function') {
        fn();
      }
    });
  };
}

function isScrollable(node: Element, checkForOverflow?: boolean) {
  const style = window.getComputedStyle(node);
  let value = /(auto|scroll)/.test(style.overflow + style.overflowX + style.overflowY);

  if (value && checkForOverflow) {
    value = node.scrollHeight !== node.clientHeight || node.scrollWidth !== node.clientWidth;
  }

  return value;
}

function getScrollParent(node: Element, checkForOverflow?: boolean) {
  let scrollableNode: Element | null = node;

  if (isScrollable(scrollableNode, checkForOverflow)) {
    scrollableNode = scrollableNode.parentElement;
  }

  while (scrollableNode && !isScrollable(scrollableNode, checkForOverflow)) {
    scrollableNode = scrollableNode.parentElement;
  }

  return scrollableNode || document.scrollingElement || document.documentElement;
}

// @ts-ignore
const visualViewport = typeof document !== 'undefined' && window.visualViewport;

// HTML input types that do not cause the software keyboard to appear.
const nonTextInputTypes = new Set([
  'checkbox',
  'radio',
  'range',
  'color',
  'file',
  'image',
  'button',
  'submit',
  'reset',
]);

// The number of active usePreventScroll calls. Used to determine whether to revert back to the original page style/scroll position
let preventScrollCount = 0;
let restore: () => void = () => {};

function preventScrollIOS() {
  let scrollable: Element;
  let restoreScrollableStyles: () => void;

  function onTouchStart(event: TouchEvent) {
    // Store the nearest scrollable parent element from the element that the user touched.
    scrollable = getScrollParent(event.target as Element, true);
    if (scrollable === document.documentElement && scrollable === document.body) {
      return;
    }

    // Prevent scrolling up when at the top and scrolling down when at the bottom
    // of a nested scrollable area, otherwise mobile Safari will start scrolling
    // the window instead.
    if (
      scrollable instanceof HTMLElement &&
      window.getComputedStyle(scrollable).overscrollBehavior === 'auto'
    ) {
      restoreScrollableStyles = setStyle(scrollable, 'overscrollBehavior', 'contain');
    }
  }

  function onTouchMove(e: TouchEvent) {
    // Prevent scrolling the window.
    if (!scrollable || scrollable === document.documentElement || scrollable === document.body) {
      e.preventDefault();
      return;
    }

    // overscroll-behavior should prevent scroll chaining, but currently does not
    // if the element doesn't actually overflow. https://bugs.webkit.org/show_bug.cgi?id=243452
    // This checks that both the width and height do not overflow, otherwise we might
    // block horizontal scrolling too. In that case, adding `touch-action: pan-x` to
    // the element will prevent vertical page scrolling. We can't add that automatically
    // because it must be set before the touchstart event.
    if (
      scrollable.scrollHeight === scrollable.clientHeight &&
      scrollable.scrollWidth === scrollable.clientWidth
    ) {
      e.preventDefault();
    }
  }

  function onTouchEnd(event: TouchEvent) {
    const target = event.target as HTMLElement;

    // Apply this change if we're not already focused on the target element
    if (willOpenKeyboard(target) && target !== document.activeElement) {
      event.preventDefault();
      setupStyles();

      // Apply a transform to trick Safari into thinking the input is at the top of the page
      // so it doesn't try to scroll it into view. When tapping on an input, this needs to
      // be done before the "focus" event, so we have to focus the element ourselves.
      target.style.transform = 'translateY(-2000px)';
      target.focus();
      requestAnimationFrame(() => {
        target.style.transform = '';
      });
    }

    if (restoreScrollableStyles) {
      restoreScrollableStyles();
    }
  }

  function onFocus(event: FocusEvent) {
    const target = event.target as HTMLElement;

    if (willOpenKeyboard(target)) {
      setupStyles();

      // Transform also needs to be applied in the focus event in cases where focus moves
      // other than tapping on an input directly, e.g. the next/previous buttons in the
      // software keyboard. In these cases, it seems applying the transform in the focus event
      // is good enough, whereas when tapping an input, it must be done before the focus event. 🤷‍♂️
      target.style.transform = 'translateY(-2000px)';
      requestAnimationFrame(() => {
        target.style.transform = '';

        // This will have prevented the browser from scrolling the focused element into view,
        // so we need to do this ourselves in a way that doesn't cause the whole page to scroll.
        if (visualViewport) {
          if (visualViewport.height < window.innerHeight) {
            // If the keyboard is already visible, do this after one additional frame
            // to wait for the transform to be removed.
            requestAnimationFrame(() => {
              scrollIntoView(target);
            });
          } else {
            // Otherwise, wait for the visual viewport to resize before scrolling so we can
            // measure the correct position to scroll to.
            visualViewport.addEventListener('resize', () => scrollIntoView(target), { once: true });
          }
        }
      });
    }
  }

  let restoreStyles: null | (() => void) = null;

  function setupStyles() {
    if (restoreStyles) {
      return;
    }

    function onWindowScroll() {
      // Last resort. If the window scrolled, scroll it back to the top.
      // It should always be at the top because the body will have a negative margin (see below).
      window.scrollTo(0, 0);
    }

    // Record the original scroll position so we can restore it.
    // Then apply a negative margin to the body to offset it by the scroll position. This will
    // enable us to scroll the window to the top, which is required for the rest of this to work.
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    restoreStyles = chain(
      addEvent(window, 'scroll', onWindowScroll),
      setStyle(
        document.documentElement,
        'paddingRight',
        `${window.innerWidth - document.documentElement.clientWidth}px`,
      ),
      setStyle(document.documentElement, 'overflow', 'hidden'),
      setStyle(document.body, 'marginTop', `-${scrollY}px`),
      () => {
        window.scrollTo(scrollX, scrollY);
      },
    );

    // Scroll to the top. The negative margin on the body will make this appear the same.
    window.scrollTo(0, 0);
  }

  const removeEvents = chain(
    addEvent(document, 'touchstart', onTouchStart, { passive: false, capture: true }),
    addEvent(document, 'touchmove', onTouchMove, { passive: false, capture: true }),
    addEvent(document, 'touchend', onTouchEnd, { passive: false, capture: true }),
    addEvent(document, 'focus', onFocus, true),
  );

  return () => {
    // Restore styles and scroll the page back to where it was.
    restoreScrollableStyles?.();
    restoreStyles?.();
    removeEvents();
  };
}

// Sets a CSS property on an element, and returns a function to revert it to the previous value.
function setStyle(element: HTMLElement, style: any, value: string) {
  const cur = element.style[style];
  element.style[style] = value;
  return () => {
    element.style[style] = cur;
  };
}

// Adds an event listener to an element, and returns a function to remove it.
function addEvent<K extends keyof GlobalEventHandlersEventMap>(
  target: EventTarget,
  event: K,
  handler: any,
  options?: boolean | AddEventListenerOptions,
) {
  target.addEventListener(event, handler, options);
  return () => {
    target.removeEventListener(event, handler, options);
  };
}

function scrollIntoView(target: Element | null) {
  const root = document.scrollingElement || document.documentElement;

  while (target && target !== root) {
    // Find the parent scrollable element and adjust the scroll position if the target is not already in view.
    const scrollable = getScrollParent(target);
    if (
      scrollable !== document.documentElement &&
      scrollable !== document.body &&
      scrollable !== target
    ) {
      const scrollableTop = scrollable.getBoundingClientRect().top;
      const targetTop = target.getBoundingClientRect().top;
      if (targetTop > scrollableTop + target.clientHeight) {
        scrollable.scrollTop += targetTop - scrollableTop;
      }
    }

    target = scrollable.parentElement;
  }
}

function willOpenKeyboard(target: Element) {
  return (
    (target instanceof HTMLInputElement && !nonTextInputTypes.has(target.type)) ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function preventScrollStandard() {
  const html = document.documentElement;
  const rootStyle = html.style;
  const bodyStyle = document.body.style;

  let resizeRaf: number;
  let scrollX: number;
  let scrollY: number;

  function lockScroll() {
    const scrollbarWidth = window.innerWidth - html.clientWidth;
    const offsetLeft = window.visualViewport?.offsetLeft || 0;
    const offsetTop = window.visualViewport?.offsetTop || 0;

    scrollX = rootStyle.left ? parseFloat(rootStyle.left) : window.scrollX;
    scrollY = rootStyle.top ? parseFloat(rootStyle.top) : window.scrollY;

    // We don't need to lock the scroll if there's already an active lock. However, it's possible
    // that the one that originally locked it doesn't get cleaned up last. In that case, one of the
    // newer locks needs to perform the style and scroll restoration.
    if (preventScrollCount > 1) {
      return cleanup;
    }

    originalStyles = {
      position: rootStyle.position,
      top: rootStyle.top,
      left: rootStyle.left,
      right: rootStyle.right,
      ...(scrollbarWidth && {
        overflowX: rootStyle.overflowX,
        overflowY: rootStyle.overflowY,
      }),
    };
    originalBodyOverflow = bodyStyle.overflow;

    bodyStyle.overflow = 'hidden';

    Object.assign(rootStyle, {
      // Handle `scrollbar-gutter` in Chrome when there is no scrollable content.
      position: html.scrollHeight > html.clientHeight ? 'fixed' : '',
      top: `${-(scrollY - Math.floor(offsetTop))}px`,
      left: `${-(scrollX - Math.floor(offsetLeft))}px`,
      right: '0',
      // On iOS, the html can't be scrollable as it allows "pull-to-refresh" to still work. This
      // is only necessary when scrollbars are present.
      ...(scrollbarWidth && {
        overflowY: html.scrollHeight > html.clientHeight ? 'scroll' : 'hidden',
        overflowX: html.scrollWidth > html.clientWidth ? 'scroll' : 'hidden',
      }),
    });

    return undefined;
  }

  function cleanup() {
    Object.assign(rootStyle, originalStyles);
    bodyStyle.overflow = originalBodyOverflow;

    if (window.scrollTo.toString().includes('[native code]')) {
      window.scrollTo(scrollX, scrollY);
    }
  }

  function handleResize() {
    cleanup();
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(lockScroll);
  }

  lockScroll();
  window.addEventListener('resize', handleResize);

  return () => {
    cleanup();
    window.removeEventListener('resize', handleResize);
  };
}

/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 */
export function useScrollLock(enabled: boolean = true) {
  const id = useId();

  useEnhancedEffect(() => {
    if (!enabled || !id) {
      return undefined;
    }

    preventScrollCount += 1;
    if (preventScrollCount === 1) {
      restore = isIOS() ? preventScrollIOS() : preventScrollStandard();
    }

    return () => {
      preventScrollCount -= 1;
      if (preventScrollCount === 0) {
        restore();
      }
    };
  }, [enabled, id]);
}
