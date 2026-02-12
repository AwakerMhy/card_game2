// 音效 - 使用 Web Audio API 生成

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency, duration, type = "sine", volume = 0.2) {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("Audio not available:", e);
  }
}

function playSequence(frequencies, durations, gap = 0.03) {
  let time = 0;
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.type = "sine";

    frequencies.forEach((freq, i) => {
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + time);
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime + time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + durations[i]);
      time += durations[i] + gap;
    });

    oscillator.stop(ctx.currentTime + time);
  } catch (e) {
    console.warn("Audio not available:", e);
  }
}

export function playDraw() {
  playSequence([400, 600], [0.08, 0.12]);
}

export function playSummon() {
  playSequence([300, 500, 700], [0.06, 0.06, 0.1]);
}

export function playAttack() {
  playTone(150, 0.08, "square", 0.15);
  setTimeout(() => playTone(200, 0.12, "sawtooth", 0.1), 50);
}

export function playDestroy() {
  playSequence([600, 400, 200], [0.05, 0.08, 0.12]);
}

export function playDamage() {
  playTone(100, 0.15, "square", 0.2);
}

export function playSet() {
  playTone(350, 0.1, "sine", 0.12);
}

export function playPhase() {
  playTone(440, 0.05, "sine", 0.1);
}
