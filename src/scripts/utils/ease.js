export function smoothstep(t) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return 3 * t ** 2 - 2 * t ** 3
}

export function smootherstep(t) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3
}
