import { Metadata } from 'next';
import { ReleaseTimeline } from 'docs/src/components/ReleaseTimeline';
import styles from './releases.module.css';

export const metadata: Metadata = {
  title: 'Releases - Base UI',
  description: 'Changelogs for each Base UI release.',
};

export default function ReleasesPage() {
  return (
    <div className={styles.releasesPage}>
      <h1 className={styles.title}>Releases</h1>
      <p className={styles.subtitle}>Changelogs for each Base UI release.</p>
      
      <section className={styles.timelineSection}>
        <ReleaseTimeline />
      </section>

      <section className={styles.canarySection}>
        <h2 className={styles.sectionTitle}>Canary Releases</h2>
        <div className={styles.canaryContent}>
          <p>
            Want to get the latest features and fixes before the next stable release? 
            You can install the canary version of Base UI to access pre-release features and bug fixes.
          </p>
          <p>To install the canary version:</p>
          <pre className={styles.codeBlock}>
            <code>npm install @base-ui/react@canary</code>
          </pre>
          <p className={styles.warning}>
            ⚠️ Canary releases are published automatically from the latest commits on the main branch. 
            They may contain breaking changes and experimental features that are not yet ready for production use.
          </p>
        </div>
      </section>

      <section className={styles.fullNotesSection}>
        <h2 className={styles.sectionTitle}>Full Release Notes</h2>
        <p>
          For detailed release notes including all changes and component-specific updates, 
          view individual release pages by clicking on any release in the timeline above, 
          or see the{' '}
          <a 
            href="https://github.com/mui/base-ui/blob/master/CHANGELOG.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            full changelog on GitHub
          </a>.
        </p>
      </section>
    </div>
  );
}
