'use client';
import * as React from 'react';

export function useLabelable(params: useLabelable.Parameters): useLabelable.ReturnValue {
  const [controlId, setControlId] = React.useState<string | null | undefined>(
    params.initialControlId,
  );
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined);
  const [messageIds, setMessageIds] = React.useState<string[]>([]);

  return {
    controlId,
    setControlId,
    labelId,
    setLabelId,
    messageIds,
    setMessageIds,
  };
}

export namespace useLabelable {
  export interface Parameters {
    initialControlId: string | null | undefined;
  }

  export interface ReturnValue {
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
}
