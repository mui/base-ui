'use client';
import * as React from 'react';
import { generateId } from '../../utils/generateId';
import { useForcedRerendering } from '../../utils/useForcedRerendering';
import { useRenderElement } from '../../utils/useRenderElement';
import { useOnMount } from '../../utils/useOnMount';
import type { BaseUIComponentProps } from '../../utils/types';
import type { TabsRoot } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import { tabsStyleHookMapping } from '../root/styleHooks';
import { useTabsListContext } from '../list/TabsListContext';
import type { TabsTab } from '../tab/TabsTab';
import { script as prehydrationScript } from './prehydrationScript.min';
import { TabsIndicatorCssVars } from './TabsIndicatorCssVars';

const customStyleHookMapping = {
  ...tabsStyleHookMapping,
  selectedTabPosition: () => null,
  selectedTabSize: () => null,
};

function round(value: number) {
  return Math.round(value * 100) * 0.01;
}

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

  const { tabsListRef } = useTabsListContext();

  const [instanceId] = React.useState(() => generateId('tab'));
  const [isMounted, setIsMounted] = React.useState(false);
  const { value: activeTabValue } = useTabsRootContext();

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
    const selectedTabElement = getTabElementBySelectedValue(value);
    isTabSelected = true;

    if (selectedTabElement != null) {
      const {
        left: tabLeft,
        right: tabRight,
        bottom: tabBottom,
        top: tabTop,
      } = selectedTabElement.getBoundingClientRect();

      const { right: listRight, bottom: listBottom } = tabsListRef.current.getBoundingClientRect();

      left = selectedTabElement.offsetLeft - tabsListRef.current.clientLeft;
      right = round(listRight - tabRight);
      top = selectedTabElement.offsetTop - tabsListRef.current.clientTop;
      bottom = round(listBottom - tabBottom);
      width = round(tabRight - tabLeft);
      height = round(tabBottom - tabTop);
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
    customStyleHookMapping,
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

export namespace TabsIndicator {
  export interface State extends TabsRoot.State {
    selectedTabPosition: TabsTab.Position | null;
    selectedTabSize: TabsTab.Size | null;
    orientation: TabsRoot.Orientation;
  }

  export interface Props extends BaseUIComponentProps<'span', State> {
    /**
     * Whether to render itself before React hydrates.
     * This minimizes the time that the indicator isn’t visible after server-side rendering.
     * @default false
     */
    renderBeforeHydration?: boolean;
  }
}
