export const AGENT_COOKIE_NAME = 'hello_agent_login';

export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) {
    return null;
  }
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) {
      continue;
    }
    const key = part.slice(0, separator).trim();
    if (key !== name) {
      continue;
    }
    return part.slice(separator + 1).trim();
  }
  return null;
}
