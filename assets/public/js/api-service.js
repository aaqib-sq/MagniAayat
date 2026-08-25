import { OFFLINE_AYAHS, TRANSLITERATION_ALIASES } from './quran-data.js';
import { storage } from './storage.js';

const API_BASE = 'https://api.alquran.cloud/v1';
const ARABIC_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\uFEFF]/g;

export class QuranApiError extends Error {
  constructor(message, code = 0, cancelled = false) {
    super(message);
    this.name = 'QuranApiError';
    this.code = code;
    this.cancelled = cancelled;
  }
}

function cancellationError() {
  return new QuranApiError('Search cancelled.', 499, true);
}
function throwIfAborted(signal) {
  if (signal?.aborted) throw cancellationError();
}

function normalise(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(ARABIC_MARKS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '')
    .toLocaleLowerCase();
}

function isArabic(value) { return /[\u0600-\u06FF]/.test(value); }
function looksUrdu(value) { return /[ےٹڈڑںھچپگژ]/.test(value); }
function isLatin(value) { return /[a-z]/i.test(value); }

function toRecord(match, arabicIndex, sourceEdition, query) {
  const indexed = arabicIndex?.[match.number];
  const surah = indexed?.surah || match.surah || { number: 0, name: '—', englishName: 'Quran', revelationType: 'Unknown' };
  return {
    number: match.number,
    numberInSurah: indexed?.numberInSurah ?? match.numberInSurah,
    juz: indexed?.juz ?? null,
    page: indexed?.page ?? null,
    surah,
    arabic: indexed?.arabic || (sourceEdition === 'quran-uthmani' ? match.text : ''),
    english: sourceEdition === 'en.sahih' ? match.text : '',
    urdu: sourceEdition === 'ur.jalandhry' ? match.text : '',
    matchText: match.text,
    matchEdition: sourceEdition,
    query,
    source: 'live'
  };
}

function fallbackSearch(query) {
  const needle = normalise(query);
  return OFFLINE_AYAHS.filter((ayah) => {
    const haystack = [...ayah.searchKeys, ayah.arabic, ayah.english, ayah.urdu].map(normalise).join(' ');
    return haystack.includes(needle) || ayah.searchKeys.some((key) => normalise(key) === needle);
  }).map((ayah) => ({
    ...ayah,
    matchText: ayah.arabic,
    matchEdition: isLatin(query) ? 'en.sahih' : 'quran-uthmani',
    query,
    source: 'offline'
  }));
}

export class QuranApiService {
  constructor() {
    this.arabicIndexPromise = null;
  }

