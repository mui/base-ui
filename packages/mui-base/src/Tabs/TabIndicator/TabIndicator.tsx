'use client';
import * as React from 'react';
import { useTabIndicator } from '../../useTabIndicator/useTabIndicator';
import { TabIndicatorProps } from './TabIndicator.types';
import { resolveClassName } from '../../utils/resolveClassName';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import { useTabIndicatorStyleHooks } from './useTabIndicatorStyleHooks';
import { useTabsContext } from '../TabsContext';

const TabIndicator = React.forwardRef<HTMLSpanElement, TabIndicatorProps>(
  function TabIndicator(props, forwardedRef) {
    const { className: classNameProp, render: renderProp, ...other } = props;
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
    } = useTabIndicator();

    const ownerState = {
      selectedTabPosition,
      orientation,
      direction,
    };

    const className = resolveClassName(classNameProp, ownerState);
    const styleHooks = useTabIndicatorStyleHooks(ownerState);

    if (activeTabValue == null) {
      return null;
    }

    const rootProps = {
      ...styleHooks,
      ...other,
      className,
      ref: forwardedRef,
      'data-instance-id': isMounted ? undefined : instanceId,
      suppressHydrationWarning: true,
    };

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

        tabIndicator.style.setProperty('--active-tab-left', \`\${left}px\`);
        tabIndicator.style.setProperty('--active-tab-right', \`\${right}px\`);
        tabIndicator.style.setProperty('--active-tab-top', \`\${top}px\`);
        tabIndicator.style.setProperty('--active-tab-bottom', \`\${bottom}px\`);
        tabIndicator.style.setProperty('--active-tab-movement-forwards', '0');
        tabIndicator.style.setProperty('--active-tab-movement-backwards', '0');
      })();
    `;

    return (
      <React.Fragment>
        {render(getRootProps(rootProps), ownerState)}
        {!isMounted && (
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
