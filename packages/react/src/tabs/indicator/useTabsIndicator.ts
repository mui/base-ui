'use client';
import * as React from 'react';
import type { TabsListContext } from '../tabs-list/TabsListContext';
import type { TabsRootContext } from '../root/TabsRootContext';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';
import { useForcedRerendering } from '../../utils/useForcedRerendering';
import { TabsIndicatorCssVars } from './TabsIndicatorCssVars';

function round(value: number) {
  return Math.round(value * 100) * 0.01;
}

export function useTabsIndicator(
  parameters: useTabsIndicator.Parameters,
): useTabsIndicator.ReturnValue {
  const { value, tabsListRef, getTabElementBySelectedValue } = parameters;

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

      const {
        left: listLeft,
        right: listRight,
        top: listTop,
        bottom: listBottom,
      } = tabsListRef.current.getBoundingClientRect();

      left = round(tabLeft - listLeft);
      right = round(listRight - tabRight);
      top = round(tabTop - listTop);
      bottom = round(listBottom - tabBottom);
      width = round(tabRight - tabLeft);
      height = round(tabBottom - tabTop);
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

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'span'>(externalProps, {
        role: 'presentation',
        style,
      });
    },
    [style],
  );

  return {
    getRootProps,
    activeTabPosition,
  };
}

export interface ActiveTabPosition {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export namespace useTabsIndicator {
  export interface Parameters
    extends Pick<TabsRootContext, 'getTabElementBySelectedValue' | 'value'>,
      Pick<TabsListContext, 'tabsListRef'> {}

  export interface ReturnValue {
    /**
     * Resolver for the TabIndicator component's props.
     * @param externalProps additional props for Tabs.TabIndicator
     * @returns props that should be spread on Tabs.TabIndicator
     */
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    activeTabPosition: ActiveTabPosition | null;
  }
}
