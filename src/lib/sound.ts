// Elegant Web Audio API Sound Synthesizer for Prerab OS
// Zero external assets required, crystal-clear 48kHz audio generation

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('prerab_sound_enabled');
      this.soundEnabled = stored !== null ? stored === 'true' : true;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('prerab_sound_enabled', String(enabled));
      window.dispatchEvent(new CustomEvent('prerab_sound_setting_changed', { detail: { enabled } }));
    }
  }

  // Play an elegant two-tone notification chime
  public playNotificationChime(type: 'gentle' | 'success' | 'alert' = 'gentle'): void {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (type === 'gentle' || type === 'success') {
        // High-end two-tone chime (Note 1: 587.33 Hz / D5 -> Note 2: 880 Hz / A5)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        const masterFilter = ctx.createBiquadFilter();

        masterFilter.type = 'lowpass';
        masterFilter.frequency.setValueAtTime(2800, now);

        // Note 1: First tone
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(type === 'success' ? 523.25 : 587.33, now); // C5 or D5
        
        gain1.gain.setValueAtTime(0.0001, now);
        gain1.gain.exponentialRampToValueAtTime(0.09, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

        // Note 2: Second tone slightly delayed
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(type === 'success' ? 783.99 : 880.0, now + 0.08); // G5 or A5

        gain2.gain.setValueAtTime(0.0001, now);
        gain2.gain.setValueAtTime(0.0001, now + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.12, now + 0.10);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        // Connect nodes
        osc1.connect(gain1);
        gain1.connect(masterFilter);

        osc2.connect(gain2);
        gain2.connect(masterFilter);

        masterFilter.connect(ctx.destination);

        // Start & Stop
        osc1.start(now);
        osc1.stop(now + 0.35);

        osc2.start(now + 0.07);
        osc2.stop(now + 0.48);
      } else if (type === 'alert') {
        // Subtle alert tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(330, now + 0.25);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      // AudioContext policy or driver error - fail silently
    }
  }
}

export const soundManager = new SoundManager();
