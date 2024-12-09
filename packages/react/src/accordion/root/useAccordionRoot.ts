'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useControlled } from '../../utils/useControlled';
import { ARROW_DOWN, ARROW_UP, ARROW_RIGHT, ARROW_LEFT } from '../../composite/composite';

const SUPPORTED_KEYS = [ARROW_DOWN, ARROW_UP, ARROW_RIGHT, ARROW_LEFT, 'Home', 'End'];

function getActiveTriggers(accordionItemRefs: {
  current: (HTMLElement | null)[];
}): HTMLButtonElement[] {
  const { current: accordionItemElements } = accordionItemRefs;

  const output: HTMLButtonElement[] = [];

  for (let i = 0; i < accordionItemElements.length; i += 1) {
    const section = accordionItemElements[i];
    if (!isDisabled(section)) {
      const trigger = section?.querySelector('[type="button"]') as HTMLButtonElement;
      if (!isDisabled(trigger)) {
        output.push(trigger);
      }
    }
  }

  return output;
}

function isDisabled(element: HTMLElement | null) {
  return (
    element === null ||
    element.hasAttribute('disabled') ||
    element.getAttribute('data-disabled') === 'true'
  );
}

export function useAccordionRoot(
  parameters: useAccordionRoot.Parameters,
): useAccordionRoot.ReturnValue {
  const {
    disabled,
    direction,
    loop,
    onValueChange,
    orientation,
    openMultiple,
    value: valueParam,
    defaultValue,
  } = parameters;

  const accordionItemRefs = React.useRef<(HTMLElement | null)[]>([]);

  const [value, setValue] = useControlled({
    controlled: valueParam,
    default: defaultValue,
    name: 'Accordion',
    state: 'value',
  });

  const handleValueChange = React.useCallback(
    (newValue: number | string, nextOpen: boolean) => {
      if (!openMultiple) {
        const nextValue = value[0] === newValue ? [] : [newValue];
        setValue(nextValue);
        onValueChange?.(nextValue);
      } else if (nextOpen) {
        const nextOpenValues = value.slice();
        nextOpenValues.push(newValue);
        setValue(nextOpenValues);
        onValueChange?.(nextOpenValues);
      } else {
        const nextOpenValues = value.filter((v) => v !== newValue);
        setValue(nextOpenValues);
        onValueChange?.(nextOpenValues);
      }
    },
    [onValueChange, openMultiple, setValue, value],
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

          event.preventDefault();

          const triggers = getActiveTriggers(accordionItemRefs);

          const numOfEnabledTriggers = triggers.length;
          const lastIndex = numOfEnabledTriggers - 1;

          let nextIndex = -1;

          const thisIndex = triggers.indexOf(event.target as HTMLButtonElement);

          function toNext() {
            if (loop) {
              nextIndex = thisIndex + 1 > lastIndex ? 0 : thisIndex + 1;
            } else {
              nextIndex = Math.min(thisIndex + 1, lastIndex);
            }
          }

          function toPrev() {
            if (loop) {
              nextIndex = thisIndex === 0 ? lastIndex : thisIndex - 1;
            } else {
              nextIndex = thisIndex - 1;
            }
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
            triggers[nextIndex].focus();
          }
        },
      });
    },
    [direction, loop, orientation],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      accordionItemRefs,
      direction,
      disabled,
      handleValueChange,
      orientation,
      value,
    }),
    [getRootProps, accordionItemRefs, direction, disabled, handleValueChange, orientation, value],
  );
}

export type AccordionValue = (any | null)[];

type Direction = 'ltr' | 'rtl';

export type AccordionOrientation = 'horizontal' | 'vertical';

export namespace useAccordionRoot {
  export interface Parameters {
    /**
     * The value of the currently open `Accordion.Item`
     * This is the controlled counterpart of `defaultValue`.
     */
    value?: AccordionValue;
    /**
     * The default value representing the currently open `Accordion.Item`
     * This is the uncontrolled counterpart of `value`.
     */
    defaultValue?: AccordionValue;
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled: boolean;
    direction: Direction;
    /**
     * If `true`, focus will loop when moving focus between `Trigger`s using
     * the arrow keys.
     * @default true
     */
    loop: boolean;
    /**
     * Callback fired when an Accordion section is opened or closed.
     * The value representing the involved section is provided as an argument.
     */
    onValueChange: (value: AccordionValue) => void;
    /**
     * Whether multiple Accordion sections can be opened at the same time.
     * @default true
     */
    openMultiple: boolean;
    /**
     * The orientation of the accordion.
     * @default 'vertical'
     */
    orientation: AccordionOrientation;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'div'>,
    ) => React.ComponentPropsWithRef<'div'>;
    accordionItemRefs: React.RefObject<(HTMLElement | null)[]>;
    direction: Direction;
    /**
     * The disabled state of the Accordion
     */
    disabled: boolean;
    handleValueChange: (value: number | string, nextOpen: boolean) => void;
    orientation: AccordionOrientation;
    /**
     * The open state of the Accordion represented by an array of the values
     * of all open `<Accordion.item/>`s
     */
    value: AccordionValue;
  }
}
