'use client';
import * as React from 'react';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  PaintSelectionController,
  type PaintSelectionChange,
} from '../../internals/paint-selection/PaintSelectionController';
import { useCheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';
import {
  CheckboxGroupPaintSelectionContext,
  CheckboxGroupPaintSelectionFeatureContext,
  type CheckboxGroupPaintSelectionFeature,
  type CheckboxPaintItem,
} from '../../checkbox-group/paint-selection-provider/CheckboxGroupPaintSelectionContext';

/**
 * Enables painting checkboxes with a mouse or pen in the checkbox group it wraps.
 * Dragging back to an earlier checkbox restores the items beyond it to their original state.
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
  // The value the last sample proposed, and the group value it built on. A controlled
  // owner can apply a proposal after later samples, so they build on the proposal
  // until the owner renders a different value.
  const gestureRef = React.useRef<{ value: string[]; proposal: string[] } | null>(null);
  const paint = useStableCallback(
    (changes: PaintSelectionChange<CheckboxPaintItem>[], event: PointerEvent) => {
      if (!group) {
        return;
      }
      const gesture = gestureRef.current;
      const base =
        gesture != null && haveSameItems(gesture.value, group.value)
          ? gesture.proposal
          : group.value;
      // Changes within a sample accumulate on the base.
      group.valueRef.current = base;
      try {
        for (const { item, checked } of changes) {
          item.setChecked(checked, event);
        }
        gestureRef.current = { value: group.value, proposal: group.valueRef.current ?? base };
      } finally {
        group.valueRef.current = null;
      }
    },
  );
  const controller = useRefWithInit(
    () =>
      new PaintSelectionController(paint, () => {
        gestureRef.current = null;
      }),
  ).current;
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

function haveSameItems(a: readonly string[], b: readonly string[]) {
  const items = new Set(b);
  return a.length === b.length && a.every((item) => items.has(item));
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
