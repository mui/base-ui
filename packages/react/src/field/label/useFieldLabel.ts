'use client';
import * as React from 'react';
import { getTarget } from '@floating-ui/react/utils';
import { mergeProps } from '../../merge-props';
import { useFieldRootContext } from '../root/FieldRootContext';

export function useFieldLabel() {
  const { controlId, labelId } = useFieldRootContext();

  const getLabelProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps<'label'>(
        {
          id: labelId,
          htmlFor: controlId,
          onMouseDown(event) {
            const target = getTarget(event.nativeEvent) as HTMLElement | null;
            if (target?.closest('button,input,select,textarea')) {
              return;
            }

            // Prevent text selection when double clicking label.
            if (!event.defaultPrevented && event.detail > 1) {
              event.preventDefault();
            }
          },
        },
        externalProps,
      ),
    [controlId, labelId],
  );

  return React.useMemo(
    () => ({
      getLabelProps,
    }),
    [getLabelProps],
  );
}
