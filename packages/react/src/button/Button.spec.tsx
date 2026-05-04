import * as React from 'react';
import { expectType } from '#test-utils';
import { Button } from '@base-ui/react/button';

<Button />;
<Button type="submit" form="form-id" name="action" />;

<Button nativeButton={false} render={<span />} />;
<Button nativeButton={false} render={(props) => <div {...props} />} />;
<Button nativeButton={false} disabled render={<span />} />;
<Button
  nativeButton={false}
  render={<div />}
  ref={(node) => {
    expectType<HTMLElement | null, typeof node>(node);
  }}
  onMouseDown={(event) => {
    expectType<EventTarget & HTMLElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;

<Button
  nativeButton
  ref={(node) => {
    expectType<HTMLButtonElement | null, typeof node>(node);
  }}
  onMouseDown={(event) => {
    expectType<EventTarget & HTMLButtonElement, typeof event.currentTarget>(event.currentTarget);
  }}
/>;

function App() {
  const nativeButtonRef = React.useRef<HTMLButtonElement>(null);
  const nonNativeButtonRef = React.useRef<HTMLElement>(null);
  const nativeButton = true as boolean;

  return (
    <React.Fragment>
      <Button
        ref={nativeButtonRef}
        render={<button type="button">Button</button>}
        nativeButton
        type="submit"
      />
      <Button ref={nonNativeButtonRef} render={<div />} nativeButton={false} />
      <Button
        nativeButton={nativeButton}
        ref={(node) => {
          expectType<HTMLElement | null, typeof node>(node);
        }}
        onMouseDown={(event) => {
          expectType<EventTarget & HTMLElement, typeof event.currentTarget>(event.currentTarget);
        }}
      />
    </React.Fragment>
  );
}

// @ts-expect-error -- 'type' is not a valid prop when 'nativeButton' is false
<Button nativeButton={false} type="submit" />;
