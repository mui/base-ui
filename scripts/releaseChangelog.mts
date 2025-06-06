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
  const changesList = getFormattedChangelogEntries(
    changelogEntries.filter((entry) => entry.scope === 'public-api'),
    format,
  );

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
      components: getComponentsFromLabels(labels),
      isBreakingChange: labels.includes('breaking change'),
      scope: getScopeFromLabels(labels),
    } as ChangelogEntry;
  });

  return (await Promise.all(promises)).filter((entry) => entry !== null);
}

function getFormattedChangelogEntries(
  changelogEntries: ChangelogEntry[],
  format: 'changelog' | 'docs',
) {
  const changes = new Map<string, { breaking: string[]; nonBreaking: string[] }>();

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

function getComponentsFromLabels(labels: string[]): string[] {
  if (labels.includes('all components')) {
    return [GENERAL_CHANGES_HEADER];
  }

  const components = labels
    .filter((label) => {
      return label.startsWith('component:') || label.startsWith('hook:');
    })
    .map((label) => {
      return label.replace('component: ', '').replace('hook: ', '');
    });

  return components;
}

function getScopeFromLabels(labels: string[]): ChangeScope {
  if (labels.includes('docs') || labels.includes('website')) {
    return 'docs';
  }

  if (
    labels.includes('core') ||
    labels.includes('scope: infra') ||
    labels.includes('scope: code-infra') ||
    labels.includes('scope: docs-infra')
  ) {
    return 'infra';
  }

  if (labels.includes('dependencies')) {
    return 'dependencies';
  }

  if (labels.includes('release')) {
    return 'release';
  }

  if (labels.includes('internal') || labels.includes('test')) {
    return 'internal';
  }

  return 'public-api';
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

type ChangeScope = 'docs' | 'infra' | 'public-api' | 'internal' | 'dependencies' | 'release';

interface ChangelogEntry {
  title: string;
  prNumber: number;
  author: string;
  components: string[];
  isBreakingChange: boolean;
  scope: ChangeScope;
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
