/**
 * @fileoverview
 * Logic for unit movement, including mode toggling, path previews, and execution.
 */

/**
 * Enables or disables the movement mode.
 * When enabled, selecting a tile initiates the movement phase.
 *
 * @this {import("../../sh.js").sh}
 * @param {boolean} bool - True to enable, false to disable.
 */
export function setMovementMode(bool) {
  if (bool === true) {
    this.clearReachableTiles();
    this.state.movementMode = true;
    console.log("[sh] Movement mode ON - select source tile");
  } else if (bool === false) {
    this.clearMovementPreview();
    this.clearReachableTiles();
    this.state.movementMode = false;
    console.trace("[sh] Movement mode OFF");
  } else {
    console.error(
      "[sh] setMovementMode requires a boolean argument (true/false)",
    );
  }
}

/**
 * Toggles the movement mode on or off.
 *
 * @this {import("../../sh.js").sh}
 */
export function toggleMovementMode() {
  if (this.state.movementMode) {
    this.setMovementMode(false);
  } else {
    this.setMovementMode(true);
  }
}

/**
 * Clears the current movement path preview.
 * Resets tile highlights and army previews.
 *
 * @this {import("../../sh.js").sh}
 */
export function clearMovementPreview() {
  this.state.movementPreview.forEach((idx) => {
    const tile = this.state.tiles[idx];

    if (tile.armyPreview !== undefined) {
      this.setArmyStrength(idx, tile.army); // Restore real army text
      delete tile.armyPreview;
    }

    // *** PRESERVE REACHABLE HIGHLIGHT ***
    if (this.state.reachableTiles?.includes(idx)) {
      // Keep blue reachable glow
      const reachColor = tile.mesh.userData.originalColor
        .clone()
        .multiplyScalar(1.15);
      tile.mesh.material.color.copy(reachColor);
      tile.mesh.material.emissive.setHex(0x000044);
    } else {
      // Normal reset
      this._resetTileHighlight(tile);
    }
  });
  this.state.movementPreview = [];
  this.clearAttackPreview();
}

/**
 * Updates the movement path preview based on the hovered tile.
 * Calculates the path and projected army strengths.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} hoverIndex - The index of the tile currently being hovered.
 */
