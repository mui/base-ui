import { parseArgs } from 'node:util';
import { fetchChangelogData } from '@mui/internal-code-infra/changelog';
import { formatChangelog, formatDocsPage } from './changelog.mjs';

const HELP = `Prints the changelog of a release.

Options:
  --lastRelease     Git reference (tag/commit) of the last release. Defaults to the last version tag.
  --release         Git reference (tag/commit) of the new release. Defaults to the current commit.
  --releaseVersion  Version of the new release. Defaults to the version \`--release\` is a tag of, else
                    to the version of the root package.json.
  --cwd             Directory of the checkout. Defaults to the current one.
  --format          "changelog" (default), or "docs" for the release page of the docs.
  --help            Show this help.`;

const FORMATTERS = new Map([
  ['changelog', formatChangelog],
  ['docs', formatDocsPage],
]);

/**
 * @param {string} text
 */
function print(text) {
  process.stdout.write(`${text}\n`);
}

const { values } = parseArgs({
  options: {
    lastRelease: { type: 'string' },
    release: { type: 'string' },
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

  const format = FORMATTERS.get(values.format);

  if (!format) {
    throw new Error(
      `Unknown format "${values.format}". Use one of: ${[...FORMATTERS.keys()].join(', ')}.`,
    );
  }

  const data = await fetchChangelogData({
    cwd: values.cwd,
    lastRelease: values.lastRelease,
    release: values.release,
    version: values.releaseVersion,
  });

  print(format(data));
}

await run();
