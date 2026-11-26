import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const MEDIA_ROOT = path.join(ROOT_DIR, 'public', 'media');
const CONTENT_ROOT = path.join(ROOT_DIR, 'content');

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const SKIP_FILES = new Set(['projects/boji-miniprogram.png']);

function getPreset(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  const fileName = path.posix.basename(normalized);

  if (normalized.startsWith('home/')) {
    return {
      maxWidth: 520,
      maxHeight: 780,
      quality: 68,
      effort: 5,
      skipSizeBytes: 95 * 1024,
    };
  }

  if (normalized.startsWith('projects/')) {
    if (/^boji-app\./i.test(fileName)) {
      return {
        maxWidth: 900,
        maxHeight: 1400,
        quality: 82,
        effort: 5,
        skipSizeBytes: 90 * 1024,
      };
    }
    if (/^podcast-daihuier\./i.test(fileName)) {
      return {
        maxWidth: 900,
        maxHeight: 900,
        quality: 78,
        effort: 5,
        skipSizeBytes: 110 * 1024,
      };
    }
    return {
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 78,
      effort: 5,
      skipSizeBytes: 110 * 1024,
    };
  }

  if (normalized.startsWith('life/covers/')) {
    return {
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 75,
      effort: 5,
      skipSizeBytes: 120 * 1024,
    };
  }

  if (normalized.startsWith('life/')) {
    return {
      maxWidth: 1280,
      maxHeight: 1280,
      quality: 75,
      effort: 5,
      skipSizeBytes: 185 * 1024,
    };
  }

  if (normalized.startsWith('profile/')) {
    if (/^academic-cover\./i.test(fileName)) {
      return {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 88,
        effort: 5,
        skipSizeBytes: 120 * 1024,
      };
    }
    if (/^wechat\./i.test(fileName)) {
      return {
        maxWidth: 900,
        maxHeight: 1200,
        quality: 88,
        effort: 5,
        skipSizeBytes: 120 * 1024,
      };
    }
    if (/^avatar\./i.test(fileName)) {
      return {
        maxWidth: 240,
        maxHeight: 240,
        quality: 82,
        effort: 5,
        skipSizeBytes: 30 * 1024,
      };
    }
    return {
      maxWidth: 1000,
      maxHeight: 1000,
      quality: 85,
      effort: 5,
      skipSizeBytes: 150 * 1024,
    };
  }

  return {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 75,
    effort: 5,
    skipSizeBytes: 160 * 1024,
  };
}

