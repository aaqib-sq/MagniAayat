# MagniAayat Web Audit & Native Migration Handoff

**Audit date:** 2026-08-25 (UTC)  
**Repository/branch:** `sq987in-wq/MagniAayat`, `arena/01a03840-magniaayat`  
**Scope:** the committed frontend under `assets/public/`, the Capacitor shell files under `assets/`, and the files named in the mission.

---

## 0. Executive conclusion

### The speed secret in one sentence

The web client is **not doing a deep full-Quran search in JavaScript**. A search is delegated to `https://api.alquran.cloud/v1/search/...` and the browser only enriches the returned hits and highlights at most 20 rendered cards. The native implementation is therefore not an apples-to-apples comparison if it scans and normalizes a local Quran corpus on the device.

The web client does have useful optimizations—an `arabicIndexPromise`/`localStorage` metadata cache, absolute-ayah hash lookups, bounded result rendering, a single HTML render per region, and cancellation tokens—but none of those is an FTS engine or a faster equivalent of a native full-corpus scan. The dominant explanation for a 4–5 second web result versus a 15–20 second native result is **different work placement and different work volume**, not a magical JavaScript Arabic-search algorithm.

### Current architectural verdict

This is a visually polished, small online-first web shell with resilient fallbacks. It is not currently a strictly offline-first Quran application:

- The committed offline corpus contains four sample ayahs (`quran-data.js:1-100`), not the Quran.
- Search normally requires a public remote API (`api-service.js:4`, `157-191`).
- Word study requires two more public APIs (`morphology-service.js:1-2`, `74-115`).
- There is no IndexedDB, service worker, Cache Storage, Web Worker, full local index, Room database, or Android project in this checkout.
- The full Arabic text fetched for enrichment is persisted as one synchronous `localStorage` JSON value.

The code is a reasonable prototype/distribution artifact, but it should not be used as the native domain architecture verbatim. Port the pure contracts and data model; replace the network/search/storage/rendering mechanisms.

### Highest-priority findings

| ID | Severity | Finding | Primary evidence |
|---|---|---|---|
| F-01 | High | Search speed is obtained by remote server-side search, not local JavaScript search. This conflicts with the stated offline-first target. | `api-service.js:4`, `157-191`; `quran-data.js:1-6` |
| F-02 | High | Full Quran Arabic metadata and unbounded bookmarks are serialized synchronously into `localStorage`; quota failures are swallowed, and the cache has no schema/version validation beyond a count threshold. | `api-service.js:118-154`; `storage.js:8-31`; `app.js:2072-2086` |
| F-03 | High | Audio commands are not serialized or generation-checked. Rapid play/pause, track changes, and reciter switches can let an older `play()` completion mutate the state of a newer track. | `audio-engine.js:133-173` |
| F-04 | High | Background/media lifecycle handling is incomplete. There is Media Session metadata/action integration but no authoritative native playback service, audio-focus handling, visibility reconciliation, or foreground service in this repository. | `audio-engine.js:76-112`, `203-260`; `native-bridge.js:17-43` |
| F-05 | Medium/High | The shipped `app.js` is a 2,354-line bundle containing duplicate copies of the other modules and Capacitor runtime. The source modules are not directly loaded by `index.html`; no package/build manifest or source map is committed. | `index.html:20`; `app.js:1-1553`; raw module imports |
| F-06 | Medium | Several async functions are invoked from DOM/native event handlers without an outer `.catch()`. Most normal paths catch internally, but malformed state, a failed storage clear, clipboard fallback failure, or an audio precondition can create unhandled rejections. | `app.js:2155-2324`; `storage.js:29-31`; `app.js:2095-2116` |
| F-07 | Medium | Morphology caches are process-lifetime, unbounded `Map`s and do not coalesce in-flight requests. They are not persisted and have no invalidation policy. | `morphology-service.js:68-115` |
| F-08 | Medium | Large UI regions are rebuilt with `innerHTML`; bookmark rendering is unbounded, and audio state updates scan/rebuild multiple regions. It is bounded for normal search results (20 cards) but can degrade with saved data. | `app.js:1783-1807`, `2030-2053`, `2072-2093` |
| F-09 | Medium | Several numeric/API-derived values are interpolated into HTML without a validation/escaping boundary. Most text is correctly escaped, but the safe rendering rule is inconsistent. | `app.js:1774`, `1876`, `1890-1893`; `escapeHtml` at `1617-1619` |
| F-10 | Medium | The UI is not a robust modal/accessibility implementation: nested interactive controls inside an element with `role="button"`, no focus trap/restore, very small text, and global `user-select:none`. | `app.js:1774`; `styles.css:310-323`; modal renderers |

### Recommendation

1. Preserve the existing search semantics and visual contract in tests.
2. Build a pre-normalized local Quran database and FTS-backed repository for Android.
3. Make search, highlighting, storage, morphology, and playback pure/use-case-driven services with injected platform ports.
4. Treat the current web API path as an optional online enrichment/fallback path, not the source of truth.
5. Fix audio command races and storage bounds before using the web client as a production shell.

---

## 1. Audit method and evidence boundaries

This is a static audit of the committed files. I checked:

- all JavaScript, HTML, CSS, Capacitor configuration, and generated bridge files in the checkout;
- line-level control flow, promise/cancellation paths, cache ownership, and DOM mutation sites;
- JavaScript syntax with `node --check` for every `assets/public/js/*.js` file;
- presence/absence of `indexedDB`, service-worker, Cache Storage, Web Worker, FTS, and `content-visibility` implementations.

The syntax check passes for all seven JavaScript files. There are no automated tests, `package.json`, lockfile, build configuration, source maps, Android/Gradle sources, or native Kotlin sources in the committed repository. Runtime claims about the unseen Android application cannot be proven from this checkout; the web-versus-native explanation below explicitly separates confirmed facts from likely differential causes.

Line references to `app.js` refer to the committed generated bundle. The same application logic also exists in the smaller raw modules; `app.js` includes bundled copies beginning around `app.js:686` and `app.js:1553`.

---

# Phase 1 — Comprehensive codebase audit

## 1.1 Runtime topology and build/distribution audit

### What actually runs

`index.html:20` loads only `./js/app.js` as a module. The loaded `app.js` starts with bundled Capacitor runtime code and contains the source logic for Quran data, storage, API, native bridge, audio, morphology, and app UI. The raw files are not separately imported by the HTML page.

This has four consequences:

1. **There are two apparent sources of truth.** Editing `assets/public/js/api-service.js`, for example, does not alter the shipped `app.js` until an absent/uncommitted build step is run.
2. **The raw files are not browser-loadable as-is without a bundler/import map.** `audio-engine.js` and `native-bridge.js` import bare package specifiers such as `@capacitor/core`; the browser cannot resolve those from this directory alone.
3. **Debugging is unnecessarily difficult.** There is no source map, package manifest, or build command in the checkout. Stack traces point into the generated bundle, and line references in raw modules do not match the deployed file.
4. **The bundle is duplicated in the repository.** `assets/native-bridge.js` is a generated Capacitor runtime (901 lines) in addition to `assets/public/js/native-bridge.js` and the runtime embedded in `app.js`. `cordova.js` and `cordova_plugins.js` are empty generated stubs.

`capacitor.config.json:4` points Capacitor at `webDir: "www"`, while the committed web files live in `assets/public`. That may be an external packaging convention, but no copy/build step is present here. A clean handoff needs one explicit source tree and one reproducible build output directory.

### Entry-point observations

- Good: the HTML has a viewport with `viewport-fit=cover`, a theme color, a description, and a small initial DOM shell (`index.html:1-20`).
- Good: all dynamic text is generally passed through `escapeHtml` before insertion.
- Risk: Google Fonts are remote (`index.html:9-12`). Font loading is not offline and can cause layout/typography changes. The native app should bundle the exact Quran fonts.
- Risk: there is no CSP, service worker, install manifest, or offline asset strategy. This is not a security exploit by itself, but it makes the claimed offline behavior materially weaker.
- Risk: the document is `lang="en"` even though Arabic and Urdu are first-class UI/content languages. Per-element `dir` is used, but the document language and locale semantics are incomplete.

