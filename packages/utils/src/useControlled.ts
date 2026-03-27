'use client';
// TODO: uncomment once we enable eslint-plugin-react-compiler // eslint-disable-next-line react-compiler/react-compiler -- process.env never changes, dependency arrays are intentionally ignored
/* eslint-disable react-hooks/rules-of-hooks, react-hooks/exhaustive-deps */
import * as React from 'react';

let deepEqual: (a: any, b: any) => boolean;

export interface UseControlledProps<T = unknown> {
  /**
   * Holds the component value when it's controlled.
   */
  controlled: T | undefined;
  /**
   * The default value when uncontrolled.
   */
  default: T | undefined;
  /**
   * The component name displayed in warnings.
   */
  name: string;
  /**
   * The name of the state variable displayed in warnings.
   */
  state?: string | undefined;
}

export function useControlled<T = unknown>({
  controlled,
  default: defaultProp,
  name,
  state = 'value',
}: UseControlledProps<T>): [T, (newValue: T | ((prevValue: T) => T)) => void] {
  // isControlled is ignored in the hook dependency lists as it should never change.
  const { current: isControlled } = React.useRef(controlled !== undefined);
  const [valueState, setValue] = React.useState(defaultProp);
  const value = isControlled ? controlled : valueState;

  if (process.env.NODE_ENV !== 'production') {
    React.useEffect(() => {
      if (isControlled !== (controlled !== undefined)) {
        console.error(
          [
            `Base UI: A component is changing the ${
              isControlled ? '' : 'un'
            }controlled ${state} state of ${name} to be ${isControlled ? 'un' : ''}controlled.`,
            'Elements should not switch from uncontrolled to controlled (or vice versa).',
            `Decide between using a controlled or uncontrolled ${name} ` +
              'element for the lifetime of the component.',
            "The nature of the state is determined during the first render. It's considered controlled if the value is not `undefined`.",
            'More info: https://fb.me/react-controlled-components',
          ].join('\n'),
        );
      }
    }, [state, name, controlled]);

    const { current: defaultValue } = React.useRef(defaultProp);

    React.useEffect(() => {
      if (!isControlled && !deepEqual(defaultValue, defaultProp)) {
        console.error(
          [
            `Base UI: A component is changing the default ${state} state of an uncontrolled ${name} after being initialized. ` +
              `To suppress this warning opt to use a controlled ${name}.`,
          ].join('\n'),
        );
      }
    }, [defaultProp]);
  }

  const setValueIfUncontrolled = React.useCallback((newValue: React.SetStateAction<T>) => {
    if (!isControlled) {
      setValue(newValue as T);
    }
  }, []);

  return [value as T, setValueIfUncontrolled];
}
if (process.env.NODE_ENV !== 'production') {
  deepEqual = (a: any, b: any) => {
    if (a === b) {
      return true;
    }

    // Handle NaN and null/primitive mismatches
    if (!(a instanceof Object) || !(b instanceof Object)) {
      return Number.isNaN(a) && Number.isNaN(b);
    }

    if (a.constructor !== b.constructor) {
      return false;
    }

    if (a instanceof Date || a instanceof RegExp) {
      return a.toString() === b.toString();
    }

    // Convert Maps/Sets to Arrays to "cheat" and use the same logic
    const arrA = a instanceof Set || a instanceof Map ? Array.from(a) : null;
    const arrB = b instanceof Set || b instanceof Map ? Array.from(b) : null;

    // If one is a Map/Set and the other isn't, they aren't equal
    if (!!arrA !== !!arrB) {
      return false;
    }

    if (arrA && arrB) {
      if (arrA.length !== arrB.length) {
        return false;
      }
      // Sets are unordered, so this only works for "Deep Equal" if
      // the order happens to match or if you sort them (sorting is expensive).
      return arrA.every((val, i) => deepEqual(val, arrB[i]));
    }

    // Standard Array/Object logic
    const keys = Object.keys(a);

    if (keys.length !== Object.keys(b).length) {
      return false;
    }

    return keys.every(
      (key) => Object.prototype.hasOwnProperty.call(b, key) && deepEqual(a[key], b[key]),
    );
  };
}
