'use client';

import * as React from 'react';
import Link from 'next/link';
import { releases } from 'docs/src/data/releases';
import './ReleaseTimeline.css';

export function ReleaseTimeline() {
  return (
    <div className="ReleaseTimeline">
      <div className="TimelineSpine" />
      {releases.map((release) => (
        <div key={release.versionSlug} className="TimelineItem">
          <div className="TimelineDot" />
          <div className="TimelineCard">
            <div className="TimelineCardHeader">
              <h3 className="TimelineVersion">
                <Link
                  className="TimelineVersionLink"
                  href={`/react/overview/releases/${release.versionSlug}`}
                >
                  {release.version}
                </Link>
              </h3>
              <p className="TimelineDate">{release.date}</p>
            </div>
            <ul className="TimelineHighlights">
              {release.highlights.map((highlight, i) => (
                <li key={i}>{highlight}</li>
              ))}
            </ul>
            <Link className="Link" href={`/react/overview/releases/${release.versionSlug}`}>
              Read more
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
