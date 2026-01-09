import { Metadata } from 'next';
import { ReleaseTimeline } from '@/components/ReleaseTimeline';

export const metadata: Metadata = {
  title: 'Releases - Base UI',
  description: 'Changelogs for each Base UI release.',
};

export default function ReleasesPage() {
  return (
    <div>
      <h1>Releases</h1>
      <p className="Subtitle">Changelogs for each Base UI release.</p>
      
      <section style={{ marginTop: '3rem', marginBottom: '4rem' }}>
        <h2 style={{ marginBottom: '2rem' }}>Release Timeline</h2>
        <ReleaseTimeline />
      </section>

      <section style={{ marginTop: '4rem' }}>
        <h2>Canary Releases</h2>
        <p>
          Want to get the latest features and fixes before the next stable release? 
          You can install the canary version of Base UI to access pre-release features and bug fixes.
        </p>
        <p>
          To install the canary version:
        </p>
        <pre>
          <code>npm install @base-ui/react@canary</code>
        </pre>
        <p>
          Canary releases are published automatically from the latest commits on the main branch. 
          They may contain breaking changes and experimental features that are not yet ready for production use.
        </p>
      </section>

      <section style={{ marginTop: '4rem' }}>
        <h2>Full Release Notes</h2>
        <p style={{ marginBottom: '2rem' }}>
          For detailed release notes including all changes and component-specific updates, 
          view individual release pages by clicking on any release in the timeline above, 
          or see the <a href="https://github.com/mui/base-ui/blob/master/CHANGELOG.md">full changelog on GitHub</a>.
        </p>
      </section>
    </div>
  );
}
