'use client';
import * as React from 'react';
import { PreviewCard } from '@base-ui/react/preview-card';
import styles from './index.module.css';

const demoPreviewCard = PreviewCard.createHandle<React.ReactElement>();

const cardContents = {
  typography: (
    <div className={styles.PopupContent}>
      <img
        width="224"
        height="150"
        className={styles.Image}
        src="https://images.unsplash.com/photo-1619615391095-dfa29e1672ef?q=80&w=448&h=300"
        alt="Station Hofplein signage in Rotterdam, Netherlands"
      />
      <p className={styles.Summary}>
        <strong>Typography</strong> is the art and science of arranging type.
      </p>
    </div>
  ),
  design: (
    <div className={styles.PopupContent}>
      <img
        width="250"
        height="249"
        className={styles.Image}
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Braun_ABW30_%28schwarz%29.jpg/250px-Braun_ABW30_%28schwarz%29.jpg"
        alt="Braun ABW30"
      />
      <p className={styles.Summary}>
        A <strong>design</strong> is the concept or proposal for an object, process, or system.
      </p>
    </div>
  ),
  art: (
    <div className={styles.PopupContent}>
      <img
        width="250"
        height="290"
        className={styles.Image}
        src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/MonaLisa_sfumato.jpeg/250px-MonaLisa_sfumato.jpeg"
        alt="Mona Lisa"
      />
      <p className={styles.Summary}>
        <strong>Art</strong> is a diverse range of cultural activity centered around works utilizing
        creative or imaginative talents, which are expected to evoke a worthwhile experience,
        generally through an expression of emotional power, conceptual ideas, technical proficiency,
        or beauty.
      </p>
    </div>
  ),
};

export default function PreviewCardDetachedTriggersFullDemo() {
  return (
    <div>
      <p className={styles.Paragraph}>
        Discover{' '}
        <PreviewCard.Trigger
          className={styles.Link}
          handle={demoPreviewCard}
          href="https://en.wikipedia.org/wiki/Typography"
          payload={cardContents.typography}
        >
          typography
        </PreviewCard.Trigger>
        ,{' '}
        <PreviewCard.Trigger
          className={styles.Link}
          handle={demoPreviewCard}
          href="https://en.wikipedia.org/wiki/Design"
          payload={cardContents.design}
        >
          design
        </PreviewCard.Trigger>
        , or{' '}
        <PreviewCard.Trigger
          className={styles.Link}
          handle={demoPreviewCard}
          href="https://en.wikipedia.org/wiki/Art"
          payload={cardContents.art}
        >
          art
        </PreviewCard.Trigger>
        .
      </p>

      <PreviewCard.Root handle={demoPreviewCard}>
        {({ payload }) => (
          <PreviewCard.Portal>
            <PreviewCard.Positioner sideOffset={8} className={styles.Positioner}>
              <PreviewCard.Popup className={styles.Popup}>
                <PreviewCard.Arrow className={styles.Arrow}>
                  <ArrowSvg />
                </PreviewCard.Arrow>
                <PreviewCard.Viewport className={styles.Viewport}>{payload}</PreviewCard.Viewport>
              </PreviewCard.Popup>
            </PreviewCard.Positioner>
          </PreviewCard.Portal>
        )}
      </PreviewCard.Root>
    </div>
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
