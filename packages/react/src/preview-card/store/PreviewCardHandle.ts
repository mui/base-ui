import type { PreviewCardStore, PreviewCardHandleStore } from './PreviewCardStore';
import { createNullPreviewCardStore } from './PreviewCardStore';
import { BasePopupHandle } from '../../utils/popups/popupHandle';

/**
 * Controls a PreviewCard imperatively and associates detached `PreviewCard.Trigger` components with
 * a `PreviewCard.Root`. Create one with `PreviewCard.createHandle()` and pass it to the `handle`
 * prop of the root and of any triggers rendered outside of it.
 *
 * The imperative methods take effect only while a root using this handle is mounted; calls made
 * before a root attaches (or after it unmounts) are ignored.
 */
export class PreviewCardHandle<Payload> extends BasePopupHandle<
  PreviewCardHandleStore<Payload>,
  PreviewCardStore<Payload>
> {
  constructor() {
    super(createNullPreviewCardStore<Payload>(), 'PreviewCard');
  }
}

/**
 * Creates a new handle to connect a PreviewCard.Root with detached PreviewCard.Trigger components.
 */
export function createPreviewCardHandle<Payload>(): PreviewCardHandle<Payload> {
  return new PreviewCardHandle<Payload>();
}
