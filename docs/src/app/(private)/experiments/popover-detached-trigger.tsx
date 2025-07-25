'use client';
import * as React from 'react';
import { Popover } from '@base-ui-components/react/popover';

// eslint-disable-next-line no-restricted-imports
import { PopoverHandle } from '@base-ui-components/react/popover/handle/createPopover';
import {
  SettingsMetadata,
  useExperimentSettings,
} from 'docs/src/components/Experiments/SettingsPanel';
import styles from './popover-detached-trigger.module.css';

const popover1 = new PopoverHandle<unknown>();

interface Settings {
  openOnHover: boolean;
  side: 'top' | 'bottom' | 'left' | 'right';
}

const contents = [
  <React.Fragment>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
    <p>
      Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
      quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    </p>
  </React.Fragment>,
  <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>,
  <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</p>,
  <p>Ex ea commodo consequat.</p>,
  <React.Fragment>
    <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat.</p>
    <p>
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim
      id est laborum.
    </p>
    <p>
      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
      pariatur.
    </p>
    <p>
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim
      id est laborum.
    </p>
  </React.Fragment>,
];

export default function PopoverDetachedTrigger() {
  const { settings } = useExperimentSettings<Settings>();
  return (
    <div className={styles.Page}>
      <h1>Popovers</h1>
      <div className={styles.Container}>
        <h2>Detached triggers</h2>
        <StyledPopover handle={popover1} />
        <StyledTrigger handle={popover1} payload={0} />
        <StyledTrigger handle={popover1} payload={1} />
        <StyledTrigger handle={popover1} payload={2} />
        <StyledTrigger handle={popover1} payload={3} />
        <StyledTrigger handle={popover1} payload={4} />
      </div>
      <div className={styles.Container}>
        <h2>Ordinary popover</h2>
        <Popover.Root>
          <StyledTrigger />
          {renderPopoverContent(0, settings)}
        </Popover.Root>
      </div>
    </div>
  );
}

interface StyledPopoverProps {
  handle: PopoverHandle<unknown>;
}

function StyledTrigger<Payload>(props: { handle?: PopoverHandle<Payload>; payload?: Payload }) {
  const { settings } = useExperimentSettings<Settings>();
  return (
    <Popover.Trigger
      className={styles.IconButton}
      handle={props.handle as PopoverHandle<unknown>}
      payload={props.payload}
      openOnHover={settings.openOnHover}
      delay={50}
    >
      <PopupIcon aria-label="Notifications" className={styles.Icon} />
    </Popover.Trigger>
  );
}

function StyledPopover(props: StyledPopoverProps) {
  const { handle } = props;
  const { settings } = useExperimentSettings<Settings>();

  return (
    <Popover.Root handle={handle}>
      {({ payload }) => renderPopoverContent(payload as number, settings)}
    </Popover.Root>
  );
}

function renderPopoverContent(contentIndex: number, settings: Settings) {
  return (
    <Popover.Portal>
      <Popover.Positioner sideOffset={8} className={styles.Positioner} side={settings.side}>
        <Popover.Popup className={styles.Popup}>
          <Popover.Arrow className={styles.Arrow}>
            <ArrowSvg />
          </Popover.Arrow>
          <Popover.Title className={styles.Title}>Popover {contentIndex}</Popover.Title>
          <Content contentIndex={contentIndex} />
        </Popover.Popup>
      </Popover.Positioner>
    </Popover.Portal>
  );
}

function Content({ contentIndex }: { contentIndex: number }) {
  const [localState, setLocalState] = React.useState(0);

  return (
    <div>
      <div className={styles.PopoverSection}>{contents[contentIndex]}</div>

      <div className={styles.PopoverSection}>
        <p>Local state: {localState}</p>
        <button type="button" onClick={() => setLocalState((s) => s + 1)}>
          Increment local state
        </button>
      </div>
    </div>
  );
}

export const settingsMetadata: SettingsMetadata<Settings> = {
  openOnHover: {
    type: 'boolean',
    label: 'Open on hover',
  },
  side: {
    type: 'string',
    label: 'Side',
    options: ['top', 'bottom', 'left', 'right'],
    default: 'bottom',
  },
};

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

function PopupIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      {...props}
      height="24px"
      viewBox="0 -960 960 960"
      width="24px"
      fill="#606060"
    >
      <path d="M480-80 373-240H160q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H587L480-80Zm0-144 64-96h256v-480H160v480h256l64 96Zm0-336Z" />
    </svg>
  );
}
