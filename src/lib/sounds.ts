// ===== FLOWFIN SOUND SYSTEM =====

let _audioCtx: AudioContext | null = null
function getAudioCtx(): AudioContext {
  if (!_audioCtx) _audioCtx = new AudioContext()
  return _audioCtx
}

export const playSound = (type: 'success' | 'delete' | 'click' | 'coin' | 'error' | 'notification') => {
  try {
    const ctx = getAudioCtx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g)
    g.connect(ctx.destination)

    switch (type) {
      case 'success':
        o.type = 'sine'
        o.frequency.setValueAtTime(523, ctx.currentTime)
        o.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
        o.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
        g.gain.setValueAtTime(0.08, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
        o.start(ctx.currentTime)
        o.stop(ctx.currentTime + 0.35)
        break

      case 'delete':
        o.type = 'sine'
        o.frequency.setValueAtTime(400, ctx.currentTime)
        o.frequency.setValueAtTime(300, ctx.currentTime + 0.1)
        g.gain.setValueAtTime(0.06, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        o.start(ctx.currentTime)
        o.stop(ctx.currentTime + 0.2)
        break

      case 'click':
        o.type = 'sine'
        o.frequency.setValueAtTime(800, ctx.currentTime)
        g.gain.setValueAtTime(0.03, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)
        o.start(ctx.currentTime)
        o.stop(ctx.currentTime + 0.04)
        break

      case 'coin':
        o.type = 'sine'
        o.frequency.setValueAtTime(988, ctx.currentTime)
        o.frequency.setValueAtTime(1319, ctx.currentTime + 0.08)
        g.gain.setValueAtTime(0.07, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        o.start(ctx.currentTime)
        o.stop(ctx.currentTime + 0.2)
        break

      case 'error':
        o.type = 'sawtooth'
        o.frequency.setValueAtTime(200, ctx.currentTime)
        o.frequency.setValueAtTime(150, ctx.currentTime + 0.15)
        g.gain.setValueAtTime(0.05, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
        o.start(ctx.currentTime)
        o.stop(ctx.currentTime + 0.25)
        break

      case 'notification':
        o.type = 'sine'
        o.frequency.setValueAtTime(880, ctx.currentTime)
        o.frequency.setValueAtTime(1100, ctx.currentTime + 0.12)
        g.gain.setValueAtTime(0.06, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
        o.start(ctx.currentTime)
        o.stop(ctx.currentTime + 0.25)
        break
    }
  } catch {
    // Audio not available
  }
}
