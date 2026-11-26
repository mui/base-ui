import { parseArgs } from 'node:util';
import { fetchChangelogData  } from '@mui/internal-code-infra/changelog';
import type {ChangelogData} from '@mui/internal-code-infra/changelog';
import { renderChangelog, renderDocsPage } from './changelog.mts';

const HELP = `Prints the changelog of a release.

Options:
  --lastRelease     Git reference (tag/commit) of the last release. Defaults to the last version tag.
  --release         Git reference (tag/commit) of the new release. Defaults to master on GitHub.
  --releaseVersion  Version of the new release. Defaults to the version \`--release\` is a tag of, else
                    to the version of the root package.json.
  --cwd             Directory of the checkout. Defaults to the current one.
  --format          "changelog" (default), or "docs" for the release page of the docs.
  --help            Show this help.`;

const RENDERERS: Record<string, (data: ChangelogData) => string> = {
  changelog: renderChangelog,
  docs: renderDocsPage,
};

function print(text: string) {
  process.stdout.write(`${text}\n`);
}

const { values } = parseArgs({
  options: {
    lastRelease: { type: 'string' },
    release: { type: 'string', default: 'master' },
    releaseVersion: { type: 'string' },
    cwd: { type: 'string' },
    format: { type: 'string', default: 'changelog' },
    help: { type: 'boolean' },
  },
});

async function run() {
  if (values.help) {
    print(HELP);

    return;
  }

  const render = RENDERERS[values.format];

  if (!render) {
    throw new Error(
      `Unknown format "${values.format}". Use one of: ${Object.keys(RENDERERS).join(', ')}.`,
    );
  }

  const data = await fetchChangelogData({
    cwd: values.cwd,
    lastRelease: values.lastRelease,
    release: values.release,
    version: values.releaseVersion,
  });

  print(render(data));
}

await run();
