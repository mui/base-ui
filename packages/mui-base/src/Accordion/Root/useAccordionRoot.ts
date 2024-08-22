'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { NOOP } from '../../utils/noop';
import { useControlled } from '../../utils/useControlled';
import { ARROW_DOWN, ARROW_UP, ARROW_RIGHT, ARROW_LEFT } from '../../Composite/composite';

const SUPPORTED_KEYS = [ARROW_DOWN, ARROW_UP, ARROW_RIGHT, ARROW_LEFT, 'Home', 'End'];

function isDisabled(element: HTMLElement | null) {
  return (
    element === null ||
    element.hasAttribute('disabled') ||
    element.getAttribute('data-disabled') === 'true'
  );
}
/**
 *
 * Demos:
 *
 * - [Accordion](https://mui.com/base-ui/react-accordion/#hook)
 *
 * API:
 *
 * - [useAccordionRoot API](https://mui.com/base-ui/react-accordion/hooks-api/#use-accordion-root)
 */
export function useAccordionRoot(
  parameters: useAccordionRoot.Parameters,
): useAccordionRoot.ReturnValue {
  const {
    animated = true,
    disabled = false,
    direction = 'ltr',
    onOpenChange = NOOP,
    orientation = 'vertical',
    openMultiple = true,
    value: valueParam,
    defaultValue,
  } = parameters;

  const accordionSectionRefs = React.useRef<(HTMLElement | null)[]>([]);

  const [value, setValue] = useControlled({
    controlled: valueParam,
    default: valueParam ?? defaultValue ?? [],
    name: 'Accordion',
    state: 'value',
  });

  const handleOpenChange = React.useCallback(
    (newValue: number | string, nextOpen: boolean) => {
      // console.group('useAccordionRoot handleOpenChange');
      // console.log('newValue', newValue, 'nextOpen', nextOpen, 'openValues', value);
      if (!openMultiple) {
        const nextValue = value[0] === newValue ? [] : [newValue];
        setValue(nextValue);
        onOpenChange(nextValue);
      } else if (nextOpen) {
        const nextOpenValues = value.slice();
        nextOpenValues.push(newValue);
        // console.log('nextOpenValues', nextOpenValues);
        setValue(nextOpenValues);
        onOpenChange(nextOpenValues);
      } else {
        const nextOpenValues = value.filter((v) => v !== newValue);
        // console.log('nextOpenValues', nextOpenValues);
        setValue(nextOpenValues);
        onOpenChange(nextOpenValues);
      }
      // console.groupEnd();
    },
    [onOpenChange, openMultiple, setValue, value],
  );

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      const isRtl = direction === 'rtl';
      const isHorizontal = orientation === 'horizontal';
      return mergeReactProps(externalProps, {
        dir: direction,
        role: 'region',
        onKeyDown(event: React.KeyboardEvent) {
          if (!SUPPORTED_KEYS.includes(event.key)) {
            return;
          }

          // console.group('onKeyDown');
          const { current: accordionSectionElements } = accordionSectionRefs;

          // TODO: memo this outside
          const triggers: HTMLButtonElement[] = [];

          for (let i = 0; i < accordionSectionElements.length; i += 1) {
            const section = accordionSectionElements[i];
            if (!isDisabled(section)) {
              const trigger = section?.querySelector('[type="button"]') as HTMLButtonElement;
              if (!isDisabled(trigger)) {
                triggers.push(trigger);
              }
            }
          }

          const numOfEnabledTriggers = triggers.length;
          const lastIndex = numOfEnabledTriggers - 1;

          let nextIndex = -1;

          const thisIndex = triggers.indexOf(event.target as HTMLButtonElement);

          function toNext() {
            nextIndex = Math.min(thisIndex + 1, lastIndex);
          }

          function toPrev() {
            nextIndex = thisIndex - 1;
          }

          switch (event.key) {
            case ARROW_DOWN:
              if (!isHorizontal) {
                toNext();
              }
              break;
            case ARROW_UP:
              if (!isHorizontal) {
                toPrev();
              }
              break;
            case ARROW_RIGHT:
              if (isHorizontal) {
                if (isRtl) {
                  toPrev();
                } else {
                  toNext();
                }
              }
              break;
            case ARROW_LEFT:
              if (isHorizontal) {
                if (isRtl) {
                  toNext();
                } else {
                  toPrev();
                }
              }
              break;
            case 'Home':
              nextIndex = 0;
              break;
            case 'End':
              nextIndex = lastIndex;
              break;
            default:
              break;
          }

          if (nextIndex > -1) {
            // console.log('focus nextIndex', nextIndex);
            triggers[nextIndex].focus();
          }
          // console.groupEnd();
        },
      });
    },
    [direction, orientation],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      accordionSectionRefs,
      animated,
      direction,
      disabled,
      handleOpenChange,
      orientation,
      value,
    }),
    [
      getRootProps,
      accordionSectionRefs,
      animated,
      direction,
      disabled,
      handleOpenChange,
      orientation,
      value,
    ],
  );
}

export namespace useAccordionRoot {
  export type Value = readonly (string | number)[];

  export type Direction = 'ltr' | 'rtl';

  export type Orientation = 'horizontal' | 'vertical';

  export interface Parameters {
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
     * If `true`, the component supports CSS/JS-based animations and transitions.
     * @default true
     */
    animated?: boolean;
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * @default 'ltr'
     */
    direction?: Direction;
    /**
     * Callback fired when an Accordion section is opened or closed.
     * The value representing the involved section is provided as an argument.
     */
    onOpenChange?: (value: Value) => void;
    /**
     * Whether multiple Accordion sections can be opened at the same time
     * @default true
     */
    openMultiple?: boolean;
    /**
     * @default 'vertical'
     */
    orientation?: Orientation;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'div'>,
    ) => React.ComponentPropsWithRef<'div'>;
    accordionSectionRefs: React.MutableRefObject<(HTMLElement | null)[]>;
    animated: boolean;
    direction: Direction;
    /**
     * The disabled state of the Accordion
     */
    disabled: boolean;
    handleOpenChange: (value: number | string, nextOpen: boolean) => void;
    orientation: Orientation;
    /**
     * The open state of the Accordion represented by an array of the values
     * of all open `<Accordion.Section/>`s
     */
    value: Value;
  }
}
