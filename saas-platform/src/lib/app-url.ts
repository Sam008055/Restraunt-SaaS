/** Public app URL for QR links, settings preview, etc. */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url) return url.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export function getPublicMenuPath(slug: string): string {
  return `${getAppUrl()}/r/${slug}`;
}

export function getTableQrUrl(slug: string, tableId: string, token: string): string {
  return `${getAppUrl()}/r/${slug}/t/${tableId}?token=${token}`;
}
