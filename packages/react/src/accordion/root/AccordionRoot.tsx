'use client';
import * as React from 'react';
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
export const AccordionRoot = React.forwardRef(function AccordionRoot(
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
    /**
     * Whether the component should ignore user interaction.
     */
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
     *
     * Overrides the `keepMounted` prop and uses `hidden="until-found"`
     * to hide the element without removing it from the DOM.
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
