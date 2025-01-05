import * as THREE from 'three';
import { WorldChunk } from './worldChunk';
import { Player } from './player';
import { DataStore } from './dataStore';

export class World extends THREE.Group {
  /**
   * The number of chunks to render around the player.
   * When this is set to 0, the chunk the player is on
   * is the only one that is rendered. If it is set to 1,
   * the adjacent chunks are rendered; if set to 2, the
   * chunks adjacent to those are rendered, and so on.
   */
  drawDistance = 3;

  /**
   * If true, chunks are loaded asynchronously.
   */
  asyncLoading = true;

  /**
   * Width and height of a single chunk of terrain
   */
  chunkSize = {
    width: 32,
    height: 24
  }

  /**
   * Parameters for terrain generation
   */
  params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.2,
      offset: 0.25,
      waterHeight: 5
    },
    trees: {
      frequency: 0.04,
      trunkHeight: {
        min: 6,
        max: 8
      },
      canopy: {
        size: {
          min: 2,
          max: 4,
        },
        density: 0.5
      }
    },
    clouds: {
      density: 0.3,
      scale: 30
    }
  }
  
  /**
   * Used for persisting changes to the world
   */
  dataStore = new DataStore();

  constructor(seed = 0) {
    super();
    this.seed = seed;

    document.addEventListener('keydown', (ev) => {
      switch (ev.code) {
        case 'F1':
          this.save();
          break;
        case 'F2':
          this.load();
          break;
      }
    });
  }

  /**
   * Clears existing world data and regenerates everything
   * @param {Player} player 
   */
  regenerate(playerPosition = new THREE.Vector3()) {
    this.children.forEach((obj) => {
      obj.disposeChildren();
    });
    this.clear();
    this.update(playerPosition);
  }

  /**
   * Updates the visible portions of the world based on the
   * current player position
   * @param {THREE.Vector3} playerPosition
   */
  update(playerPosition) {
    const visibleChunks = this.getVisibleChunks(playerPosition);
    const chunksToAdd = this.getChunksToAdd(visibleChunks);
    this.removeUnusedChunks(visibleChunks);
    
    for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z);
    }
  }

  /**
   * Returns an array containing the coordinates of the chunks that 
   * are current visible to the player
   * @param {THREE.Vector3} playerPosition 
   * @returns {{ x: number, z: number}[]}
   */
  getVisibleChunks(playerPosition) {
    // Get the coordinates of the chunk the player is currently in
    const coords = this.worldToChunkCoords(playerPosition.x, 0, playerPosition.z);
    
    const visibleChunks = [];
    for (let x = coords.chunk.x - this.drawDistance; x <= coords.chunk.x + this.drawDistance; x++) {
      for (let z = coords.chunk.z - this.drawDistance; z <= coords.chunk.z + this.drawDistance; z++) {
        visibleChunks.push({ x, z });
      }
    }

    return visibleChunks;
  }

  /**
   * Returns an array containing the coordinates of the chunks that 
   * are not yet loaded and need to be added to the scene
   * @param {{ x: number, z: number}[]} visibleChunks 
   * @returns {{ x: number, z: number}[]}
   */
  getChunksToAdd(visibleChunks) {
    return visibleChunks.filter(({ x, z }) => 
      !this.children.some((chunk) => chunk.userData.x === x && chunk.userData.z === z)
    );
  }

  /**
   * Removes current loaded chunks that are no longer visible to the player
   * @param {{ x: number, z: number}[]} visibleChunks 
   */
  removeUnusedChunks(visibleChunks) {
    const visibleCoords = new Set(visibleChunks.map(({ x, z }) => `${x},${z}`));
    const chunksToRemove = this.children.filter((obj) => 
      !visibleCoords.has(`${obj.userData.x},${obj.userData.z}`)
    );

    for (const chunk of chunksToRemove) {
      chunk.disposeChildren();
      this.remove(chunk);
    }
  }

  /**
   * Generates the chunk at the (x,z) coordinates
   * @param {number} x 
   * @param {number} z
   */
  generateChunk(x, z) {
    const chunk = new WorldChunk(this.chunkSize, this.params, this.dataStore);
    chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
    chunk.userData = { x, z };

    if (this.asyncLoading) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }

    this.add(chunk);
    //console.log(`Creating chunk at X: ${x} Z: ${z}`);
  }

  /**
   * Gets the block data at (x, y, z)
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {{id: number, instanceId: number} | null}
   */
  getBlock(x, y, z) {
    const { chunk, block } = this.worldToChunkCoords(x, y, z);
    const chunkObj = this.getChunk(chunk.x, chunk.z);
    return chunkObj && chunkObj.loaded ? chunkObj.getBlock(block.x, y, block.z) : null;
  }

  /**
   * Adds a new block at (x,y,z)
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @param {number} blockId 
   */
  addBlock(x, y, z, blockId) {
    const { chunk, block } = this.worldToChunkCoords(x, y, z);
    const chunkObj = this.getChunk(chunk.x, chunk.z);
    if (chunkObj) {
      chunkObj.addBlock(block.x, block.y, block.z, blockId);
      [ [x-1,y,z], [x+1,y,z], [x,y-1,z], [x,y+1,z], [x,y,z-1], [x,y,z+1] ]
        .forEach(coords => this.hideBlockIfNeeded(...coords));
    }
  }
  
  /**
   * Removes the block at (x, y, z) and sets it to empty
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  removeBlock(x, y, z) {
    const { chunk, block } = this.worldToChunkCoords(x, y, z);
    if (block.y === 0) return; // Don't remove ground blocks
    const chunkObj = this.getChunk(chunk.x, chunk.z);
    if (chunkObj) {
      chunkObj.removeBlock(block.x, block.y, block.z);
      [ [x-1,y,z], [x+1,y,z], [x,y-1,z], [x,y+1,z], [x,y,z-1], [x,y,z+1] ]
        .forEach(coords => this.revealBlock(...coords));
    }
  }

  /**
   * Reveals the block at (x,y,z) by adding a new mesh instance
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  revealBlock(x, y, z) {
    const { chunk, block } = this.worldToChunkCoords(x, y, z);
    const chunkObj = this.getChunk(chunk.x, chunk.z);
    if (chunkObj) {
      chunkObj.addBlockInstance(block.x, block.y, block.z);
    }
  }

  /**
   * Hides the block at (x,y,z) by removing the  new mesh instance
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   */
  hideBlockIfNeeded(x, y, z) {
    const { chunk, block } = this.worldToChunkCoords(x, y, z);
    const chunkObj = this.getChunk(chunk.x, chunk.z);
    if (chunkObj && chunkObj.isBlockObscured(block.x, block.y, block.z)) {
      chunkObj.deleteBlockInstance(block.x, block.y, block.z);
    }
  }

  /**
   * Returns the chunk and world coordinates of the block at (x,y,z)\
   *  - `chunk` is the coordinates of the chunk containing the block
   *  - `block` is the world coordinates of the block
   * @param {number} x 
   * @param {number} y 
   * @param {number} z 
   * @returns {{
   *  chunk: { x: number, z: number},
   *  block: { x: number, y: number, z: number}
   * }}
   */
  worldToChunkCoords(x, y, z) {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width),
    };

    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y,
      z: z - this.chunkSize.width * chunkCoords.z
    }

    return {
      chunk: chunkCoords,
      block: blockCoords
    };
  }
 
  /**
   * Returns the WorldChunk object the contains the specified coordinates
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk | null}
   */
  getChunk(chunkX, chunkZ) {
    return this.children.find((chunk) => {
      return chunk.userData.x === chunkX && 
             chunk.userData.z === chunkZ;
    });
  }

  /**
   * Saves the world data to local storage
   */
  save() {
    localStorage.setItem('minecraft_params', JSON.stringify(this.params));
    localStorage.setItem('minecraft_data', JSON.stringify(this.dataStore.data));
    document.getElementById('status').innerText = "Game Saved";
    setTimeout(() => document.getElementById('status').innerText = "", 3000);
  }

  /**
   * Loads the game from disk
   */
  load() {
    this.params = JSON.parse(localStorage.getItem('minecraft_params'));
    this.dataStore.data = JSON.parse(localStorage.getItem('minecraft_data'));
    document.getElementById('status').innerText = "Game Loaded";
    setTimeout(() => document.getElementById('status').innerText = "", 3000);
    this.regenerate();
  }
}