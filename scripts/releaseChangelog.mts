/* eslint-disable no-console */
import childProcess from 'node:child_process';
import { promisify } from 'node:util';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import _ from 'lodash';
import packageJson from '../package.json';

const exec = promisify(childProcess.exec);

const GENERAL_CHANGES_HEADER = 'general changes';

async function main(parameters: CommandParameters) {
  const { githubToken, lastRelease: previousReleaseParam, release, format } = parameters;

  if (!githubToken) {
    throw new TypeError(
      'Unable to authenticate. Make sure you either call the script with `--githubToken $token` or set the `GITHUB_TOKEN` environment variable. The token needs `public_repo` permissions.',
    );
  }

  const octokit = new Octokit({
    auth: githubToken,
    request: {
      fetch,
    },
  });

  const latestTaggedVersion = await findLatestTaggedVersion();
  const previousRelease =
    previousReleaseParam !== undefined ? previousReleaseParam : latestTaggedVersion;
  if (previousRelease !== latestTaggedVersion) {
    console.warn(
      `Creating changelog for ${previousRelease}..${release} while the latest tagged version is '${latestTaggedVersion}'.`,
    );
  }

  const commits = await findCommits(octokit, previousRelease, release);
  const changelogEntries = await getChangelogEntries(commits, octokit);
  const changesList = getFormattedChangelogEntries(changelogEntries, format);

  const allContributors = getAllContributors(commits);

  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const changelog = `
## v${packageJson.version}

${format === 'changelog' ? `_${today}_` : `**${today}**`}

${changesList.join('\n')}

${format === 'changelog' ? `All contributors of this release in alphabetical order: ${allContributors}` : ''}
`;

  console.log(changelog);
}

async function findLatestTaggedVersion() {
  const { stdout } = await exec(
    [
      'git',
      'describe',
      '--tags',
      '--abbrev=0',
      // only include "version-tags"
      '--match "v*"',
    ].join(' '),
  );

  return stdout.trim();
}

async function findCommits(
  octokit: Octokit,
  previousRelease: string,
  release: string,
): Promise<CommitDetails[]> {
  type CompareCommitsResult = Awaited<
    ReturnType<Octokit['repos']['compareCommits']>
  >['data']['commits'];

  const timeline: any = octokit.paginate.iterator(
    octokit.repos.compareCommitsWithBasehead.endpoint.merge({
      owner: 'mui',
      repo: 'base-ui',
      basehead: `${previousRelease}...${release}`,
    }),
  );

  const results: CompareCommitsResult = [];

  for await (const response of timeline) {
    results.push(...response.data.commits);
  }

  let warnedOnce = false;

  return results.map((result) => {
    let author: string;
    if (!result.author) {
      if (!warnedOnce) {
        console.warn(
          `The author of the commit: ${result.sha} cannot be retrieved. Please add the github username manually.`,
        );
      }

      warnedOnce = true;
      author = chalk.red("TODO: INSERT AUTHOR'S USERNAME");
    } else {
      author = result.author.login;
    }

    return {
      sha: result.sha,
      author,
      message: result.commit.message,
    };
  });
}

function getAllContributors(commits: CommitDetails[]) {
  const authors = Array.from(
    new Set(
      commits.map((commit) => {
        return commit.author;
      }),
    ),
  );

  return authors
    .filter((author) => author !== 'renovate[bot]')
    .sort((a, b) => a.localeCompare(b))
    .map((author) => `@${author}`)
    .join(', ');
}

