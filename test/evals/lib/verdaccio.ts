/**
 * In-process Verdaccio helper for the pack pipeline.
 *
 * Each pack-time variant gets its own short-lived registry: unique port,
 * unique storage dir, fully independent — so variants can run in parallel.
 *
 * We skip `npm publish` entirely (avoids the auth handshake). Instead, we
 * write the package metadata + tarball directly into Verdaccio's storage
 * layout. Verdaccio serves both from there on demand. Transitive deps
 * (react, react-dom, types, etc.) are proxied through to npmjs.org via the
 * configured `uplink`.
 *
 * IMPORTANT: any subprocess that talks to this registry must run async —
 * `execSync` blocks the Node event loop, which freezes Verdaccio.
 */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runServer } from 'verdaccio';

export interface VerdaccioHandle {
  url: string;
  close(): Promise<void>;
  /** Pre-populate storage with a package (skip the publish auth dance). */
  publish(args: {
    name: string;
    version: string;
    packageJson: Record<string, unknown>;
    tarballPath: string;
  }): void;
}

export async function startVerdaccio(): Promise<VerdaccioHandle> {
  const root = mkdtempSync(join(tmpdir(), 'eval-verdaccio-'));
  const dataDir = join(root, 'storage');
  const configPath = join(root, 'config.yaml');
  // @base-ui/* is carved out from the proxy: publishes for those don't need
  // an upstream metadata lookup. Everything else proxies to npmjs.
  writeFileSync(
    configPath,
    `
storage: ${dataDir}
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
    cache: true
packages:
  '@base-ui/*':
    access: $all
    publish: $all
    unpublish: $all
  '@*/*':
    access: $all
    proxy: npmjs
  '**':
    access: $all
    proxy: npmjs
log:
  type: stdout
  format: pretty
  level: warn
`,
  );

  const app = await runServer(configPath);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.on('listening', () => resolve()));
  const addr = server.address();
  if (!addr || typeof addr === 'string') {
    throw new Error('verdaccio: failed to obtain listen address');
  }
  const url = `http://127.0.0.1:${addr.port}/`;

  function publish({
    name,
    version,
    packageJson,
    tarballPath,
  }: {
    name: string;
    version: string;
    packageJson: Record<string, unknown>;
    tarballPath: string;
  }): void {
    const slash = name.indexOf('/');
    const [scope, basename] = name.startsWith('@')
      ? [name.slice(0, slash), name.slice(slash + 1)]
      : ['', name];
    const dir = scope ? join(dataDir, scope, basename) : join(dataDir, basename);
    mkdirSync(dir, { recursive: true });

    const tarballFilename = `${basename}-${version}.tgz`;
    const destTarball = join(dir, tarballFilename);
    copyFileSync(tarballPath, destTarball);

    const buf = readFileSync(destTarball);
    const shasum = createHash('sha1').update(buf).digest('hex');
    const integrity = `sha512-${createHash('sha512').update(buf).digest('base64')}`;
    const tarballUrl = `${url}${name}/-/${tarballFilename}`;
    const iso = new Date().toISOString();

    const meta = {
      _id: name,
      name,
      'dist-tags': { latest: version },
      versions: {
        [version]: {
          ...packageJson,
          name,
          version,
          _id: `${name}@${version}`,
          dist: { tarball: tarballUrl, shasum, integrity },
        },
      },
      time: { created: iso, modified: iso, [version]: iso },
      _attachments: {},
    };
    writeFileSync(join(dir, 'package.json'), JSON.stringify(meta, null, 2));
  }

  async function close(): Promise<void> {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(root, { recursive: true, force: true });
  }

  return { url, close, publish };
}

/** Replace every `http://127.0.0.1:<port>/...` in a lockfile with the canonical npmjs URL. */
export function scrubLockfile(lockfilePath: string, registryUrl: string): void {
  const escaped = registryUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const content = readFileSync(lockfilePath, 'utf8');
  writeFileSync(
    lockfilePath,
    content.replace(new RegExp(escaped, 'g'), 'https://registry.npmjs.org/'),
  );
}
