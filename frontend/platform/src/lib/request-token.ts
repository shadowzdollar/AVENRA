const STORAGE_KEY = "avenra.request-token";
const TOKEN = /^[A-Za-z0-9_-]{20,200}$/;

type Browser = Pick<Window, "location" | "history" | "sessionStorage">;

/**
 * The request-link token (ADR-020). It arrives in the URL fragment, which is
 * never sent to a server or in a referrer. It is moved to this tab's session
 * storage and removed from the address bar, so it does not end up in history,
 * bookmarks or screenshots; a reload in the same tab still works.
 */
export function readRequestToken(browser: Browser): string | null {
  const fragment = browser.location.hash.replace(/^#/, "");
  if (TOKEN.test(fragment)) {
    try {
      browser.sessionStorage.setItem(STORAGE_KEY, fragment);
    } catch {
      // Storage may be unavailable (private mode); the token still works for this page view.
    }
    browser.history.replaceState(null, "", browser.location.pathname);
    return fragment;
  }
  try {
    const stored = browser.sessionStorage.getItem(STORAGE_KEY);
    return stored && TOKEN.test(stored) ? stored : null;
  } catch {
    return null;
  }
}
