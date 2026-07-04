const KEY = "OPENAI_API_KEY";

// localStorage may throw (Safari with storage blocked, some private modes) —
// every access goes through these guards.
export function readApiKey() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeApiKey(value) {
  try {
    localStorage.setItem(KEY, value);
    return true;
  } catch {
    return false;
  }
}

export function clearApiKey() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to do — the key was unreadable anyway
  }
}
