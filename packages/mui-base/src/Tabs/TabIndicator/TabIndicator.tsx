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
      movementDirection,
    } = useTabIndicator();

    const ownerState = {
      selectedTabPosition,
      orientation,
      direction,
      movementDirection,
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
        const tabIndicator = document.querySelector('[data-instance-id="${instanceId}"]');
        if (!tabIndicator) {
          return;
        }

        let parentTabList = tabIndicator.parentElement;
        while (parentTabList && parentTabList.getAttribute('role') !== 'tablist') {
          parentTabList = parentTabList.parentElement;
        }

        if (!parentTabList) {
          return;
        }

        const selectedTabElement = parentTabList.querySelector('[data-selected="true"]');
        if (!selectedTabElement) {
          return;
        }

        const {
          left: tabLeft,
          right: tabRight,
          top: tabTop,
          bottom: tabBottom,
          width: tabWidth,
        } = selectedTabElement.getBoundingClientRect();

        const {
          left: listLeft,
          right: listRight,
          top: listTop,
          bottom: listBottom,
          width: listWidth,
        } = parentTabList.getBoundingClientRect();

        if (tabWidth === 0 || listWidth === 0) {
          return;
        }

        const left = tabLeft - listLeft;
        const right = listRight - tabRight;
        const top = tabTop - listTop;
        const bottom = listBottom - tabBottom;
        width = tabRight - tabLeft;
        height = tabBottom - tabTop;

        tabIndicator.style.setProperty('--active-tab-left', \`\${left}px\`);
        tabIndicator.style.setProperty('--active-tab-right', \`\${right}px\`);
        tabIndicator.style.setProperty('--active-tab-top', \`\${top}px\`);
        tabIndicator.style.setProperty('--active-tab-bottom', \`\${bottom}px\`);
        tabIndicator.style.setProperty('--active-tab-width', \`\${width}px\`);
        tabIndicator.style.setProperty('--active-tab-height', \`\${height}px\`);
      })();
    `;

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
