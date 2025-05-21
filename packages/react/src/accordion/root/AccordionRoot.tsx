'use client';
import * as React from 'react';
import { BaseUIComponentProps, Orientation } from '../../utils/types';
import { isElementDisabled } from '../../utils/isElementDisabled';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useRenderElement } from '../../utils/useRenderElement';
import { warn } from '../../utils/warn';
import {
  ARROW_DOWN,
  ARROW_UP,
  ARROW_RIGHT,
  ARROW_LEFT,
  HOME,
  END,
  stopEvent,
} from '../../composite/composite';
import { CompositeList } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { AccordionRootContext } from './AccordionRootContext';

const SUPPORTED_KEYS = new Set([ARROW_DOWN, ARROW_UP, ARROW_RIGHT, ARROW_LEFT, HOME, END]);

const rootMapping = {
  value: () => null,
};

function getActiveTriggers(accordionItemRefs: {
  current: (HTMLElement | null)[];
}): HTMLButtonElement[] {
  const { current: accordionItemElements } = accordionItemRefs;

  const output: HTMLButtonElement[] = [];

  for (let i = 0; i < accordionItemElements.length; i += 1) {
    const section = accordionItemElements[i];
    if (!isElementDisabled(section)) {
      const trigger = section?.querySelector('[type="button"]') as HTMLButtonElement;
      if (!isElementDisabled(trigger)) {
        output.push(trigger);
      }
    }
  }

  return output;
}

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
    className,
    disabled = false,
    hiddenUntilFound: hiddenUntilFoundProp,
    keepMounted: keepMountedProp,
    loop = true,
    onValueChange: onValueChangeProp,
    openMultiple = true,
    orientation = 'vertical',
    value: valueProp,
    defaultValue: defaultValueProp,
    ...elementProps
  } = componentProps;

  const direction = useDirection();

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useModernLayoutEffect(() => {
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
      if (!openMultiple) {
        const nextValue = value[0] === newValue ? [] : [newValue];
        setValue(nextValue);
        onValueChange(nextValue);
      } else if (nextOpen) {
        const nextOpenValues = value.slice();
        nextOpenValues.push(newValue);
        setValue(nextOpenValues);
        onValueChange(nextOpenValues);
      } else {
        const nextOpenValues = value.filter((v) => v !== newValue);
        setValue(nextOpenValues);
        onValueChange(nextOpenValues);
      }
    },
    [onValueChange, openMultiple, setValue, value],
  );

  const isRtl = direction === 'rtl';
  const isHorizontal = orientation === 'horizontal';

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
        onKeyDown(event: React.KeyboardEvent) {
          if (!SUPPORTED_KEYS.has(event.key)) {
            return;
          }

          stopEvent(event);

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
      },
      elementProps,
    ],
    stateAttributesMapping: rootMapping,
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
    onValueChange?: (value: AccordionValue) => void;
    /**
     * Whether multiple items can be open at the same time.
     * @default true
     */
    openMultiple?: boolean;
    /**
     * The visual orientation of the accordion.
     * Controls whether roving focus uses left/right or up/down arrow keys.
     * @default 'vertical'
     */
    orientation?: Orientation;
  }
}
