import { MediaSession } from '@jofr/capacitor-media-session';
import { Capacitor } from '@capacitor/core';

export const RECITERS = [
  {
    id: 'alafasy',
    name: 'Mishary Rashid Alafasy',
    shortName: 'Alafasy',
    subtitle: 'Murattal · 128 kbps',
    url: ({ number }) => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${number}.mp3`
  },
  {
    id: 'husary',
    name: 'Mahmoud Khalil Al-Husary',
    shortName: 'Husary',
    subtitle: 'Murattal · 128 kbps',
    url: ({ number }) => `https://cdn.islamic.network/quran/audio/128/ar.husary/${number}.mp3`
  },
  {
    id: 'sudais',
    name: 'Abdurrahman Al-Sudais',
    shortName: 'Sudais',
    subtitle: 'Murattal · 192 kbps',
    url: ({ surahNumber, ayahNumber }) => `https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/${String(surahNumber).padStart(3, '0')}${String(ayahNumber).padStart(3, '0')}.mp3`
  }
];

export function reciterById(id) {
  return RECITERS.find((reciter) => reciter.id === id) || RECITERS[0];
}

function trackFromRecord(record, reciterId) {
  const reciter = reciterById(reciterId);
  return {
    number: record.number,
    surahNumber: record.surah?.number,
    ayahNumber: record.numberInSurah,
    reference: `${record.surah?.number || '—'}:${record.numberInSurah || '—'}`,
    surahName: record.surah?.englishName || 'Quran',
    arabicSurahName: record.surah?.name || '',
    reciterId: reciter.id,
    reciterName: reciter.name,
    url: reciter.url({
      number: record.number,
      surahNumber: record.surah?.number,
      ayahNumber: record.numberInSurah
    })
  };
}

class QuranAudioEngine {
  constructor() {
    this.audio = null;
    this.listeners = new Set();
    this.lastPositionPush = 0;
    this.state = {
      track: null,
      playing: false,
      loading: false,
      repeat: false,
      speed: 1,
      error: null
    };
  }

  ensureAudio() {
    if (this.audio) return this.audio;
    const audio = document.createElement('audio');
    audio.id = 'magniaayat-native-audio';
    audio.preload = 'none';
    audio.playsInline = true;
    audio.setAttribute('aria-hidden', 'true');
    audio.className = 'native-audio-engine';
    document.body.append(audio);

    audio.addEventListener('playing', () => {
      this.state = { ...this.state, playing: true, loading: false, error: null };
      this.syncNativeSession();
      this.emit();
    });
    audio.addEventListener('pause', () => {
      if (!audio.ended) {
        this.state = { ...this.state, playing: false, loading: false };
        this.syncNativeSession();
        this.emit();
      }
    });
    audio.addEventListener('waiting', () => {
      this.state = { ...this.state, loading: true };
      this.emit();
    });
    audio.addEventListener('canplay', () => {
      this.state = { ...this.state, loading: false };
      this.emit();
    });
    audio.addEventListener('timeupdate', () => {
      const now = Date.now();
      if (now - this.lastPositionPush > 5000) {
        this.lastPositionPush = now;
        this.syncNativeSessionPosition();
      }
    });
    audio.addEventListener('ended', () => {
      this.state = { ...this.state, playing: false, loading: false };
      this.syncNativeSession();
      this.emit();
    });
    audio.addEventListener('error', () => {
      this.state = { ...this.state, playing: false, loading: false, error: 'This recitation stream could not be played. Please try another reciter.' };
      this.syncNativeSession();
      this.emit();
    });
    this.audio = audio;
    this.registerNativeHandlers();
    return audio;
  }

