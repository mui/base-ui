'use client';
import * as React from 'react';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { PaintSelectionController } from '../../internals/paint-selection/PaintSelectionController';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';
import {
  CheckboxGroupPaintSelectionContext,
  type CheckboxPaintItem,
} from '../../checkbox-group/paint-selection-provider/CheckboxGroupPaintSelectionContext';

/**
 * Enables painting checkboxes with a mouse or pen. Place inside a CheckboxGroup, around its checkboxes.
 * Doesn't render an HTML element. Touch gestures retain native scrolling.
 *
 * Documentation: [Base UI Checkbox Group](https://base-ui.com/react/components/checkbox-group)
 */
export function CheckboxPaintSelectionProvider(props: CheckboxPaintSelectionProvider.Props) {
  const group = useCheckboxGroupContext();
  const paint = useStableCallback(
    (items: CheckboxPaintItem[], checked: boolean, event: PointerEvent) => {
      if (!group) {
        return;
      }
      // Reconcile controlled state before each batch, then accumulate changes within that batch.
      group.valueRef.current = group.value;
      try {
        for (const item of items) {
          item.setChecked(checked, event);
        }
      } finally {
        group.valueRef.current = null;
      }
    },
  );
  const controller = useRefWithInit(() => new PaintSelectionController(paint)).current;
  useOnMount(controller.disposeEffect);
  const owner = group?.setValue;
  const context = React.useMemo(
    () => (owner ? { owner, controller } : undefined),
    [owner, controller],
  );
  return (
    <CheckboxGroupPaintSelectionContext.Provider value={context}>
      {props.children}
    </CheckboxGroupPaintSelectionContext.Provider>
  );
}

export interface CheckboxPaintSelectionProviderProps {
  children?: React.ReactNode;
}

export namespace CheckboxPaintSelectionProvider {
  export type Props = CheckboxPaintSelectionProviderProps;
}
