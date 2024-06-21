'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTabIndicator } from './useTabIndicator';
import { TabIndicatorOwnerState, TabIndicatorProps } from './TabIndicator.types';
import { script as prehydrationScript } from './prehydrationScript.min';
import { useTabsContext } from '../Root/TabsContext';
import { tabsStyleHookMapping } from '../Root/styleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useTabsListContext } from '../TabsList/TabsListContext';

const noop = () => null;

const TabIndicator = React.forwardRef<HTMLSpanElement, TabIndicatorProps>(
  function TabIndicator(props, forwardedRef) {
    const { className, render, renderBeforeHydration = false, ...other } = props;

    const [instanceId] = React.useState(() => Math.random().toString(36).slice(2));
    const [isMounted, setIsMounted] = React.useState(false);
    const {
      orientation,
      direction,
      value: activeTabValue,
      tabActivationDirection,
    } = useTabsContext();

    const {
      getTabElement,
      state: { tabsListRef },
    } = useTabsListContext();

    React.useEffect(() => {
      setIsMounted(true);
    }, []);

    const { getRootProps, activeTabPosition: selectedTabPosition } = useTabIndicator({
      tabsListRef,
      getTabElement,
      selectedValue: activeTabValue,
    });

    const ownerState: TabIndicatorOwnerState = {
      selectedTabPosition,
      orientation,
      direction,
      tabActivationDirection,
    };

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

TabIndicator.propTypes /* remove-proptypes */ = {
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

export { TabIndicator };
