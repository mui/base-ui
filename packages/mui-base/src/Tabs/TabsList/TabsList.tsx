'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTabsList } from './useTabsList';
import { TabsListProvider } from './TabsListProvider';
import { tabsStyleHookMapping } from '../Root/styleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { TabsRoot } from '../Root/TabsRoot';
import { BaseUIComponentProps } from '../../utils/types';

/**
 *
 * Demos:
 *
 * - [Tabs](https://base-ui.netlify.app/components/react-tabs/)
 *
 * API:
 *
 * - [TabsList API](https://base-ui.netlify.app/components/react-tabs/#api-reference-TabsList)
 */
const TabsList = React.forwardRef(function TabsList(
  props: TabsList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { activateOnFocus = true, className, loop = true, render, ...other } = props;

  const { direction, orientation, getRootProps, contextValue, tabActivationDirection } =
    useTabsList({
      rootRef: forwardedRef,
      loop,
      activateOnFocus,
    });

  const ownerState: TabsList.OwnerState = React.useMemo(
    () => ({
      direction,
      orientation,
      tabActivationDirection,
    }),
    [direction, orientation, tabActivationDirection],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: other,
    customStyleHookMapping: tabsStyleHookMapping,
  });

  return <TabsListProvider value={contextValue}>{renderElement()}</TabsListProvider>;
});

namespace TabsList {
  export type OwnerState = TabsRoot.OwnerState;

  export type Props = BaseUIComponentProps<'div', TabsList.OwnerState> & {
    /**
     * If `true`, the tab will be activated whenever it is focused.
     * Otherwise, it has to be activated by clicking or pressing the Enter or Space key.
     *
     * @default true
     */
    activateOnFocus?: boolean;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
     *
     * @default true
     */
    loop?: boolean;
  };
}

TabsList.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the tab will be activated whenever it is focused.
   * Otherwise, it has to be activated by clicking or pressing the Enter or Space key.
   *
   * @default true
   */
  activateOnFocus: PropTypes.bool,
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
   * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
   *
   * @default true
   */
  loop: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { TabsList };
