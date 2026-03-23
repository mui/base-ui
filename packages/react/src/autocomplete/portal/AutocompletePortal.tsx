'use client';
import type * as React from 'react';
import { ComboboxPortal } from '../../combobox/portal/ComboboxPortal';
import type { FloatingPortal } from '../../floating-ui-react';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompletePortal = ComboboxPortal as AutocompletePortal;

/**
 * The state of the autocomplete portal component.
 */
export interface AutocompletePortalState {}

/**
 * The props of the autocomplete portal component.
 */
export interface AutocompletePortalProps extends FloatingPortal.Props<AutocompletePortalState> {
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted?: boolean | undefined;
  /**
   * A parent element to render the portal element into.
   */
  container?: FloatingPortal.Props<AutocompletePortalState>['container'] | undefined;
}

/**
 * The type of the autocomplete portal component.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export interface AutocompletePortal {
  (
    componentProps: AutocompletePortalProps & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element | null;
}

export namespace AutocompletePortal {
  export type State = AutocompletePortalState;
  export type Props = AutocompletePortalProps;
}
