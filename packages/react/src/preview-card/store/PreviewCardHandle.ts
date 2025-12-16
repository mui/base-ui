import { PreviewCardStore } from './PreviewCardStore';

export class PreviewCardHandle<Payload> {
  /**
   * Internal store holding the preview card state.
   * @internal
   */
  public readonly store: PreviewCardStore<Payload>;

  constructor() {
    this.store = new PreviewCardStore<Payload>();
  }
}

/**
 * Creates a new handle to connect a PreviewCard.Root with detached PreviewCard.Trigger components.
 */
export function createPreviewCardHandle<Payload>(): PreviewCardHandle<Payload> {
  return new PreviewCardHandle<Payload>();
}
