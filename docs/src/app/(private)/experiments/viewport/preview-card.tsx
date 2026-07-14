'use client';
import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';
import { Collapsible } from '@base-ui/react/collapsible';
import styles from './preview-card.module.css';

type View = 'overview' | 'details';

export default function Experiment() {
  const [view, setView] = React.useState<View>('overview');

  return (
    <div className={styles.Container}>
      <p className={styles.Paragraph}>
        Read more about{' '}
        <PreviewCard.Root
          onOpenChangeComplete={(open) => {
            if (!open) {
              setView('overview');
            }
          }}
        >
          <PreviewCard.Trigger className={styles.Link} href="https://base-ui.com">
            Base UI
          </PreviewCard.Trigger>
          <PreviewCard.Portal>
            <PreviewCard.Positioner sideOffset={8} className={styles.Positioner}>
              <PreviewCard.Popup className={styles.Popup}>
                <PreviewCard.Arrow className={styles.Arrow} />
                <PreviewCard.Viewport className={styles.Viewport} transitionKey={view}>
                  {view === 'overview' ? (
                    <div className={styles.Content}>
                      <div className={styles.Tabs}>
                        <button type="button" className={styles.TabActive}>
                          Overview
                        </button>
                        <button
                          type="button"
                          className={styles.Tab}
                          onClick={() => setView('details')}
                        >
                          Details
                        </button>
                      </div>
                      <p className={styles.Summary}>
                        Base UI is a library of unstyled React components for building accessible
                        user interfaces.
                      </p>

                      {/* A collapsible drives the popup height while it stays `auto`. */}
                      <Collapsible.Root className={styles.Collapsible}>
                        <Collapsible.Trigger className={styles.CollapsibleTrigger}>
                          Who makes it?
                          <CaretRightIcon className={styles.Caret} />
                        </Collapsible.Trigger>
                        <Collapsible.Panel className={styles.CollapsiblePanel}>
                          <p className={styles.CollapsibleContent}>
                            Built by the team behind Radix, Floating UI, and Material UI.
                          </p>
                        </Collapsible.Panel>
                      </Collapsible.Root>
                    </div>
                  ) : (
                    <div className={styles.Content}>
                      <div className={styles.Tabs}>
                        <button
                          type="button"
                          className={styles.Tab}
                          onClick={() => setView('overview')}
                        >
                          Overview
                        </button>
                        <button type="button" className={styles.TabActive}>
                          Details
                        </button>
                      </div>
                      <dl className={styles.Stats}>
                        <div className={styles.Stat}>
                          <dt className={styles.StatLabel}>License</dt>
                          <dd className={styles.StatValue}>MIT</dd>
                        </div>
                        <div className={styles.Stat}>
                          <dt className={styles.StatLabel}>Bundle</dt>
                          <dd className={styles.StatValue}>Tree-shakeable</dd>
                        </div>
                        <div className={styles.Stat}>
                          <dt className={styles.StatLabel}>Styling</dt>
                          <dd className={styles.StatValue}>Bring your own</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </PreviewCard.Viewport>
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        </PreviewCard.Root>
        .
      </p>
    </div>
  );
}

function CaretRightIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <path d="M6 12V4l4.5 4z" />
    </svg>
  );
}
