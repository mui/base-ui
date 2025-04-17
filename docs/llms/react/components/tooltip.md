---
title: Tooltip
subtitle: A popup that appears when an element is hovered or focused, showing a hint for sighted users.
description: A high-quality, unstyled React tooltip component that appears when an element is hovered or focused, showing a hint for sighted users.
---
# Tooltip

<Meta name="description" content="A high-quality, unstyled React tooltip component that appears when an element is hovered or focused, showing a hint for sighted users." />

## Demo

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Panel {
  display: flex;
  gap: 1px;
  border: 1px solid var(--color-gray-200);
  background-color: var(--color-gray-50);
  border-radius: 0.375rem;
  padding: 0.125rem;
}

.Button {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  margin: 0;
  outline: 0;
  border: 0;
  border-radius: 0.25rem;
  background-color: transparent;
  color: var(--color-gray-900);
  user-select: none;

  &[data-popup-open] {
    background-color: var(--color-gray-100);
  }

  &:focus-visible {
    background-color: transparent;
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }

  @media (hover: hover) {
    &:hover {
      background-color: var(--color-gray-100);
    }
  }

  &:active {
    background-color: var(--color-gray-200);
  }
}

.Icon {
  width: 1rem;
  height: 1rem;
}

.Popup {
  box-sizing: border-box;
  font-size: 0.875rem;
  line-height: 1.25rem;
  display: flex;
  flex-direction: column;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background-color: canvas;
  transform-origin: var(--transform-origin);
  transition:
    transform 150ms,
    opacity 150ms;

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
    transform: scale(0.9);
  }

  &[data-instant] {
    transition-duration: 0ms;
  }

  @media (prefers-color-scheme: light) {
    outline: 1px solid var(--color-gray-200);
    box-shadow:
      0 10px 15px -3px var(--color-gray-200),
      0 4px 6px -4px var(--color-gray-200);
  }

  @media (prefers-color-scheme: dark) {
    outline: 1px solid var(--color-gray-300);
    outline-offset: -1px;
  }
}

.Arrow {
  display: flex;

  &[data-side='top'] {
    bottom: -8px;
    rotate: 180deg;
  }

  &[data-side='bottom'] {
    top: -8px;
    rotate: 0deg;
  }

  &[data-side='left'] {
    right: -13px;
    rotate: 90deg;
  }

  &[data-side='right'] {
    left: -13px;
    rotate: -90deg;
  }
}

.ArrowFill {
  fill: canvas;
}

.ArrowOuterStroke {
  @media (prefers-color-scheme: light) {
    fill: var(--color-gray-200);
  }
}

.ArrowInnerStroke {
  @media (prefers-color-scheme: dark) {
    fill: var(--color-gray-300);
  }
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';
import styles from './index.module.css';

export default function ExampleTooltip() {
  return (
    <Tooltip.Provider>
      <div className={styles.Panel}>
        <Tooltip.Root>
          <Tooltip.Trigger aria-label="Bold" className={styles.Button}>
            <BoldIcon className={styles.Icon} />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={10}>
              <Tooltip.Popup className={styles.Popup}>
                <Tooltip.Arrow className={styles.Arrow}>
                  <ArrowSvg />
                </Tooltip.Arrow>
                Bold
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger aria-label="Italic" className={styles.Button}>
            <ItalicIcon className={styles.Icon} />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={10}>
              <Tooltip.Popup className={styles.Popup}>
                <Tooltip.Arrow className={styles.Arrow}>
                  <ArrowSvg />
                </Tooltip.Arrow>
                Italic
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger aria-label="Underline" className={styles.Button}>
            <UnderlineIcon className={styles.Icon} />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={10}>
              <Tooltip.Popup className={styles.Popup}>
                <Tooltip.Arrow className={styles.Arrow}>
                  <ArrowSvg />
                </Tooltip.Arrow>
                Underline
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className={styles.ArrowFill}
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className={styles.ArrowOuterStroke}
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className={styles.ArrowInnerStroke}
      />
    </svg>
  );
}

function BoldIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentcolor" {...props}>
      <path d="M3.73353 2.13333C3.4386 2.13333 3.2002 2.37226 3.2002 2.66666C3.2002 2.96106 3.4386 3.2 3.73353 3.2H4.26686V12.8H3.73353C3.4386 12.8 3.2002 13.0389 3.2002 13.3333C3.2002 13.6277 3.4386 13.8667 3.73353 13.8667H9.86686C11.7783 13.8667 13.3335 12.3115 13.3335 10.4C13.3335 8.9968 12.4945 7.78881 11.2929 7.24375C11.8897 6.70615 12.2669 5.93066 12.2669 5.06666C12.2669 3.44906 10.9506 2.13333 9.33353 2.13333H3.73353ZM6.93353 3.2H8.26686C9.29619 3.2 10.1335 4.03733 10.1335 5.06666C10.1335 6.096 9.29619 6.93333 8.26686 6.93333H6.93353V3.2ZM6.93353 8H7.73353H8.26686C9.59006 8 10.6669 9.0768 10.6669 10.4C10.6669 11.7232 9.59006 12.8 8.26686 12.8H6.93353V8Z" />
    </svg>
  );
}

function ItalicIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentcolor" {...props}>
      <path d="M8.52599 2.12186C8.48583 2.12267 8.44578 2.1265 8.4062 2.13332H6.93328C6.86261 2.13232 6.79244 2.14538 6.72686 2.17173C6.66127 2.19808 6.60158 2.23721 6.55125 2.28683C6.50092 2.33646 6.46096 2.39559 6.43368 2.46079C6.4064 2.526 6.39235 2.59597 6.39235 2.66665C6.39235 2.73733 6.4064 2.80731 6.43368 2.87251C6.46096 2.93772 6.50092 2.99685 6.55125 3.04647C6.60158 3.0961 6.66127 3.13522 6.72686 3.16157C6.79244 3.18793 6.86261 3.20099 6.93328 3.19999H7.70099L6.69057 12.8H5.86661C5.79594 12.799 5.72577 12.812 5.66019 12.8384C5.59461 12.8648 5.53492 12.9039 5.48459 12.9535C5.43425 13.0031 5.39429 13.0623 5.36701 13.1275C5.33973 13.1927 5.32568 13.2626 5.32568 13.3333C5.32568 13.404 5.33973 13.474 5.36701 13.5392C5.39429 13.6044 5.43425 13.6635 5.48459 13.7131C5.53492 13.7628 5.59461 13.8019 5.66019 13.8282C5.72577 13.8546 5.79594 13.8677 5.86661 13.8667H9.06661C9.13729 13.8677 9.20745 13.8546 9.27304 13.8282C9.33862 13.8019 9.39831 13.7628 9.44864 13.7131C9.49897 13.6635 9.53894 13.6044 9.56622 13.5392C9.5935 13.474 9.60754 13.404 9.60754 13.3333C9.60754 13.2626 9.5935 13.1927 9.56622 13.1275C9.53894 13.0623 9.49897 13.0031 9.44864 12.9535C9.39831 12.9039 9.33862 12.8648 9.27304 12.8384C9.20745 12.812 9.13729 12.799 9.06661 12.8H8.2989L9.30932 3.19999H10.1333C10.204 3.20099 10.2741 3.18793 10.3397 3.16157C10.4053 3.13522 10.465 3.0961 10.5153 3.04647C10.5656 2.99685 10.6056 2.93772 10.6329 2.87251C10.6602 2.80731 10.6742 2.73733 10.6742 2.66665C10.6742 2.59597 10.6602 2.526 10.6329 2.46079C10.6056 2.39559 10.5656 2.33646 10.5153 2.28683C10.465 2.23721 10.4053 2.19808 10.3397 2.17173C10.2741 2.14538 10.204 2.13232 10.1333 2.13332H8.66349C8.61807 2.12555 8.57207 2.12171 8.52599 2.12186Z" />
    </svg>
  );
}

function UnderlineIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentcolor" {...props}>
      <path d="M3.73331 2.13332C3.66264 2.13232 3.59247 2.14538 3.52689 2.17173C3.46131 2.19809 3.40161 2.23721 3.35128 2.28684C3.30095 2.33646 3.26099 2.39559 3.23371 2.4608C3.20643 2.526 3.19238 2.59598 3.19238 2.66666C3.19238 2.73734 3.20643 2.80731 3.23371 2.87252C3.26099 2.93772 3.30095 2.99685 3.35128 3.04648C3.40161 3.0961 3.46131 3.13523 3.52689 3.16158C3.59247 3.18793 3.66264 3.20099 3.73331 3.19999V7.99999C3.73331 10.224 5.55144 12.2667 7.99998 12.2667C10.4485 12.2667 12.2666 10.224 12.2666 7.99999V3.19999C12.3373 3.20099 12.4075 3.18793 12.4731 3.16158C12.5386 3.13523 12.5983 3.0961 12.6487 3.04648C12.699 2.99685 12.739 2.93772 12.7662 2.87252C12.7935 2.80731 12.8076 2.73734 12.8076 2.66666C12.8076 2.59598 12.7935 2.526 12.7662 2.4608C12.739 2.39559 12.699 2.33646 12.6487 2.28684C12.5983 2.23721 12.5386 2.19809 12.4731 2.17173C12.4075 2.14538 12.3373 2.13232 12.2666 2.13332H10.1333C10.0626 2.13232 9.99247 2.14538 9.92689 2.17173C9.8613 2.19809 9.80161 2.23721 9.75128 2.28684C9.70095 2.33646 9.66099 2.39559 9.63371 2.4608C9.60643 2.526 9.59238 2.59598 9.59238 2.66666C9.59238 2.73734 9.60643 2.80731 9.63371 2.87252C9.66099 2.93772 9.70095 2.99685 9.75128 3.04648C9.80161 3.0961 9.8613 3.13523 9.92689 3.16158C9.99247 3.18793 10.0626 3.20099 10.1333 3.19999V8.97187C10.1333 10.0855 9.32179 11.0818 8.21352 11.1896C6.94152 11.3138 5.86665 10.3136 5.86665 9.06666V3.19999C5.93732 3.20099 6.00748 3.18793 6.07307 3.16158C6.13865 3.13523 6.19834 3.0961 6.24867 3.04648C6.299 2.99685 6.33897 2.93772 6.36625 2.87252C6.39353 2.80731 6.40757 2.73734 6.40757 2.66666C6.40757 2.59598 6.39353 2.526 6.36625 2.4608C6.33897 2.39559 6.299 2.33646 6.24867 2.28684C6.19834 2.23721 6.13865 2.19809 6.07307 2.17173C6.00748 2.14538 5.93732 2.13232 5.86665 2.13332H3.73331ZM3.73331 13.3333C3.66264 13.3323 3.59247 13.3454 3.52689 13.3717C3.46131 13.3981 3.40161 13.4372 3.35128 13.4868C3.30095 13.5365 3.26099 13.5956 3.23371 13.6608C3.20643 13.726 3.19238 13.796 3.19238 13.8667C3.19238 13.9373 3.20643 14.0073 3.23371 14.0725C3.26099 14.1377 3.30095 14.1969 3.35128 14.2465C3.40161 14.2961 3.46131 14.3352 3.52689 14.3616C3.59247 14.3879 3.66264 14.401 3.73331 14.4H12.2666C12.3373 14.401 12.4075 14.3879 12.4731 14.3616C12.5386 14.3352 12.5983 14.2961 12.6487 14.2465C12.699 14.1969 12.739 14.1377 12.7662 14.0725C12.7935 14.0073 12.8076 13.9373 12.8076 13.8667C12.8076 13.796 12.7935 13.726 12.7662 13.6608C12.739 13.5956 12.699 13.5365 12.6487 13.4868C12.5983 13.4372 12.5386 13.3981 12.4731 13.3717C12.4075 13.3454 12.3373 13.3323 12.2666 13.3333H3.73331Z" />
    </svg>
  );
}
```

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Tooltip } from '@base-ui-components/react/tooltip';

export default function ExampleTooltip() {
  return (
    <Tooltip.Provider>
      <div className="flex gap-px rounded-md border border-gray-200 bg-gray-50 p-0.5">
        <Tooltip.Root>
          <Tooltip.Trigger className="flex size-8 items-center justify-center rounded-sm text-gray-900 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[popup-open]:bg-gray-100 focus-visible:[&:not(:hover)]:bg-transparent">
            <BoldIcon aria-label="Bold" className="size-4" />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={10}>
              <Tooltip.Popup className="flex origin-[var(--transform-origin)] flex-col rounded-md bg-[canvas] px-2 py-1 text-sm shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[instant]:duration-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
                <Tooltip.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
                  <ArrowSvg />
                </Tooltip.Arrow>
                Bold
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger className="flex size-8 items-center justify-center rounded-sm text-gray-900 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[popup-open]:bg-gray-100 focus-visible:[&:not(:hover)]:bg-transparent">
            <ItalicIcon aria-label="Italic" className="size-4" />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={10}>
              <Tooltip.Popup className="flex origin-[var(--transform-origin)] flex-col rounded-md bg-[canvas] px-2 py-1 text-sm shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[instant]:duration-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
                <Tooltip.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
                  <ArrowSvg />
                </Tooltip.Arrow>
                Italic
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger className="flex size-8 items-center justify-center rounded-sm text-gray-900 select-none hover:bg-gray-100 focus-visible:bg-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 active:bg-gray-200 data-[popup-open]:bg-gray-100 focus-visible:[&:not(:hover)]:bg-transparent">
            <UnderlineIcon aria-label="Underline" className="size-4" />
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={10}>
              <Tooltip.Popup className="flex origin-[var(--transform-origin)] flex-col rounded-md bg-[canvas] px-2 py-1 text-sm shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[instant]:duration-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0 dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
                <Tooltip.Arrow className="data-[side=bottom]:top-[-8px] data-[side=left]:right-[-13px] data-[side=left]:rotate-90 data-[side=right]:left-[-13px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-8px] data-[side=top]:rotate-180">
                  <ArrowSvg />
                </Tooltip.Arrow>
                Underline
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </Tooltip.Provider>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-[canvas]"
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className="fill-gray-200 dark:fill-none"
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="dark:fill-gray-300"
      />
    </svg>
  );
}

function BoldIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentcolor" {...props}>
      <path d="M3.73353 2.13333C3.4386 2.13333 3.2002 2.37226 3.2002 2.66666C3.2002 2.96106 3.4386 3.2 3.73353 3.2H4.26686V12.8H3.73353C3.4386 12.8 3.2002 13.0389 3.2002 13.3333C3.2002 13.6277 3.4386 13.8667 3.73353 13.8667H9.86686C11.7783 13.8667 13.3335 12.3115 13.3335 10.4C13.3335 8.9968 12.4945 7.78881 11.2929 7.24375C11.8897 6.70615 12.2669 5.93066 12.2669 5.06666C12.2669 3.44906 10.9506 2.13333 9.33353 2.13333H3.73353ZM6.93353 3.2H8.26686C9.29619 3.2 10.1335 4.03733 10.1335 5.06666C10.1335 6.096 9.29619 6.93333 8.26686 6.93333H6.93353V3.2ZM6.93353 8H7.73353H8.26686C9.59006 8 10.6669 9.0768 10.6669 10.4C10.6669 11.7232 9.59006 12.8 8.26686 12.8H6.93353V8Z" />
    </svg>
  );
}

function ItalicIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentcolor" {...props}>
      <path d="M8.52599 2.12186C8.48583 2.12267 8.44578 2.1265 8.4062 2.13332H6.93328C6.86261 2.13232 6.79244 2.14538 6.72686 2.17173C6.66127 2.19808 6.60158 2.23721 6.55125 2.28683C6.50092 2.33646 6.46096 2.39559 6.43368 2.46079C6.4064 2.526 6.39235 2.59597 6.39235 2.66665C6.39235 2.73733 6.4064 2.80731 6.43368 2.87251C6.46096 2.93772 6.50092 2.99685 6.55125 3.04647C6.60158 3.0961 6.66127 3.13522 6.72686 3.16157C6.79244 3.18793 6.86261 3.20099 6.93328 3.19999H7.70099L6.69057 12.8H5.86661C5.79594 12.799 5.72577 12.812 5.66019 12.8384C5.59461 12.8648 5.53492 12.9039 5.48459 12.9535C5.43425 13.0031 5.39429 13.0623 5.36701 13.1275C5.33973 13.1927 5.32568 13.2626 5.32568 13.3333C5.32568 13.404 5.33973 13.474 5.36701 13.5392C5.39429 13.6044 5.43425 13.6635 5.48459 13.7131C5.53492 13.7628 5.59461 13.8019 5.66019 13.8282C5.72577 13.8546 5.79594 13.8677 5.86661 13.8667H9.06661C9.13729 13.8677 9.20745 13.8546 9.27304 13.8282C9.33862 13.8019 9.39831 13.7628 9.44864 13.7131C9.49897 13.6635 9.53894 13.6044 9.56622 13.5392C9.5935 13.474 9.60754 13.404 9.60754 13.3333C9.60754 13.2626 9.5935 13.1927 9.56622 13.1275C9.53894 13.0623 9.49897 13.0031 9.44864 12.9535C9.39831 12.9039 9.33862 12.8648 9.27304 12.8384C9.20745 12.812 9.13729 12.799 9.06661 12.8H8.2989L9.30932 3.19999H10.1333C10.204 3.20099 10.2741 3.18793 10.3397 3.16157C10.4053 3.13522 10.465 3.0961 10.5153 3.04647C10.5656 2.99685 10.6056 2.93772 10.6329 2.87251C10.6602 2.80731 10.6742 2.73733 10.6742 2.66665C10.6742 2.59597 10.6602 2.526 10.6329 2.46079C10.6056 2.39559 10.5656 2.33646 10.5153 2.28683C10.465 2.23721 10.4053 2.19808 10.3397 2.17173C10.2741 2.14538 10.204 2.13232 10.1333 2.13332H8.66349C8.61807 2.12555 8.57207 2.12171 8.52599 2.12186Z" />
    </svg>
  );
}

function UnderlineIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentcolor" {...props}>
      <path d="M3.73331 2.13332C3.66264 2.13232 3.59247 2.14538 3.52689 2.17173C3.46131 2.19809 3.40161 2.23721 3.35128 2.28684C3.30095 2.33646 3.26099 2.39559 3.23371 2.4608C3.20643 2.526 3.19238 2.59598 3.19238 2.66666C3.19238 2.73734 3.20643 2.80731 3.23371 2.87252C3.26099 2.93772 3.30095 2.99685 3.35128 3.04648C3.40161 3.0961 3.46131 3.13523 3.52689 3.16158C3.59247 3.18793 3.66264 3.20099 3.73331 3.19999V7.99999C3.73331 10.224 5.55144 12.2667 7.99998 12.2667C10.4485 12.2667 12.2666 10.224 12.2666 7.99999V3.19999C12.3373 3.20099 12.4075 3.18793 12.4731 3.16158C12.5386 3.13523 12.5983 3.0961 12.6487 3.04648C12.699 2.99685 12.739 2.93772 12.7662 2.87252C12.7935 2.80731 12.8076 2.73734 12.8076 2.66666C12.8076 2.59598 12.7935 2.526 12.7662 2.4608C12.739 2.39559 12.699 2.33646 12.6487 2.28684C12.5983 2.23721 12.5386 2.19809 12.4731 2.17173C12.4075 2.14538 12.3373 2.13232 12.2666 2.13332H10.1333C10.0626 2.13232 9.99247 2.14538 9.92689 2.17173C9.8613 2.19809 9.80161 2.23721 9.75128 2.28684C9.70095 2.33646 9.66099 2.39559 9.63371 2.4608C9.60643 2.526 9.59238 2.59598 9.59238 2.66666C9.59238 2.73734 9.60643 2.80731 9.63371 2.87252C9.66099 2.93772 9.70095 2.99685 9.75128 3.04648C9.80161 3.0961 9.8613 3.13523 9.92689 3.16158C9.99247 3.18793 10.0626 3.20099 10.1333 3.19999V8.97187C10.1333 10.0855 9.32179 11.0818 8.21352 11.1896C6.94152 11.3138 5.86665 10.3136 5.86665 9.06666V3.19999C5.93732 3.20099 6.00748 3.18793 6.07307 3.16158C6.13865 3.13523 6.19834 3.0961 6.24867 3.04648C6.299 2.99685 6.33897 2.93772 6.36625 2.87252C6.39353 2.80731 6.40757 2.73734 6.40757 2.66666C6.40757 2.59598 6.39353 2.526 6.36625 2.4608C6.33897 2.39559 6.299 2.33646 6.24867 2.28684C6.19834 2.23721 6.13865 2.19809 6.07307 2.17173C6.00748 2.14538 5.93732 2.13232 5.86665 2.13332H3.73331ZM3.73331 13.3333C3.66264 13.3323 3.59247 13.3454 3.52689 13.3717C3.46131 13.3981 3.40161 13.4372 3.35128 13.4868C3.30095 13.5365 3.26099 13.5956 3.23371 13.6608C3.20643 13.726 3.19238 13.796 3.19238 13.8667C3.19238 13.9373 3.20643 14.0073 3.23371 14.0725C3.26099 14.1377 3.30095 14.1969 3.35128 14.2465C3.40161 14.2961 3.46131 14.3352 3.52689 14.3616C3.59247 14.3879 3.66264 14.401 3.73331 14.4H12.2666C12.3373 14.401 12.4075 14.3879 12.4731 14.3616C12.5386 14.3352 12.5983 14.2961 12.6487 14.2465C12.699 14.1969 12.739 14.1377 12.7662 14.0725C12.7935 14.0073 12.8076 13.9373 12.8076 13.8667C12.8076 13.796 12.7935 13.726 12.7662 13.6608C12.739 13.5956 12.699 13.5365 12.6487 13.4868C12.5983 13.4372 12.5386 13.3981 12.4731 13.3717C12.4075 13.3454 12.3373 13.3323 12.2666 13.3333H3.73331Z" />
    </svg>
  );
}
```

