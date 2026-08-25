const KEYS = {
  history: 'magniaayat.history.v1',
  bookmarks: 'magniaayat.bookmarks.v1',
  preferences: 'magniaayat.preferences.v1',
  arabicIndex: 'magniaayat.arabic-index.v1'
};

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function safeWrite(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private mode / full storage. */ }
}

export const storage = {
  history: () => safeRead(KEYS.history, []),
  saveHistory(items) { safeWrite(KEYS.history, items.slice(0, 12)); },
  bookmarks: () => safeRead(KEYS.bookmarks, []),
  saveBookmarks(items) { safeWrite(KEYS.bookmarks, items); },
  preferences: () => safeRead(KEYS.preferences, { translation: 'both' }),
  savePreferences(value) { safeWrite(KEYS.preferences, value); },
  getArabicIndex() { return safeRead(KEYS.arabicIndex, null); },
  saveArabicIndex(index) { safeWrite(KEYS.arabicIndex, index); },
  clearAll() {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  }
};