  /** Request helper with both timeout and caller-owned cancellation. */
  async request(path, { timeout = 18000, signal } = {}) {
    throwIfAborted(signal);
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort();
    signal?.addEventListener('abort', abortFromCaller, { once: true });
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(`${API_BASE}${path}`, { signal: controller.signal });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.code !== 200) {
        throw new QuranApiError(payload?.data || 'No matching verses were found.', response.status);
      }
      return payload.data;
    } catch (error) {
      if (error instanceof QuranApiError) throw error;
      if (signal?.aborted) throw cancellationError();
      if (error?.name === 'AbortError') throw new QuranApiError('The Quran service took too long to respond.');
      throw new QuranApiError('Could not reach the Quran service. Check your connection and try again.');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abortFromCaller);
    }
  }

  resolveSearch(input) {
    const original = input.trim().replace(/\s+/g, ' ');
    const lower = original.toLowerCase();
    const alias = TRANSLITERATION_ALIASES[lower];
    if (alias && isLatin(original) && alias !== original) {
      return { query: alias, displayQuery: original, edition: isLatin(alias) ? 'en.sahih' : 'quran-uthmani', aliased: true };
    }
    if (looksUrdu(original)) return { query: original, displayQuery: original, edition: 'ur.jalandhry', aliased: false };
    if (isArabic(original)) return { query: original, displayQuery: original, edition: 'quran-uthmani', aliased: false };
    return { query: original, displayQuery: original, edition: 'en.sahih', aliased: false };
  }

  /**
   * The metadata index is intentionally shared and not tied to a search's
   * AbortSignal: cancelling one search must never cancel the next search's
   * Arabic text enrichment.
   */
  async loadArabicIndex() {
    if (this.arabicIndexPromise) return this.arabicIndexPromise;
    const cached = storage.getArabicIndex();
    if (cached && typeof cached === 'object' && Object.keys(cached).length > 6000) {
      this.arabicIndexPromise = Promise.resolve(cached);
      return this.arabicIndexPromise;
    }

    this.arabicIndexPromise = this.request('/quran/quran-uthmani', { timeout: 30000 })
      .then((data) => {
        const index = {};
        data.surahs.forEach((surah) => {
          const briefSurah = {
            number: surah.number,
            name: surah.name,
            englishName: surah.englishName,
            englishNameTranslation: surah.englishNameTranslation,
            revelationType: surah.revelationType
          };
          surah.ayahs.forEach((ayah) => {
            index[ayah.number] = {
              arabic: ayah.text.replace(/^\uFEFF/, ''),
              numberInSurah: ayah.numberInSurah,
              juz: ayah.juz,
              page: ayah.page,
              surah: briefSurah
            };
          });
        });
        storage.saveArabicIndex(index);
        return index;
      })
      .catch((error) => {
        this.arabicIndexPromise = null;
        throw error;
      });
    return this.arabicIndexPromise;
  }

  async search(input, { signal } = {}) {
    const plan = this.resolveSearch(input);
    let searchData;
    let sourceEdition = plan.edition;
    try {
      searchData = await this.request(`/search/${encodeURIComponent(plan.query)}/all/${plan.edition}`, { signal });
    } catch (error) {
      if (error.cancelled) throw error;
      // Urdu spellings such as "رحمت" may not occur in Uthmani text. Only
      // attempt a secondary edition when the caller still wants this search.
      if (plan.edition === 'quran-uthmani') {
        try {
          searchData = await this.request(`/search/${encodeURIComponent(plan.query)}/all/ur.jalandhry`, { signal });
          sourceEdition = 'ur.jalandhry';
        } catch (fallbackError) { throw fallbackError.cancelled ? fallbackError : error; }
      } else {
        throw error;
      }
    }

    throwIfAborted(signal);
    let arabicIndex = null;
    try { arabicIndex = await this.loadArabicIndex(); } catch { /* Result still has source text. */ }
    throwIfAborted(signal);
    const records = searchData.matches.map((match) => toRecord(match, arabicIndex, sourceEdition, plan.query));
    return {
      query: plan.displayQuery,
      resolvedQuery: plan.query,
      total: searchData.count,
      records,
      sourceEdition,
      aliased: plan.aliased,
      offline: false
    };
  }

  async details(record, { signal } = {}) {
    try {
      const data = await this.request(`/ayah/${record.number}/editions/quran-uthmani,en.sahih,ur.jalandhry`, { signal });
      const [arabic, english, urdu] = data;
      return {
        ...record,
        arabic: arabic?.text?.replace(/^\uFEFF/, '') || record.arabic,
        english: english?.text || record.english,
        urdu: urdu?.text || record.urdu,
        numberInSurah: arabic?.numberInSurah ?? record.numberInSurah,
        juz: arabic?.juz ?? record.juz,
        page: arabic?.page ?? record.page,
        surah: arabic?.surah ?? record.surah
      };
    } catch (error) {
      if (error.cancelled) throw error;
      return record;
    }
  }

  localSearch(input) {
    const records = fallbackSearch(input);
    return {
      query: input,
      resolvedQuery: input,
      total: records.length,
      records,
      sourceEdition: isLatin(input) ? 'en.sahih' : 'quran-uthmani',
      aliased: false,
      offline: true
    };
  }
}

export { normalise, isArabic, isLatin };
