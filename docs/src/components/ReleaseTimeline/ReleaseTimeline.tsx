'use client';

import * as React from 'react';
import Link from 'next/link';
import { releases } from 'docs/src/data/releases';
import './ReleaseTimeline.css';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function ReleaseTimeline() {
  return (
    <ul className="ReleaseTimeline" aria-label="Release timeline">
      <div className="TimelineSpine" />
      {releases.map((release, index) => (
        <li key={release.versionSlug} className="TimelineItem">
          <article className="TimelineCard">
            <div className="TimelineCardHeader">
              <time className="TimelineDate" dateTime={release.date}>
                {dateFormatter.format(new Date(release.date))}
              </time>
              <h3 className="TimelineVersion">
                <Link
                  className="TimelineVersionLink"
                  href={`/react/overview/releases/${release.versionSlug}`}
                >
                  {release.version}
                </Link>
                {index === 0 && <span className="TimelineBadge">Latest</span>}
              </h3>
            </div>
            <ul className="TimelineHighlights">
              {release.highlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
              ))}
            </ul>
            <Link
              className="Link"
              href={`/react/overview/releases/${release.versionSlug}`}
              aria-label={`Read the full release notes for ${release.version}`}
            >
              Read more
            </Link>
          </article>
        </li>
      ))}
    </ul>
  );
}
