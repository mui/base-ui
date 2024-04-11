import * as React from 'react';
import type { CheckboxOwnerState } from './Checkbox.types';

export type CheckboxContextValue = CheckboxOwnerState;

export const CheckboxContext = React.createContext<CheckboxContextValue | null>(null);
