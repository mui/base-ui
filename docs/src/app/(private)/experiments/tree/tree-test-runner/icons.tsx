import * as React from 'react';
import type { TestStatus } from './suite';

export function ChevronIcon(props: React.ComponentProps<'svg'>) {
  return (
    <StrokeIcon viewBox="0 0 12 12" {...props}>
      <path d="M4.5 2L8.5 6L4.5 10" />
    </StrokeIcon>
  );
}

export function PlayIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden {...props}>
      <path d="M5 3.5v9l7-4.5-7-4.5z" />
    </svg>
  );
}

export function StopIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden {...props}>
      <rect x="4" y="4" width="8" height="8" />
    </svg>
  );
}

export function RerunIcon(props: React.ComponentProps<'svg'>) {
  return (
    <StrokeIcon {...props}>
      <path d="M12.5 8a4.5 4.5 0 1 1-1.32-3.18" />
      <path d="M11.5 2v3h-3" />
    </StrokeIcon>
  );
}

export function ExpandAllIcon(props: React.ComponentProps<'svg'>) {
  return (
    <StrokeIcon {...props}>
      <path d="M5 6l3-3 3 3M5 10l3 3 3-3" />
    </StrokeIcon>
  );
}

export function CollapseAllIcon(props: React.ComponentProps<'svg'>) {
  return (
    <StrokeIcon {...props}>
      <path d="M5 3l3 3 3-3M5 13l3-3 3 3" />
    </StrokeIcon>
  );
}

export function KeyboardIcon(props: React.ComponentProps<'svg'>) {
  return (
    <StrokeIcon {...props}>
      <rect x="1.5" y="4" width="13" height="8" rx="1" />
      <path d="M4 6.75h.01M6.67 6.75h.01M9.33 6.75h.01M12 6.75h.01M5.5 9.5h5" />
    </StrokeIcon>
  );
}

const STATUS_PATHS: Record<TestStatus, React.ReactNode> = {
  idle: <circle cx="8" cy="8" r="5" />,
  queued: (
    <React.Fragment>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v3l2 1.5" />
    </React.Fragment>
  ),
  running: <path d="M8 2.5a5.5 5.5 0 1 1-5.5 5.5" />,
  passed: <path d="M3 8.5l3.25 3.25L13 4.5" />,
  failed: (
    <React.Fragment>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M6 6l4 4M10 6l-4 4" />
    </React.Fragment>
  ),
  skipped: (
    <React.Fragment>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M4.25 11.75l7.5-7.5" />
    </React.Fragment>
  ),
};

export function StatusIcon(props: React.ComponentProps<'svg'> & { status: TestStatus }) {
  const { status, ...other } = props;
  return (
    <StrokeIcon data-status={status} {...other}>
      {STATUS_PATHS[status]}
    </StrokeIcon>
  );
}

function StrokeIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    />
  );
}
