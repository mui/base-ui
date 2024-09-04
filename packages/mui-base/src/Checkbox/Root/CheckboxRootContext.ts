'use client';

import * as React from 'react';
import type { CheckboxContextValue } from './CheckboxRoot.types';

export const CheckboxRootContext = React.createContext<CheckboxContextValue | null>(null);
