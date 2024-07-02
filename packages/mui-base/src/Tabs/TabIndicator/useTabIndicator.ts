'use client';
import * as React from 'react';
import { UseTabIndicatorParameters, UseTabIndicatorReturnValue } from './TabIndicator.types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForcedRerendering } from '../../utils/useForcedRerendering';

function round(value: number) {
  return Math.round(value * 100) * 0.01;
}

/**
 *
 * Demos:
 *
 * - [Tabs](https://mui.com/base-ui/react-tabs/#hooks)
 *
 * API:
 *
 * - [useTabIndicator API](https://mui.com/base-ui/react-tabs/hooks-api/#use-tab-indicator)
 */
export function useTabIndicator(parameters: UseTabIndicatorParameters): UseTabIndicatorReturnValue {
  const { tabsListRef, getTabElement, selectedValue } = parameters;

  const rerender = useForcedRerendering();
  React.useEffect(() => {
    if (
      selectedValue != null &&
      tabsListRef.current != null &&
      typeof ResizeObserver !== 'undefined'
    ) {
      const resizeObserver = new ResizeObserver(() => {
        rerender();
      });

      resizeObserver.observe(tabsListRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }

    return undefined;
  }, [selectedValue, tabsListRef, rerender]);

  let left = 0;
  let right = 0;
  let top = 0;
  let bottom = 0;
  let width = 0;
  let height = 0;

  let isTabSelected = false;

  if (selectedValue != null && tabsListRef.current != null) {
    const selectedTabElement = getTabElement(selectedValue);
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
      '--active-tab-left': `${left}px`,
      '--active-tab-right': `${right}px`,
      '--active-tab-top': `${top}px`,
      '--active-tab-bottom': `${bottom}px`,
      '--active-tab-width': `${width}px`,
      '--active-tab-height': `${height}px`,
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
