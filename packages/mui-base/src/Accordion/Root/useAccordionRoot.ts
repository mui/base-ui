'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useControlled } from '../../utils/useControlled';

export function useAccordionRoot(
  parameters: useAccordionRoot.Parameters,
): useAccordionRoot.ReturnValue {
  const { animated = true, defaultValue, value: valueParam, disabled = false } = parameters;

  const accordionSectionRefs = React.useRef<(HTMLElement | null)[]>([]);

  const [value, setValue] = useControlled({
    controlled: valueParam,
    default: valueParam ?? defaultValue ?? [],
    name: 'Accordion',
    state: 'value',
  });
  // console.log(value);

  const handleOpenChange = React.useCallback(
    (newValue: number | string, nextOpen: boolean) => {
      // console.group('useAccordionRoot handleOpenChange');
      // console.log('newValue', newValue, 'nextOpen', nextOpen, 'openValues', value);
      if (nextOpen) {
        const nextOpenValues = value.slice();
        nextOpenValues.push(newValue);
        setValue(nextOpenValues);
      } else {
        const nextOpenValues = value.filter((v) => v !== newValue);
        setValue(nextOpenValues);
      }
      // console.groupEnd();
    },
    [setValue, value],
  );

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps(externalProps, {
        role: 'region',
      }),
    [],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      accordionSectionRefs,
      animated,
      disabled,
      handleOpenChange,
      value,
    }),
    [getRootProps, accordionSectionRefs, animated, disabled, handleOpenChange, value],
  );
}

export namespace useAccordionRoot {
  export type Value = readonly (string | number)[];

  export interface Parameters {
    /**
     * If `true`, the component supports CSS/JS-based animations and transitions.
     * @default true
     */
    animated?: boolean;
    /**
     * The value of the currently open `Accordion.Section`
     * This is the controlled counterpart of `defaultValue`.
     */
    value?: Value;
    /**
     * The default value representing the currently open `Accordion.Section`
     * This is the uncontrolled counterpart of `value`.
     * @default 0
     */
    defaultValue?: Value;
    /**
     * Callback fired when an Accordion section is opened or closed.
     * The value representing the involved section is provided as an argument.
     */
    onOpenChange?: (value: Value) => void;
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'div'>,
    ) => React.ComponentPropsWithRef<'div'>;
    accordionSectionRefs: React.MutableRefObject<(HTMLElement | null)[]>;
    animated: boolean;
    /**
     * The disabled state of the Accordion
     */
    disabled: boolean;
    handleOpenChange: (value: number | string, nextOpen: boolean) => void;
    /**
     * The open state of the Accordion
     */
    value: Value;
  }
}
