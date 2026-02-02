/**
 * @fileoverview
 * This file contains the public API functions for interacting with the game logic,
 * such as manipulating tile properties, selecting tiles, and resetting the scene.
 */

import * as THREE from "three";
// The 'sh' object is implicitly available via 'this' context when these functions are called as methods of 'sh'.
// No direct import needed if 'sh' is always the 'this' context.

/**
 * Sets the army strength displayed on a specific tile.
 * The tile's label is updated to reflect the new army value.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} tileIndex - The index of the tile to update.
 * @param {number} value - The new army strength value.
 * @returns {void}
 */
export function setArmyStrength(tileIndex, value, isPreview = false) {
  const tile = this.state.tiles[tileIndex];
  if (!tile || !tile.label?.material?.map) {
    console.warn("[sh] Tile", tileIndex, "not ready");
    return;
  }

  if (!isPreview) {
    tile.army = value;
  }

  const ctx = tile.ctx;
  const canvas = tile.canvas;
  const showLabel = value > 0 || this.config.tile.showEmptyLabel;

  // clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (showLabel) {
    ctx.strokeText(value.toString(), 64, 32);
    ctx.fillText(value.toString(), 64, 32);
  }

  tile.label.material.map.needsUpdate = true;
  console.log(`[sh] Tile ${tileIndex} army: ${value}`);
}

/**
 * Sets the base color of a specific tile.
 * It also reapplies hover or selection highlight if the tile is currently in one of those states.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} tileIndex - The index of the tile to color.
 * @param {number} hexColor - The new color in hexadecimal format (e.g., 0xff0000 for red).
 * @returns {void}
 */
export function setTileColor(tileIndex, hexColor) {
  const tile = this.state.tiles[tileIndex];
  if (!tile) {
    console.warn("[sh] Invalid tile index:", tileIndex);
    return;
  }

  // Update original color, then reapply current highlight state
  tile.mesh.userData.originalColor.setHex(hexColor);

  if (this.state.hoveredTile === tileIndex) {
    this._highlightTile(tile);
  } else if (this.state.selectedTile === tileIndex) {
    const selectColor = tile.mesh.userData.originalColor
      .clone()
      .multiplyScalar(1.8);
    selectColor.offsetHSL(0.1, 0, 0.2);
    tile.mesh.material.color.copy(selectColor);
    tile.mesh.material.emissive.setHex(0x664411);
  } else {
    this._resetTileHighlight(tile);
  }

  console.log(`[sh] Tile ${tileIndex} color: 0x${hexColor.toString(16)}`);
}

/**
 * Moves a tile by the specified offsets in the x, y, and z directions.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} tileIndex - The index of the tile to move.
 * @param {number} [x=0] - The offset to add to the tile's x-position.
 * @param {number} [y=0] - The offset to add to the tile's y-position.
 * @param {number} [z=0] - The offset to add to the tile's z-position.
 * @returns {void}
 */
export function moveTile(tileIndex, x = 0, y = 0, z = 0) {
  const tile = this.state.tiles[tileIndex];
  if (!tile) return;

  tile.group.position.x += x;
  tile.group.position.y += y;
  tile.group.position.z += z;

  console.log(`[sh] Moved tile ${tileIndex} by (${x}, ${y}, ${z})`);
}

/**
 * Selects a tile based on its axial coordinates (q, r).
 * This will trigger the hover and selection visual effects as if the mouse clicked it.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} q - The 'q' axial coordinate of the tile.
 * @param {number} r - The 'r' axial coordinate of the tile.
 * @returns {boolean} - True if a tile was found and selected, false otherwise.
 */
export function selectTileByCoords(q, r) {
  const key = `${q}_${r}`;
  const tileIndex = this.state.tileMap.get(key);

  if (tileIndex === undefined) {
    console.warn(`[sh] No tile at q:${q}, r:${r}`);
    return false;
  }

  // Trigger hover + selection as if mouse clicked
  this.state.hoveredTile = tileIndex;
  this._selectTile();
  return true;
}

