'use client';
import * as React from 'react';

export interface FieldItemContext {
  /**
   * The `id` of the labelable element.
   * When `null` the association is implicit.
   */
  controlId: string | null | undefined;
  setControlId: React.Dispatch<React.SetStateAction<string | null | undefined>>;
  /**
   * The `id` of the label.
   */
  labelId: string | undefined;
  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
  /**
   * An array of `id`s of elements that provide an accessible description.
   */
  messageIds: string[];
  setMessageIds: React.Dispatch<React.SetStateAction<string[]>>;
}

/**
 * A context for providing [labelable elements](https://html.spec.whatwg.org/multipage/forms.html#category-label)\
 * with an accesible name and description.
 */
export const FieldItemContext = React.createContext<FieldItemContext | undefined>(undefined);

export function useFieldItemContext() {
  return React.useContext(FieldItemContext);
}
