/**
 * A very small offline index. It keeps the interface useful if the public API
 * is unavailable, without presenting cached examples as exhaustive results.
 */
export const TRANSLITERATION_ALIASES = {
  allah: 'الله',
  allahumma: 'اللهم',
  rahman: 'الرحمن',
  raheem: 'الرحيم',
  rahim: 'الرحيم',
  rahmat: 'رحمة',
  rahmah: 'رحمة',
  mercy: 'mercy',
  iman: 'إيمان',
  imaan: 'إيمان',
  faith: 'faith',
  shukr: 'شكر',
  sabr: 'صبر',
  salah: 'صلاة',
  salat: 'صلاة',
  dua: 'دعاء',
  duaa: 'دعاء',
  quran: 'قرآن',
  noor: 'نور',
  nur: 'نور',
  huda: 'هدى',
  taqwa: 'تقوى',
  rizq: 'رزق',
  tawbah: 'توبة',
  tauba: 'توبة',
  jannah: 'جنة',
  deen: 'دين',
  nabi: 'نبي'
};

export const ROOT_LEXICON = [
  { match: /(?:رحم|mercy|مہربان)/iu, root: 'ر ح م', transliteration: 'r-ḥ-m', meaning: 'Mercy, tenderness, and compassionate care.' },
  { match: /(?:غفر|forgiv|بخشش)/iu, root: 'غ ف ر', transliteration: 'gh-f-r', meaning: 'To cover, forgive, and protect.' },
  { match: /(?:شكر|gratitude|شکر)/iu, root: 'ش ك ر', transliteration: 'sh-k-r', meaning: 'Thankfulness and acknowledgment of blessing.' },
  { match: /(?:صبر|patien|صبر)/iu, root: 'ص ب ر', transliteration: 'ṣ-b-r', meaning: 'Steadfastness, restraint, and perseverance.' },
  { match: /(?:علم|know|علم)/iu, root: 'ع ل م', transliteration: 'ʿ-l-m', meaning: 'Knowledge, awareness, and discernment.' },
  { match: /(?:امن|ايمان|faith|ایمان)/iu, root: 'أ م ن', transliteration: 'ʾ-m-n', meaning: 'Security, trust, and faith.' },
  { match: /(?:هدى|guidance|ہدایت)/iu, root: 'ه د ي', transliteration: 'h-d-y', meaning: 'Guidance and being led to the right path.' },
  { match: /(?:نور|light|روشنی)/iu, root: 'ن و ر', transliteration: 'n-w-r', meaning: 'Light, illumination, and clarity.' },
  { match: /(?:دعو|دعاء|prayer|دعا)/iu, root: 'د ع و', transliteration: 'd-ʿ-w', meaning: 'To call, invite, or supplicate.' },
  { match: /(?:رزق|provision|رزق)/iu, root: 'ر ز ق', transliteration: 'r-z-q', meaning: 'Provision and sustenance.' },
  { match: /(?:توب|repent|توبہ)/iu, root: 'ت و ب', transliteration: 't-w-b', meaning: 'To return; repentance.' },
  { match: /(?:صلو|صلا|prayer|نماز)/iu, root: 'ص ل و', transliteration: 'ṣ-l-w', meaning: 'Prayer and connection.' }
];

export const OFFLINE_AYAHS = [
  {
    number: 1, numberInSurah: 1, juz: 1, page: 1, surah: { number: 1, name: 'سُورَةُ ٱلْفَاتِحَةِ', englishName: 'Al-Faatiha', revelationType: 'Meccan' },
    arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    english: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
    urdu: 'شروع اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے۔',
    searchKeys: ['الله', 'allah', 'رحمن', 'rahman', 'رحيم', 'raheem', 'mercy', 'رحمت']
  },
  {
    number: 164, numberInSurah: 157, juz: 2, page: 24, surah: { number: 2, name: 'سُورَةُ البَقَرَةِ', englishName: 'Al-Baqara', revelationType: 'Medinan' },
    arabic: 'أُولَٰئِكَ عَلَيْهِمْ صَلَوَاتٌ مِّن رَّبِّهِمْ وَرَحْمَةٌ ۖ وَأُولَٰئِكَ هُمُ الْمُهْتَدُونَ',
    english: 'Those are the ones upon whom are blessings from their Lord and mercy. And it is those who are the guided.',
    urdu: 'یہی لوگ ہیں جن پر ان کے پروردگار کی مہربانی اور رحمت ہے۔ اور یہی سیدھے رستے پر ہیں۔',
    searchKeys: ['رحمة', 'رحمت', 'rahmat', 'rahmah', 'mercy', 'ہدایت', 'guidance']
  },
  {
    number: 186, numberInSurah: 179, juz: 2, page: 28, surah: { number: 2, name: 'سُورَةُ البَقَرَةِ', englishName: 'Al-Baqara', revelationType: 'Medinan' },
    arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الْقِصَاصُ فِي الْقَتْلَىٰ',
    english: 'O you who have believed, prescribed for you is legal retribution for those murdered.',
    urdu: 'مومنو! تم پر مقتولوں کا قصاص فرض کیا گیا ہے۔',
    searchKeys: ['آمنوا', 'ایمان', 'iman', 'imaan', 'faith']
  },
  {
    number: 152, numberInSurah: 145, juz: 2, page: 22, surah: { number: 2, name: 'سُورَةُ البَقَرَةِ', englishName: 'Al-Baqara', revelationType: 'Medinan' },
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    english: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.',
    urdu: 'سو تم مجھے یاد کرو میں تم کو یاد کروں گا اور میرا احسان مانو اور ناشکری نہ کرو۔',
    searchKeys: ['شكر', 'شکر', 'shukr', 'grateful', 'gratitude']
  }
];

// Online-first Quick Search rotates through this larger concept pool per modal open.
export const QUICK_CONCEPTS = [
  { label: 'صبر', query: 'صبر' },
  { label: 'شکر', query: 'شكر' },
  { label: 'جنت', query: 'جنة' },
  { label: 'نور', query: 'نور' },
  { label: 'حق', query: 'حق' },
  { label: 'توکل', query: 'توكل' },
  { label: 'دعا', query: 'دعاء' },
  { label: 'ہدایت', query: 'هدى' },
  { label: 'تقوی', query: 'تقوى' },
  { label: 'رزق', query: 'رزق' },
  { label: 'توبہ', query: 'توبة' },
  { label: 'سلام', query: 'سلام' },
  { label: 'عدل', query: 'عدل' },
  { label: 'رحمت', query: 'رحمة' },
  { label: 'Mercy', query: 'mercy' },
  { label: 'Faith', query: 'faith' }
];
