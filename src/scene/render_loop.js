/**
 * @fileoverview
 * This file contains the function for the main Three.js render loop,
 * including camera movement based on keyboard input.
 */

import * as THREE from "three";
// The 'sh' object is implicitly available via 'this' context when these functions are called as methods of 'sh'.
// No direct import needed if 'sh' is always the 'this' context.

/**
 * Starts the main Three.js render loop.
 * This function continuously renders the scene and handles camera panning based on WASD keyboard input.
 *
 * @this {import("../../sh.js").sh}
 * @returns {void}
 */
export function _startRenderLoop() {
  const panSpeed = this.config.controls.strafeSpeed;

  const tick = () => {
    requestAnimationFrame(tick);

    const dt = 0.016; // Assuming ~60fps
    /** @type {THREE.PerspectiveCamera} */
    const cam = this.state.camera;
    /** @type {THREE.Vector3} */
    const target = this.state.controls.target;

    const moveX = (this.state.keys.d ? 1 : 0) - (this.state.keys.a ? 1 : 0);
    const moveZ = (this.state.keys.w ? 1 : 0) - (this.state.keys.s ? 1 : 0);

    if (moveX !== 0 || moveZ !== 0) {
      const right = new THREE.Vector3(1, 0, 0);
      const forward = new THREE.Vector3(0, 0, -1);

      right.applyQuaternion(cam.quaternion);
      forward.applyQuaternion(cam.quaternion);
      right.y = 0; // Keep movement on the XZ plane
      forward.y = 0; // Keep movement on the XZ plane
      right.normalize();
      forward.normalize();

      const offset = right
        .clone()
        .multiplyScalar(moveX * panSpeed * dt)
        .add(forward.clone().multiplyScalar(moveZ * panSpeed * dt));

      cam.position.add(offset);
      target.add(offset);
    }

    this.state.controls.update(); // Required for damping to work
    this.state.renderer.render(this.state.scene, this.state.camera);
  };
  tick();
}