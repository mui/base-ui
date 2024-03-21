function preventBaseUiDefault(this: { baseUiDefaultPrevented: boolean }) {
  this.baseUiDefaultPrevented = true;
}

export type BaseUiEventExtension = {
  /**
   * Whether the default action of the Base UI component has been prevented.
   */
  baseUiDefaultPrevented?: boolean;
  /**
   * Prevents the default action of the Base UI component.
   * Note that it does not prevent the default action that the browser executes.
   * To do that, you should call `event.preventDefault()` as well.
   */
  preventBaseUiDefault: () => void;
};

/**
 * Merges internal and external event handlers.
 * Augments the external event handler with a `preventBaseUiDefault` method that prevents calling the internal handler..
 *
 * @param ours The internal event handler.
 * @param theirs The external event handler.
 */
export function mergeEventHandlers<EventType extends React.SyntheticEvent>(
  ours: (event: EventType) => void,
  theirs?: (event: EventType & BaseUiEventExtension) => void,
) {
  return (event: EventType & BaseUiEventExtension) => {
    event.preventBaseUiDefault = preventBaseUiDefault;

    theirs?.(event);
    if (event.baseUiDefaultPrevented) {
      return;
    }

    ours?.(event);
  };
}