---

## 1.2 `api-service.js` — data fetching, search, and Arabic enrichment

### Actual search pipeline

The service performs this sequence:

1. `resolveSearch()` trims/collapses whitespace and chooses an edition (`api-service.js:101-111`). Known Latin aliases are converted to Arabic when present (`105-106`); Urdu-looking characters choose `ur.jalandhry`; other Arabic chooses `quran-uthmani`; remaining input chooses `en.sahih`.
2. `request()` creates a private `AbortController`, connects the caller signal, and starts a timeout (`77-98`).
3. `search()` calls the public AlQuran Cloud `/search/{query}/all/{edition}` endpoint (`157-175`).
4. After the remote search completes, `loadArabicIndex()` is awaited (`177-180`). It either reads the full Arabic index from `localStorage` or fetches the complete Uthmani edition and builds an object keyed by absolute ayah number (`118-154`).
5. Every server match is converted with a hash lookup (`181`), but only the first 20 records are rendered by the UI (`app.js:1793-1797`).

### Strengths

- Caller cancellation is propagated to fetches, and a cancelled search is distinguished with `QuranApiError.cancelled` (`16-20`, `77-98`).
- `arabicIndexPromise` coalesces concurrent full-index loads and deliberately outlives an individual search cancellation (`113-117`, `119-123`). This is a sound cache ownership decision.
- The absolute-number lookup avoids repeatedly joining/searching surahs when decorating a result (`38-54`, `181`).
- A public API failure falls back to a small offline sample rather than showing fake exhaustive results (`213-223`; the comment in `quran-data.js:1-6` is honest about the sample's limits).
- `details()` requests all three editions in one call (`193-210`) and returns the original record if enrichment fails, preserving a usable result.

### Findings and hidden correctness issues

#### A. This is online-first, not offline-first (High)

There is no full local search corpus. `fallbackSearch()` scans only `OFFLINE_AYAHS`, which has four records (`api-service.js:57-69`; `quran-data.js:45-84`). A normal search waits for a remote search request. The full Arabic index is metadata/enrichment, not a search index: it is never queried to find matches.

This is the central performance finding. It also means:

- airplane-mode search can only return the four sample references;
- a successful response depends on CORS, DNS, API availability, and API behavior;
- a user may wait up to 18 seconds before the fallback path begins (`request` default timeout at `77`);
- online word study remains unavailable offline.

#### B. Cold search unnecessarily serializes a full-corpus fetch after search (Medium/High)

`search()` waits for the result request and only then starts `loadArabicIndex()` (`162`, then `177-180`). On a cold device, this can add a full Quran download, JSON parse, object construction, and synchronous localStorage serialization to the critical result path. The UI remains in the `Searching Quran…` state until all of that finishes (`app.js:1783-1791`).

The service intentionally tolerates an index failure, which is good, but it should not block first paint. A web refactor should render the server hits immediately, then enrich visible records in a background task or fetch only the missing visible ayahs.

#### C. Full-match allocation is not bounded at the service boundary (Medium)

`searchData.matches.map(...)` creates a record for every server match (`181`), even though the UI only displays 20. A common query can therefore allocate a large result array and duplicate references/metadata before the display limit is applied. The native repository should page from FTS and return a bounded page plus total count.

#### D. Search results themselves are not cached (Low/Medium)

The only persistent cache in this service is the Arabic index. Repeating the same query sends another network request. The in-memory promise is for the full Arabic enrichment only; it is not a query-result cache.

If query caching is desired for web resilience, use a small normalized-query/edition/locale keyed LRU with an explicit TTL and maximum bytes. Do not store arbitrary full result arrays in localStorage.

#### E. Error classification and fallback semantics are too broad (Medium)

If the primary Arabic edition request rejects, the service sequentially tries Urdu (`163-171`). This includes network errors and server errors, not only a no-match result. Conversely, if the API returns a successful zero-count response, the Urdu fallback is not attempted because no exception is thrown. The comment at `165-166` describes a no-match fallback, but the implementation is an exception fallback.

`payload?.data` is used directly as an `Error` message (`86-87`). If the API sends an object rather than a string, the eventual UI can show `[object Object]`. Error codes for timeouts and network errors also remain zero, making operational classification difficult.

#### F. `localSearch()` does not use the same resolution plan (Medium)

`localSearch(input)` calls `fallbackSearch(input)` directly (`213-223`) instead of `resolveSearch()`. A Latin alias such as `allah` can find a sample through `searchKeys`, but its offline record is labelled as an English edition and receives no Arabic highlight. Offline display/query semantics therefore differ from online semantics.

#### G. Arabic normalization is useful but lossy (Medium correctness)

`normalise()` applies NFKD, strips selected Arabic marks, maps alef variants, maps `ى` to `ي`, maps `ة` to `ه`, and removes tatweel (`23-31`). This is fast and useful for tolerant search, but it can create false positives and does not cover every Arabic/Persian/Urdu compatibility character. The `ة -> ه` mapping is especially broad. Preserve exact text separately and make the normalization policy a versioned, tested domain function.

#### H. Input/schema validation is missing (Medium)

The service assumes `data.surahs`, `surah.ayahs`, `searchData.matches`, and detail arrays have the expected shape. A malformed response is partly tolerated by the UI fallback, but the code does not distinguish malformed data from a genuine no-result response. Validate external payloads at the data boundary and reject with a typed error.

### Promise/cancellation review

The request-level promise handling is mostly sound:

- timeout timers and caller listeners are cleaned in `finally` (`95-98`);
- `loadArabicIndex()` resets its shared promise after a failure (`150-153`);
- search cancellation is checked before and after index enrichment (`177`, `180`).

The main gap is that `details()` intentionally swallows all non-cancellation errors and returns the stale record (`207-210`). That makes the UI look successful while translations may silently be missing. Return an explicit `enrichmentStatus` or error field instead.

---

## 1.3 `storage.js` — persistence, quota, and memory

### Current storage model

All persistence is synchronous `localStorage` JSON under four keys (`storage.js:1-6`):

- history, capped to 12 items (`20-22`);
- bookmarks, unbounded (`23-24`);
- preferences, small (`25-26`);
- the full Arabic index, unbounded from the storage adapter's perspective (`27-28`).

There is no IndexedDB, transaction, compression, chunking, schema migration, byte budget, or storage estimate.

### What is safe

`safeRead()` and `safeWrite()` catch parse, private-mode, security, and quota errors (`8-18`). This prevents a storage exception from crashing most normal reads/writes. The history limit is appropriate for a small recency list.

### What is unsafe or operationally hidden

1. **Synchronous large JSON work blocks the main thread.** `JSON.parse` of the full Arabic index and `JSON.stringify` during save both occur on the UI thread. The save is triggered in the search path (`api-service.js:147`), so a first search can incur a visible pause.
2. **The full index is duplicated.** The running application retains the parsed object in `api.arabicIndexPromise` (`api-service.js:73`, `119-123`) while the browser's storage layer retains a serialized copy. Result/bookmark objects can retain references to the same strings, and bookmark serialization creates another copy during writes.
3. **Quota failures are silent.** If the Arabic index write fails, the current process still works because the in-memory promise resolves, but the next launch silently downloads it again. If bookmark writes fail, the UI claims a bookmark was saved even though a reload loses it.
4. **Bookmarks are unbounded.** `toggleBookmark()` prepends a complete record, including Arabic, translation/match text, query, edition, and metadata, without a cap (`app.js:2072-2086`). A user can exhaust storage, and every new bookmark serializes the entire array.
5. **No schema validation.** A syntactically valid but structurally wrong JSON value is returned. Startup spreads preferences and assumes `bookmarks`/`history` are arrays (`app.js:1566-1585`). Corrupted local storage can therefore break rendering with `.map`, `.filter`, or `.find` errors.
6. **`clearAll()` is not safe.** Unlike the other methods, it directly calls `localStorage.removeItem` without a `try/catch` (`storage.js:29-31`). In a denied/private storage context, the async click handler can reject and state is not reset.
7. **No version or content identity.** The key says `v1`, but there is no edition hash, normalization version, API revision, checksum, or migration envelope. A future change in Uthmani text or normalization can reuse incompatible cached data.

### Recommended web storage boundary

- Keep localStorage only for tiny preferences and perhaps a capped history list.
- Put ayahs, normalized search text, bookmarks, and morphology records in IndexedDB with schema/version migrations.
- Store bookmarks as stable IDs plus a small snapshot/version, not arbitrary full API response objects.
- Add an explicit `StorageResult` (`saved`, `quota`, `unavailable`) instead of swallowing all failures.
- Validate every read and fall back to a known schema.
- Use a bounded in-memory LRU for hot objects; do not make the full index an accidental permanent singleton unless its memory budget is measured.

---

## 1.4 `quran-data.js` — data completeness and domain tables

`quran-data.js` contains three different kinds of data:

1. transliteration aliases (`1-33`);
2. a small, heuristic `ROOT_LEXICON` used for a UI hint (`35-52`);
3. four sample ayahs plus quick-search concepts (`45-100`).

### Findings

- It is intentionally small and fast. A four-row fallback scan is not a performance concern.
- It is not a Quran index and does not implement morphology parsing.
- `ROOT_LEXICON` is a heuristic display hint, not verified morphology. Several regex alternatives are duplicates, for example `صبر|patien|صبر` and `علم|know|علم` (`39-43`). This is harmless for speed but should be cleaned up or labelled clearly as a suggestion dictionary.
- `TRANSLITERATION_ALIASES` mixes transliteration-to-Arabic mappings with English concepts that remain English (`mercy`, `faith`). That is a deliberate policy but should be represented as typed alias records with a target edition instead of inferred from `isLatin(alias)`.
- The native seed should not mirror the four-row sample. It should contain authoritative full-Quran text, stable global/ayah keys, exact Uthmani text, translations, normalized search columns, and provenance/version metadata.

---

## 1.5 `morphology-service.js` — word-level network and caches

### Actual behavior

- `getJson()` wraps fetch with timeout/caller cancellation (`10-25`). Its own timeout also appears as a DOM `AbortError`; callers must interpret that as timeout/cancellation.
- `verseWords()` requests Quran.com word-by-word data and caches visible word projections by `surah:ayah` (`74-82`).
- `wordStudy()` starts the verse-word request and QuranHub morphology request concurrently with `Promise.all` (`84-115`). It extracts a root, derives a coarse part of speech, and limits displayed grammar features to eight values.

### Strengths

- The two independent first-load requests are parallel, which is the correct latency pattern (`89-92`).
- The projection drops unused API fields before caching, limiting retained memory (`32-40`).
- The service explicitly does not invent a lemma when the source does not provide one (`107-111`), which is a good data-integrity decision.

### Findings

1. **Unbounded process-lifetime caches.** `verseCache` and `wordCache` are `Map`s with no maximum, TTL, persistence, or clear operation (`68-72`). A long-lived session that browses many ayahs retains every word array and study object.
2. **No in-flight deduplication.** Two rapid calls for the same uncached verse or word each start network work. Cache only coalesces after the first call resolves (`74-80`, `84-92`). Keep an in-flight promise map or a shared repository request cache.
3. **Cancellation and cache policy are not explicit.** A request that completes just as its caller is cancelled can still populate the cache. That may be acceptable for a shared read-through cache, but document it and make it independent of UI ownership as the Arabic index already is.
4. **`Promise.all` loses partial data.** If QuranHub morphology fails, a usable Quran.com word projection is discarded and the UI shows the unavailable state. Return partial study data with a source/status field when appropriate.
5. **Fallback token positions are not guaranteed API positions.** `fallbackTokens()` numbers whitespace tokens from one (`118-124`). If a failed verse response contains punctuation/markers or word positions excluded by `visibleWords()`, the generated position may not be the position expected by QuranHub.
6. **No offline morphology.** A detail view can fall back to tokenized Arabic, but root/grammar/translation still require online endpoints.
7. **No response schema validation.** The code assumes `tags_by_category` and tag properties have the expected shape. Malformed data can make the study silently incomplete.

### Performance relevance

Morphology is **not on the normal search path**. It starts only when opening a detail or tapping a word (`app.js:1915`, `1949`). It therefore cannot explain the 4–5 second deep-search result except indirectly if the native app performs morphology for every search hit while this client does not.

---

## 1.6 `audio-engine.js` — playback state machine and lifecycle

### Current model

`QuranAudioEngine` owns one hidden HTML `<audio>` element, a `Set` of listeners, and a small mutable state object (`audio-engine.js:51-64`). `ensureAudio()` lazily creates the element and wires events (`66-115`). Track URLs are generated for three reciters (`4-49`). Media Session handlers and metadata are installed on first use (`203-215`, `229-260`).

### Strengths

- One audio element avoids multiple simultaneous players.
- `playing`, `pause`, `waiting`, `canplay`, `ended`, and `error` events update UI state.
- `audio.play()` rejection is caught in the normal `play()`/`toggle()` paths (`145-163`), so autoplay/user-gesture failures do not usually crash the UI.
- Native/media-session calls are individually optional and guarded by `try/catch`.
- Speed, repeat, seek-back, seek-forward, and seek-to are exposed through a narrow API.

### Confirmed race conditions

#### A. No command generation or serialization (High)

`play()` changes `audio.src`, calls `load()`, and then awaits `audio.play()` (`133-151`). There is no operation ID. Consider this sequence:

1. `play(A)` sets source A and awaits.
2. The user immediately requests `play(B)`, which pauses A, sets source B, and awaits.
3. The first `audio.play()` resolves or rejects after the source has changed.
4. The first continuation calls `syncNativeSession()` or writes an error against the current shared state, which now represents B.

The same issue applies to rapid toggles and reciter switching. A stale rejection can display an error for a newer track or clear its loading state. Serialize commands with a mutex/actor or attach a monotonically increasing generation to every asynchronous operation and ignore stale completions.

#### B. `setReciter()` does not preserve a stable transition (Medium/High)

It captures `wasPlaying`, calls `play()` unconditionally, reapplies repeat/speed, then pauses if the previous state was paused (`165-173`). That can briefly start a previously paused track, restarts from position zero, and depends on `state.playing` being current. The desired behavior should be explicit: load the new URL, preserve `wasPlaying` and optionally position according to product policy, then issue exactly one play/pause command for the new generation.

#### C. State is event-driven but not authoritative

`pause()` only calls `audio.pause()` (`189-191`); the state is changed later by the event. `stop()` changes state immediately while `pause`, `emptied`, or source events can still arrive (`193-201`). There are no `loadstart`, `stalled`, `suspend`, `abort`, `emptied`, `durationchange`, or `ratechange` handlers. Stale media events are not associated with a track generation.

#### D. Media Session synchronization can reorder

`syncNativeSession()` is invoked from event handlers without awaiting it (`76-112`) and also after `play()`. Multiple metadata/playback/position calls can complete out of order. The entire metadata update is one `try` block; if metadata fails, position state is skipped and only a browser fallback playback state is attempted (`236-249`).

#### E. Background suspension is not handled

There is no audio-specific `visibilitychange`, app pause/resume, audio-focus, noisy-audio, connectivity, or WebView lifecycle strategy. The Capacitor bridge only configures keyboard/status bar and back handling (`native-bridge.js:17-43`, `76-87`). Media Session controls are not a background playback service. On Android, reliable background playback belongs in a `MediaSessionService`/Media3 player process with audio focus and notification handling.

#### F. Position/speed edge cases

- `lastPositionPush` is not reset on track changes/stops (`96-101`), so a new track may wait up to five seconds for a position update.
- `setSpeed()` accepts any finite-looking numeric conversion without clamping (`175-180`). Negative, infinite, or unsupported rates should be rejected/clamped.
- `syncNativeSessionPosition()` checks duration but not whether `currentTime` is finite before passing it to the plugin (`252-260`); a `NaN` position is caught by the plugin but not reported.
- `toggle()` with no record attempts to call `audio.play()` on whatever source exists (`154-163`). The dock normally prevents this, but the engine API has no invariant enforcing it.
- `trackFromRecord()` assumes a valid record and emits `undefined` path components if metadata is absent (`32-49`). Validate before URL construction.

### Listener/memory review

The listener set has unsubscribe support (`122-126`), and the singleton is intended to live for the app lifetime. However, native back and keyboard listeners are not retained/removed on teardown, and `initializeNativeShell()` registers keyboard listeners without awaiting the returned promise (`native-bridge.js:33-41`). This is low risk in a single full-page lifetime, but it matters in hot reloads, embedded WebViews, or tests.

---

## 1.7 `app.js` — UI, state, DOM, and event orchestration

### State and startup

The app keeps one mutable global state object (`app.js:1554-1588`). It reads all stored data synchronously before mounting (`1566-1585`), configures audio preferences (`1587-1588`), mounts the full shell, renders all screens, then starts native integrations (`2340-2349`).

The search/detail/word flows use three AbortControllers plus sequence counters (`1557-1563`). This is a good stale-result defense and should be preserved in a platform-neutral controller/use-case layer.

### Strengths

- Event delegation on `#app` avoids one listener per dynamic card (`2155-2324`).
- The `searchSequence`, `detailSequence`, and `wordSequence` checks prevent most stale network results from replacing a newer view (`1845-1863`, `1914-1926`, `1948-1959`).
- User/API text usually passes through `escapeHtml` (`1617-1619`) or the escaping branch of `highlight()` (`1664-1678`).
- Result display is intentionally capped at 20 and supports a manual load-more (`1793-1797`).
- Screens are hidden rather than repeatedly destroyed during navigation, so scroll positions can be restored (`1732-1741`).

### Search orchestration findings

1. `performSearch()` aborts the previous request and updates the loading UI before awaiting the service (`1825-1864`). This is responsive, but the first search is still held behind the full Arabic index because the service awaits it.
2. The request controller is never nulled after completion. Aborting an already-completed controller is harmless, but it is untidy and obscures ownership.
3. A cancelled search can leave the placeholder zero-result object in state after `finally` renders it. This is not normally visible because a newer search usually replaces it, but a user-cancelled current search has no explicit idle/cancelled state.
4. The offline fallback does not preserve the service's resolved alias/edition policy, as described above.
5. Detail failures are silent because `api.details()` returns the original record. The UI cannot tell the user that translations are stale/missing.
6. `morphologyService.verseWords()` is fetched in parallel with detail (`1915`), which is good. However, its error is converted to `null` and the UI falls back to whitespace tokens, hiding whether word-level data was unavailable.

### DOM repaint and allocation hotspots

#### A. Full region replacement

The following functions rebuild complete regions using `innerHTML`:

- results top/stats/controls/body (`1783-1797`);
- bookmarks, history, settings (`1799-1807`);
- detail, word sheet, reciter sheet, quick-search modal (`1884-2017`);
- now-playing dock (`2040-2049`).

For normal search results this is acceptable because only 20 cards are inserted. It is not bounded for bookmarks: every saved record is rendered, and every bookmark change rebuilds the entire bookmark list plus all bookmark button visuals (`2072-2093`). A large or corrupted bookmark array can freeze the main thread and hit DOM/memory limits.

#### B. Audio update fan-out

Every audio snapshot updates the dock, scans every `[data-ayah-card-id]`, and replaces the detail audio section (`2328-2338`; implementations `2030-2053`). This is small with 20 results but becomes O(number of rendered cards) for bookmarks. `outerHTML` replacement also discards focus and any transient DOM state inside the audio hub.

#### C. Synchronous persistence in interaction paths

Bookmark writes call `JSON.stringify` synchronously. Preferences are written on every speed/repeat selection. Full Arabic index save occurs in the search request. These are the principal main-thread blocking operations; the regex/highlight itself is not the dominant cost for 20 short ayahs.

#### D. No virtualization or idle work

There is no `IntersectionObserver`, `content-visibility`, virtual list, Web Worker, `requestIdleCallback`, or chunked render. The result limit provides a practical bound for search, but the bookmark path has no equivalent bound.

### Async event-handler rejection audit

The browser does not await a promise returned from an event listener. The `async` click listener at `app.js:2184` has no outer catch. Additionally, several async functions are called without awaiting them:

| Call site | Risk |
|---|---|
| `app.js:2159`, `2212-2214`, `2228-2229` | `performSearch()` usually catches service errors, but a malformed state/DOM or synchronous renderer/storage failure rejects its ignored promise. |
| `app.js:2232-2235` | `openDetail()` catches network errors, but pre-`try` rendering or malformed record data can reject an ignored promise. |
| `app.js:2246-2249` | `openWordStudy()` mostly catches; a synchronous state/render exception can reject. |
| `app.js:2258-2260` | `toggleAudio()` is async and is called without `await` or `.catch()`. An invalid record/engine precondition can produce an unhandled rejection. |
| `app.js:2254-2256` | `copyCurrentAyah()` catches the primary clipboard call, but an exception in the deprecated textarea fallback is outside a second protective boundary. It also reports success without checking `execCommand()`'s boolean result. |
| `app.js:2177-2179` | `handleNativeBack()` is async and is called without awaiting/catching from the keydown handler. |
| `app.js:2306-2323` | `storage.clearAll()` can throw because it is not safe-wrapped; the surrounding async click listener then rejects. |
| `app.js:2347-2348` | Startup calls two async native functions without awaiting them. They mostly catch internally, but keyboard listener registration promises are ignored inside `initializeNativeShell()`. |

A minimal boundary pattern is `void operation().catch((error) => dispatch({ type: 'UNEXPECTED_ERROR', error }))` at every event edge, plus a single typed error reporter. Do not rely on each use case remembering to catch UI errors.

### DOM safety findings

`escapeHtml()` is correct for the five common HTML-sensitive characters, and most text values go through it. The policy is inconsistent, however:

- `record.number`, `record.numberInSurah`, and `record.surah.number` are interpolated into attributes/reference strings without validation/escaping (`1774`, `1876`, `1890-1893`);
- `juz`, `page`, and `study.tagCount` are inserted as raw interpolations in detail markup;
- API/localStorage data is untrusted at the boundary even if the current public API is expected to return numbers.

Normalize/validate the record schema before it reaches a renderer and use DOM property setters or escaped attribute helpers for every dynamic value. Keep HTML string rendering confined to a renderer module.

### Modal and accessibility findings

- An ayah `<article>` has `role="button"`, `tabindex="0"`, and nested bookmark/detail buttons (`1774`). This creates nested interactive semantics and can confuse screen readers/keyboard users.
- Modal open/close only toggles `body.modal-open` (`1896-1898`). There is no focus trap, initial focus guarantee, focus restoration, backdrop close policy, or inert background.
- Escape is routed through the native back handler, which is reasonable, but it is called without awaiting/catching (`2177-2179`).
- Global `user-select:none` is applied to `body *` (`styles.css:310-323`), so users cannot long-press/select displayed Quran text; only inputs are restored to selectable.
- Text sizes of 9–11px are used for several labels, which is difficult on small devices.
- The app uses dynamic `dir` attributes, but the overall language/accessibility tree needs explicit Arabic/Urdu labels and live-region announcements for result changes.

---

## 1.8 `native-bridge.js`, generated bridge, and Capacitor configuration

### `assets/public/js/native-bridge.js`

The bridge cleanly exposes `isNative`, shell initialization, haptics, native confirmation, back-handler registration, and app exit (`native-bridge.js:11-87`). Each status bar/keyboard operation is guarded.

Findings:

- `Keyboard.addListener()` returns an async listener handle/promise but is called without `await` or retained for removal (`33-41`). The surrounding `try` does not catch a later rejection.
- The bridge conflates “not native” with “confirmation denied”: `confirmNative()` always returns `false` on the browser (`61-69`). Consequently, “Clear data” cannot be confirmed in a web preview. That may be intentional, but it should be explicit in the platform port contract.
- Native shell initialization is called fire-and-forget from startup (`app.js:2347`).
- The bridge has direct DOM and Capacitor dependencies, so it is a platform adapter, not domain logic. Keep it out of search/audio use cases.

### `assets/native-bridge.js`

This is a generated Capacitor runtime, not application logic. It duplicates the runtime embedded in `app.js` and should be excluded from hand-maintained source. Generated bridge files should be reproducible from declared dependencies and build metadata.

### Capacitor configuration

`capacitor.config.json` configures keyboard and status bar, but no audio/background service, storage, HTTP, or native database exists in this checkout. `capacitor.plugins.json` lists App, Dialog, Haptics, Keyboard, StatusBar, and Media Session only. This is insufficient for the native Android architecture requested in Phase 4; a real native implementation should not depend on the WebView HTML audio element for background playback.

---

## 1.9 `styles.css` — rendering and performance audit

### Rendering cost

The CSS is deliberately visual, but several effects multiply across a result list:

- `.glass` applies `backdrop-filter: blur(16px)` and multiple shadows (`50`), while the fixed header, bottom navigation, modal, toast, and cards can all create compositing/blur work.
- `background-attachment: fixed` and fixed star/mihrab layers (`22-35`) are expensive or inconsistent in mobile WebViews.
- highlighted words use both `box-shadow` and `text-shadow` (`121`), which increases paint cost when many matches are visible.
- animated skeletons, stars, and waveforms continue unless reduced-motion applies (`33`, `203-204`, `227-234`). The reduced-motion rule is present (`209`) and is a good safeguard, but it does not remove blur/compositing cost.

These are visual paint costs, not the reason the search is fast. They can make a long list feel slower after data arrives. For the web shell, limit blur to fixed chrome/modal surfaces, remove fixed background attachment on low-end devices, and use a simpler highlight style.

### Layout/interaction observations

- Result cards are two-column at 620px (`207`), which is bounded and sensible.
- The app reserves large bottom padding for the dock/nav (`37`, `214`) and hides chrome when the keyboard is visible (`216-220`), which is appropriate for a WebView.
- `.view-screen[hidden]` is explicitly forced to `display:none` (`324`), so hidden screens do not lay out.
- `prefers-reduced-motion` is handled.
- The global non-selectable rule is a usability regression for Quran text.
- Remote fonts and no local fallbacks that guarantee metric parity can cause layout shift and different Arabic glyph shaping between browser/native.

---

# Phase 2 — Performance and the “speed secret”

## 2.1 Step-by-step critical path

### Online search, cold cache

```text
submit form
  -> app.performSearch()
  -> api.resolveSearch()                 O(query length)
  -> fetch AlQuran Cloud search          server-side full-corpus work
  -> await loadArabicIndex()
       -> localStorage JSON parse OR
          fetch full quran-uthmani
          -> JSON parse
          -> build object keyed by absolute ayah number
          -> JSON.stringify + localStorage.setItem
  -> matches.map(toRecord)               O(number of server matches)
  -> render first 20 cards               O(20 * visible ayah length)
  -> highlight short strings             linear-ish regex replace per displayed text
  -> browser style/layout/paint
```

### Online search, warm cache

```text
submit
  -> remote server-side search
  -> arabicIndexPromise already resolved
  -> O(1) object lookup per match
  -> allocate all result records
  -> render/highlight at most 20 cards
```

### Offline fallback

```text
remote request times out/fails
  -> scan exactly four OFFLINE_AYAHS
  -> normalize a few short strings
  -> render matching samples
```

This fallback is fast because it is tiny, not because it is an optimized full-Quran search.

## 2.2 What specifically makes the web path look fast

1. **The search corpus is outside the browser.** The `/search` request is the largest optimization. JavaScript does not loop over 6,236 ayahs, normalize each translation, build an inverted index, or run morphology.
2. **The full Arabic index is memoized.** `arabicIndexPromise` prevents multiple simultaneous full-index downloads and retains the parsed index for the session (`api-service.js:118-154`).
3. **Warm launches use a direct object cache.** A cached object with more than 6,000 keys is accepted (`120-123`). `index[match.number]` is a constant-time lookup rather than a nested surah/ayah search.
4. **Search result rendering is bounded.** `state.displayLimit` starts at 20 (`app.js:1571-1572`, `1840-1841`), and only those records become DOM cards (`1793-1797`). The service still maps all response matches, but DOM work is capped.
5. **Highlighting is a short-string operation.** `highlight()` builds a safe global regex and does one `String.replace()` over each displayed ayah/context (`app.js:1652-1678`). It produces simple `<span class="highlight-word">` nodes. There is no per-character DOM node, no full-document walk, and no morphological parsing.
6. **The browser batches DOM creation.** Result markup is assembled as one string and assigned once to `resultsBody.innerHTML` (`1797`), which is generally cheaper than appending and laying out one hit at a time.
7. **Network work is asynchronous.** Fetch and JSON wait without a synchronous JavaScript loop blocking the main thread. This does not make CPU work faster, but it prevents the UI thread from visibly spinning during I/O.
8. **Stale searches are cancelled.** The controller and sequence check prevent an old query from triggering a second large render (`app.js:1832-1863`). This improves perceived responsiveness during typing/re-submission, although the form submits rather than live-searches.
9. **Morphology is deferred.** The expensive-looking word study calls are not made for every search hit. They occur only after detail/word interaction (`app.js:1915`, `1949`).

## 2.3 What is *not* responsible

The following mechanisms are absent or not used for normal search:

- no IndexedDB query;
- no Web Worker;
- no FTS4/FTS5 or inverted index in the browser;
- no full-Quran data in `quran-data.js`;
- no cached search results by query;
- no morphology parser over the search corpus;
- no SIMD/native string-search bridge;
- no asynchronous chunked local scan.

The browser's optimized regex/string implementation may make the final short-string formatting efficient, but it is a secondary effect. The web code would not be a 4–5 second full-Quran local-search implementation if the remote `/search` service were removed; it would only search four samples.

## 2.4 Why cyan highlighting is cheap here

The highlight path is:

1. choose the text to show (`arabic`, English context, or Urdu context);
2. build one escaped literal regex, or one Arabic variant/diacritic-tolerant regex;
3. call `replace()` on a short verse string;
4. escape unmatched/matched substrings;
5. inject a small number of spans in one HTML batch;
6. let CSS paint the spans cyan.

The regex is rebuilt per call, so it is not maximally optimized, but the query and verse strings are short and the number of calls is bounded by the rendered cards. The CSS glow can increase paint work, but it does not explain a 10–15 second CPU gap in deep search.

## 2.5 The native comparison that must be validated

The repository does not contain the native search implementation, so the exact native bottleneck cannot be named. The likely causes, if it is searching locally, are:

- scanning every ayah/translation on the main/UI thread;
- normalizing the same Quran text on every query instead of precomputing normalized columns;
- allocating a new `Spannable`/`AnnotatedString` and regex for every full result set;
- rendering all matches instead of paging/virtualizing;
- performing morphology/token parsing for every hit;
- triggering repeated Compose recompositions or TextView layout passes;
- converting between JavaScript/native/JSON for each result;
- doing synchronous database/file reads or a first-run data import on the UI thread.

Do not assume which one is true until the native path is profiled. The decisive experiment is an apples-to-apples benchmark: same corpus, same query, same normalization, same result limit, same cold/warm condition, and search-only timing separated from rendering/highlighting timing.

## 2.6 Instrumentation plan without analytics

Local development instrumentation is enough; no analytics/crash tracking is needed. Add temporary or debug-only marks around:

```text
input -> normalized query
query dispatch -> repository returns IDs/count
repository returns -> records mapped
records mapped -> highlight spans built
spans built -> first visible frame
```

For the web, use `performance.mark/measure` or a local console table. For Android, use `BenchmarkRule`/Macrobenchmark and `Trace.beginSection`. Capture cold/warm P50/P95 over representative queries:

- Arabic with diacritics and alef variants;
- Urdu spelling;
- Latin transliteration alias;
- common high-hit query;
- multiword phrase;
- zero-result query.

Report CPU time, DB time, mapping time, first visible frame, and total rendered count separately.

---

# Phase 3 — Immediate web refactoring strategy

The goal is not a JavaScript framework rewrite. The goal is to retain Vanilla JS while separating pure application logic from DOM, storage, network, Capacitor, and audio implementations.

## 3.1 Establish one real source tree

Move/restore hand-maintained sources into an explicit tree and generate the public bundle:

```text
src/
  domain/
    quran-models.js
    arabic-normalizer.js
    search-planner.js
    highlight-ranges.js
    errors.js
  application/
    search-use-case.js
    detail-use-case.js
    word-study-use-case.js
    bookmark-use-case.js
    audio-use-case.js
    app-store.js
  data/
    quran-repository.js
    remote-quran-data-source.js
    local-quran-data-source.js
    morphology-repository.js
    cache.js
    storage-port.js
  platform/
    browser-audio.js
    browser-storage.js
    capacitor-shell.js
    http-fetch.js
  ui/
    renderers/
    dom-view.js
    event-controller.js
  main.js
assets/public/                 # generated distribution output only
```

Do not hand-edit the generated `assets/public/js/app.js`. Commit the build command, package manifest/lockfile, source map policy, and a check that generated output is current. If this repository intentionally stores only a distribution, state that explicitly and keep a release artifact separate from source.

## 3.2 Define platform-neutral domain contracts

The domain layer should not import `document`, `window`, `localStorage`, `navigator`, Capacitor, or `fetch`.

```js
// domain/quran-repository.js
export class QuranRepository {
  async search(_plan, _options) {
    throw new Error('Not implemented');
  }
  async getAyah(_id, _options) {
    throw new Error('Not implemented');
  }
  async getVerseWords(_id, _options) {
    throw new Error('Not implemented');
  }
}

// domain/audio-port.js
export const audioPort = {
  load: async (_track) => {},
  play: async () => {},
  pause: async () => {},
  stop: async () => {},
  setSpeed: async (_speed) => {},
  setRepeatOne: async (_enabled) => {},
  subscribe: (_listener) => () => {}
};
```

`api-service.js` becomes a remote data source plus a repository adapter. It should receive a transport and cache through its constructor instead of importing the singleton `storage` directly. `morphology-service.js` should receive a transport and cache. `audio-engine.js` should be split into a pure playback state machine and a browser `HTMLAudioElement` adapter.

## 3.3 Make state transitions a reducer/store, not renderer side effects

Keep the current useful sequence-token idea, but move it into the application layer:

```js
const initialState = {
  route: 'home',
  search: { status: 'idle', query: '', result: null, requestId: 0 },
  detail: { status: 'closed', record: null, words: [] },
  bookmarks: [],
  history: [],
  preferences: { translation: 'both', reciter: 'alafasy', speed: 1, repeat: false },
  audio: { status: 'idle', track: null, error: null }
};

function reducer(state, action) {
  // pure state changes only; no DOM, fetch, or storage
}

export function createStore({ reducer, initialState, effects }) {
  // dispatch action -> reducer -> notify subscribers -> run effect
}
```

UI event handlers dispatch commands (`SEARCH_SUBMITTED`, `DETAIL_OPENED`, `WORD_SELECTED`, `BOOKMARK_TOGGLED`). Effects call use cases and dispatch success/failure/cancelled actions. Renderers subscribe to state and only update the affected view.

At each DOM/native event boundary:

```js
void controller.submitSearch(query).catch((error) => {
  store.dispatch({ type: 'UNEXPECTED_FAILURE', error: toAppError(error) });
});
```

This closes the ignored-promise gap without putting `try/catch` in every renderer.

## 3.4 Normalize and highlight once, with testable ranges

Keep exact Quran text and normalized search text separate:

```js
const normalized = normalizeArabic(exactText);
const query = normalizeArabic(userQuery);
const ranges = findMatchRanges(normalized, query);
```

For display, return a view model such as:

```js
{ text: exactText, spans: [{ start: 12, end: 16, kind: 'match' }] }
```

The DOM adapter turns ranges into text nodes and `<span>` elements. It should not decide what edition to search, normalize records, or call APIs. Test vectors must cover diacritics, alef variants, `ة/ه`, `ى/ي`, Urdu characters, phrase whitespace, overlapping matches, and no match.

For the current web client, `highlight()` can remain a short-term implementation, but:

- compile/cache the per-query regex once per render, not once per text field;
- cap query length and result text length at the boundary;
- use an escaped attribute helper for all IDs;
- avoid the glow-heavy CSS on every match when many hits are visible;
- preserve combining marks as part of the same rendered text node.

## 3.5 Caching rules

Use three explicit cache classes:

1. **Request coalescing:** key -> in-flight promise, removed on settle.
2. **Hot memory cache:** bounded LRU by item count/bytes for recent ayah/detail/morphology records.
3. **Persistent cache:** IndexedDB with schema/version/content identity and an eviction/repair policy.

Cache keys should include edition, language, normalization version, and record identity. Caches should expose `clear`, `size`, and hit/miss diagnostics in development. Never infer cache validity from `Object.keys(index).length > 6000`.

## 3.6 Storage adapter

Define an interface with asynchronous methods:

```js
const storagePort = {
  loadPreferences: async () => defaults,
  savePreferences: async (preferences) => ({ ok: true }),
  listBookmarks: async () => [],
  putBookmark: async (bookmark) => ({ ok: true }),
  deleteBookmark: async (id) => ({ ok: true }),
  listHistory: async () => [],
  clearAll: async () => ({ ok: true })
};
```

The browser adapter can use IndexedDB; a small localStorage adapter can remain for preferences. The application layer must receive a result/error and only update optimistic state when the write is confirmed or explicitly marked pending.

## 3.7 DOM rendering plan without React/Vue

- Keep event delegation.
- Render a `<template>`/`DocumentFragment` for a single result page.
- Keep stable root elements and update only changed labels/buttons for audio/bookmark snapshots.
- Add a bounded bookmark page or incremental `Show more`, matching results behavior.
- Use keyed DOM maps by absolute ayah number if preserving nodes matters.
- Schedule noncritical enrichment with `requestIdleCallback` where available, with a timeout fallback.
- Do not mix layout reads and writes in one loop.
- Add `content-visibility:auto` only after measuring; it is not a substitute for a result bound.
- Keep modals in a dedicated view controller with focus capture/restore, `aria-labelledby`, and background inertness.

## 3.8 Priority order for immediate fixes

### P0 — before production/native parity work

1. Fix audio command generations/serialization.
2. Replace unbounded/synchronous full-index and bookmark persistence.
3. Establish one source/build artifact and add tests.
4. Add outer promise boundaries to event handlers.
5. Validate/escape every external record field before HTML rendering.

### P1 — web reliability/performance

1. Do not block first result paint on full Arabic index enrichment.
2. Bound result mapping and bookmarks.
3. Add typed error/status states instead of swallowing detail failures.
4. Add in-flight morphology dedupe and bounded cache.
5. Bundle fonts or provide an offline typography strategy.

### P2 — quality/accessibility

1. Correct modal focus semantics and nested button roles.
2. Allow selection/copy of Quran text.
3. Reduce low-value blur/glow on constrained devices.
4. Add schema/version migrations and local debug performance marks.

---

# Phase 4 — Native Android transition blueprint

## 4.1 Target architecture

Use a standard Clean Architecture boundary:

```text
Compose UI
  -> ViewModel / StateFlow / UI events
  -> use cases (search, open ayah, word study, bookmark, playback)
  -> repository interfaces
  -> Room local data source + bounded memory cache
  -> optional remote data sources for refresh/enrichment only

MediaController <-> Media3 MediaSessionService <-> ExoPlayer

DataStore: small preferences
Room: Quran corpus, FTS, translations, bookmarks, history, morphology cache
```

The offline database is the source of truth. Existing public APIs may remain optional online sources for morphology or data refresh; no new cloud backend is required or recommended.

Suggested packages:

```text
com.magniaayat/
  domain/
    model/
    repository/
    usecase/
    search/ArabicNormalizer.kt
    search/HighlightRanges.kt
  data/
    room/
    remote/
    repository/
    cache/
  playback/
    Media3ExoPlayerService.kt
    PlaybackRepository.kt
  feature/home/
  feature/search/
  feature/detail/
  feature/bookmarks/
  feature/history/
  feature/settings/
  ui/theme/
  MainActivity.kt
```

## 4.2 Room data model

### Core entities

```kotlin
@Entity(tableName = "surah")
data class SurahEntity(
    @PrimaryKey val number: Int,
    val nameArabic: String,
    val nameEnglish: String,
    val nameEnglishTranslation: String?,
    val revelationType: String?
)

@Entity(
    tableName = "ayah",
    indices = [
        Index(value = ["surahNumber", "numberInSurah"], unique = true),
        Index(value = ["surahNumber"])
    ],
    foreignKeys = [ForeignKey(
        entity = SurahEntity::class,
        parentColumns = ["number"],
        childColumns = ["surahNumber"]
    )]
)
data class AyahEntity(
    @PrimaryKey val globalNumber: Int,
    val surahNumber: Int,
    val numberInSurah: Int,
    val juz: Int?,
    val page: Int?,
    val arabicUthmani: String,
    val arabicSearch: String,
    val english: String?,
    val englishSearch: String?,
    val urdu: String?,
    val urduSearch: String?,
    val dataVersion: String
)
```

`arabicUthmani` is never overwritten by normalization. `arabicSearch` is precomputed at seed/import time with the exact same versioned policy as the web/native query normalizer. Keep English/Urdu search columns separate if edition-aware search behavior matters.

### FTS choice

Room has first-class annotations for FTS3/FTS4. A conceptual Room FTS entity is:

```kotlin
@Fts4(contentEntity = AyahEntity::class, tokenizer = "unicode61")
@Entity(tableName = "ayah_search")
data class AyahSearchEntity(
    val arabicSearch: String,
    val englishSearch: String?,
    val urduSearch: String?
)
```

Verify the exact Room/SQLite version used by the project before committing the annotation because Room's built-in FTS surface has historically centered on FTS3/FTS4. If FTS5 is a hard requirement, create the virtual table in a Room migration/database callback with validated raw SQL, or use a SQLite layer that explicitly supports FTS5; do not assume an `@Fts5` annotation exists in the selected Room release.

Important Arabic detail: `unicode61` alone is not a complete substitute for the application's normalization. Precompute `arabicSearch` so alef variants, diacritics, tatweel, and the chosen `ة/ه` and `ى/ي` policy are already resolved. Preserve a normalization version in the database metadata. If substring-within-token behavior is required, evaluate FTS5 trigram or a bounded normalized `LIKE` fallback; if token/phrase search is sufficient, use FTS token/phrase queries and prefix syntax safely.

### Supporting entities

```kotlin
@Entity(tableName = "bookmark")
data class BookmarkEntity(
    @PrimaryKey val globalNumber: Int,
    val savedAtEpochMs: Long
)

@Entity(tableName = "search_history", indices = [Index("searchedAtEpochMs")])
data class SearchHistoryEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val rawQuery: String,
    val resolvedQuery: String,
    val edition: String,
    val resultCount: Int,
    val searchedAtEpochMs: Long
)

@Entity(primaryKeys = ["globalNumber", "wordPosition"])
data class MorphologyEntity(
    val globalNumber: Int,
    val wordPosition: Int,
    val word: String,
    val translation: String?,
    val transliteration: String?,
    val root: String?,
    val partOfSpeechAr: String?,
    val partOfSpeechEn: String?,
    val grammarJson: String?,
    val source: String,
    val fetchedAtEpochMs: Long,
    val dataVersion: String
)
```

The bookmark should normally be an ID, not a copied API record. A repository joins it to `AyahEntity` in a query, so an updated translation or metadata is reflected consistently. If the product requires an offline snapshot, add an explicit snapshot/version field rather than serializing an arbitrary network object.

### Seed/import strategy

Do not parse the full Quran JSON on the main thread at first launch. Prefer a prebuilt, versioned database packaged as an app asset (`createFromAsset`/prepackaged Room database) or an install-time/background import into a temporary database followed by an atomic swap. Validate row count, surah/ayah keys, normalization version, and source checksum before marking the database ready.

A first-run readiness state should be explicit:

```text
NotInstalled -> Installing(progress) -> Ready(version) -> Error(retryable)
```

Search should either use the prior ready database or show a clear local-data-not-ready state; it should not silently fall back to a tiny four-ayah sample in a production native build.

### DAO/query shape

Return IDs and snippets/page sizes, not the entire corpus:

```kotlin
@Query("""
    SELECT a.* FROM ayah AS a
    JOIN ayah_search AS f ON f.rowid = a.globalNumber
    WHERE ayah_search MATCH :matchExpression
    ORDER BY a.globalNumber
    LIMIT :limit OFFSET :offset
""")
suspend fun searchPage(
    matchExpression: String,
    limit: Int,
    offset: Int
): List<AyahEntity>
```

The final SQL must match the chosen FTS schema. Sanitize/quote query tokens in a repository query builder; never concatenate raw user input as SQL. For Paging 3, expose a `PagingSource` keyed by the normalized query and edition. If the UI only needs 20 initial results, query 20 and fetch more explicitly.

## 4.3 Repository and use-case mapping

- `QuranRepository.search(SearchPlan, page)` resolves aliases, builds a safe FTS expression, queries Room on `Dispatchers.IO`, and maps entities to immutable domain models.
- `GetAyahDetails` joins the core ayah with translations/metadata and returns a typed result; no network is required for core details.
- `WordStudyRepository` reads `MorphologyEntity` first, then optionally calls the existing online sources and writes a bounded cache transactionally.
- `SearchPlan` should include `rawQuery`, `resolvedQuery`, `edition`, `normalizationVersion`, and `matchMode` so online/offline semantics do not diverge.
- `DataStore` holds translation preference, reciter ID, speed, repeat, and other small settings. Do not put the Quran or bookmark records in DataStore.

Use `viewModelScope` cancellation and `flatMapLatest`/explicit request IDs for query changes. Room suspend queries already leave the main thread; normalization/range calculation for large batches belongs on `Dispatchers.Default`.

## 4.4 Compose rendering and cyan highlighting

### Safe result list

Use a virtualized list with stable keys:

```kotlin
LazyColumn {
    items(
        items = uiState.results,
        key = { it.globalNumber }
    ) { result ->
        AyahCard(result = result, onClick = { ... })
    }
}
```

The ViewModel should expose immutable `StateFlow<SearchUiState>`. Compose collects it with lifecycle awareness. Room and FTS work must never be called from a composable body.

### Arabic typography

- Bundle the exact approved Quran font in `res/font`; do not depend on Google Fonts at runtime.
- Render exact Uthmani text as a single `Text`/`BasicText` where possible so Android's shaping engine keeps combining marks and ligatures together.
- Set RTL text direction and an Arabic locale/font family explicitly. Test mark placement, line breaking, ligatures, and fallback behavior on the minimum supported Android API.
- If a particular Quran font/feature does not render identically in Compose, use a small `AndroidView`/TextView adapter for that exact surface rather than splitting the text into individual glyph nodes.
- Keep exact display text separate from normalized search text.

### Highlight ranges

Do not run a regex and rebuild an `AnnotatedString` on every recomposition. The use case/repository should return match ranges, or a `remember(exactText, normalizedQuery, normalizationVersion)` block should compute them once for the current item. Use `AnnotatedString.Builder` with one or a few `SpanStyle`s:

```kotlin
buildAnnotatedString {
    append(exactText)
    ranges.forEach { range ->
        addStyle(
            SpanStyle(
                color = Cyan,
                background = Cyan.copy(alpha = 0.10f)
            ),
            range.start,
            range.end
        )
    }
}
```

There is an important index issue: normalization can remove marks or change code-point sequences. Maintain a normalized-offset-to-original-UTF-16-range map while normalizing, or compute matches over token boundaries and translate them back to original text. Never assume normalized and display string offsets are identical for Arabic combining marks.

Avoid a heavy shadow/glow per span in a long `LazyColumn`; it creates unnecessary GPU paint work. A flat cyan foreground/background is safer. Because each ayah is short, a cached range calculation on `Dispatchers.Default` is sufficient.

### Word-by-word detail surface

The current web app uses one button per API word. In Compose, a single ayah has a small bounded word count, so stable clickable token semantics are acceptable. Use a wrapped layout or an annotated text click mapping, and preserve word positions from Quran.com rather than renumbering fallback whitespace tokens. Each token must expose an accessible label and selected/matched state. Do not create a full-corpus composable tree.

## 4.5 Native audio blueprint

Map playback to a real Media3 architecture:

```text
MainActivity / feature ViewModel
  -> MediaController
  -> MediaSessionService (foreground service when required)
  -> ExoPlayer
  -> audio focus/noisy-audio/network/notification integrations
```

Use a single serialized command stream in the playback service:

```text
Idle
Preparing(track, generation)
Ready(track)
Playing(track, position)
Paused(track, position)
Buffering(track)
Ended(track)
Error(track, recoverable)
```

Every command (play, pause, stop, change reciter, seek, speed, repeat) receives a generation. Player callbacks are ignored if they refer to a stale generation. The service owns truth; ViewModels observe a `StateFlow<PlaybackState>`.

Required behavior to preserve/clarify from the web client:

- one active track at a time;
- repeat-one semantics for the current ayah;
- supported speed set (0.5x/1x/1.5x/2x) with validation;
- reciter URL construction from a validated global/surah/ayah key;
- lock-screen/media notification metadata;
- pause/resume behavior across app backgrounding according to product policy;
- audio focus loss, noisy headset, transient interruptions, and network errors;
- explicit reciter-switch position policy (the current web behavior restarts the new URL; preserve that only if it is intentional).

Do not port the hidden HTML audio element or Media Session plugin as the native audio engine. The WebView can be a temporary shell, but reliable Android background playback belongs in `MediaSessionService`.

## 4.6 One-to-one file mapping

| Web file | Native target | Porting rule |
|---|---|---|
| `api-service.js` | `QuranRepository.kt`, `QuranLocalDataSource`, optional `QuranRemoteDataSource`, `SearchPlan`, `QuranError` | Keep query/edition/error contracts; replace remote primary search with Room FTS. Remote API becomes optional refresh/enrichment. |
| `storage.js` | Room DAOs/repositories for bookmarks/history/corpus plus `DataStore` for preferences | Remove JSON blobs and synchronous writes; add migrations, validation, quotas/retention, and transactions. |
| `quran-data.js` | prepackaged Room seed, `SearchAliasEntity`, `RootHintEntity`, string/resource quick concepts | Replace four samples with versioned full data. Keep exact text and normalized search columns. |
| `morphology-service.js` | `MorphologyRepository.kt`, `WordStudyUseCase`, `MorphologyEntity` | Read local cache first; use structured coroutines for optional online enrichment; bound/invalidate cache. |
| `audio-engine.js` | `Media3ExoPlayerService`, `MediaController`, `PlaybackRepository`, `PlaybackState` | Replace HTML audio/Capacitor Media Session; serialize commands and handle Android lifecycle/audio focus. |
| `native-bridge.js` | `MainActivity`, Compose `BackHandler`, `WindowInsets`, status-bar controller, `HapticFeedback`, Compose `AlertDialog` | Keep platform concerns in adapters. No domain dependency on Capacitor or DOM. |
| `assets/native-bridge.js` | generated Capacitor runtime only; no direct native equivalent | Remove from the Clean Architecture source. It is generated WebView infrastructure. |
| `app.js` | `MainActivity`, `NavHost`, feature ViewModels, use cases, UI event reducers | Split the global state/router/renderers into feature state holders and platform-neutral effects. |
| `styles.css` | Compose theme/design system, bundled fonts, `WindowInsets`/navigation bar styling | Preserve tokens (colors, spacing, shapes) but do not port blur/glow indiscriminately. |
| `index.html` | Android manifest/theme/MainActivity/WebView only if a transitional shell remains | Bundle fonts/assets locally; do not make core search dependent on HTML. |
| `capacitor.config.json` | Gradle/app theme/manifest and native service configuration | `webDir`/plugin wiring is not the native data/playback architecture. |
| `capacitor.plugins.json` | Gradle dependencies and Android platform services | Media3, Room, DataStore, and lifecycle configuration must be explicit. |

## 4.7 Native search pipeline matching the web’s perceived speed

```text
user submits query
  -> SearchViewModel creates SearchPlan
  -> normalize query (cheap, pure)
  -> Room FTS query on pre-normalized columns (Dispatchers.IO)
  -> return total + first page of stable ayah IDs
  -> map visible entities to domain models
  -> compute visible highlight ranges (Default/cache)
  -> LazyColumn renders only visible/loaded cards
```

This is a genuine local equivalent of the user-visible web result, unlike the current web fallback. Precomputing normalization removes repeated full-corpus string work. FTS removes the O(number-of-ayahs) scan from the query path. LazyColumn prevents all-result layout. Cached range calculations prevent repeated highlighter work.

## 4.8 Native acceptance criteria

Before declaring parity:

- Search results and counts match the web API for a fixed fixture of Arabic, Urdu, English, transliteration, phrase, and zero-result queries.
- Diacritic and alef-variant vectors match the chosen normalization policy.
- Exact Uthmani text is byte/string stable against the approved seed.
- Search never runs Room, normalization, or highlighting on the main thread.
- First 20 results render without waiting for morphology or remote enrichment.
- FTS query input cannot inject SQL/FTS operators unexpectedly.
- Bookmarks/history survive process death and database migrations.
- Morphology failure does not remove already-available word/ayah data.
- Playback survives backgrounding, handles audio focus/noisy output, and ignores stale reciter/play commands.
- Macrobenchmark reports search, mapping, highlight, and first-frame timings separately for cold and warm runs.
- No analytics, crashlytics, or cloud backend is introduced.

---

# Final handoff checklist

## Web before using it as a migration reference

- [ ] Establish a reproducible source/build pipeline; eliminate raw-module/bundle drift.
- [ ] Add unit tests for normalization, aliases, highlight ranges, storage schema, and cancellation.
- [ ] Add a command-generation/serialized audio state machine.
- [ ] Move large persistent data out of synchronous localStorage; bound bookmark and morphology caches.
- [ ] Add outer promise boundaries for DOM/native event handlers.
- [ ] Validate records at the API boundary and use a uniform escaped-rendering helper.
- [ ] Render first search results without awaiting full Arabic enrichment.
- [ ] Add explicit loading/partial/error states for detail and morphology.
- [ ] Fix modal focus/selection/accessibility issues.

## Native implementation order

1. Freeze/approve normalization and search-result contracts.
2. Build and validate the prepackaged Room corpus/FTS schema.
3. Implement repository/use-case tests against web fixture outputs.
4. Implement SearchViewModel + Compose list/highlight ranges.
5. Implement detail/bookmark/history/settings persistence.
6. Implement morphology cache/remote enrichment.
7. Implement Media3 service and controller state flow.
8. Run cold/warm macrobenchmarks and compare against the web path with identical fixtures.

**Bottom line:** the web client’s observed speed is real for the work it performs, but the web and native paths are currently measuring different jobs. The correct native port is a pre-normalized Room FTS search plus bounded Compose rendering and a real Media3 service—not a line-by-line translation of the current DOM, JSON localStorage, remote search, or HTML audio implementation.
