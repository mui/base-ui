'use client';
import * as React from 'react';
import type { RegisteredVirtualizer } from '../../internals/virtualization/ListVirtualizationRegistry';

/**
 * The virtualizer currently registered with the select, or `null` when the list is static.
 *
 * Deliberately React state rather than a field on the select store. A virtualizer registers from
 * its own layout effect, and the parts that need to know while *rendering* — which props to give
 * `<CompositeList>`, whether the list still owns scrolling — must see it in the same frame. A
 * state update made during the layout-effect phase is flushed before paint; a store subscription
 * is installed passively, after it, so the first commit would render against a stale `null`.
 *
 * Parts that only need it inside an effect should read `virtualizationRegistry.virtualizer`
 * instead: layout effects run child-first, so the registration is already visible there, including
 * on the commit that performs it.
 */
export const SelectVirtualizationContext = React.createContext<RegisteredVirtualizer | null>(null);

/**
 * Returns the registered virtualizer, or `null` when the list is not virtualized.
 */
export function useSelectVirtualizer() {
  return React.useContext(SelectVirtualizationContext);
}
