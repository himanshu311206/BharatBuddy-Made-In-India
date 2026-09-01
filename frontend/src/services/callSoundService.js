class CallSoundService {
  constructor() {
    this.audioCtx = null;
    this.ringInterval = null;
    this.isPlaying = false;
  }

  getAudioContext() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // 1. OUTGOING RINGTONE (Caller side: Ring-Ring ... Ring-Ring)
  startOutgoingRingtone() {
    this.stopRingtones();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.isPlaying = true;

    const playPulse = () => {
      if (!this.isPlaying) return;
      try {
        const now = ctx.currentTime;

        // Dual Tone: 440Hz + 480Hz (Standard Telephone Ringback)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.8);
        osc2.stop(now + 1.8);
      } catch (e) {
        console.error('Outgoing ringtone error:', e);
      }
    };

    playPulse();
    this.ringInterval = setInterval(playPulse, 4000); // 1.8s ring + 2.2s silence
  }

  // 2. INCOMING RINGTONE (Receiver side: Melodic Cascading Ring)
  startIncomingRingtone() {
    this.stopRingtones();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.isPlaying = true;

    const playIncomingPattern = () => {
      if (!this.isPlaying) return;
      try {
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0.15, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.3);
        });
      } catch (e) {
        console.error('Incoming ringtone error:', e);
      }
    };

    playIncomingPattern();
    this.ringInterval = setInterval(playIncomingPattern, 1800);
  }

  // 3. CALL CONNECTED CHIME (Ascending 3-note pleasant chime)
  playConnectChime() {
    this.stopRingtones();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25]; // A4, C#5, E5

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.15, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.25);
      });
    } catch (e) {
      console.error('Connect chime error:', e);
    }
  }

  // 4. END CALL / DECLINE TONE (Descending double beep)
  playEndCallSound() {
    this.stopRingtones();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [440, 330]; // A4, E4

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.18);

        gain.gain.setValueAtTime(0.12, now + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.18 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 0.2);
      });
    } catch (e) {
      console.error('End call tone error:', e);
    }
  }

  // 5. STOP ALL RINGTONES & LOOPS
  stopRingtones() {
    this.isPlaying = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }
}

export const callSoundService = new CallSoundService();
export default callSoundService;
