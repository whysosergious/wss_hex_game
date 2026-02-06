/**
 * @fileoverview
 * This file defines the main initialization function for the `sh` application.
 */
import Modal from "./ui/modal.js";

/**
 * Initializes the application.
 * This function orchestrates the setup of the Three.js scene, tiles, camera, controls,
 * and starts the render loop. It ensures that the initialization only happens once.
 *
 * @this {import("../sh.js").sh}
 * @returns {void}
 */
export function init() {
  if (this.state.initialized) return;
  this._initScene();
  this._initTiles();
  this._initCamera();
  this._initControls();
  this._startRenderLoop();
  this._initDiceRoller(this);

  this.state.initialized = true;
  this.ui.jsonModal = new Modal('json-modal-panel', 'close-json-modal', 'json-display');
  
  // Try to load auto-save
  if (this.loadGameState) {
      this.loadGameState();
  }
}
