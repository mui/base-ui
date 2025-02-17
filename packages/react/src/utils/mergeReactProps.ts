import * as React from 'react';
import type { BaseUIEvent, WithBaseUIEvent } from './types';

/**
 * Merges multiple sets of React props such that their event handlers are called in sequence
 * (the leftmost one being called first), and allows the user to prevent the subsequent event handlers from being
 * executed by attaching a `preventBaseUIHandler` method.
 * It also merges the `className` and `style` props, whereby the classes are concatenated
 * and the leftmost styles overwrite the subsequent ones.
 * @important **`ref` is not merged.**
 * @param props props to merge.
 * @returns the merged props.
 */
export function mergeReactProps<T extends React.ElementType>(
  ...props: (WithBaseUIEvent<React.ComponentPropsWithRef<T>> | undefined)[]
): WithBaseUIEvent<React.ComponentPropsWithRef<T>> {
  if (props.length === 0) {
    return {} as WithBaseUIEvent<React.ComponentPropsWithRef<T>>;
  }

  if (props.length === 1) {
    return props[0] ?? ({} as WithBaseUIEvent<React.ComponentPropsWithRef<T>>);
  }

  let merged = merge(props[props.length - 2], props[props.length - 1]);

  for (let i = props.length - 3; i >= 0; i -= 1) {
    merged = merge(props[i], merged);
  }

  return merged ?? ({} as WithBaseUIEvent<React.ComponentPropsWithRef<T>>);
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

function mergeEventHandlers(theirHandler: Function, ourHandler: Function) {
  return (event: unknown) => {
    if (isSyntheticEvent(event)) {
      let isPrevented = false;
      const baseUIEvent = event as BaseUIEvent<typeof event>;

      baseUIEvent.preventBaseUIHandler = () => {
        isPrevented = true;
      };

      const result = theirHandler(baseUIEvent);

      if (!isPrevented) {
        ourHandler?.(baseUIEvent);
      }

      return result;
    }

    const result = theirHandler(event);
    ourHandler?.(event);
    return result;
  };
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
