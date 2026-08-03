import { pathToFileURL } from 'node:url';

interface CommitStatus {
  context?: string;
  created_at?: string;
  state?: string;
}

const requestContext = 'benchmark/full-requested';
const requestLifetime = 2 * 60 * 60 * 1000;

export function hasFreshBenchmarkRequest(statuses: CommitStatus[], now = Date.now()) {
  const requestStatus = statuses
    .filter((status) => status.context === requestContext)
    .reduce<CommitStatus | undefined>((latest, status) => {
      const createdAt = Date.parse(status.created_at ?? '');
      if (!Number.isFinite(createdAt)) {
        return latest;
      }
      return !latest || createdAt > Date.parse(latest.created_at ?? '') ? status : latest;
    }, undefined);
  const requestAge = now - Date.parse(requestStatus?.created_at ?? '');
  return requestStatus?.state === 'success' && requestAge >= 0 && requestAge < requestLifetime;
}

async function main() {
  const owner = process.env.CIRCLE_PROJECT_USERNAME;
  const repository = process.env.CIRCLE_PROJECT_REPONAME;
  const sha = process.env.CIRCLE_SHA1;
  const token = process.env.GITHUB_STATUS_TOKEN;
  if (!owner || !repository || !sha) {
    throw new Error('CircleCI repository and commit metadata are required.');
  }
  if (!token) {
    throw new Error('GITHUB_STATUS_TOKEN is required to check full benchmark requests.');
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repository}/commits/${sha}/status`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );
  if (!response.ok) {
    throw new Error(`GitHub commit status lookup failed (${response.status}).`);
  }

  const result = (await response.json()) as { statuses?: CommitStatus[] };
  process.stdout.write(hasFreshBenchmarkRequest(result.statuses ?? []) ? 'true' : 'false');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
