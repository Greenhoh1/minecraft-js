import * as THREE from 'three';

// TextureManager to handle loading and configuration of textures
class TextureManager {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.textures = {};
  }

  loadTexture(name, path) {
    const texture = this.loader.load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    this.textures[name] = texture;
    return texture;
  }

  getTexture(name) {
    return this.textures[name];
  }
}

// Instantiate TextureManager and load textures
const textureManager = new TextureManager();
textureManager.loadTexture('dirt', 'textures/dirt.png');
textureManager.loadTexture('grass', 'textures/grass.png');
textureManager.loadTexture('grassSide', 'textures/grass_side.png');
textureManager.loadTexture('stone', 'textures/stone.png');
textureManager.loadTexture('coalOre', 'textures/coal_ore.png');
textureManager.loadTexture('ironOre', 'textures/iron_ore.png');
textureManager.loadTexture('leaves', 'textures/leaves.png');
textureManager.loadTexture('treeSide', 'textures/tree_side.png');
textureManager.loadTexture('treeTop', 'textures/tree_top.png');
textureManager.loadTexture('sand', 'textures/sand.png');

// Utility function to create materials
const createMaterial = (textureName, materialType = THREE.MeshLambertMaterial, options = {}) => {
  return new materialType({ map: textureManager.getTexture(textureName), ...options });
};

// Block definitions
export const blocks = {
  empty: {
    id: 0,
    name: 'empty',
    visible: false
  },
  grass: {
    id: 1,
    name: 'grass',
    material: [
      createMaterial('grassSide'), // right
      createMaterial('grassSide'), // left
      createMaterial('grass'),     // top
      createMaterial('dirt'),      // bottom
      createMaterial('grassSide'), // front
      createMaterial('grassSide')  // back
    ]
  },
  dirt: {
    id: 2,
    name: 'dirt',
    material: createMaterial('dirt')
  },
  stone: {
    id: 3,
    name: 'stone',
    material: createMaterial('stone'),
    scale: { x: 30, y: 30, z: 30 },
    scarcity: 0.8
  },
  coalOre: {
    id: 4,
    name: 'coal_ore',
    material: createMaterial('coalOre'),
    scale: { x: 20, y: 20, z: 20 },
    scarcity: 0.8
  },
  ironOre: {
    id: 5,
    name: 'iron_ore',
    material: createMaterial('ironOre'),
    scale: { x: 40, y: 40, z: 40 },
    scarcity: 0.9
  },
  tree: {
    id: 6,
    name: 'tree',
    visible: true,
    material: [
      createMaterial('treeSide'), // right
      createMaterial('treeSide'), // left
      createMaterial('treeTop'),  // top
      createMaterial('treeTop'),  // bottom
      createMaterial('treeSide'), // front
      createMaterial('treeSide')  // back
    ]
  },
  leaves: {
    id: 7,
    name: 'leaves',
    visible: true,
    material: createMaterial('leaves')
  },
  sand: {
    id: 8,
    name: 'sand',
    visible: true,
    material: createMaterial('sand')
  },
  cloud: {
    id: 9,
    name: 'cloud',
    visible: true,
    material: new THREE.MeshBasicMaterial({ color: 0xf0f0f0 })
  }
};

// Resource blocks (e.g., for mining or crafting)
export const resources = [blocks.stone, blocks.coalOre, blocks.ironOre];
