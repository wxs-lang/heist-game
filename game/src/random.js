// A small seeded generator (mulberry32) so a ?seed=N run is reproducible:
// the same seed and the same inputs always play the same game.
export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return {
    next() {
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    range(min, max) {
      return min + this.next() * (max - min);
    },
  };
}
