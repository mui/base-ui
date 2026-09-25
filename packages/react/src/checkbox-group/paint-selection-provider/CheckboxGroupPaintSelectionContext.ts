'use client';
import * as React from 'react';
import type {
  PaintSelectionController,
  PaintSelectionItem,
} from '../../internals/paint-selection/PaintSelectionController';
import type { CheckboxGroupContext } from '../CheckboxGroupContext';

/**
 * What `Checkbox.PaintSelectionProvider` hands to the checkbox group directly inside it.
 * Only the provider imports the paint implementation, so groups without it don't bundle it.
 */
export interface CheckboxGroupPaintSelectionFeature {
  /** Wraps the group's children with the paint implementation, which reads the group context. */
  render: (children: React.ReactNode) => React.ReactNode;
}

/**
 * Non-null only directly below a provider. The group that consumes it resets it, so a
 * nested group stays unpaintable unless it has its own provider.
 */
export const CheckboxGroupPaintSelectionFeatureContext = React.createContext<
  CheckboxGroupPaintSelectionFeature | undefined
>(undefined);

export interface CheckboxPaintItem extends PaintSelectionItem {
  setChecked: (checked: boolean, event: PointerEvent) => void;
}

/** The paint controller of a group, provided to its checkboxes. */
export const CheckboxGroupPaintSelectionContext = React.createContext<
  | {
      owner: CheckboxGroupContext['setValue'];
      controller: PaintSelectionController<CheckboxPaintItem>;
    }
  | undefined
>(undefined);
