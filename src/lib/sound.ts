// iOS only lets audio play after a user gesture, so the context is created on the
// "Plant" tap and reused for the completion chime later.
let ctx: AudioContext | null = null

export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

/** A soft three-note chime. */
export function chime(): void {
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const t0 = ctx.currentTime + 0.05
  ;[523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx!.createOscillator()
    const gain = ctx!.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const t = t0 + i * 0.18
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2)
    osc.connect(gain).connect(ctx!.destination)
    osc.start(t)
    osc.stop(t + 1.3)
  })
}