export function updateMovementPreview(hoverIndex) {
  if (!this.state.movementMode || this.state.selectedTile === null) return;

  const selectedTile = this.state.tiles[this.state.selectedTile];
  const targetTile = this.state.tiles[hoverIndex];
  const pathLength = this.hexDistance(
    selectedTile.q,
    selectedTile.r,
    targetTile.q,
    targetTile.r,
  );

  // *** DON'T CLEAR if we're just checking enemy - preserve path ***
  const isEnemy =
    targetTile.playerId !== undefined &&
    targetTile.playerId !== this.getActivePlayer();

  // Always clear previous preview to avoid visual artifacts
  this.clearMovementPreview();

  // *** RESTRICT ATTACK TO NEIGHBORS ***
  if (isEnemy && this.hexDistance(selectedTile.q, selectedTile.r, targetTile.q, targetTile.r) > 1) {
      return;
  }

  // *** ALWAYS COMPUTE PATH (even to enemies) ***
  const path = this.findHexPath(
    selectedTile.q,
    selectedTile.r,
    targetTile.q,
    targetTile.r,
    selectedTile.army // Pass maxDist to limit range
  );

  // *** FOR ENEMIES: SHOW PATH TO LAST REACHABLE + ATTACK INDICATOR ***
  if (isEnemy && path.length > 1) {
    console.log(`[sh] ATTACK POSSIBLE: Tile ${hoverIndex}`);

    const reachablePath = path.slice(0, -1); // Exclude enemy
    this.state.movementPreview = reachablePath;

    const originalArmies = reachablePath.map(
      (idx) => this.state.tiles[idx].army,
    );
    let movingArmy = originalArmies[0];

    reachablePath.forEach((index, i) => {
      const tile = this.state.tiles[index];
      delete tile.armyPreview;

      let previewValue;
      if (i === 0) {
        previewValue = 1;
        movingArmy -= 1;
      } else {
        previewValue = originalArmies[i] + 1;
        movingArmy -= 1;
      }
      this._setArmyPreview(tile, previewValue); // *** SHOWS FINAL ARMY ✓ ***

      const pathColor = tile.mesh.userData.originalColor
        .clone()
        .multiplyScalar(2.0);
      tile.mesh.material.color.copy(pathColor);
      tile.mesh.material.emissive.setHex(0x444400);
    });

    // *** RED X ON LAST REACHABLE (FINAL ARMY STATE) ***
    const lastReachableIndex = this.state.movementPreview[this.state.movementPreview.length - 1];
    this.showAttackX(lastReachableIndex, hoverIndex);
    return;
  }

  // *** NORMAL MOVEMENT LOGIC (your original) ***
  if (
    pathLength >= selectedTile.army ||
    hoverIndex === this.state.selectedTile ||
    path.length <= 1
  ) {
    return;
  }

  this.state.movementPreview = path;
  const originalArmies = path.map((idx) => this.state.tiles[idx].army);
  let movingArmy = originalArmies[0];

  path.forEach((index, i) => {
    const tile = this.state.tiles[index];
    delete tile.armyPreview;

    let previewValue;
    if (i === 0) {
      previewValue = 1;
      movingArmy -= 1;
    } else if (i === path.length - 1) {
      previewValue = originalArmies[i] + movingArmy;
    } else {
      previewValue = originalArmies[i] + 1;
      movingArmy -= 1;
    }
    this._setArmyPreview(tile, previewValue);

    const pathColor = tile.mesh.userData.originalColor
      .clone()
      .multiplyScalar(2.0);
    tile.mesh.material.color.copy(pathColor);
    tile.mesh.material.emissive.setHex(0x444400);
  });

  console.log(
    `[sh] Preview: [${originalArmies.join(",")}→${path.map((_, i) => (i === path.length - 1 ? originalArmies[i] + movingArmy : originalArmies[i] + 1)).join(",")}]`,
  );
}

/**
 * Internal helper to set the army preview value on a tile.
 *
 * @this {import("../../sh.js").sh}
 * @param {import("../state.js").TileData} tile - The tile to update.
 * @param {number} previewValue - The predicted army value.
 */
export function _setArmyPreview(tile, previewValue) {
  tile.armyPreview = previewValue;

  const ctx = tile.ctx;
  const canvas = tile.canvas;

  // Clear + background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  // ctx.fillRect(0, 0, canvas.width, canvas.height);
  //
  // // *** YELLOW TEXT FOR PREVIEW ***
  // ctx.fillStyle = "#ffff88"; // Light yellow
  // ctx.strokeStyle = "black";
  // ctx.lineWidth = 2;
  // ctx.font = "bold 28px Arial";
  // ctx.textAlign = "center";
  // ctx.textBaseline = "middle";

  ctx.strokeText(previewValue.toString(), canvas.width / 2, canvas.height / 2);
  ctx.fillText(previewValue.toString(), canvas.width / 2, canvas.height / 2);

  tile.label.material.map.needsUpdate = true;
}

/**
 * Executes a movement from one tile to another.
 * Updates army strengths along the path.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} fromIndex - The index of the starting tile.
 * @param {number} toIndex - The index of the destination tile.
 * @param {boolean} [count_as_action=true] - Whether to deduct an action point.
 */
