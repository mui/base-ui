import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// Reproduce CircleCI's dependency resolver when `pnpm dedupe` disagrees between local
// machines and CI. The container uses the same Node image as the CircleCI executor,
// runs a fresh install, then runs pnpm dedupe against the mounted checkout.
const repositoryRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const image = process.env.DEDUPE_HARDER_IMAGE ?? 'cimg/node:22.21.1';
const containerDirectory = '/tmp/base-ui';
const pnpmStoreDirectory = '/tmp/pnpm-store';
const dedupeArgs = process.argv.slice(2);

function shellQuote(value: string) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

const hostUserId = typeof process.getuid === 'function' ? process.getuid() : null;
const hostGroupId = typeof process.getgid === 'function' ? process.getgid() : null;
const restoreOwnershipCommand =
  hostUserId == null || hostGroupId == null
    ? ''
    : `chown ${hostUserId}:${hostGroupId} pnpm-lock.yaml package.json pnpm-workspace.yaml 2>/dev/null || true`;

const shellCommands = [
  'set -euo pipefail',
  'corepack enable',
  'node --version',
  'pnpm --version',
  `pnpm --store-dir ${shellQuote(pnpmStoreDirectory)} install`,
  `pnpm --store-dir ${shellQuote(pnpmStoreDirectory)} dedupe${
    dedupeArgs.length > 0 ? ` ${dedupeArgs.map(shellQuote).join(' ')}` : ''
  }`,
  restoreOwnershipCommand,
].filter(Boolean);

const dockerArgs = [
  'run',
  '--rm',
  '--user',
  'root',
  '--volume',
  `${repositoryRoot}:${containerDirectory}`,
  // Keep the container install from purging or relinking the host's node_modules.
  '--volume',
  `${containerDirectory}/node_modules`,
  '--workdir',
  containerDirectory,
  '--env',
  'CI=true',
  '--env',
  'COREPACK_ENABLE_DOWNLOAD_PROMPT=0',
  image,
  'bash',
  '-lc',
  shellCommands.join('\n'),
];

const result = spawnSync('docker', dockerArgs, { stdio: 'inherit' });

if (result.error) {
  if ((result.error as NodeJS.ErrnoException).code === 'ENOENT') {
    console.error('Docker is required to run `pnpm dedupe-harder`.');
    process.exit(1);
  }

  throw result.error;
}

process.exit(result.status ?? 1);
