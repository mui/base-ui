import * as React from 'react';
import type { OwnerState } from './Checkbox.types';

export type CheckboxContextValue = OwnerState;

export const CheckboxContext = React.createContext<CheckboxContextValue | null>(null);
