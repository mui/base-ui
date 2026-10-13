'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useFieldRootContext } from './field-root-context/FieldRootContext';
import { createChangeEventDetails } from './createBaseUIEventDetails';
import type { BaseUIChangeEventDetails } from './createBaseUIEventDetails';
import { REASONS } from './reasons';

export type FormResetEventDetails = BaseUIChangeEventDetails<typeof REASONS.formReset>;

/**
 * Lets a control restore its value when its form owner is reset. `elementRef` is the control's
 * input, or an element containing its inputs (such as a group). Unless the restore is canceled,
 * the surrounding field then returns to its pristine state.
 *
 * `onReset` runs before the browser restores the form's default values, and a trusted click on a
 * reset button lets React commit in between. A hidden input whose `checked` state React controls
 * must keep its `checked` attribute in sync with state so the native restore leaves it unchanged.
 */
export function useFormReset(
  elementRef: React.RefObject<Element | null>,
  onReset: (eventDetails: FormResetEventDetails, input: HTMLInputElement) => void,
  enabled = true,
) {
  const { reset: resetField } = useFieldRootContext();
  const onResetStable = useStableCallback(onReset);

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    // Listening on the root instead of the form lets React `onReset` handlers cancel the reset
    // first, and follows the input to whichever form owns it when the reset happens.
    const root = elementRef.current?.getRootNode() ?? ownerDocument(null);
    return addEventListener(root, 'reset', (event) => {
      const element = elementRef.current;
      const input = (element && 'form' in element ? element : element?.querySelector('input')) as
        HTMLInputElement | null | undefined;
      if (!input || event.target !== input.form || event.defaultPrevented) {
        return;
      }

      const eventDetails = createChangeEventDetails(REASONS.formReset, event);
      onResetStable(eventDetails, input);
      if (!eventDetails.isCanceled) {
        resetField();
      }
    });
  }, [enabled, elementRef, onResetStable, resetField]);
}
