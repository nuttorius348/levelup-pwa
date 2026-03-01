import { useCallback, useEffect, useState } from 'react';
import { soundManager, SoundEffect } from '@/lib/sounds/manager';

export function useSound() {
  const [enabled, setEnabled] = useState(soundManager.isEnabled());
  const [volume, setVolume] = useState(soundManager.getMasterVolume());

  const play = useCallback((effect: SoundEffect) => {
    soundManager.play(effect);
  }, []);

  const toggle = useCallback(() => {
    const newEnabled = !soundManager.isEnabled();
    soundManager.setEnabled(newEnabled);
    setEnabled(newEnabled);
  }, []);

  const updateVolume = useCallback((newVolume: number) => {
    soundManager.setMasterVolume(newVolume);
    setVolume(newVolume);
  }, []);

  // Sync state with localStorage on mount
  useEffect(() => {
    setEnabled(soundManager.isEnabled());
    setVolume(soundManager.getMasterVolume());
  }, []);

  return {
    play,
    enabled,
    volume,
    toggle,
    setVolume: updateVolume,
  };
}
