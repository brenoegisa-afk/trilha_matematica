/* =========================================================
   SFX — efeitos sonoros sintetizados com a Web Audio API.
   Sem arquivos de áudio: tons curtos e amigáveis para crianças
   (envelopes suaves, sem "buzz" agressivo no erro).
   ========================================================= */

let ctx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
        if (!ctx) {
            const AC = window.AudioContext || (window as any).webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
        }
        // Navegadores suspendem o contexto até um gesto do usuário (o clique no dado resolve).
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    } catch {
        return null;
    }
}

interface ToneOpts {
    freq: number;
    start: number;
    duration: number;
    type?: OscillatorType;
    gain?: number;
}

function tone(ac: AudioContext, { freq, start, duration, type = 'sine', gain = 0.2 }: ToneOpts) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;

    const t0 = ac.currentTime + start;
    // Ataque/decay suaves para não estalar
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(g).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
}

export type SfxName = 'correct' | 'wrong' | 'step' | 'levelup' | 'victory';

export function playSfx(name: SfxName) {
    if (muted) return;
    const ac = getCtx();
    if (!ac) return;

    switch (name) {
        case 'correct': // duas notas ascendentes, alegre (E5 → B5)
            tone(ac, { freq: 659.25, start: 0, duration: 0.12, type: 'triangle', gain: 0.22 });
            tone(ac, { freq: 987.77, start: 0.1, duration: 0.18, type: 'triangle', gain: 0.22 });
            break;
        case 'wrong': // "aw" grave e gentil — não punitivo (Eb4 → Bb3)
            tone(ac, { freq: 311.13, start: 0, duration: 0.18, type: 'sine', gain: 0.18 });
            tone(ac, { freq: 233.08, start: 0.14, duration: 0.22, type: 'sine', gain: 0.18 });
            break;
        case 'step': // "tique" curtinho a cada pulo do peão
            tone(ac, { freq: 523.25, start: 0, duration: 0.07, type: 'square', gain: 0.06 });
            break;
        case 'levelup': // arpejo ascendente (C5-E5-G5-C6)
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
                tone(ac, { freq: f, start: i * 0.09, duration: 0.16, type: 'triangle', gain: 0.2 })
            );
            break;
        case 'victory': // fanfarra (C5-E5-G5-C6-E6)
            [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) =>
                tone(ac, { freq: f, start: i * 0.12, duration: 0.24, type: 'triangle', gain: 0.22 })
            );
            break;
    }
}

export function setSfxMuted(value: boolean) {
    muted = value;
}

export function isSfxMuted() {
    return muted;
}
