import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class ModelLoader {
  constructor(onLoad) {
    this.loader = new GLTFLoader();
    this.models = {}; // Dynamic storage for loaded models
    this.onLoad = onLoad; // Default callback when a model is loaded
    this.loadDefaultModels(); // Load predefined models
  }

  /**
   * Load default models and trigger the `onLoad` callback when all are loaded.
   */
  loadDefaultModels() {
    const defaultModels = [
      { key: 'pickaxe', path: './models/pickaxe.glb' },
      // Add more default models here if needed
    ];

    let loadedCount = 0;
    const totalModels = defaultModels.length;

    // Load each default model
    defaultModels.forEach(({ key, path }) => {
      this.loadModel(
        key,
        path,
        () => {
          loadedCount++;
          if (loadedCount === totalModels && this.onLoad) {
            this.onLoad(this.models); // Trigger callback when all models are loaded
          }
        },
        (error) => {
          console.error(`Failed to load default model '${key}':`, error);
        }
      );
    });
  }

  /**
   * Load a model from a given path and store it with a key.
   * @param {string} key - The key to identify the model (e.g., 'pickaxe').
   * @param {string} path - The path to the model file (e.g., './models/pickaxe.glb').
   * @param {Function} [onLoad] - Optional callback when the model loads.
   * @param {Function} [onError] - Optional callback for handling errors.
   */
  loadModel(key, path, onLoad, onError) {
    this.loader.load(
      path,
      (gltf) => {
        const mesh = gltf.scene;
        this.models[key] = mesh; // Store the loaded model
        if (onLoad) onLoad(mesh);
      },
      undefined, // Optional: Progress callback
      (error) => {
        console.error(`Error loading model '${key}' from ${path}:`, error);
        if (onError) onError(error);
      }
    );
  }

  /**
   * Get a loaded model by key.
   * @param {string} key - The key of the model to retrieve.
   * @returns {THREE.Object3D | undefined} - The loaded model, or undefined if not loaded.
   */
  getModel(key) {
    return this.models[key];
  }
}