## Accessibility guidelines

To ensure that tooltips are accessible and helpful, follow these guidelines:

- **Provide an accessible name for the trigger**: The tooltip's trigger must have a meaningful label. This can be its visible text or an `aria-label`/`aria-labelledby` attribute. The label should closely match the tooltip's content to ensure consistency for screen reader users.
- **Avoid tooltips for critical information**: Tooltips work well for enhancing UI clarity (like labeling icon buttons) but should not be the sole means of conveying important information. Since tooltips do not appear on touch devices, consider using a [Popover](/react/components/popover) for essential content.
- **Avoid tooltips for "infotips"**: If your tooltip is attached to an "info icon" button whose only purpose is to show the tooltip, opt for [Popover](/react/components/popover) and add the `openOnHover` prop instead. Tooltips should describe an element that performs an action separate from opening the tooltip itself.

## API reference

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Tooltip } from '@base-ui-components/react/tooltip';

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger />
    <Tooltip.Portal>
      <Tooltip.Positioner>
        <Tooltip.Popup>
          <Tooltip.Arrow />
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>;
```

### Provider

Provides a shared delay for multiple tooltips. The grouping logic ensures that
once a tooltip becomes visible, the adjacent tooltips will be shown instantly.

**Provider Props:**

| Prop       | Type        | Default | Description                                                                                                               |
| :--------- | :---------- | :------ | :------------------------------------------------------------------------------------------------------------------------ |
| delay      | `number`    | -       | How long to wait before opening a tooltip. Specified in milliseconds.                                                     |
| closeDelay | `number`    | -       | How long to wait before closing a tooltip. Specified in milliseconds.                                                     |
| timeout    | `number`    | `400`   | Another tooltip will open instantly if the previous tooltip&#xA;is closed within this timeout. Specified in milliseconds. |
| children   | `ReactNode` | -       | -                                                                                                                         |

### Root

Groups all parts of the tooltip.
Doesn’t render its own HTML element.

**Root Props:**

| Prop                 | Type                                                                                          | Default  | Description                                                                                                                                                                                                                                                                |
| :------------------- | :-------------------------------------------------------------------------------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| defaultOpen          | `boolean`                                                                                     | `false`  | Whether the tooltip is initially open.To render a controlled tooltip, use the `open` prop instead.                                                                                                                                                                         |
| open                 | `boolean`                                                                                     | -        | Whether the tooltip is currently open.                                                                                                                                                                                                                                     |
| onOpenChange         | `((open: boolean, event: Event \| undefined, reason: OpenChangeReason \| undefined) => void)` | -        | Event handler called when the tooltip is opened or closed.                                                                                                                                                                                                                 |
| actionsRef           | `RefObject<Actions>`                                                                          | -        | A ref to imperative actions.\* `unmount`: When specified, the tooltip will not be unmounted when closed.&#xA;Instead, the `unmount` function must be called to unmount the tooltip manually.&#xA;Useful when the tooltip's animation is controlled by an external library. |
| onOpenChangeComplete | `((open: boolean) => void)`                                                                   | -        | Event handler called after any animations complete when the tooltip is opened or closed.                                                                                                                                                                                   |
| trackCursorAxis      | `'none' \| 'both' \| 'x' \| 'y'`                                                              | `'none'` | Determines which axis the tooltip should track the cursor on.                                                                                                                                                                                                              |
| disabled             | `boolean`                                                                                     | `false`  | Whether the tooltip is disabled.                                                                                                                                                                                                                                           |
| delay                | `number`                                                                                      | `600`    | How long to wait before opening the tooltip. Specified in milliseconds.                                                                                                                                                                                                    |
| closeDelay           | `number`                                                                                      | `0`      | How long to wait before closing the tooltip. Specified in milliseconds.                                                                                                                                                                                                    |
| hoverable            | `boolean`                                                                                     | `true`   | Whether the tooltip contents can be hovered without closing the tooltip.                                                                                                                                                                                                   |
| children             | `ReactNode`                                                                                   | -        | -                                                                                                                                                                                                                                                                          |

### Trigger

An element to attach the tooltip to.
Renders a `<button>` element.

**Trigger Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Trigger Data Attributes:**

| Attribute       | Type | Description                                     |
| :-------------- | :--- | :---------------------------------------------- |
| data-popup-open | -    | Present when the corresponding tooltip is open. |

### Portal

A portal element that moves the popup to a different part of the DOM.
By default, the portal element is appended to `<body>`.

**Portal Props:**

| Prop        | Type                                                    | Default | Description                                                              |
| :---------- | :------------------------------------------------------ | :------ | :----------------------------------------------------------------------- |
| container   | `HTMLElement \| RefObject<HTMLElement \| null> \| null` | -       | A parent element to render the portal element into.                      |
| children    | `ReactNode`                                             | -       | -                                                                        |
| keepMounted | `boolean`                                               | `false` | Whether to keep the portal mounted in the DOM while the popup is hidden. |

### Positioner

Positions the tooltip against the trigger.
Renders a `<div>` element.

**Positioner Props:**

| Prop        | Type                           | Default    | Description                                                                                                                                                                                                                                                                                                |
| :---------- | :----------------------------- | :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| align       | `'center' \| 'end' \| 'start'` | `'center'` | How to align the popup relative to the specified side.                                                                                                                                                                                                                                                     |
| alignOffset | `number \| OffsetFunction`     | `0`        | Additional offset along the alignment axis in pixels.&#xA;Also accepts a function that returns the offset to read the dimensions of the anchor&#xA;and positioner elements, along with its side and alignment.\* `data.anchor`: the dimensions of the anchor element with properties `width` and `height`. |

- `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
- `data.side`: which side of the anchor element the positioner is aligned against.
- `data.align`: how the positioner is aligned relative to the specified side. |
  | side | `Side` | `'top'` | Which side of the anchor element to align the popup against.&#xA;May automatically change to avoid collisions. |
  | sideOffset | `number \| OffsetFunction` | `0` | Distance between the anchor and the popup in pixels.&#xA;Also accepts a function that returns the distance to read the dimensions of the anchor&#xA;and positioner elements, along with its side and alignment.\* `data.anchor`: the dimensions of the anchor element with properties `width` and `height`.
