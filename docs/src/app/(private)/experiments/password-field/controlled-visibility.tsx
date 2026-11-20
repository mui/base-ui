'use client';
import * as React from 'react';
import { PasswordFieldPreview as PasswordField } from '@base-ui/react/password-field';
import styles from './controlled-visibility.module.css';

export default function PasswordFieldControlledVisibility() {
  const id = React.useId();
  const [visible, setVisible] = React.useState(false);
  return (
    <PasswordField.Root
      id={id}
      visible={visible}
      onVisibleChange={setVisible}
      className={styles.Root}
    >
      <div className={styles.Character} data-visible={visible ? '' : undefined}>
        <Character />
      </div>
      <label htmlFor={id} className={styles.Label}>
        Password
      </label>
      <div className={styles.Control}>
        <PasswordField.Input className={styles.Input} placeholder="Enter your password" />
        <PasswordField.Toggle className={styles.Toggle} aria-label="Show password">
          <PasswordField.ToggleIndicator className={styles.Icon} match="masked">
            <EyeOffIcon />
          </PasswordField.ToggleIndicator>
          <PasswordField.ToggleIndicator className={styles.Icon} match="visible">
            <EyeIcon />
          </PasswordField.ToggleIndicator>
        </PasswordField.Toggle>
      </div>
    </PasswordField.Root>
  );
}

// Covers its eyes while the password is masked.
function Character() {
  return (
    <svg width="72" height="56" viewBox="0 0 72 56" fill="none" className={styles.CharacterSvg}>
      <rect x="15" y="5" width="42" height="50" className={styles.Head} strokeWidth="2" />
      <rect x="24" y="21" width="7" height="7" fill="currentColor" />
      <rect x="41" y="21" width="7" height="7" fill="currentColor" />
      <rect x="31" y="38" width="10" height="2" fill="currentColor" />
      <Hand x={10} />
      <Hand x={40} />
    </svg>
  );
}

function Hand({ x }: { x: number }) {
  return (
    <g className={styles.Hand}>
      <rect x={x} y="44" width="22" height="12" fill="currentColor" />
      <path
        d={`M${x + 5.5} 44v6M${x + 11} 44v6M${x + 16.5} 44v6`}
        className={styles.Fingers}
        strokeWidth="1"
      />
    </g>
  );
}

function EyeIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path
        d="M1.333 8s2.334-4.667 6.667-4.667S14.667 8 14.667 8 12.333 12.667 8 12.667 1.333 8 1.333 8Z"
        stroke="currentColor"
        strokeWidth="1"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function EyeOffIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path
        d="M2 2l12 12M7.067 7.067a2 2 0 0 0 2.8 2.8M6.267 3.467A6.467 6.467 0 0 1 8 3.333c4.333 0 6.667 4.667 6.667 4.667a11.333 11.333 0 0 1-1.6 2.2M4.133 4.133A11.333 11.333 0 0 0 1.333 8s2.334 4.667 6.667 4.667a6.467 6.467 0 0 0 2-.334"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
