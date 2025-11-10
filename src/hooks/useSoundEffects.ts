import { useCallback } from 'react';

type SoundType = 'move' | 'capture' | 'check' | 'castle' | 'promote' | 'illegal' | 'gameEnd';

export const useSoundEffects = () => {
  const playSound = useCallback((type: SoundType) => {
    // Create audio context for sound generation
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configure sound based on type
    switch (type) {
      case 'move':
        oscillator.frequency.value = 440;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
        break;
        
      case 'capture':
        oscillator.frequency.value = 330;
        gainNode.gain.value = 0.15;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.08);
        break;
        
      case 'check':
        oscillator.frequency.value = 880;
        gainNode.gain.value = 0.2;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
        
      case 'castle':
        oscillator.frequency.value = 523;
        gainNode.gain.value = 0.12;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.07);
        break;
        
      case 'promote':
        oscillator.frequency.value = 660;
        gainNode.gain.value = 0.15;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
        
      case 'illegal':
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 200;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
        break;
        
      case 'gameEnd':
        oscillator.frequency.value = 523;
        gainNode.gain.value = 0.2;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
        break;
    }
  }, []);
  
  return { playSound };
};
