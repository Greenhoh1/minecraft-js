import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { World } from './world';
import { blocks } from './blocks';

const CENTER_SCREEN = new THREE.Vector2();

export class Player {
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
  cameraHelper = new THREE.CameraHelper(this.camera);
  controls = new PointerLockControls(this.camera, document.body);

  height = 1.75;
  radius = 0.5;
  maxSpeed = 5;
  jumpSpeed = 10;
  sprinting = false;
  onGround = false;
  debugCamera = false;
  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();
  input = new THREE.Vector3();

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 3);
  selectedCoords = null;
  activeBlockId = blocks.empty.id;

  tool = {
    container: new THREE.Group(),
    animate: false,
    animationStart: 0,
    animationSpeed: 0.025,
    animation: null
  };

  isInPlayMode = false;  // Flag to track if game is in play mode

  constructor(scene, world) {
    this.world = world;
    this.position.set(32, 32, 32);
    this.cameraHelper.visible = false;
    scene.add(this.camera);
    scene.add(this.cameraHelper);

    // Lock
    this.controls.addEventListener('lock', function () {
      console.log('locked');
      document.getElementById('overlay').style.visibility = 'hidden'; // Hide the overlay
    });

    // Unlock
    this.controls.addEventListener('unlock', function () {
      console.log('unlocked');
      document.getElementById('overlay').style.visibility = 'visible'; // Show the overlay
    });

    // To handle pointer lock errors
    document.addEventListener('pointerlockerror', function () {
      console.error('Unable to enter pointer lock');
    });

    // Menu button for showing controls panel
    document.getElementById('controls-button').addEventListener('click', function() {
      const controlsPanel = document.getElementById('controls-panel');
      if (controlsPanel.style.display === 'none' || controlsPanel.style.display === '') {
        controlsPanel.style.display = 'block';
      } else {
        controlsPanel.style.display = 'none';
      }
    });

    // Play button event
    document.getElementById('play-button').addEventListener('click', function() {
      document.getElementById('overlay').style.display = 'none'; // Hide the overlay
      this.controls.lock(); // Lock the camera into free movement mode
      this.isInPlayMode = true;  // Set the game to play mode
    }.bind(this));

    // The tool is parented to the camera
    this.camera.add(this.tool.container);

    this.raycaster.layers.set(0);
    this.camera.layers.enable(1);

    this.boundsHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true })
    );
    this.boundsHelper.visible = false;
    scene.add(this.boundsHelper);

    const selectionMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0xffffaa
    });
    const selectionGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
    scene.add(this.selectionHelper);

    document.addEventListener('keyup', this.onKeyUp.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('mousedown', this.onMouseDown.bind(this));
    document.addEventListener('keydown', this.onEscapeKeyDown.bind(this));  // Handle escape key
  }

  // Prevent escape key from unlocking the pointer if in play mode
  onEscapeKeyDown(event) {
    if (this.isInPlayMode && event.code === 'Escape') {
      event.preventDefault();  // Prevent the default behavior (unlocking pointer)
      return false;  // Prevent any further event processing for Escape
    }
  }

  update(world) {
    this.updateBoundsHelper();
    this.updateRaycaster(world);

    if (this.tool.animate) {
      this.updateToolAnimation();
    }
  }

  updateRaycaster(world) {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
    const intersections = this.raycaster.intersectObject(world, true);

    if (intersections.length > 0) {
      const intersection = intersections[0];
      const chunk = intersection.object.parent;
      const blockMatrix = new THREE.Matrix4();
      intersection.object.getMatrixAt(intersection.instanceId, blockMatrix);

      this.selectedCoords = chunk.position.clone();
      this.selectedCoords.applyMatrix4(blockMatrix);

      if (this.activeBlockId !== blocks.empty.id) {
        this.selectedCoords.add(intersection.normal);
      }

      this.selectionHelper.position.copy(this.selectedCoords);
      this.selectionHelper.visible = true;
    } else {
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }
  }

  applyInputs(dt) {
    if (this.controls.isLocked === true) {
      this.velocity.x = this.input.x * (this.sprinting ? 1.5 : 1);
      this.velocity.z = this.input.z * (this.sprinting ? 1.5 : 1);
      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
      this.position.y += this.velocity.y * dt;

      if (this.position.y < 0) {
        this.position.y = 0;
        this.velocity.y = 0;
      }
    }
    
    document.getElementById('info-player-position').innerHTML = this.toString();
  }

  updateBoundsHelper() {
    this.boundsHelper.position.copy(this.camera.position);
    this.boundsHelper.position.y -= this.height / 2;
  }

  setTool(tool) {
    this.tool.container.clear();
    this.tool.container.add(tool);
    this.tool.container.receiveShadow = true;
    this.tool.container.castShadow = true;
  
    this.tool.container.position.set(0.6, -0.3, -0.5);
    this.tool.container.scale.set(0.5, 0.5, 0.5);
    this.tool.container.rotation.z = Math.PI / 2;
    this.tool.container.rotation.y = Math.PI + 0.2;
  }

  updateToolAnimation() {
    if (this.tool.container.children.length > 0) {
      const t = this.tool.animationSpeed * (performance.now() - this.tool.animationStart);
      this.tool.container.children[0].rotation.y = 0.5 * Math.sin(t);
    }
  }

  get position() {
    return this.camera.position;
  }

  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(new THREE.Euler(0, this.camera.rotation.y, 0));
    return this.#worldVelocity;
  }

  applyWorldDeltaVelocity(dv) {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
        this.input.z = 0;
        break;
      case 'KeyA':
        this.input.x = 0;
        break;
      case 'KeyS':
        this.input.z = 0;
        break;
      case 'KeyD':
        this.input.x = 0;
        break;
    }
  }

  onKeyDown(event) {
    if (!this.controls.isLocked) {
      this.debugCamera = false;
      this.controls.lock();
    }

    switch (event.code) {
      case 'Digit0':
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      case 'Digit7':
      case 'Digit8':
        document.getElementById(`toolbar-${this.activeBlockId}`)?.classList.remove('selected');
        document.getElementById(`toolbar-${event.key}`)?.classList.add('selected');

        this.activeBlockId = Number(event.key);
        this.tool.container.visible = (this.activeBlockId === 0);

        break;
      case 'KeyW':
        this.input.z = this.maxSpeed;
        break;
      case 'KeyA':
        this.input.x = -this.maxSpeed;
        break;
      case 'KeyS':
        this.input.z = -this.maxSpeed;
        break;
      case 'KeyD':
        this.input.x = this.maxSpeed;
        break;
      case 'KeyR':
        if (this.repeat) break;
        this.position.y = 32;
        this.velocity.set(0, 0, 0);
        break;
      case 'ShiftLeft':
        case 'ShiftRight':
          this.sprinting = true;
          break;
      case 'Space':
        if (this.onGround) {
          this.velocity.y += this.jumpSpeed;
        }
        break;
      case 'F10':
        this.debugCamera = true;
        this.controls.unlock();
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
        this.input.z = 0;
        break;
      case 'KeyA':
        this.input.x = 0;
        break;
      case 'KeyS':
        this.input.z = 0;
        break;
      case 'KeyD':
        this.input.x = 0;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.sprinting = false;
        break;
    }
  }

  onMouseDown(event) {
    if (this.controls.isLocked) {
      if (this.selectedCoords) {
        if (this.activeBlockId === blocks.empty.id) {
          this.world.removeBlock(
            this.selectedCoords.x,
            this.selectedCoords.y,
            this.selectedCoords.z
          );
        } else {
          this.world.addBlock(
            this.selectedCoords.x,
            this.selectedCoords.y,
            this.selectedCoords.z,
            this.activeBlockId
          );
        }

        if (!this.tool.animate) {
          this.tool.animate = true;
          this.tool.animationStart = performance.now();
          clearTimeout(this.tool.animation);

          this.tool.animation = setTimeout(() => {
            this.tool.animate = false;
          }, 3 * Math.PI / this.tool.animationSpeed);
        }
      }
    }
  }

  toString() {
    let str = '';
    str += `X: ${this.position.x.toFixed(3)} `;
    str += `Y: ${this.position.y.toFixed(3)} `;
    str += `Z: ${this.position.z.toFixed(3)}`;
    return str;
  }
}