async function getChangelogEntries(
  commits: CommitDetails[],
  octokit: Octokit,
): Promise<ChangelogEntry[]> {
  const promises = commits.map(async (commit) => {
    const prMatch = commit.message.match(/#(\d+)/);
    if (prMatch === null) {
      return null;
    }

    const prNumber = parseInt(prMatch[1], 10);

    const pr = await octokit.pulls.get({
      owner: 'mui',
      repo: 'base-ui',
      pull_number: prNumber,
      headers: {
        Accept: 'application/vnd.github.text+json',
      },
    });

    const labels = pr.data.labels.map((label) => label.name);

    return {
      title: cleanCommitMessage(commit.message),
      prNumber,
      author: commit.author,
      group: getGroupFromLabels(labels),
      components: getComponentsFromLabels(labels),
      isBreakingChange: labels.includes('breaking change'),
    } as ChangelogEntry;
  });

  return (await Promise.all(promises)).filter((entry) => entry !== null);
}

function getFormattedChangelogEntries(
  changelogEntries: ChangelogEntry[],
  format: 'changelog' | 'docs',
) {
  const changes = new Map<string, { breaking: string[]; nonBreaking: string[] }>();

  // Ignore private changes.
  changelogEntries = changelogEntries.filter((entry) => entry.group === 'public-change-group-1');

  for (const entry of changelogEntries) {
    const { title, prNumber, author, components, isBreakingChange } = entry;

    const formattedPrNumber =
      format === 'changelog'
        ? `(#${prNumber})`
        : `([#${prNumber}](https://github.com/mui/base-ui/pull/${prNumber}))`;
    let line: string;
    if (isBreakingChange) {
      line = `- **Breaking change:** ${title}.\n  ${chalk.red('TODO: DESCRIBE THE BREAKING CHANGE.')}\n  ${formattedPrNumber}${format === 'changelog' ? ` by @${author}` : ''}`;
    } else {
      line = `- ${title} ${formattedPrNumber}${format === 'changelog' ? ` by @${author}` : ''}`;
    }

    for (const component of components) {
      if (!changes.has(component)) {
        changes.set(component, { breaking: [], nonBreaking: [] });
      }

      if (isBreakingChange) {
        changes.get(component)?.breaking.push(line);
      } else {
        changes.get(component)?.nonBreaking.push(line);
      }
    }
  }

  const changedComponents = Array.from(changes.keys()).sort((a, b) => {
    if (a === GENERAL_CHANGES_HEADER) {
      return -1;
    }
    if (b === GENERAL_CHANGES_HEADER) {
      return 1;
    }

    return a.localeCompare(b);
  });

  return changedComponents.map((component) => {
    const componentChanges = changes.get(component);
    if (componentChanges === undefined) {
      return '';
    }

    return `${formatHeader(component)}${componentChanges.breaking.join('\n')}${componentChanges.breaking.length > 0 && componentChanges.nonBreaking.length > 0 ? '\n' : ''}${componentChanges.nonBreaking.join('\n')}\n`;
  });
}

function getGroupFromLabels(labels: string[]): ChangelogEntryGroup {
  // Force internal regardless of the existance of product scope label
  if (
    labels.includes('docs') ||
    labels.includes('internal') ||
    labels.includes('test') ||
    labels.includes('dependencies')
  ) {
    return 'internal-change';
  }

  const topLevelPublicChange = labels.reduce((acc, label) => {
    // Those are internal product scopes, we don't want entries for them.
    if (['scope: support-infra', 'scope: code-infra', 'scope: docs-infra'].includes(label)) {
      return acc;
    }
    if (label.startsWith('scope: ')) {
      return acc + 1;
    }
    return acc;
  }, 0);

  if (topLevelPublicChange >= 1) {
    return 'public-change-group-1';
  }

  return 'internal-change';
}

function getComponentsFromLabels(labels: string[]): string[] {
  if (labels.includes('scope: all components')) {
    return [GENERAL_CHANGES_HEADER];
  }

  let components = labels
    .filter((label) => getGroupFromLabels([label]) === 'public-change-group-1')
    .map((label) => label.replace('scope: ', ''));

  // The autocomplete product scope is complex.
  // We have spit it in two components: Autocomplete and Combobox.
  // Our users only care about one of the two, but when we work on this product scope, we most of the time
  // work on both components at the same time (we can't isolate them much).
  // - If we have "scope: autocomplete" and no component scopes, we assume all components are impacted.
  // - If we have "scope: autocomplete" and a component scope, we assume only this component is impacted.
  if (labels.includes('scope: autocomplete')) {
    if (!labels.includes('component: Autocomplete') && !labels.includes('component: Combobox')) {
      components.push('Autocomplete');
      components.push('Combobox');
    }
    if (labels.includes('component: Autocomplete')) {
      components.push('Autocomplete');
    }
    if (labels.includes('component: Combobox')) {
      components.push('Combobox');
    }
    components = components.filter((component) => component !== 'autocomplete');
  }

  return components;
}

function cleanCommitMessage(commitMessage: string) {
  return commitMessage
    .split('\n')[0]
    .replace(/^(\[[A-Za-z0-9 ,]+\])+ /, '') // remove the leading tags
    .replace(/\(#\d+\)/, '') // remove the PR number
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .trim();
}

function formatHeader(section: string): string {
  if (/^use[A-Z]/.test(section)) {
    return `### ${section}\n\n`;
  }

  if (section === GENERAL_CHANGES_HEADER) {
    return `### General changes\n\n`;
  }

  return `### ${_.startCase(section)}\n\n`;
}

type CommitDetails = {
  sha: string;
  author: string;
  message: string;
};

interface CommandParameters {
  lastRelease?: string;
  githubToken: string;
  release: string;
  format: 'changelog' | 'docs';
}

type ChangelogEntryGroup = 'public-change-group-1' | 'internal-change';

interface ChangelogEntry {
  title: string;
  prNumber: number;
  author: string;
  isBreakingChange: boolean;
  group: ChangelogEntryGroup;
  components: string[];
}

yargs(hideBin(process.argv))
  .command<CommandParameters>(
    '$0',
    'Creates a changelog',
    (command) => {
      return command
        .option('lastRelease', {
          describe:
            'The release to compare against e.g. `v1.0.0-alpha.4`. Default: The latest tag on the current branch.',
          type: 'string',
        })
        .option('githubToken', {
          default: process.env.GITHUB_TOKEN,
          describe:
            'The personal access token to use for authenticating with GitHub. Needs public_repo permissions.',
          type: 'string',
        })
        .option('release', {
          // #default-branch-switch
          default: 'master',
          describe: 'Ref which we want to release',
          type: 'string',
        })
        .option('format', {
          default: 'changelog',
          describe: 'Format of the generated text. Either "changelog" or "docs"',
          type: 'string',
          choices: ['changelog', 'docs'],
        });
    },
    main,
  )
  .help()
  .strict()
  .version(false)
  .parse();
