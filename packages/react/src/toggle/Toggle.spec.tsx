import * as React from 'react';
import { expectType } from '#test-utils';
import { Toggle } from '@base-ui/react/toggle';
import type { ToggleIndicatorProps, ToggleProps } from '@base-ui/react/toggle';

<Toggle pressed onPressedChange={() => {}} />;

<Toggle.Root<'bold'>
  value="bold"
  onPressedChange={(pressed, eventDetails) => {
    expectType<boolean, typeof pressed>(pressed);
    expectType<Toggle.Root.ChangeEventDetails, typeof eventDetails>(eventDetails);
  }}
>
  <Toggle.Indicator match="unpressed" keepMounted />
</Toggle.Root>;

// @ts-expect-error value must match the Value type argument
<Toggle.Root<'bold'> value="italic" />;

// @ts-expect-error match only accepts pressed or unpressed
<Toggle.Indicator match="on" />;

const rootRef = React.createRef<HTMLButtonElement>();
const indicatorRef = React.createRef<HTMLSpanElement>();
<Toggle.Root ref={rootRef}>
  <Toggle.Indicator ref={indicatorRef} />
</Toggle.Root>;

expectType<ToggleProps<string>, Toggle.Props>({} as Toggle.Props);
expectType<ToggleProps<string>, Toggle.Root.Props>({} as Toggle.Root.Props);
expectType<ToggleIndicatorProps, Toggle.Indicator.Props>({} as Toggle.Indicator.Props);
expectType<Toggle.State, Toggle.Root.State>({} as Toggle.Root.State);
expectType<boolean, Toggle.Indicator.State['pressed']>(true);
