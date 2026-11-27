import { execFileSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const args = new Set(process.argv.slice(2));
const skipBuild = args.has('--skip-build');

const host = process.env.DEPLOY_HOST || 'homepage';
const remoteDir = process.env.DEPLOY_DIR || '/opt/homepage';
const container = process.env.DEPLOY_CONTAINER || 'homepage-web';
const remoteTar = '/tmp/homepage-dist.tar.gz';

function validateSafeToken(value, label) {
  if (!/^[a-zA-Z0-9._:/-]+$/.test(value)) {
    throw new Error(`Invalid ${label}: ${value}`);
  }
}

validateSafeToken(host, 'DEPLOY_HOST');
validateSafeToken(remoteDir, 'DEPLOY_DIR');
validateSafeToken(container, 'DEPLOY_CONTAINER');

if (!skipBuild) {
  console.log('[deploy] Running typecheck and production build...');
  execSync('npm run check', { cwd: rootDir, stdio: 'inherit' });
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
}

if (!fs.existsSync(path.join(distDir, 'index.html'))) {
  throw new Error('dist/index.html not found. Run npm run build first.');
}

const tmpTar = path.join(os.tmpdir(), `homepage-dist-${Date.now()}.tar.gz`);

try {
  console.log('[deploy] Packing dist/ archive...');
  execFileSync('tar', ['-czf', tmpTar, '-C', distDir, '.'], {
    cwd: rootDir,
    stdio: 'inherit',
  });

  console.log(`[deploy] Uploading archive to ${host}:${remoteTar}...`);
  execFileSync('scp', ['-o', 'BatchMode=yes', tmpTar, `${host}:${remoteTar}`], {
    stdio: 'inherit',
  });

  const remoteScript = [
    'set -eu',
    `STAGE="${remoteDir}/dist.next"`,
    `LIVE="${remoteDir}/dist"`,
    `PREV="${remoteDir}/dist.prev"`,
    `TAR="${remoteTar}"`,
    'sudo -n rm -rf "$STAGE" "$PREV"',
    'sudo -n mkdir -p "$STAGE"',
    'sudo -n tar -xzf "$TAR" -C "$STAGE"',
    'sudo -n chown -R "$(id -un):$(id -gn)" "$STAGE"',
    'sudo -n chmod -R a+rX "$STAGE"',
    'if [ -d "$LIVE" ]; then sudo -n mv "$LIVE" "$PREV"; fi',
    'sudo -n mv "$STAGE" "$LIVE"',
    'sudo -n rm -rf "$PREV" "$TAR"',
    `sudo -n docker restart "${container}"`,
  ].join(' && ');

  console.log(`[deploy] Swapping ${remoteDir}/dist and restarting ${container}...`);
  execFileSync('ssh', ['-o', 'BatchMode=yes', host, remoteScript], {
    stdio: 'inherit',
  });

  console.log('[deploy] Deployment complete.');
} finally {
  fs.rmSync(tmpTar, { force: true });
}
