import * as React from 'react';
import type { BaseUIEvent, WithBaseUIEvent } from './types';

/**
 * Merges multiple sets of React props such that their event handlers are called in sequence (the user's
 * before our internal ones), and allows the user to prevent the internal event handlers from being
 * executed by attaching a `preventBaseUIHandler` method. It also merges the `className` and `style` props, whereby
 * the classes are concatenated and the user's styles overwrite the internal ones.
 * @important **`ref` is not merged.**
 * @param externalProps the user's external props.
 * @param internalProps our own internal props.
 * @returns the merged props.
 */
export function mergeReactProps<T extends React.ElementType>(
  externalProps: WithBaseUIEvent<React.ComponentPropsWithRef<T>> | undefined,
  ...internalProps: React.ComponentPropsWithRef<T>[]
): WithBaseUIEvent<React.ComponentPropsWithRef<T>> {
  let mergedInternalProps: WithBaseUIEvent<React.ComponentPropsWithRef<T>> = internalProps[0];
  for (let i = 1; i < internalProps.length; i += 1) {
    mergedInternalProps = merge(mergedInternalProps, internalProps[i]);
  }

  return merge(externalProps, mergedInternalProps as React.ComponentPropsWithRef<T>);
}

function merge<T extends React.ElementType>(
  externalProps: WithBaseUIEvent<React.ComponentPropsWithRef<T>> | undefined,
  internalProps: React.ComponentPropsWithRef<T>,
): WithBaseUIEvent<React.ComponentPropsWithRef<T>> {
  if (!externalProps) {
    return internalProps;
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
    { ...internalProps },
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

function mergeEventHandlers(theirHandler: any, ourHandler: any) {
  return (event: React.SyntheticEvent | {}) => {
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
    return { ...ourStyle, ...(theirStyle || {}) };
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

function isSyntheticEvent(event: React.SyntheticEvent | unknown): event is React.SyntheticEvent {
  return event != null && typeof event === 'object' && 'nativeEvent' in event;
}
