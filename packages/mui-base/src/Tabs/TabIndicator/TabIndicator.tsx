'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTabIndicator } from './useTabIndicator';
import { useTabIndicatorStyleHooks } from './useTabIndicatorStyleHooks';
import { TabIndicatorProps } from './TabIndicator.types';
import { script as prehydrationScript } from './prehydrationScript.min';
import { useTabsContext } from '../Root/TabsContext';
import { resolveClassName } from '../../utils/resolveClassName';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';

const TabIndicator = React.forwardRef<HTMLSpanElement, TabIndicatorProps>(
  function TabIndicator(props, forwardedRef) {
    const {
      className: classNameProp,
      render: renderProp,
      renderBeforeHydration = false,
      ...other
    } = props;
    const render = renderProp ?? defaultRenderFunctions.span;
    const [instanceId] = React.useState(() => Math.random().toString(36).slice(2));
    const [isMounted, setIsMounted] = React.useState(false);
    const { value: activeTabValue } = useTabsContext();

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

    const ownerState = {
      selectedTabPosition,
      orientation,
      direction,
      tabActivationDirection,
    };

    const className = resolveClassName(classNameProp, ownerState);
    const styleHooks = useTabIndicatorStyleHooks(ownerState);
    const mergedRef = useRenderPropForkRef(render, forwardedRef);

    if (activeTabValue == null) {
      return null;
    }

    const rootProps = getRootProps({
      ...styleHooks,
      ...other,
      className,
      ref: mergedRef,
      'data-instance-id': !(isMounted && renderBeforeHydration) ? instanceId : undefined,
      suppressHydrationWarning: true,
    } as React.ComponentPropsWithRef<'span'>);

    return (
      <React.Fragment>
        {evaluateRenderProp(render, rootProps, ownerState)}
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
