import type * as React from 'react';

export function mergeRefs<T>(...refs: React.Ref<T>[]) {
  return (value: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref) {
        ref.current = value;
      }
    });
  };
}
