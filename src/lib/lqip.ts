import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const lqipCache = new Map<string, string>();

/**
 * Generates and caches a tiny (~20x28) inline WebP LQIP data URI for a media file under public/.
 */
export async function getLqipDataUri(mediaPath: string): Promise<string> {
  if (!mediaPath) return '';
  const cached = lqipCache.get(mediaPath);
  if (cached !== undefined) return cached;

  const cleanRel = mediaPath.replace(/^\/+/, '');
  const absPath = path.join(process.cwd(), 'public', ...cleanRel.split('/'));

  try {
    const srcBuf = await fs.readFile(absPath);
    const lqipBuf = await sharp(srcBuf)
      .rotate()
      .resize({
        width: 20,
        height: 28,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 28,
        effort: 6,
      })
      .toBuffer();
    const dataUri = `data:image/webp;base64,${lqipBuf.toString('base64')}`;
    lqipCache.set(mediaPath, dataUri);
    return dataUri;
  } catch {
    lqipCache.set(mediaPath, '');
    return '';
  }
}
