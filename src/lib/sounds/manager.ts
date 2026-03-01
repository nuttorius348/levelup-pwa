// =============================================================
// Sound System — Audio feedback for gamification events
// =============================================================

export type SoundEffect =
  | 'xp_gain'
  | 'level_up'
  | 'coin_gain'
  | 'purchase'
  | 'boost_activate'
  | 'quest_complete'
  | 'streak_milestone'
  | 'achievement_unlock'
  | 'button_click'
  | 'error';

interface SoundConfig {
  volume: number;
  playbackRate?: number;
}

// Sound effect configurations
const SOUND_EFFECTS: Record<SoundEffect, SoundConfig> = {
  xp_gain: { volume: 0.3, playbackRate: 1.2 },
  level_up: { volume: 0.5, playbackRate: 1.0 },
  coin_gain: { volume: 0.4, playbackRate: 1.1 },
  purchase: { volume: 0.4, playbackRate: 1.0 },
  boost_activate: { volume: 0.5, playbackRate: 1.0 },
  quest_complete: { volume: 0.6, playbackRate: 1.0 },
  streak_milestone: { volume: 0.5, playbackRate: 1.0 },
  achievement_unlock: { volume: 0.6, playbackRate: 1.0 },
  button_click: { volume: 0.2, playbackRate: 1.5 },
  error: { volume: 0.3, playbackRate: 1.0 },
};

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private masterVolume: number = 0.7;

  constructor() {
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('sound_enabled') !== 'false';
      const savedVolume = localStorage.getItem('master_volume');
      if (savedVolume) {
        this.masterVolume = parseFloat(savedVolume);
      }
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext && typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext!;
  }

  // Generate simple tones (no audio files needed)
  private async playTone(
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'sine'
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      const context = this.getAudioContext();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);

      gainNode.gain.setValueAtTime(volume * this.masterVolume, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + duration);
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  async play(effect: SoundEffect): Promise<void> {
    if (!this.enabled) return;

    const config = SOUND_EFFECTS[effect];

    switch (effect) {
      case 'xp_gain':
        // Quick ascending chirp
        await this.playTone(400, 0.1, config.volume, 'sine');
        setTimeout(() => this.playTone(600, 0.1, config.volume, 'sine'), 50);
        break;

      case 'level_up':
        // Triumphant chord progression
        await this.playTone(523, 0.2, config.volume, 'triangle'); // C
        setTimeout(() => this.playTone(659, 0.2, config.volume, 'triangle'), 100); // E
        setTimeout(() => this.playTone(784, 0.3, config.volume, 'triangle'), 200); // G
        break;

      case 'coin_gain':
        // Coin clink
        await this.playTone(800, 0.05, config.volume, 'square');
        setTimeout(() => this.playTone(1000, 0.05, config.volume, 'square'), 30);
        break;

      case 'purchase':
        // Cash register ding
        await this.playTone(1047, 0.15, config.volume, 'sine');
        setTimeout(() => this.playTone(1319, 0.15, config.volume, 'sine'), 80);
        break;

      case 'boost_activate':
        // Power-up sound
        await this.playTone(200, 0.1, config.volume, 'sawtooth');
        setTimeout(() => this.playTone(400, 0.15, config.volume, 'sawtooth'), 60);
        setTimeout(() => this.playTone(800, 0.2, config.volume, 'sawtooth'), 120);
        break;

      case 'quest_complete':
        // Victory fanfare
        await this.playTone(659, 0.15, config.volume, 'triangle');
        setTimeout(() => this.playTone(784, 0.15, config.volume, 'triangle'), 100);
        setTimeout(() => this.playTone(1047, 0.25, config.volume, 'triangle'), 200);
        break;

      case 'streak_milestone':
        // Ascending arpeggio
        await this.playTone(523, 0.1, config.volume, 'sine');
        setTimeout(() => this.playTone(659, 0.1, config.volume, 'sine'), 80);
        setTimeout(() => this.playTone(784, 0.1, config.volume, 'sine'), 160);
        setTimeout(() => this.playTone(1047, 0.2, config.volume, 'sine'), 240);
        break;

      case 'achievement_unlock':
        // Epic unlock
        await this.playTone(440, 0.2, config.volume, 'triangle');
        setTimeout(() => this.playTone(554, 0.2, config.volume, 'triangle'), 120);
        setTimeout(() => this.playTone(659, 0.3, config.volume, 'triangle'), 240);
        break;

      case 'button_click':
        // Quick click
        await this.playTone(800, 0.03, config.volume, 'square');
        break;

      case 'error':
        // Error buzz
        await this.playTone(150, 0.15, config.volume, 'sawtooth');
        break;
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sound_enabled', String(enabled));
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (typeof window !== 'undefined') {
      localStorage.setItem('master_volume', String(this.masterVolume));
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }
}

// Singleton instance
export const soundManager = new SoundManager();
