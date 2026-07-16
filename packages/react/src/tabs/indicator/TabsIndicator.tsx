'use client';
import * as React from 'react';
import { useForcedRerendering } from '@base-ui/utils/useForcedRerendering';
import { ownerWindow } from '@base-ui/utils/owner';
import { script as prehydrationScript } from '#prehydration/tabs/indicator';
import { PrehydrationScript } from '../../internals/PrehydrationScript';
import { useRenderElement } from '../../internals/useRenderElement';
import { getCssDimensions } from '../../utils/getCssDimensions';
import { getElementTransform } from '../../utils/getElementTransform';
import type { BaseUIComponentProps } from '../../internals/types';
import type { TabsRoot, TabsRootState } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import { tabsStateAttributesMapping } from '../root/stateAttributesMapping';
import { useTabsListContext } from '../list/TabsListContext';
import type { TabsTab } from '../tab/TabsTab';

const stateAttributesMapping = {
  ...tabsStateAttributesMapping,
  activeTabPosition: () => null,
  activeTabSize: () => null,
};

// `offsetLeft`/`offsetTop` are rounded to whole pixels and the error can compound
// across the offset parent chain.
const MAX_LAYOUT_ROUNDING_ERROR = 2;

/**
 * A visual indicator that can be styled to match the position of the currently active tab.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsIndicator = React.forwardRef(function TabsIndicator(
  componentProps: TabsIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    className,
    render,
    renderBeforeHydration = false,
    style: styleProp,
    ...elementProps
  } = componentProps;

  const { getTabElementBySelectedValue, orientation, tabActivationDirection, value } =
    useTabsRootContext();

  const { tabsListElement, registerIndicatorUpdateListener } = useTabsListContext();

  const rerender = useForcedRerendering();

  React.useEffect(() => {
    return registerIndicatorUpdateListener(rerender);
  }, [registerIndicatorUpdateListener, rerender]);

  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  let width = 0;
  let height = 0;

  let isTabSelected = false;

  if (value != null && tabsListElement != null) {
    const activeTab = getTabElementBySelectedValue(value);

    if (activeTab != null) {
      isTabSelected = true;

      const { width: computedWidth, height: computedHeight } = getCssDimensions(activeTab);
      const { width: tabListWidth, height: tabListHeight } = getCssDimensions(tabsListElement);
      const tabRect = activeTab.getBoundingClientRect();
      const tabsListRect = tabsListElement.getBoundingClientRect();
      const scaleX = tabListWidth > 0 ? tabsListRect.width / tabListWidth : 1;
      const scaleY = tabListHeight > 0 ? tabsListRect.height / tabListHeight : 1;
      const hasNonZeroScale = scaleX > Number.EPSILON && scaleY > Number.EPSILON;

      // Layout offsets are immune to transforms, but lose sub-pixel precision.
      const layoutOffset = getLayoutOffset(activeTab, tabsListElement);
      left = layoutOffset.left;
      top = layoutOffset.top;

      if (hasNonZeroScale) {
        const rectLeft =
          (tabRect.left - tabsListRect.left) / scaleX +
          tabsListElement.scrollLeft -
          tabsListElement.clientLeft;
        const rectTop =
          (tabRect.top - tabsListRect.top) / scaleY +
          tabsListElement.scrollTop -
          tabsListElement.clientTop;

        // The rect-based offset is sub-pixel-precise but is derived from projected viewport
        // geometry: a rotation, skew, flip, perspective, or 3D transform on the tab or any
        // ancestor warps it beyond what the scale division can undo. When it agrees with the
        // layout offset (up to layout rounding), no distortion is in effect and the more
        // precise value is safe to use.
        //
        // The active tab's own translation moves the rect but not the layout offset, so
        // strip it from the comparison. This lets the indicator follow tab-local animations
        // (e.g. `transform: translateX(12px)` on the selected tab) — the indicator is a
        // sibling of the tab and does not inherit its transform.
        const tabTranslation = getActiveTabTranslation(activeTab);
        if (
          Math.abs(rectLeft - tabTranslation.x - left) <= MAX_LAYOUT_ROUNDING_ERROR &&
          Math.abs(rectTop - tabTranslation.y - top) <= MAX_LAYOUT_ROUNDING_ERROR
        ) {
          left = rectLeft;
          top = rectTop;
        }
      }

      width = computedWidth;
      height = computedHeight;
      right = tabsListElement.scrollWidth - left - width;
      bottom = tabsListElement.scrollHeight - top - height;
    }
  }

  const activeTabPosition = isTabSelected ? { left, right, top, bottom } : null;

  const activeTabSize = isTabSelected ? { width, height } : null;

  const style: React.CSSProperties | undefined = isTabSelected
    ? ({
        '--active-tab-left': `${left}px`,
        '--active-tab-right': `${right}px`,
        '--active-tab-top': `${top}px`,
        '--active-tab-bottom': `${bottom}px`,
        '--active-tab-width': `${width}px`,
        '--active-tab-height': `${height}px`,
      } as React.CSSProperties)
    : undefined;

  const displayIndicator = isTabSelected && width > 0 && height > 0;

  const state: TabsIndicatorState = {
    orientation,
    activeTabPosition,
    activeTabSize,
    tabActivationDirection,
  };

  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        role: 'presentation',
        style,
        hidden: !displayIndicator, // do not display the indicator before the layout is settled
      },
      elementProps,
      {
        suppressHydrationWarning: true,
      },
    ],
    stateAttributesMapping,
  });

  if (value == null) {
    return null;
  }

  return (
    <React.Fragment>
      {element}
      {renderBeforeHydration && <PrehydrationScript script={prehydrationScript} />}
    </React.Fragment>
  );
});

export interface TabsIndicatorState extends TabsRootState {
  /**
   * The active tab position.
   */
  activeTabPosition: TabsTab.Position | null;
  /**
   * The active tab size.
   */
  activeTabSize: TabsTab.Size | null;
  /**
   * The component orientation.
   */
  orientation: TabsRoot.Orientation;
}

