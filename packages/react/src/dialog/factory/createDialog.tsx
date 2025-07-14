export interface TypedDialogHandle<TPayload> {
  readonly id: string;
  readonly __payloadType: TPayload;
}

export function createDialog<TPayload = any>(id: string): TypedDialogHandle<TPayload> {
  return {
    id,
    __payloadType: undefined as TPayload,
  };
}
