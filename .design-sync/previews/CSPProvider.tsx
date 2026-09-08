import * as React from 'react';
import { Checkbox, CSPProvider, Switch } from '@base-ui/react';
import './CSPProvider.css';

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="m2.5 8.5 4 4 7-9" />
    </svg>
  );
}

// CSPProvider has no visible DOM/behavior of its own — its entire effect is
// applying a nonce to inline <style>/<script> tags Base UI renders under a
// strict Content Security Policy. This demonstrates that supplying a nonce
// does not change or break normal rendering of the children it wraps.
export const Basic = () => (
  <CSPProvider nonce="preview-nonce-123">
    <div className="Stack">
      <label className="Label">
        <Checkbox.Root defaultChecked className="Checkbox">
          <Checkbox.Indicator className="Indicator">
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Enable notifications
      </label>
      <label className="Label">
        <Switch.Root defaultChecked className="Switch">
          <Switch.Thumb className="Thumb" />
        </Switch.Root>
        Auto-save
      </label>
    </div>
  </CSPProvider>
);

// disableStyleElements is the other CSPProvider option, used when inline
// <style> tags are avoided entirely instead of nonced. It also has no
// visual effect on ordinary components like these.
export const DisableStyleElements = () => (
  <CSPProvider disableStyleElements>
    <div className="Stack">
      <label className="Label">
        <Checkbox.Root className="Checkbox">
          <Checkbox.Indicator className="Indicator">
            <CheckIcon />
          </Checkbox.Indicator>
        </Checkbox.Root>
        Subscribe to newsletter
      </label>
      <label className="Label">
        <Switch.Root className="Switch">
          <Switch.Thumb className="Thumb" />
        </Switch.Root>
        Airplane mode
      </label>
    </div>
  </CSPProvider>
);
