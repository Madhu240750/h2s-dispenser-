/**
 * Industrial Safety Notification and Acoustic Warning Pipeline
 */

let audioContext: AudioContext | null = null;
let activeAlarmOscillators: OscillatorNode[] = [];
let isAlarmSounding = false;

/**
 * Initialize and request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Browser notifications not supported in this environment.');
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  } catch (err) {
    console.warn('Browser notification permission restricted in this frame context:', err);
    return false;
  }

  return false;
}

/**
 * Play a synthesized dual-tone industrial emergency siren via Web Audio API
 */
export function playHazardAlarmSound(durationSeconds: number = 2) {
  if (isAlarmSounding) return;
  isAlarmSounding = true;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioContext || audioContext.state === 'suspended') {
      audioContext = new AudioContextClass();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;

    // Dual-tone pulsing industrial siren
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    // Modulate pitch between 600Hz and 950Hz
    osc1.frequency.setValueAtTime(650, now);
    osc1.frequency.linearRampToValueAtTime(950, now + 0.3);
    osc1.frequency.linearRampToValueAtTime(650, now + 0.6);
    osc1.frequency.linearRampToValueAtTime(950, now + 0.9);
    osc1.frequency.linearRampToValueAtTime(650, now + 1.2);
    osc1.frequency.linearRampToValueAtTime(950, now + 1.5);

    osc2.frequency.setValueAtTime(325, now);
    osc2.frequency.linearRampToValueAtTime(475, now + 0.3);
    osc2.frequency.linearRampToValueAtTime(325, now + 0.6);
    osc2.frequency.linearRampToValueAtTime(475, now + 0.9);
    osc2.frequency.linearRampToValueAtTime(325, now + 1.2);
    osc2.frequency.linearRampToValueAtTime(475, now + 1.5);

    // Gain pulse
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2.0);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);

    activeAlarmOscillators = [osc1, osc2];

    setTimeout(() => {
      isAlarmSounding = false;
      activeAlarmOscillators = [];
    }, 2000);
  } catch (e) {
    console.warn('Web Audio synthesis failed:', e);
    isAlarmSounding = false;
  }
}

/**
 * Stop active alarm audio
 */
export function silenceAlarm() {
  activeAlarmOscillators.forEach((osc) => {
    try {
      osc.stop();
    } catch {
      // already stopped
    }
  });
  activeAlarmOscillators = [];
  isAlarmSounding = false;
}

/**
 * Trigger local browser notification when a scan result indicates 'HIGH' risk
 */
export function triggerHighRiskNotification(workerName: string, exposure: number, bandId: string) {
  // 1. Play auditory alarm
  playHazardAlarmSound();

  // 2. Trigger browser notification if available
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        try {
          const notif = new Notification('⚠️ CRITICAL H₂S EXPOSURE ALERT', {
            body: `HIGH RISK: Worker ${workerName} measured ${exposure} ppm·h on band #${bandId}! Immediate respiratory support & evacuation required.`,
            tag: 'h2s-high-risk-alert',
            requireInteraction: true,
            badge: '/favicon.ico',
          });

          notif.onclick = () => {
            window.focus();
            notif.close();
          };
        } catch (err) {
          console.warn('Failed to display native browser notification:', err);
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            triggerHighRiskNotification(workerName, exposure, bandId);
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Browser notifications restricted in frame:', e);
    }
  }
}
