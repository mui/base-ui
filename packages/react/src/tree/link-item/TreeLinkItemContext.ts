'use client';
import * as React from 'react';

/** Whether a part renders inside `<Tree.LinkItem>`, whose `<a>` can't contain a button. */
export const TreeLinkItemContext = React.createContext(false);