async function walkFiles(dir) {
  const results = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
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

async function collectContentFiles() {
  const targets = [];
  const all = await walkFiles(CONTENT_ROOT);
  for (const filePath of all) {
    const rel = path.relative(CONTENT_ROOT, filePath).replace(/\\/g, '/');
    if (rel === 'private.local.json') continue;
    if (rel.endsWith('.json') || rel.endsWith('.md')) {
      targets.push({ filePath, rel });
    }
  }
  return targets;
}

async function main() {
  const rawArgs = process.argv.slice(2).filter((arg) => arg !== '--');
  const filters = rawArgs.map((arg) =>
    arg.replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''),
  );

  const allFiles = (await walkFiles(MEDIA_ROOT)).sort();
  const targetFiles = allFiles.filter((filePath) => {
    const rel = path.relative(MEDIA_ROOT, filePath).replace(/\\/g, '/');
    if (filters.length === 0) return true;
    return filters.some((f) => rel === f || rel.startsWith(`${f}/`));
  });

  if (targetFiles.length === 0) {
    console.log('No matching files found under public/media/.');
    return;
  }

  const conversions = new Map();
  let totalBefore = 0;
  let totalAfter = 0;
  let convertedCount = 0;
  let recompressedCount = 0;
  let skippedCount = 0;
  const rows = [];

  for (const srcPath of targetFiles) {
    const rel = path.relative(MEDIA_ROOT, srcPath).replace(/\\/g, '/');
    const ext = path.extname(rel).toLowerCase();
    const srcBuf = await fs.readFile(srcPath);
    const beforeBytes = srcBuf.length;

    if (!SUPPORTED_EXTS.has(ext) || SKIP_FILES.has(rel)) {
      totalBefore += beforeBytes;
      totalAfter += beforeBytes;
      skippedCount += 1;
      rows.push({ status: 'SKIP', rel, beforeBytes, afterBytes: beforeBytes });
      continue;
    }

    const preset = getPreset(rel);
    const parsed = path.posix.parse(rel);
    const targetRel = `${parsed.dir ? `${parsed.dir}/` : ''}${parsed.name}.webp`;
    const targetPath = path.join(MEDIA_ROOT, ...targetRel.split('/'));

    const meta = await sharp(srcBuf).metadata();
    const needsOrient = Boolean(meta.orientation && meta.orientation !== 1);
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    const fitsBounds = w > 0 && h > 0 && w <= preset.maxWidth && h <= preset.maxHeight;

    if (ext === '.webp' && !needsOrient && fitsBounds && beforeBytes <= preset.skipSizeBytes) {
      totalBefore += beforeBytes;
      totalAfter += beforeBytes;
      skippedCount += 1;
      rows.push({ status: 'OK', rel, beforeBytes, afterBytes: beforeBytes });
      continue;
    }

    const outBuf = await sharp(srcBuf)
      .rotate()
      .resize({
        width: preset.maxWidth,
        height: preset.maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: preset.quality,
        effort: preset.effort,
      })
      .toBuffer();

    const afterBytes = outBuf.length;

    // No-bloat guard: if source already fits within target bounds and needs no orientation fix,
    // keep the original untouched when WebP does not save meaningful bytes.
    if (ext !== '.webp' && fitsBounds && !needsOrient && afterBytes >= beforeBytes * 0.96) {
      totalBefore += beforeBytes;
      totalAfter += beforeBytes;
      skippedCount += 1;
      rows.push({ status: 'SKIP_KEPT', rel, beforeBytes, afterBytes: beforeBytes });
      continue;
    }

    if (ext === '.webp' && fitsBounds && !needsOrient && afterBytes >= beforeBytes * 0.94) {
      totalBefore += beforeBytes;
      totalAfter += beforeBytes;
      skippedCount += 1;
      rows.push({ status: 'SKIP_KEPT', rel, beforeBytes, afterBytes: beforeBytes });
      continue;
    }

    await fs.writeFile(targetPath, outBuf);

    if (srcPath !== targetPath) {
      await fs.unlink(srcPath);
      conversions.set(`/media/${rel}`, `/media/${targetRel}`);
      convertedCount += 1;
      rows.push({
        status: 'CONV',
        rel: `${rel} -> ${path.posix.basename(targetRel)}`,
        beforeBytes,
        afterBytes,
      });
    } else {
      recompressedCount += 1;
      rows.push({ status: 'OPT', rel, beforeBytes, afterBytes });
    }

    totalBefore += beforeBytes;
    totalAfter += afterBytes;
  }

  let updatedContentFiles = 0;
  if (conversions.size > 0) {
    const contentFiles = await collectContentFiles();
    const replacements = Array.from(conversions.entries()).sort(
      (a, b) => b[0].length - a[0].length,
    );

    for (const { filePath, rel } of contentFiles) {
      const original = await fs.readFile(filePath, 'utf8');
      let next = original;
      for (const [oldRef, newRef] of replacements) {
        if (next.includes(oldRef)) {
          next = next.split(oldRef).join(newRef);
        }
      }
      if (next !== original) {
        await fs.writeFile(filePath, next, 'utf8');
        updatedContentFiles += 1;
        console.log(`Updated references in content/${rel}`);
      }
    }
  }

  console.log('\n=== Media Optimization Summary ===');
  for (const row of rows) {
    if (row.status === 'SKIP' || row.status === 'OK') continue;
    if (row.status === 'SKIP_KEPT') {
      console.log(`[KEPT] ${row.rel}: ${formatKb(row.beforeBytes)} (original smaller than WebP)`);
      continue;
    }
    const ratio = row.beforeBytes > 0 ? ((1 - row.afterBytes / row.beforeBytes) * 100).toFixed(1) : '0.0';
    console.log(
      `[${row.status}] ${row.rel}: ${formatKb(row.beforeBytes)} -> ${formatKb(row.afterBytes)} (-${ratio}%)`,
    );
  }

  const savedBytes = totalBefore - totalAfter;
  const savedPct = totalBefore > 0 ? ((savedBytes / totalBefore) * 100).toFixed(1) : '0.0';
  console.log(`\nFiles processed: ${targetFiles.length}`);
  console.log(`  Converted to WebP : ${convertedCount}`);
  console.log(`  Re-compressed WebP: ${recompressedCount}`);
  console.log(`  Skipped / intact  : ${skippedCount}`);
  console.log(`  Content files upd.: ${updatedContentFiles}`);
  console.log(
    `Total size: ${(totalBefore / 1024 / 1024).toFixed(2)} MB -> ${(totalAfter / 1024 / 1024).toFixed(2)} MB (-${(savedBytes / 1024 / 1024).toFixed(2)} MB, -${savedPct}%)`,
  );
}

main().catch((err) => {
  console.error('optimize-media failed:', err);
  process.exit(1);
});
