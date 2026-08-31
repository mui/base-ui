'use client';
import * as React from 'react';
import { getParentNode, isHTMLElement, isLastTraversableNode } from '@floating-ui/utils/dom';
import { useForcedRerendering } from '@base-ui/utils/useForcedRerendering';
import { ownerWindow } from '@base-ui/utils/owner';
import { script as prehydrationScript } from '#prehydration/tabs/indicator';
import { PrehydrationScript } from '../../internals/PrehydrationScript';
import { useRenderElement } from '../../internals/useRenderElement';
import { getCssDimensions } from '../../utils/getCssDimensions';
import type { BaseUIComponentProps } from '../../internals/types';
import type { TabsRoot, TabsRootState } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import { tabsStateAttributesMapping } from '../root/stateAttributesMapping';
import { useTabsListContext } from '../list/TabsListContext';
import type { TabsTab } from '../tab/TabsTab';
import * as TabsIndicatorCssVars from './TabsIndicatorCssVars';

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

      // Layout offsets are immune to transforms, but lose sub-pixel precision.
      const layoutOffset = getLayoutOffset(activeTab, tabsListElement);
      left = layoutOffset.left;
      top = layoutOffset.top;

      const rectLeft =
        (tabRect.left - tabsListRect.left) / scaleX +
        tabsListElement.scrollLeft -
        tabsListElement.clientLeft;
      const rectTop =
        (tabRect.top - tabsListRect.top) / scaleY +
        tabsListElement.scrollTop -
        tabsListElement.clientTop;

      // Matching offsets need no ancestor style reads. Otherwise keep the precise rect when
      // only translations or shared positive scales are involved; layout offsets handle distortion.
      if (
        (Math.abs(rectLeft - left) <= MAX_LAYOUT_ROUNDING_ERROR &&
          Math.abs(rectTop - top) <= MAX_LAYOUT_ROUNDING_ERROR) ||
        (Number.isFinite(rectLeft) &&
          Number.isFinite(rectTop) &&
          !hasDistortingTransform(activeTab, tabsListElement))
      ) {
        left = rectLeft;
        top = rectTop;
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
        [TabsIndicatorCssVars.activeTabLeft]: `${left}px`,
        [TabsIndicatorCssVars.activeTabRight]: `${right}px`,
        [TabsIndicatorCssVars.activeTabTop]: `${top}px`,
        [TabsIndicatorCssVars.activeTabBottom]: `${bottom}px`,
        [TabsIndicatorCssVars.activeTabWidth]: `${width}px`,
        [TabsIndicatorCssVars.activeTabHeight]: `${height}px`,
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

  let left = elementOffset.left - ancestorOffset.left - ancestor.clientLeft;
  let top = elementOffset.top - ancestorOffset.top - ancestor.clientTop;

  // `offsetLeft`/`offsetTop` describe layout, and scrolling doesn't change layout: a scroll
  // container between the tab and the list moves the tab on screen while its layout slot stays
  // put. Subtract that scroll from the layout fallback. The list's own scroll is deliberately
  // excluded: the indicator sits inside it and scrolls along with the tab.
  //
  // `getParentNode` crosses shadow boundaries (and slots), so a tab inside a shadow root still
  // reaches the scroll containers between it and the list.
  let node: Node | null = getParentNode(element);
  while (isHTMLElement(node) && node !== ancestor && !isLastTraversableNode(node)) {
    left -= node.scrollLeft;
    top -= node.scrollTop;
    node = getParentNode(node);
  }

  return { left, top };
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

function hasDistortingTransform(element: HTMLElement, list: HTMLElement) {
  let node: Node = element;
  let allowScale = false;
  while (isHTMLElement(node)) {
    // The rect calculation accounts for scale shared with the list, but not tab-local scale.
    allowScale ||= node === list;
    const scaleIsShared = allowScale;
    const win = ownerWindow(node);
    const css = win.getComputedStyle(node);
    if (css.transform && css.transform !== 'none') {
      if (!win.DOMMatrixReadOnly) {
        return true;
      }
      const matrix = new win.DOMMatrixReadOnly(css.transform);
      if (
        matrix.a <= 0 ||
        matrix.d <= 0 ||
        (!allowScale && (matrix.a !== 1 || matrix.d !== 1)) ||
        // In the 4×4 matrix, ignore the diagonal scale and final translation column.
        matrix.toFloat64Array().some((value, i) => i < 12 && i % 5 !== 0 && value !== 0)
      ) {
        return true;
      }
    }
    if (
      parseFloat(css.rotate?.split(' ').pop() || '') % 360 ||
      (css.scale &&
        css.scale !== 'none' &&
        css.scale
          .split(' ')
          .some((value) => Number(value) <= 0 || (!scaleIsShared && Number(value) !== 1))) ||
      (css.perspective && css.perspective !== 'none')
    ) {
      return true;
    }
    if (isLastTraversableNode(node)) {
      break;
    }
    node = getParentNode(node);
  }
  return false;
}
