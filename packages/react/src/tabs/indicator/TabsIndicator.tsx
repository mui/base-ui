'use client';
import * as React from 'react';
import { useForcedRerendering } from '@base-ui-components/utils/useForcedRerendering';
import { useOnMount } from '@base-ui-components/utils/useOnMount';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { useDirection } from '../../direction-provider/DirectionContext';
import type { TabsRoot } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import { tabsStateAttributesMapping } from '../root/stateAttributesMapping';
import { useTabsListContext } from '../list/TabsListContext';
import type { TabsTab } from '../tab/TabsTab';
import { script as prehydrationScript } from './prehydrationScript.min';
import { TabsIndicatorCssVars } from './TabsIndicatorCssVars';

const stateAttributesMapping = {
  ...tabsStateAttributesMapping,
  activeTabPosition: () => null,
  activeTabSize: () => null,
};

/**
 * A visual indicator that can be styled to match the position of the currently active tab.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
export const TabsIndicator = React.forwardRef(function TabIndicator(
  componentProps: TabsIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, renderBeforeHydration = false, ...elementProps } = componentProps;

  const { getTabElementBySelectedValue, orientation, tabActivationDirection, value } =
    useTabsRootContext();

  const { tabsListElement } = useTabsListContext();

  const [isMounted, setIsMounted] = React.useState(false);
  const { value: activeTabValue } = useTabsRootContext();

  const direction = useDirection();

  useOnMount(() => setIsMounted(true));

  const rerender = useForcedRerendering();

  React.useEffect(() => {
    if (value != null && tabsListElement != null && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(rerender);

      resizeObserver.observe(tabsListElement);

      return () => {
        resizeObserver.disconnect();
      };
    }

    return undefined;
  }, [value, tabsListElement, rerender]);

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
      const tabsListRect = tabsListElement.getBoundingClientRect();
      const {
        left: tabLeft,
        top: tabTop,
        width: computedWidth,
        height: computedHeight,
      } = activeTab.getBoundingClientRect();

      left = tabLeft - tabsListRect.left + tabsListElement.scrollLeft - tabsListElement.clientLeft;
      top = tabTop - tabsListRect.top + tabsListElement.scrollTop - tabsListElement.clientTop;
      width = computedWidth;
      height = computedHeight;

      right =
        direction === 'ltr'
          ? tabsListElement.scrollWidth - left - width - tabsListElement.clientLeft
          : left - tabsListElement.clientLeft;
      bottom = tabsListElement.scrollHeight - top - height - tabsListElement.clientTop;
    }
  }

  const activeTabPosition = React.useMemo(
    () =>
      isTabSelected
        ? {
            left,
            right,
            top,
            bottom,
          }
        : null,
    [left, right, top, bottom, isTabSelected],
  );

  const activeTabSize = React.useMemo(
    () =>
      isTabSelected
        ? {
            width,
            height,
          }
        : null,
    [width, height, isTabSelected],
  );

  const style = React.useMemo(() => {
    if (!isTabSelected) {
      return undefined;
    }

    return {
      [TabsIndicatorCssVars.activeTabLeft]: `${left}px`,
      [TabsIndicatorCssVars.activeTabRight]: `${right}px`,
      [TabsIndicatorCssVars.activeTabTop]: `${top}px`,
      [TabsIndicatorCssVars.activeTabBottom]: `${bottom}px`,
      [TabsIndicatorCssVars.activeTabWidth]: `${width}px`,
      [TabsIndicatorCssVars.activeTabHeight]: `${height}px`,
    } as React.CSSProperties;
  }, [left, right, top, bottom, width, height, isTabSelected]);

  const displayIndicator = isTabSelected && width > 0 && height > 0;

  const state: TabsIndicator.State = React.useMemo(
    () => ({
      orientation,
      activeTabPosition,
      activeTabSize,
      tabActivationDirection,
    }),
    [orientation, activeTabPosition, activeTabSize, tabActivationDirection],
  );

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

  if (activeTabValue == null) {
    return null;
  }

  return (
    <React.Fragment>
      {element}
      {!isMounted && renderBeforeHydration && (
        <script
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: prehydrationScript }}
          suppressHydrationWarning
        />
      )}
    </React.Fragment>
  );
});

export interface TabsIndicatorState extends TabsRoot.State {
  activeTabPosition: TabsTab.Position | null;
  activeTabSize: TabsTab.Size | null;
  orientation: TabsRoot.Orientation;
}

export interface TabsIndicatorProps extends BaseUIComponentProps<'span', TabsIndicator.State> {
  /**
   * Whether to render itself before React hydrates.
   * This minimizes the time that the indicator isn’t visible after server-side rendering.
   * @default false
   */
  renderBeforeHydration?: boolean;
}

export namespace TabsIndicator {
  export type State = TabsIndicatorState;
  export type Props = TabsIndicatorProps;
}
