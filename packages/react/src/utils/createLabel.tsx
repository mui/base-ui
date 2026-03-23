'use client';
import * as React from 'react';
import type { Store } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from './types';
import { useRenderElement } from './useRenderElement';
import type { FieldRoot } from '../field/root/FieldRoot';
import { useFieldRootContext } from '../field/root/FieldRootContext';
import { fieldValidityMapping } from '../field/utils/constants';
import { useLabel } from '../labelable-provider/useLabel';
import { getDefaultLabelId } from './resolveAriaLabelledBy';

/**
 * Factory that creates a Label component for components with a `labelId` store field.
 * Used by both Listbox.Label and Select.Label — the only difference between them
 * is which element the label is associated with (`listElement` vs `triggerElement`).
 *
 * @param useLabelContext - Hook that returns the store and the already-subscribed
 *   values needed for label wiring. The caller is responsible for calling `useStore`
 *   to subscribe to the control element and root ID reactively.
 */
export function createLabel(
  useLabelContext: () => {
    store: Store<{ labelId: string | undefined }>;
    rootId: string | undefined;
    controlElement: HTMLElement | null;
  },
) {
  return React.forwardRef(function Label(
    componentProps: LabelProps,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { render, className, ...elementProps } = componentProps;
    // Keep label id derived from the root and ignore runtime `id` overrides from untyped consumers.
    const elementPropsWithoutId = elementProps as typeof elementProps & {
      id?: string | undefined;
    };
    delete elementPropsWithoutId.id;

    const fieldRootContext = useFieldRootContext();
    const { store, rootId, controlElement } = useLabelContext();

    const defaultLabelId = getDefaultLabelId(rootId);

    const labelProps = useLabel({
      id: defaultLabelId,
      fallbackControlId: controlElement?.id ?? rootId,
      setLabelId(nextLabelId) {
        store.set('labelId', nextLabelId);
      },
    });

    return useRenderElement('div', componentProps, {
      ref: forwardedRef,
      state: fieldRootContext.state,
      props: [labelProps, elementProps],
      stateAttributesMapping: fieldValidityMapping,
    });
  });
}

export type LabelState = FieldRoot.State;

export interface LabelProps extends Omit<BaseUIComponentProps<'div', LabelState>, 'id'> {}
