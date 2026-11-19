const configuredUrl = import.meta.env.VITE_GITHUB_URL;

/** Override with VITE_GITHUB_URL at build time, or edit the fallback. */
export const GITHUB_URL: string =
  typeof configuredUrl === 'string' && configuredUrl.trim() !== ''
    ? configuredUrl.trim()
    : 'https://github.com/DiemMyCodex/promptforge';
