'use client';

import * as React from 'react';
import Link from 'next/link';
import { releases } from '@/data/releases';
import './ReleaseTimeline.css';

export function ReleaseTimeline() {
  return (
    <div className="ReleaseTimeline">
      <div className="TimelineSpine" />
      {releases.map((release, index) => (
        <div key={release.versionSlug} className="TimelineItem">
          <div className="TimelineDot" />
          <div className="TimelineCard">
            <Link href={`/react/overview/releases/${release.versionSlug}`} className="TimelineCardLink">
              <div className="TimelineCardHeader">
                <h3 className="TimelineVersion">{release.version}</h3>
                <p className="TimelineDate">{release.date}</p>
              </div>
              <ul className="TimelineHighlights">
                {release.highlights.map((highlight, i) => (
                  <li key={i}>{highlight}</li>
                ))}
              </ul>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
