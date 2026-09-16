import * as React from 'react';
import { mergeObjects } from '@base-ui/utils/mergeObjects';
import type { BaseUIEvent, WithBaseUIEvent, WithPreventBaseUIHandler } from '../internals/types';

type ElementType = React.ElementType;
type PropsOf<T extends ElementType> = WithBaseUIEvent<React.ComponentPropsWithRef<T>>;
type PropsGetter<T extends ElementType> = (otherProps: PropsOf<T>) => PropsOf<T>;
type InputProps<T extends ElementType> = PropsOf<T> | PropsGetter<T> | undefined;

const WRAPPED_EVENT_HANDLER = Symbol();

type EventHandler = ((...args: any[]) => any) & {
  [WRAPPED_EVENT_HANDLER]?: true | undefined;
};

const EMPTY_PROPS = {};

/* eslint-disable id-denylist */
/**
 * Merges multiple sets of React props. It follows the Object.assign pattern where the rightmost object's fields overwrite
 * the conflicting ones from others. This doesn't apply to event handlers, `className` and `style` props.
 *
 * Event handlers are merged and called in right-to-left order (rightmost handler executes first, leftmost last).
 * For React synthetic events, the rightmost handler can prevent prior (left-positioned) handlers from executing
 * by calling `event.preventBaseUIHandler()`. For non-synthetic events (custom events with primitive/object values),
 * all handlers always execute without prevention capability.
 *
 * The `className` prop is merged by concatenating classes in right-to-left order (rightmost class appears first in the string).
 * The `style` prop is merged with rightmost styles overwriting the prior ones.
 *
 * Props can either be provided as objects or as functions that take the previous props as an argument.
 * The function will receive the merged props up to that point (going from left to right):
 * so in the case of `(obj1, obj2, fn, obj3)`, `fn` will receive the merged props of `obj1` and `obj2`.
 * The function is responsible for chaining event handlers if needed (that is, we don't run the merge logic).
 *
 * Event handlers returned by functions are wrapped with Base UI's event enhancements. The function is still
 * responsible for respecting `event.baseUIHandlerPrevented` when it manually calls a previous event handler.
 *
 * @important **`ref` is not merged.**
 * @param a Props object to merge.
 * @param b Props object to merge. The function will overwrite conflicting props from `a`.
 * @param c Props object to merge. The function will overwrite conflicting props from previous parameters.
 * @param d Props object to merge. The function will overwrite conflicting props from previous parameters.
 * @param e Props object to merge. The function will overwrite conflicting props from previous parameters.
 * @returns The merged props.
 * @public
 */
export function mergeProps<T extends ElementType>(
  a: InputProps<T>,
  b: InputProps<T>,
  c: InputProps<T>,
  d: InputProps<T>,
  e: InputProps<T>,
): PropsOf<T>;
export function mergeProps<T extends ElementType>(
  a: InputProps<T>,
  b: InputProps<T>,
  c: InputProps<T>,
  d: InputProps<T>,
): PropsOf<T>;
export function mergeProps<T extends ElementType>(
  a: InputProps<T>,
  b: InputProps<T>,
  c: InputProps<T>,
): PropsOf<T>;
export function mergeProps<T extends ElementType>(a: InputProps<T>, b: InputProps<T>): PropsOf<T>;
export function mergeProps(a: any, b: any, c?: any, d?: any, e?: any) {
  if (!c && !d && !e && !a) {
    return createInitialMergedProps(b);
  }

  // We need to mutably own `merged`.
  let merged = createInitialMergedProps(a);

  if (b) {
    merged = mergeInto(merged, b);
  }
  if (c) {
    merged = mergeInto(merged, c);
  }
  if (d) {
    merged = mergeInto(merged, d);
  }
  if (e) {
    merged = mergeInto(merged, e);
  }

  return merged;
}
/* eslint-enable id-denylist */

/**
 * Merges an arbitrary number of React props using the same logic as {@link mergeProps}.
 * This function accepts an array of props instead of individual arguments.
 *
 * This has slightly lower performance than {@link mergeProps} due to accepting an array
 * instead of a fixed number of arguments. Prefer {@link mergeProps} when merging 5 or
 * fewer prop sets for better performance.
 *
 * @param props Array of props to merge.
 * @returns The merged props.
 * @see mergeProps
 * @public
 */
export function mergePropsN<T extends ElementType>(props: InputProps<T>[]): PropsOf<T> {
  if (props.length === 0) {
    return EMPTY_PROPS as PropsOf<T>;
  }
  if (props.length === 1) {
    return createInitialMergedProps(props[0]);
  }

  // We need to mutably own `merged`.
  let merged = createInitialMergedProps(props[0]);

  for (let i = 1; i < props.length; i += 1) {
    merged = mergeInto(merged, props[i]);
  }

  return merged;
}

function createInitialMergedProps<T extends ElementType>(inputProps: InputProps<T>): PropsOf<T> {
  if (isPropsGetter(inputProps)) {
    return resolvePropsGetter(inputProps, EMPTY_PROPS as PropsOf<T>);
  }

  return copyInitialProps(inputProps);
}

