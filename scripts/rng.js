export class RNG {
  static mask = 0xffffffff;
  static seed1 = 123456789;
  static seed2 = 987654321;

  constructor(seed) {
    this.m_w = (RNG.seed1 + seed) & RNG.mask;
    this.m_z = (RNG.seed2 - seed) & RNG.mask;
  }

  /**
   * Generates a pseudo-random number between 0 (inclusive) and 1.0 (exclusive),
   * similar to Math.random().
   * @returns {number} A pseudo-random number between 0 and 1.
   */
  random() {
    this.m_z = (36969 * (this.m_z & 0xffff) + (this.m_z >> 16)) & RNG.mask;
    this.m_w = (18000 * (this.m_w & 0xffff) + (this.m_w >> 16)) & RNG.mask;
    const result = ((this.m_z << 16) + (this.m_w & 0xffff)) >>> 0;
    return result / 4294967296;
  }

  /**
   * Generates a pseudo-random integer in the specified range [min, max).
   * @param {number} min The minimum value (inclusive).
   * @param {number} max The maximum value (exclusive).
   * @returns {number} A pseudo-random integer between min (inclusive) and max (exclusive).
   */
  randomInt(min, max) {
    return Math.floor(this.random() * (max - min)) + min;
  }

  /**
   * Generates a random boolean.
   * @returns {boolean} A random boolean (true or false).
   */
  randomBool() {
    return this.random() < 0.5;
  }
}
