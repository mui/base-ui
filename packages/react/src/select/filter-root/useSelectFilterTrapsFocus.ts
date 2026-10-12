'use client';
import { useSelectRootContext } from '../root/SelectRootContext';

/**
 * Whether the filterable popup traps focus like a modal dialog: a modal select opened by
 * keyboard or a fine pointer. Touch and assistive-technology clicks (which report no pointer
 * type) leave focus free.
 */
export function useSelectFilterTrapsFocus(): boolean {
  const store = useSelectRootContext();
  const modal = store.useState('modal');
  const openMethod = store.useState('openMethod');
  return modal && openMethod !== 'touch' && openMethod !== '';
}
