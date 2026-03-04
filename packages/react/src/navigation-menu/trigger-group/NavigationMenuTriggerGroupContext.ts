'use client';
import * as React from 'react';

export const NavigationMenuTriggerGroupContext = React.createContext(false);

if (process.env.NODE_ENV !== 'production') {
  NavigationMenuTriggerGroupContext.displayName = 'NavigationMenuTriggerGroupContext';
}

export function useNavigationMenuTriggerGroupContext() {
  return React.useContext(NavigationMenuTriggerGroupContext);
}
