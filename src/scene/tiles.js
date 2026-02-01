/**
 * @fileoverview
 * This file contains functions for initializing and creating hexagonal tiles in the Three.js scene.
 */

import * as THREE from "three";
// The 'sh' object is implicitly available via 'this' context when these functions are called as methods of 'sh'.
// No direct import needed if 'sh' is always the 'this' context.

/**
 * Initializes a hexagonal grid of tiles.
 * Generates tile positions based on the given radii and calls `_createHexTile` for each position.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} [qRadius=1] - The radius for the 'q' axial coordinate.
 * @param {number} [rRadius=1] - The radius for the 'r' axial coordinate.
 * @returns {void}
 */
export function _initTiles(qRadius = 1, rRadius = 1) {
  const size = this.config.tile.radius;
  const spacing = this.config.tile.spacing;

  const hexWidth = size * 2.0;
  const hexHeight = size * 1.732;
  const spacingX = hexWidth * 0.75 + spacing;
  const spacingZ = hexHeight * 0.5 + spacing;

  const positions = [];

  for (let q = -qRadius; q <= qRadius; q++) {
    for (
      let r = Math.max(-rRadius, -q - rRadius);
      r <= Math.min(rRadius, -q + rRadius);
      r++
    ) {
      const x = spacingX * q;
      const z = spacingZ * (r * 2 + q);
      positions.push({ pos: [x, z], q, r });
    }
  }

  positions.forEach(({ pos: [x, z], q, r }, index) => {
    this._createHexTile(x, z, q, r, index);
  });

  console.log(
    `[sh] Generated ${positions.length} tiles (q:${qRadius}, r:${rRadius})`,
  );
}

/**
 * Creates a single hexagonal tile, including its 3D mesh, material, and a canvas-based sprite for displaying text.
 * Stores tile data in `sh.state.tiles` and maps its coordinates to its index in `sh.state.tileMap`.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} x - The x-coordinate for the tile's position.
 * @param {number} z - The z-coordinate for the tile's position.
 * @param {number} q - The 'q' axial coordinate of the tile.
 * @param {number} r - The 'r' axial coordinate of the tile.
 * @param {number} index - The unique index of the tile.
 * @returns {void}
 */
export function _createHexTile(x, z, q, r, index) {
  // CREATE GROUP FIRST
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData = { q, r, index };

  // Hex mesh
  const shape = new THREE.Shape();
  const radius = this.config.tile.radius;

  shape.moveTo(radius, 0);
  shape.lineTo(radius * 0.5, radius * 0.866);
  shape.lineTo(-radius * 0.5, radius * 0.866);
  shape.lineTo(-radius, 0);
  shape.lineTo(-radius * 0.5, -radius * 0.866);
  shape.lineTo(radius * 0.5, -radius * 0.866);
  shape.lineTo(radius, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: this.config.tile.depth,
    bevelEnabled: false,
  });

  const material = new THREE.MeshLambertMaterial({
    color: this.config.tile.color,
  });
  material.color.convertSRGBToLinear();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = this.config.tile.depth / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Store originals on MESH
  mesh.userData.originalColor = material.color.clone();
  mesh.userData.originalEmissive = material.emissive.clone();
  mesh.userData.index = index;

  group.add(mesh);

  // Canvas + sprite
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const showLabel = 0 > 0 || this.config.tile.showEmptyLabel;

  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = "white";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;

  if (showLabel) {
    ctx.strokeText("0", 64, 32);
    ctx.fillText("0", 64, 32);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.95,
  });

  const label = new THREE.Sprite(spriteMaterial);
  label.scale.set(1.4, 0.7, 1);
  label.position.y = this.config.tile.depth + 1;
  label.userData.font = true;

  group.add(label);

  const tile = {
    group,
    mesh,
    canvas,
    ctx,
    label,
    army: 0,
    q,
    r,
  };

  this.state.scene.add(group);
  this.state.tiles.push(tile);

  const key = `${q}_${r}`;
  this.state.tileMap.set(key, index);
  console.log(`[sh] Registered tile [${q},${r}] → ${index}`);
}
