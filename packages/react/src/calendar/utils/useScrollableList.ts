import * as React from 'react';

// TODO: Replace with Composite when possible.
/**
 * Internal utility hook to handle a the focus and scroll in a list of options / cells:
 * - Focuses the first tabbable child on mount if `props.focusOnMount` is `true`.
 * - Scrolls the scroller to center the focused element if it is not visible.
 * @param {useScrollableList.Parameters} parameters The parameters of the hook.
 */
export function useScrollableList(parameters: useScrollableList.Parameters) {
  const { focusOnMount = false, ref } = parameters;
  const initialFocusOnMount = React.useRef(focusOnMount);

  React.useEffect(() => {
    if (ref.current === null) {
      return;
    }

    const tabbableButton = ref.current.querySelector<HTMLElement>('[tabindex="0"]');
    if (!tabbableButton) {
      return;
    }

    if (initialFocusOnMount.current) {
      tabbableButton.focus();
    }

    // Taken from useScroll in x-data-grid, but vertically centered
    const offsetHeight = tabbableButton.offsetHeight;
    const offsetTop = tabbableButton.offsetTop;

    const clientHeight = ref.current.clientHeight;
    const scrollTop = ref.current.scrollTop;

    const elementBottom = offsetTop + offsetHeight;

    if (offsetHeight > clientHeight || offsetTop < scrollTop) {
      // Button already visible
      return;
    }

    ref.current.scrollTop = elementBottom - clientHeight / 2 - offsetHeight / 2;
  }, [ref]);
}

export namespace useScrollableList {
  export interface PublicParameters {
    /**
     * If `true`, the first tabbable children inside this component will be focused on mount.
     * Warning: If several components are rendered at the same time with focusOnMount={true}, the result might be unpredictable.
     * @default false
     */
    focusOnMount?: boolean;
  }

  export interface Parameters extends PublicParameters {
    /**
     * The ref applied to the scrollable list.
     */
    ref: React.RefObject<HTMLElement | null>;
  }
}
