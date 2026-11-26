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
 * Returns a ref that lets a control restore its value when its form owner is reset. Attach it,
 * through `useMergedRefs` or `useRenderElement` (which run its cleanup), to each input the control
 * owns, such as every checkbox of a group: one reset runs `onReset` once, with every attached
 * input. Unless the restore is canceled, the surrounding field then returns to its pristine state.
 *
 * `onReset` runs before the browser restores the form's default values, and a trusted click on a
 * reset button lets React commit in between. A hidden input whose `checked` state React controls
 * must keep its `checked` attribute in sync with state so the native restore leaves it unchanged.
 * Listeners that cancel the reset after the document has handled it aren't honored.
 */
export function useFormReset(
  onReset: (eventDetails: FormResetEventDetails, inputs: HTMLInputElement[]) => void,
) {
  const { reset: resetField } = useFieldRootContext();
  const onResetStable = useStableCallback(onReset);

  return React.useMemo(() => {
    const inputs = new Set<HTMLInputElement>();
    let handledEvent: Event | undefined;
    return (input: HTMLInputElement) => {
      inputs.add(input);
      // Listening on the root instead of the form lets React `onReset` handlers cancel the reset
      // first, and follows the input to whichever form owns it when the reset happens.
      const removeListener = addEventListener(input.getRootNode(), 'reset', (event) => {
        if (event.defaultPrevented || event.target !== input.form || event === handledEvent) {
          return;
        }
        handledEvent = event;

        const eventDetails = createChangeEventDetails(REASONS.formReset, event);
        onResetStable(eventDetails, [...inputs]);
        if (!eventDetails.isCanceled) {
          resetField();
        }
      });
      return () => {
        inputs.delete(input);
        removeListener();
      };
    };
  }, [onResetStable, resetField]);
}
