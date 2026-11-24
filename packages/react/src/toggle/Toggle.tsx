// No 'use client' here: Server Components read `Toggle.Root` and `Toggle.Indicator`,
// which isn't possible on a client reference.
import * as React from 'react';
import { ToggleRoot } from './root/ToggleRoot';
import type {
  ToggleState,
  ToggleProps,
  ToggleChangeEventReason,
  ToggleChangeEventDetails,
} from './root/ToggleRoot';
import { ToggleIndicator } from './indicator/ToggleIndicator';

const ToggleComponent = React.forwardRef(function Toggle(
  props: ToggleProps<string>,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  return <ToggleRoot {...props} ref={forwardedRef} />;
}) as typeof ToggleRoot;

/**
 * A two-state button that can be on or off.
 * Renders a `<button>` element.
 *
 * Rendering `<Toggle>` directly is deprecated. Use `<Toggle.Root>` instead.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 */
export const Toggle = ToggleComponent as {
  /**
   * A two-state button that can be on or off.
   * Renders a `<button>` element.
   *
   * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
   *
   * @deprecated Use `<Toggle.Root>` instead.
   */
  <Value extends string>(
    props: Toggle.Props<Value> & React.RefAttributes<HTMLButtonElement>,
  ): React.JSX.Element;
  /**
   * A two-state button that can be on or off.
   * Renders a `<button>` element.
   *
   * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
   */
  Root: typeof ToggleRoot;
  /**
   * Indicates whether the toggle is pressed.
   * Renders a `<span>` element that is hidden from assistive technology, so label the toggle on
   * `Toggle.Root` with text children or `aria-label`.
   *
   * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
   */
  Indicator: typeof ToggleIndicator;
};

Toggle.Root = ToggleRoot;
Toggle.Indicator = ToggleIndicator;

export type {
  ToggleState,
  ToggleProps,
  ToggleChangeEventReason,
  ToggleChangeEventDetails,
} from './root/ToggleRoot';

export namespace Toggle {
  export type State = ToggleState;
  export type Props<TValue extends string = string> = ToggleProps<TValue>;
  export type ChangeEventReason = ToggleChangeEventReason;
  export type ChangeEventDetails = ToggleChangeEventDetails;

  /**
   * A two-state button that can be on or off.
   * Renders a `<button>` element.
   *
   * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
   */
  export type Root = typeof ToggleRoot;
  export namespace Root {
    export type State = ToggleState;
    export type Props<TValue extends string = string> = ToggleProps<TValue>;
    export type ChangeEventReason = ToggleChangeEventReason;
    export type ChangeEventDetails = ToggleChangeEventDetails;
  }

  /**
   * Indicates whether the toggle is pressed.
   * Renders a `<span>` element that is hidden from assistive technology, so label the toggle on
   * `Toggle.Root` with text children or `aria-label`.
   *
   * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
   */
  export type Indicator = typeof ToggleIndicator;
  export namespace Indicator {
    export type State = ToggleIndicator.State;
    export type Props = ToggleIndicator.Props;
  }
}
