import * as React from 'react';
import type { BaseUIEvent, WithBaseUIEvent } from './types';

type MergableProps<T extends React.ElementType> =
  | WithBaseUIEvent<React.ComponentPropsWithRef<T>>
  | ((
      otherProps: WithBaseUIEvent<React.ComponentPropsWithRef<T>>,
    ) => WithBaseUIEvent<React.ComponentPropsWithRef<T>>)
  | undefined;

/**
 * Merges multiple sets of React props. It follows the Object.assign pattern where the leftmost object's fields overwrite
 * the conflicting ones from others. This doesn't apply to event handlers, `className` and `style` props.
 * Event handlers are merged such that they are called in sequence (the leftmost one being called first),
 * and allows the user to prevent the subsequent event handlers from being
 * executed by attaching a `preventBaseUIHandler` method.
 * It also merges the `className` and `style` props, whereby the classes are concatenated
 * and the leftmost styles overwrite the subsequent ones.
 *
 * Props can either be provided as objects or as functions that take the previous props as an argument.
 * The function will receive the merged props up to that point (going from right to left):
 * so in the case of `(obj1, fn, obj2, obj3)`, `fn` will receive the merged props of `obj2` and `obj3`.
 * The function is responsible for chaining event handlers if needed (i.e. we don't run the merge logic).
 *
 * Event handlers returned by the functions are not automatically prevented when `preventBaseUIHandler` is called.
 * They must check `event.baseUIHandlerPrevented` themselves and bail out if it's true.
 *
 * @important **`ref` is not merged.**
 * @param props props to merge.
 * @returns the merged props.
 */
export function mergeReactProps<T extends React.ElementType>(
  ...props: MergableProps<T>[]
): WithBaseUIEvent<React.ComponentPropsWithRef<T>> {
  if (props.length === 0) {
    return {} as WithBaseUIEvent<React.ComponentPropsWithRef<T>>;
  }

  if (props.length === 1) {
    return resolvePropsGetter(props[0], {});
  }

  let merged = resolvePropsGetter(props[props.length - 1], {});

  for (let i = props.length - 2; i >= 0; i -= 1) {
    const propsOrPropsGetter = props[i];
    if (!propsOrPropsGetter) {
      continue;
    }

    if (isPropsGetter(propsOrPropsGetter)) {
      merged = propsOrPropsGetter(merged);
    } else {
      merged = merge(propsOrPropsGetter as WithBaseUIEvent<React.ComponentPropsWithRef<T>>, merged);
    }
  }

  return merged ?? ({} as WithBaseUIEvent<React.ComponentPropsWithRef<T>>);
}

function resolvePropsGetter<T extends React.ElementType>(
  propsOrPropsGetter: MergableProps<React.ElementType>,
  previousProps: WithBaseUIEvent<React.ComponentPropsWithRef<T>>,
) {
  if (isPropsGetter(propsOrPropsGetter)) {
    return propsOrPropsGetter(previousProps);
  }

  return propsOrPropsGetter ?? ({} as WithBaseUIEvent<React.ComponentPropsWithRef<T>>);
}

/**
 * Merges two sets of props. In case of conflicts, the external props take precedence.
 */
function merge<T extends React.ElementType>(
  externalProps: WithBaseUIEvent<React.ComponentPropsWithRef<T>> | undefined,
  internalProps: WithBaseUIEvent<React.ComponentPropsWithRef<T>> | undefined,
): WithBaseUIEvent<React.ComponentPropsWithRef<T>> {
  if (!externalProps) {
    if (!internalProps) {
      return {} as WithBaseUIEvent<React.ComponentPropsWithRef<T>>;
    }

    return internalProps;
  }

  if (!internalProps) {
    return externalProps;
  }

  return Object.entries(externalProps).reduce(
    (mergedProps, [propName, externalPropValue]) => {
      if (isEventHandler(propName, externalPropValue)) {
        mergedProps[propName] = mergeEventHandlers(externalPropValue, internalProps[propName]);
      } else if (propName === 'style') {
        mergedProps[propName] = mergeStyles(
          externalPropValue as React.CSSProperties,
          internalProps.style,
        );
      } else if (propName === 'className') {
        mergedProps[propName] = mergeClassNames(
          externalPropValue as string,
          internalProps.className,
        );
      } else {
        mergedProps[propName] = externalPropValue;
      }

      return mergedProps;
    },
    { ...internalProps } as React.ComponentPropsWithRef<T>,
  );
}

function isEventHandler(key: string, value: unknown) {
  // This approach is more efficient than using a regex.
  const thirdCharCode = key.charCodeAt(2);
  return (
    key[0] === 'o' &&
    key[1] === 'n' &&
    thirdCharCode >= 65 /* A */ &&
    thirdCharCode <= 90 /* Z */ &&
    typeof value === 'function'
  );
}

function isPropsGetter<T extends React.ComponentType>(
  propsOrPropsGetter: MergableProps<T>,
): propsOrPropsGetter is (
  props: WithBaseUIEvent<React.ComponentPropsWithRef<T>>,
) => WithBaseUIEvent<React.ComponentPropsWithRef<T>> {
  return typeof propsOrPropsGetter === 'function';
}

function mergeEventHandlers(theirHandler: Function, ourHandler: Function) {
  return (event: unknown) => {
    if (isSyntheticEvent(event)) {
      const baseUIEvent = event as BaseUIEvent<typeof event>;

      makeEventPreventable(baseUIEvent);

      const result = theirHandler(baseUIEvent);

      if (!baseUIEvent.baseUIHandlerPrevented) {
        ourHandler?.(baseUIEvent);
      }

      return result;
    }

    const result = theirHandler(event);
    ourHandler?.(event);
    return result;
  };
}

export function makeEventPreventable<T extends React.SyntheticEvent>(event: BaseUIEvent<T>) {
  event.preventBaseUIHandler = () => {
    (event.baseUIHandlerPrevented as boolean) = true;
  };

  return event;
}

function mergeStyles(
  theirStyle: React.CSSProperties | undefined,
  ourStyle: React.CSSProperties | undefined,
) {
  if (theirStyle || ourStyle) {
    return { ...ourStyle, ...theirStyle };
  }

  return undefined;
}

function mergeClassNames(theirClassName: string | undefined, ourClassName: string | undefined) {
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
