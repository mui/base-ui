import * as React from 'react';

export interface GroupRootContext {
  setLabelId: (id: string | undefined) => void;
}

export const GroupRootContext = React.createContext<GroupRootContext | undefined>(undefined);

if (process.env.NODE_ENV !== 'production') {
  GroupRootContext.displayName = 'GroupRootContext';
}

export function useGroupRootContext() {
  const context = React.useContext(GroupRootContext);
  if (context == null) {
    throw new Error('Base UI: Missing GroupRootContext provider');
  }

  return context;
}
