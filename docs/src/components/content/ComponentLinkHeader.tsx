import * as React from 'react';
import classes from './ComponentLinkHeader.module.css';

export interface ComponentLinkHeaderProps {
  githubLabel?: string;
  ariaSpecUrl?: string;
}

export function ComponentLinkHeader(props: ComponentLinkHeaderProps) {
  const { githubLabel, ariaSpecUrl } = props;

  return (
    <div className={classes.root}>
      {githubLabel && (
        <a
          href={`${process.env.SOURCE_CODE_REPO}/labels/${encodeURIComponent(githubLabel)}`}
          className={classes.github}
          rel="nofollow"
          data-ga-event-category="ComponentLinkHeader"
          data-ga-event-action="click"
          data-ga-event-label="githubLabel"
          data-ga-event-split="0.1"
        >
          Give Feedback
        </a>
      )}
      {ariaSpecUrl && (
        <a
          href={ariaSpecUrl}
          className={classes.aria}
          rel="nofollow"
          data-ga-event-category="ComponentLinkHeader"
          data-ga-event-action="click"
          data-ga-event-label="WAI_ARIA"
          data-ga-event-split="0.1"
        >
          WAI-ARIA
        </a>
      )}
      <a
        href="https://bundlephobia.com/package/@base-ui-components/react@latest"
        className={classes.bundleSize}
        rel="nofollow"
        data-ga-event-category="ComponentLinkHeader"
        data-ga-event-action="click"
        data-ga-event-label="bundleSize"
        data-ga-event-split="0.1"
      >
        Bundle Size
      </a>
    </div>
  );
}
