const QURAN_COM_API = 'https://api.quran.com/api/v4';
const QURAN_HUB_API = 'https://api.quranhub.com/v1';

function abortError() {
  const error = new Error('Request cancelled');
  error.name = 'AbortError';
  return error;
}

async function getJson(url, { signal, timeout = 16000 } = {}) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Study data request failed (${response.status}).`);
    return response.json();
  } catch (error) {
    if (signal?.aborted) throw abortError();
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

function reference(record) {
  return `${record.surah?.number}:${record.numberInSurah}`;
}

function visibleWords(words = []) {
  return words
    .filter((word) => word.char_type_name === 'word' && word.text_uthmani)
    .map((word) => ({
      position: word.position,
      text: word.text_uthmani,
      translation: word.translation?.text || '',
      transliteration: word.transliteration?.text || ''
    }));
}

function extractRoot(tagsByCategory = {}) {
  const candidates = (tagsByCategory.Root || []).filter((tag) => tag.code && tag.code !== 'خص');
  return candidates[0]?.code || null;
}

function derivePartOfSpeech(tagsByCategory = {}) {
  if (tagsByCategory.Afal?.length) return { ar: 'فعل', en: 'Verb' };
  if (tagsByCategory.Asma?.length) return { ar: 'اسم', en: 'Noun / nominal' };
  if (tagsByCategory.Horof?.length) return { ar: 'حرف', en: 'Particle' };
  if (tagsByCategory.Sawabiq?.length && !tagsByCategory.Lawahiq?.length) return { ar: 'سابقة', en: 'Prefix / particle' };
  return { ar: '—', en: 'Morphological classification' };
}

function conciseFeatures(tagsByCategory = {}) {
  const groups = ['Irab', 'Sarf', 'Aam', 'Lawahiq', 'Sawabiq'];
  const values = [];
  groups.forEach((group) => {
    (tagsByCategory[group] || []).forEach((tag) => {
      const label = tag.user_meaning || tag.meaning;
      if (label && !values.includes(label) && values.length < 8) values.push(label);
    });
  });
  return values;
}

export class MorphologyService {
  constructor() {
    this.verseCache = new Map();
    this.wordCache = new Map();
  }

  async verseWords(record, { signal } = {}) {
    const key = reference(record);
    if (this.verseCache.has(key)) return this.verseCache.get(key);
    const url = `${QURAN_COM_API}/verses/by_key/${key}?words=true&word_fields=text_uthmani,translation,transliteration`;
    const payload = await getJson(url, { signal });
    const words = visibleWords(payload?.verse?.words);
    this.verseCache.set(key, words);
    return words;
  }

  async wordStudy(record, position, fallbackWord = '', { signal } = {}) {
    const verseKey = reference(record);
    const key = `${verseKey}:${position}`;
    if (this.wordCache.has(key)) return this.wordCache.get(key);

    const [verseWords, morphologyPayload] = await Promise.all([
      this.verseWords(record, { signal }),
      getJson(`${QURAN_HUB_API}/morphology/word/${key}`, { signal })
    ]);
    const quranWord = verseWords.find((word) => Number(word.position) === Number(position));
    const data = morphologyPayload?.data || {};
    const tagsByCategory = data.morphology?.tags_by_category || {};
    const pos = derivePartOfSpeech(tagsByCategory);

    const study = {
      location: key,
      word: quranWord?.text || data.word?.text || fallbackWord,
      translation: quranWord?.translation || '',
      transliteration: quranWord?.transliteration || '',
      root: extractRoot(tagsByCategory),
      partOfSpeech: pos,
      grammar: conciseFeatures(tagsByCategory),
      tagCount: data.morphology?.total_tags || 0,
      // QuranHub exposes verified roots and grammar tags. It does not expose
      // a dictionary lemma field, so the UI deliberately does not infer one.
      lemma: null,
      lemmaNote: 'This online morphology record exposes verified roots and grammar tags; it does not provide a dictionary lemma for this token.',
      source: 'QuranHub morphology + Quran.com word-by-word'
    };
    this.wordCache.set(key, study);
    return study;
  }
}

export function fallbackTokens(arabic = '') {
  return arabic
    .replace(/[ۖۗۚۛۙۘۜ۝۞]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((text, index) => ({ position: index + 1, text, translation: '', transliteration: '' }));
}

export const morphologyService = new MorphologyService();
