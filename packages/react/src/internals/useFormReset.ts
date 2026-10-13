'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useFieldRootContext } from './field-root-context/FieldRootContext';
import { createChangeEventDetails } from './createBaseUIEventDetails';
import type { BaseUIChangeEventDetails } from './createBaseUIEventDetails';
import { REASONS } from './reasons';

export type FormResetEventDetails = BaseUIChangeEventDetails<typeof REASONS.formReset>;

/**
 * Returns a ref that lets a control restore its value when its form owner is reset. Attach it to
 * the control's input, or to an element containing its inputs (such as a group), through
 * `useMergedRefs` or `useRenderElement`, which run its cleanup. Unless the restore is canceled,
 * the surrounding field then returns to its pristine state.
 *
 * `onReset` runs before the browser restores the form's default values, and a trusted click on a
 * reset button lets React commit in between. A hidden input whose `checked` state React controls
 * must keep its `checked` attribute in sync with state so the native restore leaves it unchanged.
 */
export function useFormReset<T extends Element>(
  onReset: (eventDetails: FormResetEventDetails, element: T) => void,
) {
  const { reset: resetField } = useFieldRootContext();
  const onResetStable = useStableCallback(onReset);

  return React.useCallback(
    (element: T) =>
      // Listening on the root instead of the form lets React `onReset` handlers cancel the reset
      // first, and follows the input to whichever form owns it when the reset happens.
      addEventListener(element.getRootNode(), 'reset', (event) => {
        // The element is the control's input, or contains the inputs of a group, which may be
        // associated with the form through their `form` attribute. A form's elements share its
        // tree, so native `contains` is enough.
        if (
          event.defaultPrevented ||
          ![...(event.target as HTMLFormElement).elements].some((input) => element.contains(input))
        ) {
          return;
        }

        const eventDetails = createChangeEventDetails(REASONS.formReset, event);
        onResetStable(eventDetails, element);
        if (!eventDetails.isCanceled) {
          resetField();
        }
      }),
    [onResetStable, resetField],
  );
}
