import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const DIST_DIR = path.join(process.cwd(), 'dist');
const TARGET_EXTS = new Set(['.html', '.css', '.js', '.svg', '.json', '.xml', '.txt']);
const MIN_BYTES = 256;

async function walkFiles(dir) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkFiles(full)));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  const allFiles = await walkFiles(DIST_DIR);
  let processed = 0;
  let totalRaw = 0;
  let totalZst = 0;
  let totalBr = 0;
  let totalGz = 0;

  for (const filePath of allFiles) {
    const ext = path.extname(filePath).toLowerCase();
    if (!TARGET_EXTS.has(ext)) continue;

    const raw = await fs.readFile(filePath);
    if (raw.length < MIN_BYTES) continue;

    processed += 1;
    totalRaw += raw.length;

    const zst = zlib.zstdCompressSync(raw, {
      params: {
        [zlib.constants.ZSTD_c_compressionLevel]: 11,
      },
    });
    if (zst.length < raw.length) {
      await fs.writeFile(`${filePath}.zst`, zst);
      totalZst += zst.length;
    } else {
      totalZst += raw.length;
    }

    const br = zlib.brotliCompressSync(raw, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
        [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length,
      },
    });
    if (br.length < raw.length) {
      await fs.writeFile(`${filePath}.br`, br);
      totalBr += br.length;
    } else {
      totalBr += raw.length;
    }

    const gz = zlib.gzipSync(raw, { level: 9 });
    if (gz.length < raw.length) {
      await fs.writeFile(`${filePath}.gz`, gz);
      totalGz += gz.length;
    } else {
      totalGz += raw.length;
    }
  }

  console.log(
    `[precompress] ${processed} files: raw ${formatKb(totalRaw)} -> zstd ${formatKb(totalZst)}, br ${formatKb(totalBr)}, gzip ${formatKb(totalGz)}`,
  );
}

main().catch((err) => {
  console.error('precompress-dist failed:', err);
  process.exit(1);
});
