import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { resources } from './blocks';
import { Physics } from './physics';

/**
 * Adds a control to the GUI folder.
 * @param {object} folder The folder to add the control to.
 * @param {object} obj The object containing the property.
 * @param {string} property The property to control.
 * @param {number} min The minimum value.
 * @param {number} max The maximum value.
 * @param {number} step The step value.
 * @param {string} name The label for the control.
 */
function addControl(folder, obj, property, min, max, step, name) {
  folder.add(obj, property, min, max, step).name(name);
}

/**
 * Sets up the UI controls.
 * @param {World} world 
 * @param {Player} player
 * @param {Physics} physics
 * @param {Scene} scene
 */
export function setupUI(world, player, physics, scene) {
  const gui = new GUI();

  // Player controls
  const playerFolder = gui.addFolder('Player');
  addControl(playerFolder, player, 'maxSpeed', 1, 20, 0.1, 'Max Speed');
  addControl(playerFolder, player, 'jumpSpeed', 1, 10, 0.1, 'Jump Speed');
  addControl(playerFolder, player.boundsHelper, 'visible', 0, 1, 1, 'Show Player Bounds');
  addControl(playerFolder, player.cameraHelper, 'visible', 0, 1, 1, 'Show Camera Helper');

  // Physics controls
  const physicsFolder = gui.addFolder('Physics');
  addControl(physicsFolder, physics.helpers, 'visible', 0, 1, 1, 'Visualize Collisions');
  addControl(physicsFolder, physics, 'simulationRate', 10, 1000, 1, 'Sim Rate');

  // World settings
  const worldFolder = gui.addFolder('World');
  addControl(worldFolder, world, 'drawDistance', 0, 5, 1, 'Draw Distance');
  addControl(worldFolder, world, 'asyncLoading', 0, 1, 1, 'Async Loading');
  addControl(worldFolder, scene.fog, 'near', 1, 200, 1, 'Fog Near');
  addControl(worldFolder, scene.fog, 'far', 1, 200, 1, 'Fog Far');

  // Terrain settings
  const terrainFolder = worldFolder.addFolder('Terrain').close();
  addControl(terrainFolder, world.params, 'seed', 0, 10000, 1, 'Seed');
  addControl(terrainFolder, world.params.terrain, 'scale', 10, 100, 1, 'Scale');
  addControl(terrainFolder, world.params.terrain, 'magnitude', 0, 1, 0.01, 'Magnitude');
  addControl(terrainFolder, world.params.terrain, 'offset', 0, 1, 0.01, 'Ground Offset');
  addControl(terrainFolder, world.params.terrain, 'waterHeight', 0, 16, 0.1, 'Water Offset');

  // Resources settings
  const resourcesFolder = worldFolder.addFolder('Resources').close();
  resources.forEach(resource => {
    const resourceFolder = resourcesFolder.addFolder(resource.name);
    addControl(resourceFolder, resource, 'scarcity', 0, 1, 0.01, 'Scarcity');
    addControl(resourceFolder, resource.scale, 'x', 10, 100, 1, 'Scale X');
    addControl(resourceFolder, resource.scale, 'y', 10, 100, 1, 'Scale Y');
    addControl(resourceFolder, resource.scale, 'z', 10, 100, 1, 'Scale Z');
  });

  // Trees settings
  const treesFolder = worldFolder.addFolder('Trees').close();
  addControl(treesFolder, world.params.trees, 'frequency', 0, 0.1, 0.001, 'Frequency');
  addControl(treesFolder, world.params.trees.trunkHeight, 'min', 0, 10, 1, 'Min Trunk Height');
  addControl(treesFolder, world.params.trees.trunkHeight, 'max', 0, 10, 1, 'Max Trunk Height');
  addControl(treesFolder, world.params.trees.canopy.size, 'min', 0, 10, 1, 'Min Canopy Size');
  addControl(treesFolder, world.params.trees.canopy.size, 'max', 0, 10, 1, 'Max Canopy Size');
  addControl(treesFolder, world.params.trees.canopy, 'density', 0, 1, 0.01, 'Canopy Density');

  // Clouds settings
  const cloudsFolder = worldFolder.addFolder('Clouds').close();
  addControl(cloudsFolder, world.params.clouds, 'density', 0, 1, 0.01, 'Density');
  addControl(cloudsFolder, world.params.clouds, 'scale', 1, 100, 1, 'Scale');

  // Regenerate world on changes
  worldFolder.onFinishChange(() => world.regenerate(player));

  // Handle UI visibility toggling
  document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyU') {
      if (gui._hidden) {
        gui.show();
      } else {
        gui.hide();
      }
    }
  });
}