- `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
- `data.side`: which side of the anchor element the positioner is aligned against.
- `data.align`: how the positioner is aligned relative to the specified side. |
  | arrowPadding | `number` | `5` | Minimum distance to maintain between the arrow and the edges of the popup.Use it to prevent the arrow element from hanging out of the rounded corners of a popup. |
  | anchor | `Element \| RefObject<Element \| null> \| VirtualElement \| (() => Element \| VirtualElement \| null) \| null` | - | An element to position the popup against.&#xA;By default, the popup will be positioned against the trigger. |
  | collisionBoundary | `Boundary` | `'clipping-ancestors'` | An element or a rectangle that delimits the area that the popup is confined to. |
  | collisionPadding | `Padding` | `5` | Additional space to maintain from the edge of the collision boundary. |
  | sticky | `boolean` | `false` | Whether to maintain the popup in the viewport after&#xA;the anchor element was scrolled out of view. |
  | positionMethod | `'fixed' \| 'absolute'` | `'absolute'` | Determines which CSS `position` property to use. |
  | trackAnchor | `boolean` | `true` | Whether the popup tracks any layout shift of its positioning anchor. |
  | trackCursorAxis | `'none' \| 'both' \| 'x' \| 'y'` | `'none'` | Determines which axis the tooltip should track the cursor on. |
  | className | `string \| ((state: State) => string)` | - | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state. |
  | render | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | - | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Positioner Data Attributes:**

| Attribute          | Type                                                                       | Description                                                             |
| :----------------- | :------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| data-open          | -                                                                          | Present when the tooltip is open.                                       |
| data-closed        | -                                                                          | Present when the tooltip is closed.                                     |
| data-anchor-hidden | -                                                                          | Present when the anchor is hidden.                                      |
| data-side          | `'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the tooltip is positioned relative to the trigger. |

