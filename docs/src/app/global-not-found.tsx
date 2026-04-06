import { Link } from 'docs/src/components/Link';
import Layout from './(website)/layout';

export default function NotFoundPage() {
  return (
    <Layout>
      <section className="bui-d-c">
        <h1 className="Text sz-3 bp2:sz-4 bui-gcs-1 bui-gce-9 bp4:bui-gce-5">Page not found</h1>
        <div className="bui-gcs-1 bui-gce-9">
          <p className="Text sz-2">
            This page couldn't be found. Please return to the{' '}
            <Link href="/react/overview/quick-start">docs</Link> or create a corresponding issue on{' '}
            <Link href="https://github.com/mui/base-ui">GitHub</Link>.
          </p>
        </div>
      </section>
    </Layout>
  );
}
