'use client';

import * as React from 'react';
import Link from 'next/link';
import { releases } from 'docs/src/data/releases';
import './ReleaseTimeline.css';

export function ReleaseTimeline() {
  return (
    <ul className="ReleaseTimeline" aria-label="Release timeline">
      <div className="TimelineSpine" />
      {releases.map((release, index) => (
        <li key={release.versionSlug} className="TimelineItem">
          <article className="TimelineCard">
            <h3 className="TimelineVersion">
              <Link
                className="TimelineVersionLink"
                href={`/react/overview/releases/${release.versionSlug}`}
              >
                {release.version}
              </Link>
              {index === 0 && <span className="TimelineBadge">Latest</span>}
            </h3>
            <p className="TimelineDate">{release.date}</p>
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
