'use client';
import * as React from 'react';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { PaintSelectionController } from '../../internals/paint-selection/PaintSelectionController';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';
import {
  CheckboxGroupPaintSelectionContext,
  CheckboxGroupPaintSelectionFeatureContext,
  type CheckboxGroupPaintSelectionFeature,
  type CheckboxPaintItem,
} from '../../checkbox-group/paint-selection-provider/CheckboxGroupPaintSelectionContext';

/**
 * Enables painting checkboxes with a mouse or pen in the checkbox group it wraps.
 * Touch gestures retain native scrolling.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Checkbox Group](https://base-ui.com/react/components/checkbox-group)
 */
export function CheckboxPaintSelectionProvider(props: CheckboxPaintSelectionProvider.Props) {
  const { children, disabled = false } = props;
  const feature = React.useMemo(
    (): CheckboxGroupPaintSelectionFeature => ({
      render: (groupChildren) => (
        <CheckboxGroupPaintSelection disabled={disabled}>
          {groupChildren}
        </CheckboxGroupPaintSelection>
      ),
    }),
    [disabled],
  );
  return (
    <CheckboxGroupPaintSelectionFeatureContext.Provider value={feature}>
      {children}
    </CheckboxGroupPaintSelectionFeatureContext.Provider>
  );
}

/** The paint selection of `Checkbox.PaintSelectionProvider`, rendered inside the group it wraps. */
function CheckboxGroupPaintSelection(props: { disabled: boolean; children: React.ReactNode }) {
  const { disabled, children } = props;
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
  React.useEffect(() => {
    if (disabled) {
      controller.dispose();
    }
  }, [controller, disabled]);
  const owner = group?.setValue;
  const context = React.useMemo(
    () => (owner && !disabled ? { owner, controller } : undefined),
    [owner, controller, disabled],
  );
  return (
    <CheckboxGroupPaintSelectionContext.Provider value={context}>
      {children}
    </CheckboxGroupPaintSelectionContext.Provider>
  );
}

export interface CheckboxPaintSelectionProviderProps {
  children?: React.ReactNode;
  /**
   * Whether painting is disabled. Clicking and keyboard interaction keep working.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace CheckboxPaintSelectionProvider {
  export type Props = CheckboxPaintSelectionProviderProps;
}
