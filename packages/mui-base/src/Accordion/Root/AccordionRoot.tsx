'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { useCollapsibleContent } from '../../Collapsible/Content/useCollapsibleContent';
import { CompositeList } from '../../Composite/List/CompositeList';
import { useAccordionRoot } from './useAccordionRoot';
import { AccordionRootContext } from './AccordionRootContext';

/**
 *
 * Demos:
 *
 * - [Accordion](https://base-ui.netlify.app/components/react-accordion/)
 *
 * API:
 *
 * - [AccordionRoot API](https://base-ui.netlify.app/components/react-accordion/#api-reference-AccordionRoot)
 */
const AccordionRoot = React.forwardRef(function AccordionRoot(
  props: AccordionRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    animated,
    className,
    direction,
    disabled = false,
    htmlHidden,
    onOpenChange,
    openMultiple = true,
    orientation,
    value,
    defaultValue: defaultValueProp,
    render,
    ...otherProps
  } = props;

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
    orientation,
    onOpenChange,
    openMultiple,
    value,
  });

  const ownerState: AccordionRoot.OwnerState = React.useMemo(
    () => ({
      value: accordion.value,
      disabled: accordion.disabled,
      orientation: accordion.orientation,
      // transitionStatus: accordion.transitionStatus,
    }),
    [accordion.value, accordion.disabled, accordion.orientation],
  );

  const contextValue: AccordionRoot.Context = React.useMemo(
    () => ({
      ...accordion,
      htmlHidden,
      ownerState,
    }),
    [accordion, htmlHidden, ownerState],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getRootProps,
    render: render ?? 'div',
    className,
    ownerState,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: {
      disabled: (isDisabled) => {
        if (isDisabled) {
          return { 'data-disabled': '' };
        }
        return null;
      },
      value: () => null,
    },
  });

  return (
    <AccordionRootContext.Provider value={contextValue}>
      <CompositeList elementsRef={accordion.accordionSectionRefs}>{renderElement()}</CompositeList>
    </AccordionRootContext.Provider>
  );
});

export { AccordionRoot };

export namespace AccordionRoot {
  export interface Context extends Omit<useAccordionRoot.ReturnValue, 'getRootProps'> {
    ownerState: OwnerState;
    htmlHidden?: useCollapsibleContent.HtmlHiddenType;
  }

  export interface OwnerState {
    value: useAccordionRoot.Value;
    disabled: boolean;
    orientation: useAccordionRoot.Orientation;
  }

  export interface Props
    extends useAccordionRoot.Parameters,
      BaseUIComponentProps<any, OwnerState> {
    htmlHidden?: useCollapsibleContent.HtmlHiddenType;
  }
}

AccordionRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the component supports CSS/JS-based animations and transitions.
   * @default true
   */
  animated: PropTypes.bool,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The default value representing the currently open `Accordion.Section`
   * This is the uncontrolled counterpart of `value`.
   * @default 0
   */
  defaultValue: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  ),
  /**
   * @default 'ltr'
   */
  direction: PropTypes.oneOf(['ltr', 'rtl']),
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  htmlHidden: PropTypes.oneOf(['hidden', 'until-found']),
  /**
   * Callback fired when an Accordion section is opened or closed.
   * The value representing the involved section is provided as an argument.
   */
  onOpenChange: PropTypes.func,
  /**
   * Whether multiple Accordion sections can be opened at the same time
   * @default true
   */
  openMultiple: PropTypes.bool,
  /**
   * @default 'vertical'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The value of the currently open `Accordion.Section`
   * This is the controlled counterpart of `defaultValue`.
   */
  value: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired),
} as any;
