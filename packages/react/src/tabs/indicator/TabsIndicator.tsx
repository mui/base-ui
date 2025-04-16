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
import { ActiveTabPosition, ActiveTabSize, useTabsIndicator } from './useTabsIndicator';
import { script as prehydrationScript } from './prehydrationScript.min';
import { generateId } from '../../utils/generateId';

const noop = () => null;

/**
 * A visual indicator that can be styled to match the position of the currently active tab.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tabs](https://base-ui.com/react/components/tabs)
 */
const TabsIndicator = React.forwardRef<HTMLSpanElement, TabsIndicator.Props>(
  function TabIndicator(props, forwardedRef) {
    const { className, render, renderBeforeHydration = false, ...other } = props;

    const { getTabElementBySelectedValue, orientation, tabActivationDirection, value } =
      useTabsRootContext();

    const { tabsListRef } = useTabsListContext();

    const [instanceId] = React.useState(() => generateId('tab'));
    const [isMounted, setIsMounted] = React.useState(false);
    const { value: activeTabValue } = useTabsRootContext();

    useOnMount(() => setIsMounted(true));

    const {
      getRootProps,
      activeTabPosition: selectedTabPosition,
      activeTabSize: selectedTabSize,
    } = useTabsIndicator({
      getTabElementBySelectedValue,
      tabsListRef,
      value,
    });

    const state: TabsIndicator.State = React.useMemo(
      () => ({
        orientation,
        selectedTabPosition,
        selectedTabSize,
        tabActivationDirection,
      }),
      [orientation, selectedTabPosition, selectedTabSize, tabActivationDirection],
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
        selectedTabSize: noop,
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
    selectedTabSize: ActiveTabSize | null;
    orientation: TabsOrientation;
  }

  export interface Props extends BaseUIComponentProps<'span', TabsIndicator.State> {
    /**
     * Whether to render itself before React hydrates.
     * This minimizes the time that the indicator isn’t visible after server-side rendering.
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Whether to render itself before React hydrates.
   * This minimizes the time that the indicator isn’t visible after server-side rendering.
   * @default false
   */
  renderBeforeHydration: PropTypes.bool,
} as any;
