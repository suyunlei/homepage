export function withBase(path: string): string {
  if (!path) return '';
  if (/^(https?:|mailto:|tel:|#|data:)/i.test(path)) {
    return path;
  }
  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${normalizedPath}`;
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function getAlbumSlug(id: string): string {
  return id.replace(/^\d+-/, '');
}
