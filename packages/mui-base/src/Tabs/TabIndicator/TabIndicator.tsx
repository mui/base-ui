'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { ActiveTabPosition, useTabIndicator } from './useTabIndicator';
import { script as prehydrationScript } from './prehydrationScript.min';
import type { TabsDirection, TabsOrientation, TabsRoot } from '../Root/TabsRoot';
import { useTabsRootContext } from '../Root/TabsRootContext';
import { tabsStyleHookMapping } from '../Root/styleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';

const noop = () => null;

/**
 *
 * Demos:
 *
 * - [Tabs](https://base-ui.netlify.app/components/react-tabs/)
 *
 * API:
 *
 * - [TabIndicator API](https://base-ui.netlify.app/components/react-tabs/#api-reference-TabIndicator)
 */
const TabIndicator = React.forwardRef<HTMLSpanElement, TabIndicator.Props>(
  function TabIndicator(props, forwardedRef) {
    const { className, render, renderBeforeHydration = false, ...other } = props;

    const [instanceId] = React.useState(() => Math.random().toString(36).slice(2));
    const [isMounted, setIsMounted] = React.useState(false);
    const { value: activeTabValue } = useTabsRootContext();

    React.useEffect(() => {
      setIsMounted(true);
    }, []);

    const {
      direction,
      getRootProps,
      orientation,
      activeTabPosition: selectedTabPosition,
      tabActivationDirection,
    } = useTabIndicator();

    const ownerState: TabIndicator.OwnerState = {
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

namespace TabIndicator {
  export interface OwnerState extends TabsRoot.OwnerState {
    selectedTabPosition: ActiveTabPosition | null;
    orientation: TabsOrientation;
    direction: TabsDirection;
  }

  export type Props = BaseUIComponentProps<'span', TabIndicator.OwnerState> & {
    /**
     * If `true`, the indicator will include code to render itself before React hydrates.
     * This will minimize the time the indicator is not visible after the SSR-generated content is downloaded.
     *
     * @default false
     */
    renderBeforeHydration?: boolean;
  };
}

TabIndicator.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
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
