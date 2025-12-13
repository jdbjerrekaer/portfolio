/**
 * Prefix public asset paths so they work both locally (no base path)
 * and on GitHub Pages (/portfolio base path).
 * 
 * This function can be used in both server and client components.
 */
export function withBasePath(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || "";
  return `${basePath}${path}`;
}
