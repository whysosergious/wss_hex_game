/**
 * @fileoverview
 * This file contains functions for handling mouse interactions with the Three.js scene,
 * specifically for tile hovering and selection.
 */

import * as THREE from "three";
// The 'sh' object is implicitly available via 'this' context when these functions are called as methods of 'sh'.
// No direct import needed if 'sh' is always the 'this' context.

/**
 * Updates the hovered tile based on the current mouse position.
 * Uses a Raycaster to detect intersections with tile meshes and applies/removes visual highlights.
 *
 * @this {import("../../sh.js").sh}
 * @returns {void}
 */

export function _updateHover() {
  const raycaster = this.state.raycaster;
  const mouse = this.state.mouse;
  const camera = this.state.camera;
  const tiles = this.state.tiles;
  const selectedTile = this.state.selectedTile;

  // Reset previous hover (if not selected/movement)
  if (
    this.state.hoveredTile !== null &&
    this.state.hoveredTile !== selectedTile &&
    !this.state.movementPreview.includes(this.state.hoveredTile)
  ) {
    const prevTile = tiles[this.state.hoveredTile];
    this._resetTileHighlight(prevTile);
  }

  this.state.hoveredTile = null;
  this.state.attack.possible = false;
  document.body.style.cursor = "default";

  raycaster.setFromCamera(mouse, camera);
  const tileMeshes = tiles.map((tile) => tile.mesh);
  const intersects = raycaster.intersectObjects(tileMeshes);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    const tileIndex = intersect.object.userData.index;
    const tile = tiles[tileIndex];

    this.state.hoveredTile = tileIndex;
    document.body.style.cursor = "pointer";

    if (this.state.movementMode && this.state.selectedTile !== null) {
      this.updateMovementPreview(tileIndex);

      const targetTile = tiles[tileIndex];
      if (
        targetTile.playerId !== undefined &&
        targetTile.playerId !== this.getActivePlayer() &&
        targetTile.playerId !== 0
      ) {
        // path to enemy gets computed inside updateMovementPreview
        if (this.state.movementPreview.length >= 0) {
          const lastReachableIndex =
            this.state.movementPreview[this.state.movementPreview.length - 1] ??
            this.getSelectedTile();
          const lastTile = this.state.tiles[lastReachableIndex];
          const finalAttackerArmy = lastTile.armyPreview || lastTile.army;

          console.log(
            `[sh] ATTACK POSSIBLE: Tile ${tileIndex} (${finalAttackerArmy} vs ${targetTile.army})`,
          );

          this.state.attack.possible = true;
          this.state.attack.offence.index = lastReachableIndex;
          this.state.attack.offence.army = finalAttackerArmy;
          this.state.attack.defence.index = tileIndex;
          this.state.attack.defence.army = targetTile.army;

          this.showAttackX(lastReachableIndex, tileIndex);
        } else {
          this.state.attack.possible = false;
        }
      } else {
        this.state.attack.possible = false;
      }
    } else if (tileIndex !== selectedTile) {
      // *** RESTORE NORMAL HOVER (your original logic) ***
      this._highlightTile(tile);
      console.log(`[sh] Hover tile ${tileIndex} (q:${tile.q}, r:${tile.r})`);
    }
  }
}

/**
 * Applies a visual highlight to a given tile.
 * Stores the original color and emissive properties before applying the highlight.
 *
 * @this {import("../../sh.js").sh}
 * @param {import("../state.js").TileData} tile - The tile data object to highlight.
 * @returns {void}
 */
export function _highlightTile(tile) {
  // Store original colors if not already stored
  if (!tile.mesh.userData.originalColor) {
    tile.mesh.userData.originalColor = tile.mesh.material.color.clone();
    tile.mesh.userData.originalEmissive = tile.mesh.material.emissive.clone();
  }

  // Apply hover color
  const hoverColor = tile.mesh.userData.originalColor
    .clone()
    .multiplyScalar(1.3);
  tile.mesh.material.color.copy(hoverColor);
  tile.mesh.material.emissive.setHex(0x444444);
}

/**
 * Resets the visual highlight of a tile to its original state or selected state if applicable.
 *
 * @this {import("../../sh.js").sh}
 * @param {import("../state.js").TileData} tile - The tile data object to reset.
 * @returns {void}
 */