**Positioner CSS Variables:**

| Variable           | Type     | Default | Description                                                                            |
| :----------------- | :------- | :------ | :------------------------------------------------------------------------------------- |
| --anchor-height    | `number` | -       | The anchor's height.                                                                   |
| --anchor-width     | `number` | -       | The anchor's width.                                                                    |
| --available-height | `number` | -       | The available height between the trigger and the edge of the viewport.                 |
| --available-width  | `number` | -       | The available width between the trigger and the edge of the viewport.                  |
| --transform-origin | `string` | -       | The coordinates that this element is anchored to. Used for animations and transitions. |

### Popup

A container for the tooltip contents.
Renders a `<div>` element.

**Popup Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Popup Data Attributes:**

| Attribute           | Type                                                                       | Description                                                             |
| :------------------ | :------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| data-open           | -                                                                          | Present when the tooltip is open.                                       |
| data-closed         | -                                                                          | Present when the tooltip is closed.                                     |
| data-instant        | `'delay' \| 'dismiss' \| 'focus'`                                          | Present if animations should be instant.                                |
| data-side           | `'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the tooltip is positioned relative to the trigger. |
| data-starting-style | -                                                                          | Present when the tooltip is animating in.                               |
| data-ending-style   | -                                                                          | Present when the tooltip is animating out.                              |

### Arrow

Displays an element positioned against the tooltip anchor.
Renders a `<div>` element.

**Arrow Props:**

| Prop      | Type                                                                        | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: State) => string)`                                      | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: GenericHTMLProps, state: State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Arrow Data Attributes:**

| Attribute          | Type                                                                       | Description                                                             |
| :----------------- | :------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| data-open          | -                                                                          | Present when the tooltip is open.                                       |
| data-closed        | -                                                                          | Present when the tooltip is closed.                                     |
| data-uncentered    | -                                                                          | Present when the tooltip arrow is uncentered.                           |
| data-anchor-hidden | -                                                                          | Present when the anchor is hidden.                                      |
| data-side          | `'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the tooltip is positioned relative to the trigger. |