export function executeMovement(fromIndex, toIndex, count_as_action = true) {
  const fromTile = this.state.tiles[fromIndex];
  const toTile = this.state.tiles[toIndex];
  const pathLength = this.hexDistance(
    fromTile.q,
    fromTile.r,
    toTile.q,
    toTile.r,
  );
  const remainder = fromTile.army - pathLength;

  if (remainder <= 0) {
    console.log(
      `[sh] Not enough army! Need ${pathLength}, have ${fromTile.army}`,
    );
    return;
  }

  const path = this.findHexPath(
    fromTile.q,
    fromTile.r,
    toTile.q,
    toTile.r,
    pathLength + 1,
  );
  // *** SAME LOGIC AS PREVIEW: PRESERVE ORIGINALS + APPLY STACKING ***
  const activePlayer = this.state.turnState.activePlayer;
  const originalArmies = path.map((idx) => this.state.tiles[idx].army);
  let movingArmy = originalArmies[0];

  path.forEach((index, i) => {
    const tile = this.state.tiles[index];

    if (i === 0) {
      // *** SOURCE: SET TO 1 ***
      this.setArmyStrength(index, 1);
      movingArmy -= 1;
    } else if (i === path.length - 1) {
      // *** DESTINATION: ORIGINAL + REMAINDER ***
      this.assignTileToPlayer(index, activePlayer, 0xff4444);
      this.setArmyStrength(index, originalArmies[i] + movingArmy);
    } else {
      // *** PATH TILE: ORIGINAL + 1 ***
      this.assignTileToPlayer(index, activePlayer, 0xff4444);
      this.setArmyStrength(index, originalArmies[i] + 1);
      movingArmy -= 1;
    }
  });

  this.clearMovementPreview();
  this.clearReachableTiles();
  this.clearSelection();
  this.setMovementMode(false);

  if (count_as_action) {
    this.consumeAction();
  } else {
    this.ui.statusbar.update();
  }

  console.log(
    `[sh] EXECUTED: [${originalArmies.join(",")}→${path.map((idx, i) => (i === 0 ? 1 : i === path.length - 1 ? originalArmies[i] + movingArmy : originalArmies[i] + 1)).join(",")}]`,
  );
}

/**
 * Highlights all reachable tiles from the currently selected tile.
 * Reachable tiles are shown with a subtle blue glow.
 *
 * @this {import("../../sh.js").sh}
 */
export function updateReachableTiles() {
  if (!this.state.movementMode || this.state.selectedTile === null) {
    this.clearReachableTiles();
    return;
  }

  const activePlayer = this.getActivePlayer();
  const selectedTile = this.state.tiles[this.state.selectedTile];
  const maxDist = selectedTile.army - 1;

  if (maxDist <= 0) {
    this.clearReachableTiles();
    return;
  }

  this.clearReachableTiles();

  const queue = [{ index: this.state.selectedTile, dist: 0 }];
  const visited = new Set([this.state.selectedTile]);
  this.state.reachableTiles = [];

  while (queue.length > 0) {
    const { index, dist } = queue.shift();

    if (dist > 0) {
      this.state.reachableTiles.push(index);
      const tile = this.state.tiles[index];
      const reachColor = tile.mesh.userData.originalColor
        .clone()
        .multiplyScalar(1.15);
      tile.mesh.material.color.copy(reachColor);
      tile.mesh.material.emissive.setHex(0x000044);
    }

    if (dist >= maxDist) continue;

    const tile = this.state.tiles[index];
    const neighbors = this.hexNeighbors(tile.q, tile.r);

    for (const n of neighbors) {
      const nKey = `${n.q}_${n.r}`;
      const nIndex = this.state.tileMap.get(nKey);

      if (nIndex !== undefined && !visited.has(nIndex)) {
        const neighborTile = this.state.tiles[nIndex];

        // *** BLOCK: enemy tiles (≠ activePlayer) + blocked tiles (playerId=0) ***
        if (
          neighborTile.playerId === 0 ||
          (neighborTile.playerId !== undefined &&
            neighborTile.playerId !== activePlayer)
        ) {
          continue; // Skip enemies + blocked
        }

        visited.add(nIndex);
        queue.push({ index: nIndex, dist: dist + 1 });
      }
    }
  }
}

/**
 * Clears the highlight from reachable tiles.
 *
 * @this {import("../../sh.js").sh}
 */
export function clearReachableTiles() {
  if (!this.state.reachableTiles) return;

  // here it is actually better to create a new array and not reset the old one with `this.state.reachableTiles.length = 0` as we still need the list too loop, but the _resetTileHighlight method checks if the tile is in the reachableTiles list
  const tiles = this.state.reachableTiles;
  this.state.reachableTiles = [];

  tiles.forEach((idx) => {
    const tile = this.state.tiles[idx];
    this._resetTileHighlight(tile);
  });
  this.clearAttackPreview();
}
