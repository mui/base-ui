'use client';
import * as React from 'react';
import * as Toggle from '@base-ui/react/toggle';
import styles from './index.module.css';

export default function ExampleToggleIcon() {
  return (
    <Toggle.Root aria-label="Mute" className={styles.Button}>
      <Toggle.Indicator className={styles.Indicator} match="unpressed">
        <VolumeIcon />
      </Toggle.Indicator>
      <Toggle.Indicator className={styles.Indicator} match="pressed">
        <VolumeMutedIcon />
      </Toggle.Indicator>
    </Toggle.Root>
  );
}

function VolumeIcon(props: React.ComponentProps<'svg'>) {
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
        d="M2 6h2.5L8 3v10L4.5 10H2V6ZM10.5 6a2.5 2.5 0 0 1 0 4M12 4a5 5 0 0 1 0 8"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VolumeMutedIcon(props: React.ComponentProps<'svg'>) {
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
        d="M2 6h2.5L8 3v10L4.5 10H2V6ZM10.5 6l3 4M13.5 6l-3 4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
