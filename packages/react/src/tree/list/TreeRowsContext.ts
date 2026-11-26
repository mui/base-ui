'use client';
import * as React from 'react';
import type { TreeStore } from '../store/TreeStore';

/**
 * The store of the list rendering the rows from a function child. Items rendered as
 * plain children, or in a tree nested in a row, don't find their own store here, so
 * they hide themselves while out of view.
 */
export const TreeRowsContext = React.createContext<TreeStore<any, any> | null>(null);