export interface TabsIndicatorProps extends BaseUIComponentProps<'span', TabsIndicatorState> {
  /**
   * Whether to render itself before React hydrates.
   * This minimizes the time that the indicator isn't visible after server-side rendering.
   * @default false
   */
  renderBeforeHydration?: boolean | undefined;
}

export namespace TabsIndicator {
  export type State = TabsIndicatorState;
  export type Props = TabsIndicatorProps;
}

function getLayoutOffset(element: HTMLElement, ancestor: HTMLElement) {
  const elementOffset = getCumulativeOffset(element);
  const ancestorOffset = getCumulativeOffset(ancestor);

  return {
    left: elementOffset.left - ancestorOffset.left - ancestor.clientLeft,
    top: elementOffset.top - ancestorOffset.top - ancestor.clientTop,
  };
}

function getCumulativeOffset(element: HTMLElement) {
  let left = 0;
  let top = 0;
  let currentElement: HTMLElement | null = element;

  while (currentElement != null) {
    left += currentElement.offsetLeft;
    top += currentElement.offsetTop;

    const offsetParent = currentElement.offsetParent as HTMLElement | null;
    if (offsetParent != null) {
      left += offsetParent.clientLeft;
      top += offsetParent.clientTop;
    }

    currentElement = offsetParent;
  }

  return { left, top };
}

// Returns the active tab's own 2D translation, in CSS pixels, as the sum of the
// `translate` longhand and the translation component of the `transform` property.
function getActiveTabTranslation(element: HTMLElement) {
  const { x, y } = getElementTransform(element);
  let translateX = x;
  let translateY = y;

  // The `translate` longhand is a separate property and is not reflected in the
  // computed `transform` matrix that `getElementTransform` reads. `getComputedStyle`
  // resolves absolute and font-relative lengths to pixels but keeps percentages, which
  // resolve against the tab's border box.
  const { translate } = ownerWindow(element).getComputedStyle(element);
  if (translate && translate !== 'none') {
    const parts = translate.split(' ');
    translateX += resolveTranslateLength(parts[0], element.offsetWidth);
    translateY += resolveTranslateLength(parts[1], element.offsetHeight);
  }

  return { x: translateX, y: translateY };
}

// Resolves a single `translate` longhand component to pixels. Percentages resolve against
// the given border-box size; anything that isn't a plain number or percentage (e.g.
// `calc(...)`) is treated as no translation, so the indicator falls back to the tab's
// layout slot rather than guessing.
function resolveTranslateLength(value: string | undefined, referenceSize: number): number {
  if (!value) {
    return 0;
  }
  const numeric = parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return value.endsWith('%') ? (numeric / 100) * referenceSize : numeric;
}
