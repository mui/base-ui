'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useOnMount } from '../../utils/useOnMount';
import type { BaseUIComponentProps } from '../../utils/types';
import type { TabsOrientation, TabsRoot } from '../root/TabsRoot';
import { useTabsRootContext } from '../root/TabsRootContext';
import { tabsStyleHookMapping } from '../root/styleHooks';
import { useTabsListContext } from '../list/TabsListContext';
import { ActiveTabPosition, useTabsIndicator } from './useTabsIndicator';
import { script as prehydrationScript } from './prehydrationScript.min';

const noop = () => null;

/**
 */
const TabsIndicator = React.forwardRef<HTMLSpanElement, TabsIndicator.Props>(
  function TabIndicator(props, forwardedRef) {
    const { className, render, renderBeforeHydration = false, ...other } = props;

    const { getTabElementBySelectedValue, orientation, tabActivationDirection, value } =
      useTabsRootContext();

    const { tabsListRef } = useTabsListContext();

    const [instanceId] = React.useState(() => Math.random().toString(36).slice(2));
    const [isMounted, setIsMounted] = React.useState(false);
    const { value: activeTabValue } = useTabsRootContext();

    useOnMount(() => setIsMounted(true));

    const { getRootProps, activeTabPosition: selectedTabPosition } = useTabsIndicator({
      getTabElementBySelectedValue,
      tabsListRef,
      value,
    });

    const state: TabsIndicator.State = React.useMemo(
      () => ({
        orientation,
        selectedTabPosition,
        tabActivationDirection,
      }),
      [orientation, selectedTabPosition, tabActivationDirection],
    );

    const { renderElement } = useComponentRenderer({
      propGetter: getRootProps,
      render: render ?? 'span',
      className,
      state,
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

namespace TabsIndicator {
  export interface State extends TabsRoot.State {
    selectedTabPosition: ActiveTabPosition | null;
    orientation: TabsOrientation;
  }

  export interface Props extends BaseUIComponentProps<'span', TabsIndicator.State> {
    /**
     * If `true`, the indicator will include code to render itself before React hydrates.
     * This will minimize the time the indicator is not visible after the SSR-generated content is downloaded.
     *
     * @default false
     */
    renderBeforeHydration?: boolean;
  }
}

export { TabsIndicator };

TabsIndicator.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * If `true`, the indicator will include code to render itself before React hydrates.
   * This will minimize the time the indicator is not visible after the SSR-generated content is downloaded.
   *
   * @default false
   */
  renderBeforeHydration: PropTypes.bool,
} as any;
