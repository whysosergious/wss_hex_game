/**
 * @fileoverview
 * This file contains functions for initializing the Three.js scene and camera.
 */

import * as THREE from "three";

/**
 * Initializes the Three.js scene, renderer, lighting, and a floor plane.
 * Sets up a window resize listener to adjust the camera aspect ratio and renderer size.
 * @this {import("../sh.js").sh}
 * @returns {void}
 */
export function _initScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(5, 10, 5);
  directional.castShadow = true;
  scene.add(directional);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.MeshLambertMaterial({ color: 0x333333 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  this.state.scene = scene;
  this.state.renderer = renderer;

  window.addEventListener("resize", () => {
    const { innerWidth, innerHeight } = window;
    this.state.camera.aspect = innerWidth / innerHeight;
    this.state.camera.updateProjectionMatrix();
    this.state.renderer.setSize(innerWidth, innerHeight);
  });
}

/**
 * Initializes the Three.js perspective camera.
 * Sets the camera's initial position based on configuration and adds it to the scene.
 * @this {import("../sh.js").sh}
 * @returns {void}
 */
export function _initCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(...this.config.camera.position);
  this.state.camera = camera;
  this.state.scene.add(camera);
}

