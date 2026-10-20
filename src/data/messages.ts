export const GROWING = [
  'Your tree is growing. Keep going 🌱',
  'One step at a time.',
  'Deep breath. You’ve got this.',
  'Future you says thanks.',
  'Small sessions grow big forests.',
  'Stay with it — the hard part is starting, and you already did.',
  'Quiet mind, steady roots.',
  'Every minute counts.',
]

export const COMPLETED = [
  'Beautiful! Another tree for your forest 🌳',
  'Well done — that was real focus.',
  'Your forest is getting greener!',
  'Great session. Take a little break ☕',
  'Look at that tree. You earned it.',
]

export const WITHERED = [
  'It happens. The next one will make it 🌱',
  'No worries — plant another when you’re ready.',
  'Even forests have bad days.',
]

export function pick<T>(list: T[], seed = Date.now()): T {
  return list[Math.abs(Math.floor(seed / 1000)) % list.length]
}