/**
 * Gets the index of a tile given its axial coordinates (q, r).
 *
 * @this {import("../../sh.js").sh}
 * @param {number} q - The 'q' axial coordinate of the tile.
 * @param {number} r - The 'r' axial coordinate of the tile.
 * @returns {number | undefined} - The index of the tile, or `undefined` if not found.
 */
export function getTileIndex(q, r) {
  const key = `${q}_${r}`;
  return this.state.tileMap.get(key);
}

/**
 * Gets the full tile data object given its axial coordinates (q, r).
 *
 * @this {import("../../sh.js").sh}
 * @param {number} q - The 'q' axial coordinate of the tile.
 * @param {number} r - The 'r' axial coordinate of the tile.
 * @returns {import("../state.js").TileData | null} - The tile data object, or `null` if not found.
 */
export function getTileByCoords(q, r) {
  const index = this.getTileIndex(q, r);
  return index !== undefined ? this.state.tiles[index] : null;
}

/**
 * Resets the entire game scene by clearing existing tiles and re-initializing them.
 * The camera's position and target are preserved during the reset.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} [q=1] - The radius for the 'q' axial coordinate when re-initializing tiles.
 * @param {number} [r=1] - The radius for the 'r' axial coordinate when re-initializing tiles.
 * @returns {void}
 */
export function resetScene(q = 1, r = 1) {
  if (!this.state.camera) return;

  const savedCamera = {
    position: this.state.camera.position.clone(),
    target: this.state.controls.target.clone(),
  };

  this.state.tiles.forEach((tile) => {
    this.state.scene.remove(tile.group);
  });
  this.state.tiles.length = 0;
  this.state.tileMap.clear();
  this.state.hoveredTile = null;
  this.state.selectedTile = null;

  this._initTiles(q, r);

  this.state.camera.position.copy(savedCamera.position);
  this.state.controls.target.copy(savedCamera.target);
  this.state.controls.update();

  console.log("[sh] Scene reset - camera preserved");
}

/**
 * Returns the index of the currently selected tile.
 *
 * @this {import("../../sh.js").sh}
 * @returns {number | null} - The index of the selected tile, or `null` if no tile is selected.
 */
export function getSelectedTile() {
  return this.state.selectedTile;
}

/**
 * Clears the current tile selection, resetting the previously selected tile's visual state.
 *
 * @this {import("../../sh.js").sh}
 * @returns {void}
 */
export function clearSelection() {
  if (this.state.selectedTile === null) return;

  const tile = this.state.tiles[this.state.selectedTile];
  tile.mesh.material.color.copy(tile.mesh.userData.originalColor);
  tile.mesh.material.emissive.setHex(0x000000);
  tile.group.position.y = 0;

  this.clearReachableTiles();
  this.state.selectedTile = null;
  console.log("[sh] Selection cleared");
}

/**
 * Debugging utilities for the `sh` object.
 * @namespace debug
 * @property {function(): void} printState - Prints the current state (q, r, army) of all tiles to the console.
 * @property {function(): void} printTileMap - Prints the mapping of axial coordinates (q, r) to tile indices to the console.
 */
export const debug = {
  /**
   * Prints the current state (q, r, army) of all tiles to the console as a table.
   * @returns {void}
   */
  printState() {
    console.table(
      this.state.tiles.map((t, i) => ({
        id: i,
        q: t.q,
        r: t.r,
        army: t.army,
      })),
    );
  },
  /**
   * Prints the mapping of axial coordinates (q, r) to tile indices to the console as a table.
   * @returns {void}
   */
  printTileMap() {
    console.table(
      Array.from(this.state.tileMap.entries()).map(([key, index]) => {
        const [q, r] = key.split("_").map(Number);
        return { q, r, index };
      }),
    );
  },
  async testDice() {
    // Just test dice - NO resetScene needed!
    if (!sh.diceRoller) {
      console.error(
        "[debug] DiceRoller not initialized. Call sh.init() first.",
      );
      return;
    }
    const result = await sh.diceRoller.rollDice(1);
    console.log("Dice result:", result);
  },
};
