'use client';
import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';
import baseStyles from '../../index.module.css';
import styles from './index.module.css';

type View = 'overview' | 'details';

export default function PreviewCardTransitionKeyDemo() {
  const [view, setView] = React.useState<View>('overview');

  return (
    <PreviewCard.Root
      onOpenChangeComplete={(open) => {
        if (!open) {
          setView('overview');
        }
      }}
    >
      <p className={baseStyles.Paragraph}>
        Read more about{' '}
        <PreviewCard.Trigger className={baseStyles.Link} href="https://base-ui.com">
          Base UI
        </PreviewCard.Trigger>
        .
      </p>

      <PreviewCard.Portal>
        <PreviewCard.Positioner sideOffset={8} className={styles.Positioner}>
          <PreviewCard.Popup className={styles.Popup}>
            <PreviewCard.Arrow className={baseStyles.Arrow} />
            <PreviewCard.Viewport className={styles.Viewport} transitionKey={view}>
              {view === 'overview' ? (
                <div className={styles.Content}>
                  <div className={styles.Tabs}>
                    <button type="button" className={styles.TabActive}>
                      Overview
                    </button>
                    <button type="button" className={styles.Tab} onClick={() => setView('details')}>
                      Details
                    </button>
                  </div>
                  <p className={styles.Summary}>
                    Base UI is a library of unstyled React components for building accessible user
                    interfaces.
                  </p>
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
  );
}
