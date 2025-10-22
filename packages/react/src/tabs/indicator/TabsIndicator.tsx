'use client';
import * as React from 'react';
import { generateId } from '@base-ui-components/utils/generateId';
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
  selectedTabPosition: () => null,
  selectedTabSize: () => null,
};

/**
 * A visual indicator that can be styled to match the position of the currently selected tab.
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

  const { tabsListRef } = useTabsListContext();

  const [instanceId] = React.useState(() => generateId('tab'));
  const [isMounted, setIsMounted] = React.useState(false);
  const { value: selectedTabValue } = useTabsRootContext();

  const direction = useDirection();

  useOnMount(() => setIsMounted(true));

  const rerender = useForcedRerendering();

  React.useEffect(() => {
    if (value != null && tabsListRef.current != null && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        rerender();
      });

      resizeObserver.observe(tabsListRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }

    return undefined;
  }, [value, tabsListRef, rerender]);

  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  let width = 0;
  let height = 0;

  let isTabSelected = false;

  if (value != null && tabsListRef.current != null) {
    const selectedTab = getTabElementBySelectedValue(value);
    const tabsList = tabsListRef.current;
    isTabSelected = true;

    if (selectedTab != null) {
      // Use offset-based positioning, but determine size using sub-pixel
      // precision and floor it to avoid potential overflow.
      // See https://github.com/mui/base-ui/issues/2235.
      left = selectedTab.offsetLeft - tabsList.clientLeft;
      top = selectedTab.offsetTop - tabsList.clientTop;

      const { width: rectWidth, height: rectHeight } = selectedTab.getBoundingClientRect();
      width = Math.floor(rectWidth);
      height = Math.floor(rectHeight);

      right =
        direction === 'ltr'
          ? tabsList.scrollWidth - selectedTab.offsetLeft - width - tabsList.clientLeft
          : selectedTab.offsetLeft - tabsList.clientLeft;
      bottom = tabsList.scrollHeight - selectedTab.offsetTop - height - tabsList.clientTop;
    }
  }

  const selectedTabPosition = React.useMemo(
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

  const selectedTabSize = React.useMemo(
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
      [TabsIndicatorCssVars.selectedTabLeft]: `${left}px`,
      [TabsIndicatorCssVars.selectedTabRight]: `${right}px`,
      [TabsIndicatorCssVars.selectedTabTop]: `${top}px`,
      [TabsIndicatorCssVars.selectedTabBottom]: `${bottom}px`,
      [TabsIndicatorCssVars.selectedTabWidth]: `${width}px`,
      [TabsIndicatorCssVars.selectedTabHeight]: `${height}px`,
    } as React.CSSProperties;
  }, [left, right, top, bottom, width, height, isTabSelected]);

  const displayIndicator = isTabSelected && width > 0 && height > 0;

  const state: TabsIndicator.State = React.useMemo(
    () => ({
      orientation,
      selectedTabPosition,
      selectedTabSize,
      tabActivationDirection,
    }),
    [orientation, selectedTabPosition, selectedTabSize, tabActivationDirection],
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
        ['data-instance-id' as string]: !(isMounted && renderBeforeHydration)
          ? instanceId
          : undefined,
        suppressHydrationWarning: true,
      },
    ],
    stateAttributesMapping,
  });

  if (selectedTabValue == null) {
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
  selectedTabPosition: TabsTab.Position | null;
  selectedTabSize: TabsTab.Size | null;
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
