import * as React from 'react';
import styles from './InTheWild.module.css';

export interface WildCardProps {
  /**
   * GitHub `owner/name` for the project, used to fetch the repository's social-preview
   * image (`https://opengraph.githubassets.com/1/OWNER/REPO`) unless `image` is provided.
   */
  repo: string;
  /**
   * Display name of the project/registry, shown as the card title.
   */
  title: string;
  /**
   * Permalink to the source file (or repository) on GitHub that backs this entry. The
   * title links here.
   */
  href: string;
  /**
   * Optional link to a live/marketing site for the project, rendered as a secondary
   * "live site" link.
   */
  live?: string;
  /**
   * License string as reported by the research corpus, e.g. `"MIT"`, `"AGPL-3.0"`,
   * `"no SPDX license detected"`. Rendered verbatim in a small badge.
   */
  license: string;
  /**
   * Reuse note as reported by the research corpus, e.g. `"code-ok"`, `"link-only"`,
   * `"link-only, do not copy"`. Rendered verbatim in a small badge; anything other than
   * `"code-ok"` is visually flagged (e.g. "link-only — do not copy" cases).
   */
  reuse: string;
  /**
   * Optional local screenshot import overriding the GitHub social-preview image. Not
   * wired up yet — reserved for a follow-up pass that captures real screenshots.
   */
  image?: string;
  /**
   * One-sentence description of the entry (the existing research-derived bullet text).
   */
  children: React.ReactNode;
}

/**
 * Responsive grid wrapper for a set of `WildCard`s in an "In the wild" Storybook docs
 * section.
 */
export function WildCards({ children }: { children: React.ReactNode }) {
  return <div className={styles.Grid}>{children}</div>;
}

/**
 * A single "In the wild" entry: a real (or researched) project that uses a Base UI
 * component, rendered as a small card with a GitHub social-preview image, a title
 * linking to the source permalink, an optional live-site link, a license/reuse badge,
 * and a one-sentence description.
 */
export function WildCard({ repo, title, href, live, license, reuse, image, children }: WildCardProps) {
  const isCodeOk = reuse.trim().toLowerCase() === 'code-ok';
  const imageSrc = image ?? `https://opengraph.githubassets.com/1/${repo}`;

  return (
    <div className={styles.Card}>
      <img
        className={styles.Preview}
        src={imageSrc}
        loading="lazy"
        alt={`${repo} repository card`}
      />
      <div className={styles.Body}>
        <div className={styles.TitleRow}>
          <a className={styles.Title} href={href} target="_blank" rel="noreferrer">
            {title}
          </a>
          {live ? (
            <a className={styles.Live} href={live} target="_blank" rel="noreferrer">
              live site
            </a>
          ) : null}
        </div>
        <div className={styles.Badges}>
          <span className={styles.License}>{license}</span>
          <span className={isCodeOk ? styles.Reuse : `${styles.Reuse} ${styles.ReuseFlagged}`}>
            {reuse}
          </span>
        </div>
        <p className={styles.Description}>{children}</p>
      </div>
    </div>
  );
}
