'use client';
import * as React from 'react';
import { NonceContext } from './NonceContext';

/**
 * Provides a default nonce value for Base UI components that require inline `<style>` or `<script>` tags.
 *
 * Documentation: [Base UI Nonce Provider](https://base-ui.com/react/utils/nonce-provider)
 */
export function NonceProvider(props: NonceProvider.Props) {
  return <NonceContext.Provider value={props.nonce}>{props.children}</NonceContext.Provider>;
}

export interface NonceProviderProps {
  children?: React.ReactNode;
  /**
   * The nonce value to apply to inline `<style>` and `<script>` tags.
   */
  nonce?: string;
}

export namespace NonceProvider {
  export type Props = NonceProviderProps;
}
