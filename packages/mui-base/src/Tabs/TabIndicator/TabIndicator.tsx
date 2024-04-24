'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTabIndicator } from '../../useTabIndicator/useTabIndicator';
import { TabIndicatorProps } from './TabIndicator.types';
import { resolveClassName } from '../../utils/resolveClassName';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useTabIndicatorStyleHooks } from './useTabIndicatorStyleHooks';
import { useTabsContext } from '../../useTabs/TabsContext';
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

    // This script is used to set the initial position of the indicator before hydration happens.
    // This is necessary to render the indicator in the right place right after the SSR-generated content is downloaded and not wait for React to kick in.
    const prehydrationScript = `
(function() {
  let indicator = document.currentScript.previousElementSibling;
  if (!indicator) {
    return;
  }

  let list = indicator.closest('[role="tablist"]');
  if (!list) {
    return;
  }

  let activeTab = list.querySelector('[data-selected="true"]');
  if (!activeTab) {
    return;
  }

  let { left: tabL, right: tabR, top: tabT, bottom: tabB, width: tabW } = activeTab.getBoundingClientRect();
  let { left: listL, right: listR, top: listT, bottom: listB, width: listW } = list.getBoundingClientRect();

  if (tabW === 0 || listW === 0) {
    return;
  }

  let left = tabL - listL;
  let right = listR - tabR;
  let top = tabT - listT;
  let bottom = listB - tabB;
  let width = tabR - tabL;
  let height = tabB - tabT;

  function setProp(name, value) {
    indicator.style.setProperty('--active-tab-' + name, value + 'px');
  }

  setProp('left', left);
  setProp('right', right);
  setProp('top', top);
  setProp('bottom', bottom);
  setProp('width', width);
  setProp('height', height);
})();
    `;

    return (
      <React.Fragment>
        <style>{'body { display: block !important } '}</style>
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
