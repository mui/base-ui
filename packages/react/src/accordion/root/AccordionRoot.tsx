'use client';
import * as React from 'react';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { warn } from '@base-ui-components/utils/warn';
import { BaseUIComponentProps, Orientation } from '../../utils/types';
import { CompositeList } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { AccordionRootContext } from './AccordionRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  createBaseUIEventDetails,
  type BaseUIEventDetails,
} from '../../utils/createBaseUIEventDetails';

const rootStateAttributesMapping = {
  value: () => null,
};

/**
 * Groups all parts of the accordion.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Accordion](https://base-ui.com/react/components/accordion)
 */
export const AccordionRoot = React.forwardRef(function AccordionRoot(
  componentProps: AccordionRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    disabled = false,
    hiddenUntilFound: hiddenUntilFoundProp,
    keepMounted: keepMountedProp,
    loop = true,
    onValueChange: onValueChangeProp,
    multiple = true,
    orientation = 'vertical',
    value: valueProp,
    defaultValue: defaultValueProp,
    ...elementProps
  } = componentProps;

  const direction = useDirection();

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useIsoLayoutEffect(() => {
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
    if (valueProp === undefined) {
      return defaultValueProp ?? [];
    }

    return undefined;
  }, [valueProp, defaultValueProp]);

  const onValueChange = useEventCallback(onValueChangeProp);

  const accordionItemRefs = React.useRef<(HTMLElement | null)[]>([]);

  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'Accordion',
    state: 'value',
  });

  const handleValueChange = React.useCallback(
    (newValue: number | string, nextOpen: boolean) => {
      const details = createBaseUIEventDetails('none');
      if (!multiple) {
        const nextValue = value[0] === newValue ? [] : [newValue];
        onValueChange(nextValue, details);
        if (details.isCanceled) {
          return;
        }
        setValue(nextValue);
      } else if (nextOpen) {
        const nextOpenValues = value.slice();
        nextOpenValues.push(newValue);
        onValueChange(nextOpenValues, details);
        if (details.isCanceled) {
          return;
        }
        setValue(nextOpenValues);
      } else {
        const nextOpenValues = value.filter((v) => v !== newValue);
        onValueChange(nextOpenValues, details);
        if (details.isCanceled) {
          return;
        }
        setValue(nextOpenValues);
      }
    },
    [onValueChange, multiple, setValue, value],
  );

  const state: AccordionRoot.State = React.useMemo(
    () => ({
      value,
      disabled,
      orientation,
    }),
    [value, disabled, orientation],
  );

  const contextValue: AccordionRootContext = React.useMemo(
    () => ({
      accordionItemRefs,
      direction,
      disabled,
      handleValueChange,
      hiddenUntilFound: hiddenUntilFoundProp ?? false,
      keepMounted: keepMountedProp ?? false,
      loop,
      orientation,
      state,
      value,
    }),
    [
      direction,
      disabled,
      handleValueChange,
      hiddenUntilFoundProp,
      keepMountedProp,
      loop,
      orientation,
      state,
      value,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        dir: direction,
        role: 'region',
      },
      elementProps,
    ],
    stateAttributesMapping: rootStateAttributesMapping,
  });

  return (
    <AccordionRootContext.Provider value={contextValue}>
      <CompositeList elementsRef={accordionItemRefs}>{element}</CompositeList>
    </AccordionRootContext.Provider>
  );
});

export type AccordionValue = (any | null)[];

export namespace AccordionRoot {
  export interface State {
    value: AccordionValue;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    orientation: Orientation;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * The controlled value of the item(s) that should be expanded.
     *
     * To render an uncontrolled accordion, use the `defaultValue` prop instead.
     */
    value?: AccordionValue;
    /**
     * The uncontrolled value of the item(s) that should be initially expanded.
     *
     * To render a controlled accordion, use the `value` prop instead.
     */
    defaultValue?: AccordionValue;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
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
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
     * @default true
     */
    loop?: boolean;
    /**
     * Event handler called when an accordion item is expanded or collapsed.
     * Provides the new value as an argument.
     */
    onValueChange?: (value: AccordionValue, eventDetails: ChangeEventDetails) => void;
    /**
     * Whether multiple items can be open at the same time.
     * @default true
     */
    multiple?: boolean;
    /**
     * The visual orientation of the accordion.
     * Controls whether roving focus uses left/right or up/down arrow keys.
     * @default 'vertical'
     */
    orientation?: Orientation;
  }

  export type ChangeEventReason = 'trigger-press' | 'none';
  export type ChangeEventDetails = BaseUIEventDetails<ChangeEventReason>;
}