  snapshot() {
    return { ...this.state, track: this.state.track ? { ...this.state.track } : null };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  emit() {
    const snapshot = this.snapshot();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  async play(record, reciterId = this.state.track?.reciterId || 'alafasy') {
    const audio = this.ensureAudio();
    const nextTrack = trackFromRecord(record, reciterId);
    const isSameTrack = this.state.track?.url === nextTrack.url;
    if (!isSameTrack) {
      audio.pause();
      audio.src = nextTrack.url;
      audio.load();
      this.state = { ...this.state, track: nextTrack, loading: true, error: null };
    }
    audio.loop = this.state.repeat;
    audio.playbackRate = this.state.speed;
    try {
      await audio.play();
      await this.syncNativeSession();
    } catch {
      this.state = { ...this.state, loading: false, error: 'Audio needs a connection and a user tap to begin.' };
      this.emit();
    }
  }

  async toggle(record, reciterId) {
    const audio = this.ensureAudio();
    const requested = record ? trackFromRecord(record, reciterId || this.state.track?.reciterId || 'alafasy') : null;
    if (requested && this.state.track?.url !== requested.url) return this.play(record, requested.reciterId);
    if (audio.paused) {
      try { await audio.play(); } catch { this.state = { ...this.state, error: 'Audio needs a connection and a user tap to begin.' }; this.emit(); }
    } else {
      audio.pause();
    }
  }

  async setReciter(record, reciterId) {
    const wasPlaying = this.state.playing;
    const repeat = this.state.repeat;
    const speed = this.state.speed;
    await this.play(record, reciterId);
    this.setRepeat(repeat);
    this.setSpeed(speed);
    if (!wasPlaying) this.pause();
  }

  setSpeed(speed) {
    const value = Number(speed) || 1;
    this.state = { ...this.state, speed: value };
    if (this.audio) this.audio.playbackRate = value;
    this.syncNativeSessionPosition();
    this.emit();
  }

  setRepeat(repeat) {
    this.state = { ...this.state, repeat: Boolean(repeat) };
    if (this.audio) this.audio.loop = Boolean(repeat);
    this.emit();
  }

  pause() {
    if (this.audio) this.audio.pause();
  }

  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
    this.state = { ...this.state, track: null, playing: false, loading: false, error: null };
    this.syncNativeSession();
    this.emit();
  }

  async registerNativeHandlers() {
    const actions = {
      play: () => this.audio?.play().catch(() => {}),
      pause: () => this.pause(),
      stop: () => this.stop(),
      seekbackward: () => this.seekBy(-10),
      seekforward: () => this.seekBy(10),
      seekto: ({ seekTime }) => this.seekTo(seekTime)
    };
    for (const [action, handler] of Object.entries(actions)) {
      try { await MediaSession.setActionHandler({ action }, handler); } catch { /* Unsupported on this platform. */ }
    }
  }

  seekBy(delta) {
    if (!this.audio || !Number.isFinite(this.audio.duration)) return;
    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration, this.audio.currentTime + delta));
    this.syncNativeSessionPosition();
  }

  seekTo(position) {
    if (!this.audio || !Number.isFinite(position)) return;
    this.audio.currentTime = Math.max(0, Math.min(this.audio.duration || position, position));
    this.syncNativeSessionPosition();
  }

  async syncNativeSession() {
    const track = this.state.track;
    const playbackState = this.state.playing ? 'playing' : (track ? 'paused' : 'none');
    if (!track) {
      try { await MediaSession.setPlaybackState({ playbackState }); } catch { /* Browser fallback. */ }
      return;
    }
    try {
      await MediaSession.setMetadata({
        title: `${track.surahName} · ${track.reference}`,
        artist: track.reciterName,
        album: 'MagniAayat Quran Recitation'
      });
      await MediaSession.setPlaybackState({ playbackState });
      await this.syncNativeSessionPosition();
    } catch {
      // The plugin has a Web Media Session fallback. Audio remains functional if it is unavailable.
      if (!Capacitor.isNativePlatform() && 'mediaSession' in navigator) {
        try { navigator.mediaSession.playbackState = playbackState; } catch { /* no-op */ }
      }
    }
  }

  async syncNativeSessionPosition() {
    if (!this.audio || !Number.isFinite(this.audio.duration) || this.audio.duration <= 0) return;
    try {
      await MediaSession.setPositionState({
        duration: this.audio.duration,
        position: Math.min(this.audio.currentTime, this.audio.duration),
        playbackRate: this.state.speed
      });
    } catch { /* Native Media Session support is optional in browser preview. */ }
  }
}

export const audioEngine = new QuranAudioEngine();
