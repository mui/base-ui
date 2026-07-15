'use client';

import * as React from 'react';
import { Menu } from '@base-ui/react/menu';
import { Tooltip } from '@base-ui/react/tooltip';
import styles from './popup-trigger-data-attributes.module.css';

type Variant = 'popup-open' | 'pressed';

export default function PopupTriggerDataAttributes() {
  return (
    <div className={styles.Root}>
      <div className={styles.Intro}>
        <p className={styles.Eyebrow}>Composed trigger experiment</p>
        <h1 className={styles.Title}>Why popup triggers should style data-pressed</h1>
        <p className={styles.Description}>
          Each button below is simultaneously a tooltip trigger and a menu trigger. The only
          difference is the data attribute used for its persistent active style.
        </p>
      </div>

      <ol className={styles.Steps}>
        <li>Hover either button and wait for its tooltip.</li>
        <li>Notice that only the left button looks pressed, although its menu is still closed.</li>
        <li>Click each button. Both look pressed while their menu is actually open.</li>
      </ol>

      <div className={styles.Grid}>
        <ComparisonCard variant="popup-open" />
        <ComparisonCard variant="pressed" />
      </div>

      <p className={styles.Note}>
        Tooltip intentionally uses <code>data-popup-open</code>. It never applies{' '}
        <code>data-pressed</code>, so the latter can identify the pressable popup state without
        reacting to the tooltip.
      </p>
    </div>
  );
}

function ComparisonCard({ variant }: { variant: Variant }) {
  const [tooltipOpen, setTooltipOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const isProblem = variant === 'popup-open';
  const selectorMatches = isProblem ? tooltipOpen || menuOpen : menuOpen;

  return (
    <section className={styles.Card}>
      <header className={styles.CardHeader}>
        <span className={isProblem ? styles.ProblemBadge : styles.FixedBadge}>
          {isProblem ? 'Problem' : 'Recommended'}
        </span>
        <h2>{isProblem ? 'Generic popup state' : 'Pressable popup state'}</h2>
        <p>
          Styles <code>{isProblem ? '[data-popup-open]' : '[data-pressed]'}</code>
        </p>
      </header>

      <div className={styles.Stage}>
        <Menu.Root onOpenChange={setMenuOpen}>
          <Tooltip.Root onOpenChange={setTooltipOpen}>
            <Tooltip.Trigger
              delay={150}
              closeDelay={300}
              render={
                <Menu.Trigger
                  className={`${styles.Trigger} ${
                    isProblem ? styles.PopupOpenTrigger : styles.PressedTrigger
                  }`}
                >
                  More actions
                  <ChevronDownIcon aria-hidden="true" />
                </Menu.Trigger>
              }
            />
            <Tooltip.Portal>
              <Tooltip.Positioner side="top" sideOffset={10} className={styles.Positioner}>
                <Tooltip.Popup className={styles.TooltipPopup}>
                  Tooltip is open — the menu is not
                  <Tooltip.Arrow className={styles.TooltipArrow}>
                    <ArrowSvg />
                  </Tooltip.Arrow>
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Menu.Portal>
            <Menu.Positioner sideOffset={8} className={styles.Positioner}>
              <Menu.Popup className={styles.MenuPopup}>
                <Menu.Item className={styles.MenuItem}>Edit item</Menu.Item>
                <Menu.Item className={styles.MenuItem}>Duplicate item</Menu.Item>
                <Menu.Item className={styles.MenuItem}>Archive item</Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>

      <div className={styles.Readout} aria-live="polite">
        <StateRow label="Tooltip open" active={tooltipOpen} />
        <StateRow label="Menu open" active={menuOpen} />
        <StateRow label="data-popup-open present" active={tooltipOpen || menuOpen} />
        <StateRow label="data-pressed present" active={menuOpen} />
        <StateRow label="Styled selector matches" active={selectorMatches} emphasized />
      </div>
    </section>
  );
}

function StateRow({
  label,
  active,
  emphasized = false,
}: {
  label: string;
  active: boolean;
  emphasized?: boolean;
}) {
  return (
    <div className={emphasized ? styles.EmphasizedStateRow : styles.StateRow}>
      <span>{label}</span>
      <strong data-active={active ? '' : undefined}>{active ? 'Yes' : 'No'}</strong>
    </div>
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <path d="m4.5 6 3.5 3.5L11.5 6" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <path d="M10 2 3 9h14l-7-7Z" className={styles.ArrowBorder} />
      <path d="m10 3.5-5.5 5.5h11L10 3.5Z" className={styles.ArrowFill} />
    </svg>
  );
}
