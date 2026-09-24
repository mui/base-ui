'use client';
import * as React from 'react';
import type {
  PaintSelectionController,
  PaintSelectionItem,
} from '../../internals/paint-selection/PaintSelectionController';
import type { CheckboxGroupContext } from '../CheckboxGroupContext';

export interface CheckboxPaintItem extends PaintSelectionItem {
  setChecked: (checked: boolean, event: PointerEvent) => void;
}
export const CheckboxGroupPaintSelectionContext = React.createContext<
  | {
      owner: CheckboxGroupContext['setValue'];
      controller: PaintSelectionController<CheckboxPaintItem>;
    }
  | undefined
>(undefined);