function mergeInto<T extends ElementType>(
  merged: PropsOf<T>,
  inputProps: InputProps<T>,
): PropsOf<T> {
  if (isPropsGetter(inputProps)) {
    return resolvePropsGetter(inputProps, merged);
  }
  return mutablyMergeInto(merged as Record<string, any>, inputProps);
}

function copyInitialProps<T extends ElementType>(inputProps: PropsOf<T> | undefined): PropsOf<T> {
  const copiedProps = { ...inputProps } as Record<string, any>;

  // `copiedProps` is our fresh own-object copy, so iterating with `for...in` is safe here.
  // eslint-disable-next-line guard-for-in
  for (const propName in copiedProps) {
    const propValue = copiedProps[propName];
    if (isEventHandler(propName, propValue)) {
      copiedProps[propName] = wrapEventHandler(propValue);
    }
  }

  return copiedProps as PropsOf<T>;
}

/**
 * Merges two sets of props. In case of conflicts, the external props take precedence.
 */
function mutablyMergeInto<T extends ElementType>(
  mergedProps: Record<string, any>,
  externalProps: PropsOf<T> | undefined,
): PropsOf<T> {
  if (!externalProps) {
    return mergedProps as PropsOf<T>;
  }

  // eslint-disable-next-line guard-for-in
  for (const propName in externalProps) {
    const externalPropValue = externalProps[propName];

    switch (propName) {
      case 'style': {
        mergedProps[propName] = mergeObjects(
          mergedProps.style as React.CSSProperties | undefined,
          externalPropValue as React.CSSProperties | undefined,
        );
        break;
      }
      case 'className': {
        mergedProps[propName] = mergeClassNames(mergedProps.className, externalPropValue as string);
        break;
      }
      default: {
        if (isEventHandler(propName, externalPropValue)) {
          mergedProps[propName] = mergeEventHandlers(mergedProps[propName], externalPropValue);
        } else {
          mergedProps[propName] = externalPropValue;
        }
      }
    }
  }

  return mergedProps as PropsOf<T>;
}

function isEventHandler(key: string, value: unknown) {
  // This approach is more efficient than using a regex.
  const code0 = key.charCodeAt(0);
  const code1 = key.charCodeAt(1);
  const code2 = key.charCodeAt(2);
  return (
    code0 === 111 /* o */ &&
    code1 === 110 /* n */ &&
    code2 >= 65 /* A */ &&
    code2 <= 90 /* Z */ &&
    (typeof value === 'function' || typeof value === 'undefined')
  );
}

function isPropsGetter<T extends ElementType>(
  inputProps: InputProps<T>,
): inputProps is PropsGetter<T> {
  return typeof inputProps === 'function';
}

function resolvePropsGetter<T extends ElementType>(
  inputProps: InputProps<T>,
  previousProps: PropsOf<T>,
): PropsOf<T> {
  if (isPropsGetter(inputProps)) {
    return copyInitialProps(inputProps(previousProps));
  }

  return inputProps ?? (EMPTY_PROPS as PropsOf<T>);
}

function mergeEventHandlers(
  ourHandler: EventHandler | undefined,
  theirHandler: EventHandler | undefined,
) {
  if (!theirHandler) {
    return ourHandler;
  }
  if (!ourHandler) {
    return wrapEventHandler(theirHandler);
  }

  return markEventHandlerAsWrapped((...args: unknown[]) => {
    const event = args[0];

    if (isSyntheticEvent(event)) {
      const baseUIEvent = event as BaseUIEvent<typeof event>;

      makeEventPreventable(baseUIEvent);

      const result = theirHandler(...args);

      if (!baseUIEvent.baseUIHandlerPrevented) {
        ourHandler?.(...args);
      }

      return result;
    }

    const result = theirHandler(...args);
    ourHandler?.(...args);
    return result;
  });
}

function wrapEventHandler<Handler extends EventHandler>(
  handler: Handler,
): WithPreventBaseUIHandler<Handler>;
function wrapEventHandler(handler: undefined): undefined;
function wrapEventHandler(handler: EventHandler | undefined): EventHandler | undefined {
  if (!handler || handler[WRAPPED_EVENT_HANDLER]) {
    return handler;
  }

  return markEventHandlerAsWrapped((...args: unknown[]) => {
    const event = args[0];

    if (isSyntheticEvent(event)) {
      makeEventPreventable(event as BaseUIEvent<typeof event>);
    }

    return handler(...args);
  });
}

function markEventHandlerAsWrapped<Handler extends EventHandler>(handler: Handler): Handler {
  handler[WRAPPED_EVENT_HANDLER] = true;
  return handler;
}

export function makeEventPreventable<T extends React.SyntheticEvent>(event: BaseUIEvent<T>) {
  event.preventBaseUIHandler = () => {
    (event.baseUIHandlerPrevented as boolean) = true;
  };

  return event;
}

export function mergeClassNames(
  ourClassName: string | undefined,
  theirClassName: string | undefined,
) {
  if (theirClassName) {
    if (ourClassName) {
      // eslint-disable-next-line prefer-template
      return theirClassName + ' ' + ourClassName;
    }

    return theirClassName;
  }

  return ourClassName;
}

function isSyntheticEvent(event: unknown): event is React.SyntheticEvent {
  return event != null && typeof event === 'object' && 'nativeEvent' in event;
}
