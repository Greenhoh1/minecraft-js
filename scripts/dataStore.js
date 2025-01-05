export class DataStore {
  constructor(debug = false) {
    this.data = {};
    this.debug = debug; // Enable or disable debug logging
  }

  // Clear all stored data
  clear() {
    this.data = {};
    if (this.debug) console.log("DataStore cleared.");
  }

  // Check if a block exists at the specified coordinates
  contains(chunkX, chunkZ, blockX, blockY, blockZ) {
    return this.#generateKey(chunkX, chunkZ, blockX, blockY, blockZ) in this.data;
  }

  // Get the block ID at the specified coordinates
  get(chunkX, chunkZ, blockX, blockY, blockZ) {
    const key = this.#generateKey(chunkX, chunkZ, blockX, blockY, blockZ);
    const blockId = this.data[key];
    if (this.debug) console.log(`Get: ${key} -> ${blockId}`);
    return blockId;
  }

  // Set the block ID at the specified coordinates
  set(chunkX, chunkZ, blockX, blockY, blockZ, blockId) {
    const key = this.#generateKey(chunkX, chunkZ, blockX, blockY, blockZ);
    this.data[key] = blockId;
    if (this.debug) console.log(`Set: ${key} -> ${blockId}`);
  }

  // Generate a unique key for the given coordinates
  #generateKey(chunkX, chunkZ, blockX, blockY, blockZ) {
    // Simple string concatenation for better performance
    return `${chunkX},${chunkZ},${blockX},${blockY},${blockZ}`;
  }
}
