'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { NOOP } from '../../utils/noop';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { warn } from '../../utils/warn';
import { CompositeList } from '../../composite/list/CompositeList';
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
 *
 * Demos:
 *
 * - [Accordion](https://base-ui.com/components/react-accordion/)
 *
 * API:
 *
 * - [AccordionRoot API](https://base-ui.com/components/react-accordion/#api-reference-AccordionRoot)
 */
const AccordionRoot = React.forwardRef(function AccordionRoot(
  props: AccordionRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    animated = true,
    className,
    direction = 'ltr',
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
    animated,
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
    extends Partial<useAccordionRoot.Parameters>,
      Omit<BaseUIComponentProps<'div', State>, 'defaultValue'> {
    /**
     * If `true`, sets `hidden="until-found"` when closed. Accordion panels
     * will remain mounted in the DOM when closed and overrides `keepMounted`.
     * If `false`, sets `hidden` when closed.
     * @default false
     */
    hiddenUntilFound?: boolean;
    /**
     * If `true`, accordion panels remains mounted when closed and is instead
     * hidden using the `hidden` attribute.
     * If `false`, accordion panels are unmounted when closed.
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
   * If `true`, the component supports CSS/JS-based animations and transitions.
   */
  animated: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The default value representing the currently open `Accordion.Item`
   * This is the uncontrolled counterpart of `value`.
   */
  defaultValue: PropTypes.array,
  /**
   * @ignore
   */
  direction: PropTypes.oneOf(['ltr', 'rtl']),
  /**
   * If `true`, the component is disabled.
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, sets `hidden="until-found"` when closed. Accordion panels
   * will remain mounted in the DOM when closed and overrides `keepMounted`.
   * If `false`, sets `hidden` when closed.
   * @default false
   */
  hiddenUntilFound: PropTypes.bool,
  /**
   * If `true`, accordion panels remains mounted when closed and is instead
   * hidden using the `hidden` attribute.
   * If `false`, accordion panels are unmounted when closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * If `true`, focus will loop when moving focus between `Trigger`s using
   * the arrow keys.
   */
  loop: PropTypes.bool,
  /**
   * Callback fired when an Accordion section is opened or closed.
   * The value representing the involved section is provided as an argument.
   */
  onValueChange: PropTypes.func,
  /**
   * Whether multiple Accordion sections can be opened at the same time.
   */
  openMultiple: PropTypes.bool,
  /**
   * The orientation of the accordion.
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The value of the currently open `Accordion.Item`
   * This is the controlled counterpart of `defaultValue`.
   */
  value: PropTypes.array,
} as any;
