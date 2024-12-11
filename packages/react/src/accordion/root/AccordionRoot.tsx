'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { NOOP } from '../../utils/noop';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { warn } from '../../utils/warn';
import { CompositeList } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import {
  useAccordionRoot,
  type AccordionOrientation,
  type AccordionValue,
} from './useAccordionRoot';
import { AccordionRootContext } from './AccordionRootContext';

const rootStyleHookMapping = {
  value: () => null,
};

/**
 * Groups all parts of the accordion.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
const AccordionRoot = React.forwardRef(function AccordionRoot(
  props: AccordionRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    className,
    disabled = false,
    hiddenUntilFound: hiddenUntilFoundProp,
    keepMounted: keepMountedProp,
    loop = true,
    onValueChange: onValueChangeProp,
    openMultiple = true,
    orientation = 'vertical',
    value,
    defaultValue: defaultValueProp,
    render,
    ...otherProps
  } = props;

  const direction = useDirection();

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEnhancedEffect(() => {
      if (hiddenUntilFoundProp && keepMountedProp === false) {
        warn(
          'The `keepMounted={false}` prop on a Accordion.Root will be ignored when using `hiddenUntilFound` since it requires Panels to remain mounted when closed.',
        );
      }
    }, [hiddenUntilFoundProp, keepMountedProp]);
  }

  // memoized to allow omitting both defaultValue and value
  // which would otherwise trigger a warning in useControlled
  const defaultValue = React.useMemo(() => {
    if (value === undefined) {
      return defaultValueProp ?? [];
    }

    return undefined;
  }, [value, defaultValueProp]);

  const { getRootProps, ...accordion } = useAccordionRoot({
    direction,
    disabled,
    defaultValue,
    loop,
    orientation,
    onValueChange: onValueChangeProp ?? NOOP,
    openMultiple,
    value,
  });

  const state: AccordionRoot.State = React.useMemo(
    () => ({
      value: accordion.value,
      disabled: accordion.disabled,
      orientation: accordion.orientation,
    }),
    [accordion.value, accordion.disabled, accordion.orientation],
  );

  const contextValue: AccordionRootContext = React.useMemo(
    () => ({
      ...accordion,
      hiddenUntilFound: hiddenUntilFoundProp ?? false,
      keepMounted: keepMountedProp ?? false,
      state,
    }),
    [accordion, hiddenUntilFoundProp, keepMountedProp, state],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    className,
    state,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: rootStyleHookMapping,
  });

  return (
    <AccordionRootContext.Provider value={contextValue}>
      <CompositeList elementsRef={accordion.accordionItemRefs}>{renderElement()}</CompositeList>
    </AccordionRootContext.Provider>
  );
});

export namespace AccordionRoot {
  export interface State {
    value: AccordionValue;
    disabled: boolean;
    orientation: AccordionOrientation;
  }

  export interface Props
    extends Partial<
        Pick<
          useAccordionRoot.Parameters,
          | 'value'
          | 'defaultValue'
          | 'disabled'
          | 'loop'
          | 'onValueChange'
          | 'openMultiple'
          | 'orientation'
        >
      >,
      Omit<BaseUIComponentProps<'div', State>, 'defaultValue'> {
    /**
     * Allows the browser’s built-in page search to find and expand the panel contents.
     * Overrides the `keepMounted` prop and uses `hidden="until-found"`
     * to hide the element instead of removing it from the DOM.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden#the_hidden_until_found_state)
     * @default false
     */
    hiddenUntilFound?: boolean;
    /**
     * Whether to keep the element in the DOM while the panel is closed.
     * This prop is ignored when `hiddenUntilFound` is used.
     * @default false
     */
    keepMounted?: boolean;
  }
}

export { AccordionRoot };

AccordionRoot.propTypes /* remove-proptypes */ = {
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
   * The uncontrolled value of the item(s) that should be expanded.
   * To render a controlled accordion, use the `value` prop instead.
   */
  defaultValue: PropTypes.array,
  /**
   * Whether the component should ignore user actions.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Allows the browser’s built-in page search to find and expand the panel contents.
   * Overrides the `keepMounted` prop and uses `hidden="until-found"`
   * to hide the element instead of removing it from the DOM.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden#the_hidden_until_found_state)
   * @default false
   */
  hiddenUntilFound: PropTypes.bool,
  /**
   * Whether to keep the element in the DOM while the panel is closed.
   * This prop is ignored when `hiddenUntilFound` is used.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * Whether to loop keyboard focus back to the first item
   * when the end of the list is reached using the arrow keys.
   * @default true
   */
  loop: PropTypes.bool,
  /**
   * Event handler called when an accordion item is expanded or collapsed.
   * Provides the new value as an argument.
   */
  onValueChange: PropTypes.func,
  /**
   * Whether multiple items can be open at the same time.
   * @default true
   */
  openMultiple: PropTypes.bool,
  /**
   * The visual orientation of the accordion.
   * Controls whether the roving focus uses left/right or up/down arrow keys.
   * @default 'vertical'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The controlled value of the item(s) that should be expanded.
   * To render an controlled accordion, use the `defaultValue` prop instead.
   */
  value: PropTypes.array,
} as any;
