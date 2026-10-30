/*
 * What the sign-up and reset pages tell people about a password, mirroring the
 * API's rules (ADR-014, NIST SP 800-63B): 12 to 128 characters, any
 * characters, not a single repeated character, not the email address, not a
 * commonly used password. The API decides; this only guides.
 */

export const MIN_LENGTH = 12;
export const MAX_LENGTH = 128;

export type Check = { label: string; met: boolean };

export function passwordChecks(password: string, email: string): Check[] {
  const length = [...password].length;
  const lower = password.toLowerCase();
  const address = email.trim().toLowerCase();
  return [
    { label: `At least ${MIN_LENGTH} characters`, met: length >= MIN_LENGTH && length <= MAX_LENGTH },
    { label: "Not one character repeated", met: length > 0 && new Set([...lower]).size > 1 },
    {
      label: "Not your email address",
      met: length > 0 && lower !== address && (address.indexOf("@") < 0 || lower !== address.slice(0, address.indexOf("@"))),
    },
  ];
}

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };

/**
 * A rough guide, length first (as NIST advises), then variety. Commonly used
 * passwords are refused by the API whatever their score.
 */
export function strength(password: string): Strength {
  const length = [...password].length;
  if (length === 0) return { score: 0, label: "" };
  if (length < MIN_LENGTH) return { score: 1, label: "Too short" };
  const kinds = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/, /\s/].filter((pattern) => pattern.test(password)).length;
  const points = (length >= 16 ? 1 : 0) + (length >= 20 ? 1 : 0) + (kinds >= 3 ? 1 : 0);
  if (points >= 2) return { score: 4, label: "Very strong" };
  if (points === 1) return { score: 3, label: "Strong" };
  return { score: 2, label: "Fair" };
}

const DOMAINS = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "proton.me"];

/** Edit distance, small strings only. */
function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length]!;
}

/** "jane@gmial.com" → "jane@gmail.com": one or two letters off a common mail domain. */
export function emailSuggestion(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  if (!domain || DOMAINS.includes(domain)) return null;
  const close = DOMAINS.find((candidate) => distance(domain, candidate) <= 2);
  return close ? `${email.slice(0, at)}@${close}` : null;
}
