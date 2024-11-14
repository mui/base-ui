'use client';
import * as React from 'react';
import { ActiveTabPosition, useTabIndicator } from './useTabIndicator';
import { script as prehydrationScript } from './prehydrationScript.min';
import type { TabsDirection, TabsOrientation, TabsRoot } from '../Root/TabsRoot';
import { useTabsRootContext } from '../Root/TabsRootContext';
import { tabsStyleHookMapping } from '../Root/styleHooks';
import { useTabsListContext } from '../TabsList/TabsListContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useOnMount } from '../../utils/useOnMount';
import type { BaseUIComponentProps } from '../../utils/types';

const noop = () => null;

/**
 *
 * Demos:
 *
 * - [Tabs](https://base-ui.com/components/react-tabs/)
 *
 * API:
 *
 * - [TabIndicator API](https://base-ui.com/components/react-tabs/#api-reference-TabIndicator)
 */
const TabIndicator = React.forwardRef<HTMLSpanElement, TabIndicator.Props>(
  function TabIndicator(props, forwardedRef) {
    const { className, render, renderBeforeHydration = false, ...other } = props;

    const { orientation, direction, value, tabActivationDirection } = useTabsRootContext();
    const { tabsListRef, getTabElement } = useTabsListContext();

    const [instanceId] = React.useState(() => Math.random().toString(36).slice(2));
    const [isMounted, setIsMounted] = React.useState(false);
    const { value: activeTabValue } = useTabsRootContext();

    useOnMount(() => setIsMounted(true));

    const { getRootProps, activeTabPosition: selectedTabPosition } = useTabIndicator({
      getTabElement,
      tabsListRef,
      value,
    });

    const ownerState: TabIndicator.OwnerState = React.useMemo(
      () => ({
        direction,
        orientation,
        selectedTabPosition,
        tabActivationDirection,
      }),
      [direction, orientation, selectedTabPosition, tabActivationDirection],
    );

    const { renderElement } = useComponentRenderer({
      propGetter: getRootProps,
      render: render ?? 'span',
      className,
      ownerState,
      extraProps: {
        ...other,
        'data-instance-id': !(isMounted && renderBeforeHydration) ? instanceId : undefined,
        suppressHydrationWarning: true,
      },
      customStyleHookMapping: {
        ...tabsStyleHookMapping,
        selectedTabPosition: noop,
      },
      ref: forwardedRef,
    });

    if (activeTabValue == null) {
      return null;
    }

    return (
      <React.Fragment>
        {renderElement()}
        {!isMounted && renderBeforeHydration && (
          <script
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: prehydrationScript }}
            suppressHydrationWarning
          />
        )}
      </React.Fragment>
    );
  },
);

export { TabIndicator };

namespace TabIndicator {
  export interface OwnerState extends TabsRoot.OwnerState {
    selectedTabPosition: ActiveTabPosition | null;
    orientation: TabsOrientation;
    direction: TabsDirection;
  }

  export interface Props extends BaseUIComponentProps<'span', TabIndicator.OwnerState> {
    /**
     * If `true`, the indicator will include code to render itself before React hydrates.
     * This will minimize the time the indicator is not visible after the SSR-generated content is downloaded.
     *
     * @default false
     */
    renderBeforeHydration?: boolean;
  }
}
