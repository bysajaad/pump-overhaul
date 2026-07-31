import { assetPath } from "@/lib/base-path";

/**
 * The audio engine.
 *
 * One lazily-created AudioContext, three buses (master → music / sfx). The
 * context may only be created or resumed inside a user gesture — that is the
 * onboarding's job — so everything before `unlock()` is a silent no-op rather
 * than an autoplay-policy exception. Music is a generated Lyria clip faded
 * into a seamless loop; effects are generated one-shots with a touch of random
 * detune so rapid repeats (scroll ticks) never sound machine-gunned.
 *
 * Module holds a singleton; nothing touches `window` at import time, so the
 * static export and SSR stay safe.
 */

export type SfxName = "commit" | "coin" | "tick" | "whoosh" | "win" | "lose";

const SFX_FILES: Record<SfxName, string> = {
  commit: "/media/sfx-commit.mp3",
  coin: "/media/sfx-coin.mp3",
  tick: "/media/sfx-tick.mp3",
  whoosh: "/media/sfx-whoosh.mp3",
  win: "/media/sfx-win.mp3",
  lose: "/media/sfx-lose.mp3",
};
const MUSIC_FILE = "/media/music-ambient.mp3";
const MUTED_KEY = "pump:muted";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private loading = new Map<string, Promise<AudioBuffer | null>>();
  private musicSource: AudioBufferSourceNode | null = null;
  private muted = false;
  private unlocked = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.muted = window.localStorage.getItem(MUTED_KEY) === "1";
    }
  }

  get isMuted() { return this.muted; }
  get isUnlocked() { return this.unlocked; }

  /**
   * Must be called from a user gesture. Creates/resumes the context, starts
   * the ambient loop as soon as its buffer arrives, and preloads the SFX kit
   * in the background — one-shots requested before their buffer lands are
   * skipped rather than queued, which is the right behaviour for feedback.
   */
  async unlock(): Promise<void> {
    if (this.unlocked) return;
    this.unlocked = true;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(this.master);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.9;
    this.sfxBus.connect(this.master);
    await this.ctx.resume().catch(() => {});

    void this.load("music", MUSIC_FILE).then((buffer) => {
      if (!buffer || !this.ctx || !this.musicBus) return;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(this.musicBus);
      source.start();
      this.musicSource = source;
      // A slow fade keeps the music's arrival an ambience, not an event.
      this.musicBus.gain.setTargetAtTime(0.55, this.ctx.currentTime, 1.2);
    });
    for (const name of Object.keys(SFX_FILES) as SfxName[]) {
      void this.load(name, SFX_FILES[name]);
    }
  }

  private load(name: string, url: string): Promise<AudioBuffer | null> {
    const running = this.loading.get(name);
    if (running) return running;
    const task = (async () => {
      if (!this.ctx) return null;
      try {
        const response = await fetch(assetPath(url));
        if (!response.ok) return null;
        const data = await response.arrayBuffer();
        const buffer = await this.ctx.decodeAudioData(data);
        this.buffers.set(name, buffer);
        return buffer;
      } catch {
        return null;
      }
    })();
    this.loading.set(name, task);
    return task;
  }

  sfx(name: SfxName, { gain = 1, rate = 1, detune = 0.03 }: { gain?: number; rate?: number; detune?: number } = {}) {
    if (!this.ctx || !this.sfxBus || this.muted) return;
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * detune);
    const envelope = this.ctx.createGain();
    envelope.gain.value = gain;
    source.connect(envelope);
    envelope.connect(this.sfxBus);
    source.start();
  }

  setMuted(next: boolean) {
    this.muted = next;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MUTED_KEY, next ? "1" : "0");
    }
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(next ? 0 : 1, this.ctx.currentTime, 0.12);
    }
  }

  /** Screen off / tab hidden: pause the clock so the loop doesn't drift on. */
  setActive(active: boolean) {
    if (!this.ctx) return;
    if (active) void this.ctx.resume().catch(() => {});
    else void this.ctx.suspend().catch(() => {});
  }
}

let engine: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}