export function _resetTileHighlight(tile) {
  const index = tile.mesh.userData.index;

  // *** PRIORITY SYSTEM ***
  if (this.state.reachableTiles?.includes(index)) {
    // Keep reachable blue
    const reachColor = tile.mesh.userData.originalColor
      .clone()
      .multiplyScalar(1.15);
    tile.mesh.material.color.copy(reachColor);
    tile.mesh.material.emissive.setHex(0x000044);
  } else if (this.state.selectedTile === index) {
    // Selected orange
    const selectColor = tile.mesh.userData.originalColor
      .clone()
      .multiplyScalar(1.8);
    selectColor.offsetHSL(0.1, 0, 0.2);
    tile.mesh.material.color.copy(selectColor);
    tile.mesh.material.emissive.setHex(0x664411);
  } else {
    // Normal
    tile.mesh.material.color.copy(tile.mesh.userData.originalColor);
    tile.mesh.material.emissive.setHex(0x000000);
  }
}

/**
 * Handles tile selection logic when a tile is clicked.
 * Clears previous selections, applies a distinct visual style to the newly selected tile,
 * and updates `sh.state.selectedTile`.
 *
 * @this {import("../../sh.js").sh}
 * @returns {void}
 */
export function _selectTile() {
  if (this.state.hoveredTile === null) return;

  const tileIndex = this.state.hoveredTile;
  const tile = this.state.tiles[tileIndex];

  // in movement mode, for now, only allow neutral or your own selection
  if (
    this.state.movementMode &&
    tile.playerId !== this.getActivePlayer() &&
    tile.playerId !== undefined
  ) {
    if (this.state.attack.possible) {
      console.log("EXECUTING ATTACK via state.attack", this.state.attack);

      // First move to the last reachable attacking tile
      this.executeMovement(
        this.state.selectedTile,
        this.state.attack.offence.index,
      );

      // Then resolve combat from that tile into the enemy tile
      this.executeAttack(
        this.state.attack.offence.index,
        this.state.attack.defence.index,
      );
    } else {
      console.log(
        `[sh] Cannot select enemy tile ${tileIndex} (no path/attack)`,
      );
    }
    return;
  }
  // *** ONLY ALLOW ACTIVE PLAYER'S OWN TILES ***
  if (!this.state.movementMode && tile.playerId !== this.getActivePlayer()) {
    console.log(`[sh] Cannot select enemy/neutral tile ${tileIndex}`);
    return;
  }

  // *** MOVEMENT MODE ***
  if (this.state.movementMode) {
    if (this.state.selectedTile !== null) {
      const targetTile = this.state.tiles[this.state.hoveredTile];

      // *** FIRST: Generate path to check attack possibility ***
      this.updateMovementPreview(this.state.hoveredTile);

      // *** NOW check if it's an attack ***
      if (
        targetTile.playerId !== undefined &&
        targetTile.playerId !== this.getActivePlayer() &&
        this.state.movementPreview.length > 1 // Path exists
      ) {
        console.log(
          `[sh] EXECUTING ATTACK: ${this.state.selectedTile} → ${this.state.hoveredTile}`,
        );
        this.executeAttack(this.state.selectedTile, this.state.hoveredTile);
        return;
      }

      // Normal movement
      this.executeMovement(this.state.selectedTile, this.state.hoveredTile);
      return;
    }
    return;
  }

  // *** NORMAL CLICK ON OWN TILE → ENTER MOVEMENT MODE ***
  if (tile.army > 0) {
    // Enter movement mode + select source instantly
    this.toggleMovementMode();

    // Source styling
    const sourceColor = tile.mesh.userData.originalColor
      .clone()
      .multiplyScalar(2.0);
    tile.mesh.material.color.copy(sourceColor);
    tile.mesh.material.emissive.setHex(0x00ff00); // Green
    tile.group.position.y += 0.1;
    this.state.selectedTile = tileIndex;

    // Show reachable immediately
    this.updateReachableTiles();

    console.log(`[sh] Movement activated: ${tileIndex} (army:${tile.army})`);
  } else {
    console.log(`[sh] No army to move: ${tileIndex}`);
  }
}
