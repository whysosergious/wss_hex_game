/**
 * @fileoverview
 * This file contains functions for initializing user input controls, including
 * Three.js OrbitControls, keyboard event listeners, and mouse interaction setup.
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// The 'sh' object is implicitly available via 'this' context when these functions are called as methods of 'sh'.
// No direct import needed if 'sh' is always the 'this' context.

/**
 * Initializes the OrbitControls for camera manipulation, sets up keyboard
 * event listeners for camera movement (WASD), and mouse event listeners
 * for tile interaction (hover and click). Also initializes Three.js Raycaster
 * and Vector2 for mouse picking.
 *
 * @this {import("../../sh.js").sh}
 * @returns {void}
 */
export function _initControls() {
  // @ts-ignore
  const controls = new OrbitControls(
    this.state.camera,
    this.state.renderer.domElement,
  );
  controls.target.set(...this.config.camera.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = this.config.camera.zoomMin;
  controls.maxDistance = this.config.camera.zoomMax;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.enablePan = true; // Disable pan by default, enable through WASD

  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
  controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;

  controls.touches = {
    ONE: THREE.TOUCH.ROTATE, // One finger drag = orbit
    TWO: THREE.TOUCH.DOLLY_PAN, // Two fingers = pinch zoom + drag pan/strafe
  };

  this.state.controls = controls;

  // Keyboard event listeners for WASD camera movement
  const onKeyDown = (/** @type {KeyboardEvent} */ e) => {
    this.state.keys[e.key] = true;
  };
  const onKeyUp = (/** @type {KeyboardEvent} */ e) => {
    this.state.keys[e.key] = false;
  };
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  // Mouse interaction setup
  this.state.raycaster = new THREE.Raycaster();
  this.state.mouse = new THREE.Vector2();
  // hoveredTile and selectedTile are managed in sh.state and updated by mouse.js functions

  const rendererDom = this.state.renderer.domElement;

  let pointerDownPos = null;

  // *** ORBIT DRAG DETECTION ***
  const onPointerDown = (event) => {
    pointerDownPos = { x: event.clientX, y: event.clientY };
    this.state.isOrbiting = false;
    this.state.isPointerDown = true;
  };

  const onPointerMove = (/** @type {MouseEvent} */ event) => {
    if (!this.state.isOrbiting) {
      if (pointerDownPos) {
        const deltaX = Math.abs(event.clientX - pointerDownPos.x);
        const deltaY = Math.abs(event.clientY - pointerDownPos.y);

        if (
          !sh.state.editor.drawMode &&
          (deltaX > this.state.orbitDragThreshold ||
            deltaY > this.state.orbitDragThreshold)
        ) {
          this.state.hoveredTile = null;
          this.state.seletedTile = null;
          this.state.isOrbiting = true;
          console.log("[sh] Orbit drag detected - interactions blocked");
        }
      }

      const rect = rendererDom.getBoundingClientRect();
      // Calculate mouse position in normalized device coordinates (-1 to +1)
      this.state.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.state.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this._updateHover(); // Call internal function to handle hover logic
    }
  };

  const onPointerUp = () => {
    this.state.isPointerDown = false;
    setTimeout(() => {
      this.state.isOrbiting = false;
      pointerDownPos = null;
    }, 50); // Small delay for smooth release
  };

  rendererDom.addEventListener("pointerdown", onPointerDown);
  rendererDom.addEventListener("pointerup", onPointerUp);

  const onPointerClick = (/** @type {MouseEvent} */ event) => {
    // Only process left clicks
    if (event.button === 0) {
      this._selectTile(); // Call internal function to handle selection logic
    }
  };

  rendererDom.addEventListener("pointermove", onPointerMove);
  rendererDom.addEventListener("click", onPointerClick);
  rendererDom.style.cursor = "default"; // Set default cursor style
}
