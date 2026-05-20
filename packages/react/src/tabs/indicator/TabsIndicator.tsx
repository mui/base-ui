'use client';
import * as React from 'react';
import { useForcedRerendering } from '@base-ui/utils/useForcedRerendering';
import { ownerDocument } from '@base-ui/utils/owner';
import { useRenderElement } from '../../internals/useRenderElement';
import { getCssDimensions } from '../../utils/getCssDimensions';
import { useIsHydrating } from '../../utils/useIsHydrating';
import type { BaseUIComponentProps } from '../../internals/types';
import type { TabsRoot, TabsRootState } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import { tabsStateAttributesMapping } from '../root/stateAttributesMapping';
import { useTabsListContext } from '../list/TabsListContext';
import type { TabsTab } from '../tab/TabsTab';
import { script as prehydrationScript } from './prehydrationScript.min';
import { TabsIndicatorCssVars } from './TabsIndicatorCssVars';
import { useCSPContext } from '../../internals/csp-context/CSPContext';

const stateAttributesMapping = {
  ...tabsStateAttributesMapping,
  activeTabPosition: () => null,
  activeTabSize: () => null,
};

type ElementOffset = [left: number, top: number];

function getElementOffset(element: HTMLElement) {
  let offsetParent: Element | null = element.offsetParent;

  if (!offsetParent) {
    return null;
  }

  const HTMLElementCtor = ownerDocument(element).defaultView?.HTMLElement;

  if (HTMLElementCtor == null) {
    return null;
  }

  let left = element.offsetLeft;
  let top = element.offsetTop;

  while (offsetParent) {
    if (!(offsetParent instanceof HTMLElementCtor)) {
      return null;
    }

    left += offsetParent.offsetLeft + offsetParent.clientLeft;
    top += offsetParent.offsetTop + offsetParent.clientTop;
    offsetParent = offsetParent.offsetParent;
  }

  return [left, top] satisfies ElementOffset;
}

function getIndicatorOffset(element: HTMLElement, ancestor: HTMLElement): ElementOffset {
  // Measure both the visual rectangle and the layout offset chain. DOMRects keep
  // fractional offsets, it's not suitable for transformed geometry, as 3D transforms
  // can skew their projected coordinates.
  const elementOffset = getElementOffset(element);
  const ancestorOffset = getElementOffset(ancestor);
  const { width: ancestorWidth, height: ancestorHeight } = getCssDimensions(ancestor);
  const elementRect = element.getBoundingClientRect();
  const ancestorRect = ancestor.getBoundingClientRect();
  const scaleX = ancestorWidth > 0 ? ancestorRect.width / ancestorWidth : 1;
  const scaleY = ancestorHeight > 0 ? ancestorRect.height / ancestorHeight : 1;

  // Convert the visual rect delta back into the tab list's content box. This
  // preserves sub-pixel positioning and handles normal 2D scale transforms.
  const rectOffset = (
    scaleX > Number.EPSILON && scaleY > Number.EPSILON
      ? [
          (elementRect.left - ancestorRect.left) / scaleX +
            ancestor.scrollLeft -
            ancestor.clientLeft,
          (elementRect.top - ancestorRect.top) / scaleY + ancestor.scrollTop - ancestor.clientTop,
        ]
      : [element.offsetLeft, element.offsetTop]
  ) satisfies ElementOffset;

  if (!elementOffset || !ancestorOffset) {
    return rectOffset;
  }

  // The offset chain is layout-based, so it remains stable when 3D transforms
  // distort getBoundingClientRect().
  const layoutOffset = [
    elementOffset[0] - ancestorOffset[0] - ancestor.clientLeft,
    elementOffset[1] - ancestorOffset[1] - ancestor.clientTop,
  ] satisfies ElementOffset;

  // Prefer the fractional rect result when it matches layout within rounding
  // noise. A larger mismatch means projection skew, so fall back to layout.
  return Math.abs(rectOffset[0] - layoutOffset[0]) <= 1 &&
    Math.abs(rectOffset[1] - layoutOffset[1]) <= 1
    ? rectOffset
    : layoutOffset;
}

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

  const { nonce } = useCSPContext();

  const { getTabElementBySelectedValue, orientation, tabActivationDirection, value } =
    useTabsRootContext();

  const { tabsListElement, registerIndicatorUpdateListener } = useTabsListContext();

  const isHydrating = useIsHydrating();

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
    isTabSelected = true;

    if (activeTab != null) {
      const { width: computedWidth, height: computedHeight } = getCssDimensions(activeTab);

      [left, top] = getIndicatorOffset(activeTab, tabsListElement);
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
      {isHydrating && renderBeforeHydration && (
        <script
          nonce={nonce}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: prehydrationScript }}
          suppressHydrationWarning
        />
      )}
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
