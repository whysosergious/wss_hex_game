import * as THREE from "three";
/*******
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * UNTYPED
 *
 *
 *
 *******/
////// hex grid math

sh.hexDistance = function (q1, r1, q2, r2) {
  return Math.max(
    Math.abs(q1 - q2),
    Math.abs(r1 - r2),
    Math.abs(-(q1 + r1) - -(q2 + r2)),
  );
};

sh.hexNeighbors = function (q, r) {
  return [
    { q: q + 1, r: r },
    { q: q + 1, r: r - 1 },
    { q: q, r: r - 1 },
    { q: q - 1, r: r },
    { q: q - 1, r: r + 1 },
    { q: q, r: r + 1 },
  ];
};

sh.findHexPath = function (startQ, startR, targetQ, targetR, maxDist) {
  const activePlayer = this.getActivePlayer();
  const startKey = `${startQ}_${startR}`;
  const targetKey = `${targetQ}_${targetR}`;
  const startIndex = this.state.tileMap.get(startKey);
  const targetIndex = this.state.tileMap.get(targetKey);

  if (startIndex === undefined || targetIndex === undefined) return [];

  const queue = [{ index: startIndex, path: [startIndex], dist: 0 }];
  const visited = new Set([startIndex]);

  while (queue.length > 0) {
    const { index, path, dist } = queue.shift();

    if (dist >= maxDist) break;

    const tile = this.state.tiles[index];
    const neighbors = this.hexNeighbors(tile.q, tile.r);

    for (const n of neighbors) {
      const nKey = `${n.q}_${n.r}`;
      const nIndex = this.state.tileMap.get(nKey);

      if (nIndex !== undefined && !visited.has(nIndex)) {
        if (nIndex === targetIndex) return [...path, nIndex]; // *** ALLOW TARGET (Attack) ***

        const neighborTile = this.state.tiles[nIndex];

        // *** FIXED: BLOCK enemies + blocked tiles ***
        if (
          neighborTile.playerId === 0 || // Blocked
          (neighborTile.playerId !== undefined && // Has owner
            neighborTile.playerId !== activePlayer) // Enemy
        ) {
          continue; // *** NEVER PATH THROUGH ***
        }

        visited.add(nIndex);
        const newPath = [...path, nIndex];
        queue.push({ index: nIndex, path: newPath, dist: dist + 1 });
        if (nIndex === targetIndex) return newPath;
      }
    }
  }
  return [];
};

//////player managment

// Assign tile ownership (color + player tracking)
sh.assignTileToPlayer = function (
  tileIndex,
  playerId,
  colorHex = this.state.players[playerId]?.color,
) {
  for (const index of Array.isArray(tileIndex) ? tileIndex : [tileIndex]) {
    const tile = this.state.tiles[index];
    if (!tile) return false;

    // Remove from previous owne
    for (const [pid, player] of Object.entries(this.state.players)) {
      if (player.tiles.has(index)) player.tiles.delete(index);
    }

    // Add to new player. Handle cases where playerData for playerId=undefined is not directly in this.state.players
    const playerData = this.state.players[playerId];
    const actualPlayerData = playerData || this.state.players.undefined; // Fallback to __NEUTRAL__ player data if playerId is undefined

    if (!actualPlayerData) return false; // Should not happen if __NEUTRAL__ is defined

    actualPlayerData.tiles.add(index);
    tile.playerId = playerId;

    // *** Handle visual properties based on playerId ***
    if (playerId == -1) {
      // __UNUSED__ - almost invisible, but interactive
      tile.group.visible = true; // MUST be true to be interactive
      // tile.mesh.material.transparent = false;
      // tile.mesh.material.opacity = 0.01; // Increased opacity for raycasting and visibility
      tile.mesh.material.depthWrite = true; // Helps with rendering order
      tile.label.visible = false; // Still hide label
      this.setTileColor(index, this.state.players["-1"].color); // Set to UNUSED's defined color
    } else if (playerId === undefined) {
      // __NEUTRAL__ - normal grey
      tile.group.visible = true;
      // tile.mesh.material.transparent = false; // Changed to true for NEUTRAL
      // tile.mesh.material.opacity = 1; // Increased opacity for visibility
      tile.mesh.material.depthWrite = true;
      tile.label.visible = true;
      this.setTileColor(index, this.state.players["undefined"].color); // Set to NEUTRAL's defined color
    } else {
      // Normal players or BLOCKED
      tile.group.visible = true;
      // tile.mesh.material.transparent = false;
      // tile.mesh.material.opacity = 1.0;
      tile.mesh.material.depthWrite = true;
      tile.label.visible = true;
      this.setTileColor(index, actualPlayerData.color || colorHex);
    }

    // console.log(`[sh] Tile ${index} → Player ${playerId}`);
  }
  return true;
};

// Get player info
sh.getPlayerTiles = function (playerId) {
  return this.state.players[playerId]?.tiles || new Set();
};

/////// movement system

sh.setMovementMode = function (bool) {
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
};
// Toggle movement mode
sh.toggleMovementMode = function () {
  if (this.state.movementMode) {
    sh.setMovementMode(false);
  } else {
    sh.setMovementMode(true);
  }
};

sh.clearMovementPreview = function () {
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
};

sh.updateMovementPreview = function (hoverIndex) {
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
};

sh._setArmyPreview = function (tile, previewValue) {
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
};

sh.executeMovement = function (fromIndex, toIndex, count_as_action = true) {
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
};

sh.assignAllTilesToPlayer = function (playerId = 0, colorHex = 0x888888) {
  this.state.tiles.forEach((tile, index) => {
    this.assignTileToPlayer(index, playerId, colorHex);
  });
  console.log(
    `[sh] All ${this.state.tiles.length} tiles assigned to player ${playerId}`,
  );
};

// Highlight all reachable tiles (subtle blue glow)
sh.updateReachableTiles = function () {
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
};

// Clear reachable tiles highlight
sh.clearReachableTiles = function () {
  if (!this.state.reachableTiles) return;

  // here it is actually better to create a new array and not reset the old one with `this.state.reachableTiles.length = 0` as we still need the list too loop, but the _resetTileHighlight method checks if the tile is in the reachableTiles list
  const tiles = this.state.reachableTiles;
  this.state.reachableTiles = [];

  tiles.forEach((idx) => {
    const tile = this.state.tiles[idx];
    this._resetTileHighlight(tile);
  });
  this.clearAttackPreview();
};

sh.getActivePlayer = function () {
  return this.state.turnState.activePlayer;
};

// Get active player data
sh.getActivePlayerData = function () {
  return this.state.players[this.getActivePlayer()];
};

// Next turn
sh.nextTurn = function () {
  this.state.turnState.activePlayer =
    (this.state.turnState.activePlayer % 6) + 1;
  this.state.turnState.turnNumber++;

  console.log(
    `[sh] Turn ${this.state.turnState.turnNumber}: Player ${this.getActivePlayer()}`,
  );

  this.ui.statusbar.update();
};

// Initialize players with preset colors
sh.initPlayers = function () {
  this.state.players = {
    "-1": { color: 0x888888, name: "__UNUSED__", tiles: new Set() }, // Light grey for UNUSED
    undefined: { color: 0x333333, name: "__NEUTRAL__", tiles: new Set() }, // Dark grey for NEUTRAL
    0: { color: 0x333333, name: "__BLOCKED__", tiles: new Set() }, // Blue
    1: { color: 0x1f77b4, name: "Player 1", tiles: new Set() }, // Blue
    2: { color: 0xff7f0e, name: "Player 2", tiles: new Set() }, // Orange
    3: { color: 0x2ca02c, name: "Player 3", tiles: new Set() }, // Green
    4: { color: 0xd62728, name: "Player 4", tiles: new Set() }, // Red
    5: { color: 0x9467bd, name: "Player 5", tiles: new Set() }, // Purple
    6: { color: 0x8c564b, name: "Player 6", tiles: new Set() }, // Brown
  };
  console.log("[sh] Players initialized with colorblind-safe colors");
};

/**
 *
 *
 *
 *
 *
 *
 * attack logic
 *
 *
 *
 *
 * **/

sh.updateAttackPreview = function (hoverIndex) {
  if (!this.state.movementMode || this.state.selectedTile === null) return;

  const sourceTile = this.state.tiles[this.state.selectedTile];
  const targetTile = this.state.tiles[hoverIndex];

  // *** ONLY ENEMIES ***
  if (
    targetTile.playerId !== this.getActivePlayer() &&
    targetTile.playerId !== undefined
  ) {
    const path = this.findHexPath(
      sourceTile.q,
      sourceTile.r,
      targetTile.q,
      targetTile.r,
    );

    if (path.length > 1) {
      // Can reach up to enemy
      const lastReachableIndex = path[path.length - 2]; // Last OWN tile before enemy
      const lastReachableTile = this.state.tiles[lastReachableIndex];

      // *** SHOW RED 'X' BETWEEN lastReachable → enemy ***
      this.showAttackX(lastReachableTile, targetTile);
      this.state.attackPreview.active = true;
      this.state.attackPreview.sourceIndex = this.state.selectedTile;
      this.state.attackPreview.targetIndex = hoverIndex;
      this.state.attackPreview.lastReachableIndex = lastReachableIndex;
    }
  } else {
    this.clearAttackPreview();
  }
};

sh.showAttackX = function (lastReachableIndex, targetIndex) {
  // Set the preview tile tracker
  this.state.attackPreviewTile = targetIndex;

  const tile = this.state.tiles[targetIndex];
  const ctx = tile.ctx;
  const canvas = tile.canvas;

  // *** FORCE REDRAW ARMY FIRST ***
  if (tile.armyPreview !== undefined) {
    this._setArmyPreview(tile, tile.armyPreview);
  } else {
    this.setArmyStrength(targetIndex, tile.army);
  }

  // *** RED X ON TOP ***
  ctx.save();
  ctx.strokeStyle = "#ff0000";
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(15, 15);
  ctx.lineTo(canvas.width - 15, canvas.height - 15);
  ctx.moveTo(canvas.width - 15, 15);
  ctx.lineTo(15, canvas.height - 15);
  ctx.stroke();

  ctx.restore();
  tile.label.material.map.needsUpdate = true;
};

sh.clearAttackPreview = function () {
  if (
    this.state.attackPreviewTile !== undefined &&
    this.state.attackPreviewTile !== null
  ) {
    const tile = this.state.tiles[this.state.attackPreviewTile];
    if (tile.armyPreview !== undefined) {
      this._setArmyPreview(tile, tile.armyPreview);
    } else {
      this.setArmyStrength(this.state.attackPreviewTile, tile.army);
    }
    this.state.attackPreviewTile = null;
  }
};

sh.consumeAction = function () {
  this.state.turnState.actionNumber++;
  if (this.state.turnState.actionsRemaining <= 0) {
    this.state.turnState.actionNumber = 1;
    this.endTurn(); // Just ends CURRENT player's turn
  }
  sh.ui.statusbar.update();
  this.saveGameState(); // Auto-save
  console.log("Action taken");
};

sh.endTurn = function () {
  this.state.turnState.actionNumber = 1;
  this.state.turnState.turnNumber++;

  if (this.state.turnState.turnsRemaining <= 0) {
    this.endRound(); // *** ALL REINFORCEMENTS HERE ***
    this.state.turnState.turnNumber = 1;
    sh.ui.statusbar.update();
    this.saveGameState(); // Auto-save
    return;
  }

  // *** NO REINFORCEMENTS - JUST ADVANCE PLAYER ***
  this.nextPlayer();
  sh.ui.statusbar.update();
  this.saveGameState(); // Auto-save
  console.log("Turn ended", sh.state.turnState);
};

sh.nextPlayer = function () {
  this.state.turnState.activePlayer++;
  if (this.state.turnState.activePlayer > this.config.playerCount) {
    this.state.turnState.activePlayer = 1;
  }
};

// *** NEW: Add this function ***
sh.endRound = function () {
  console.log("[sh] END OF ROUND - DISTRIBUTING REINFORCEMENTS");

  // *** ANIMATED REINFORCEMENTS FOR ALL PLAYERS ***
  for (let i = 1; i <= this.config.playerCount; i++) {
    const player = this.state.players[i];
    if (player && player.tiles) {
      for (const tile_index of player.tiles) {
        setTimeout(() => {
          sh.setArmyStrength(
            tile_index,
            sh.state.tiles[tile_index].army + sh.config.reinforcementsPerTurn,
          );
        }, i * 100); // Staggered animation per player
      }
    }
  }

  this.nextPlayer(); // Start next round with player 1
};

sh.executeAttack = async function (fromIndex, toIndex) {
  const fromTile = this.state.tiles[fromIndex];
  const toTile = this.state.tiles[toIndex];

  if (!this.diceRoller) {
    console.error("[sh] DiceRoller not initialized!");
    return;
  }

  const [attackResult, defendResult] = await this.diceRoller.roll(
    fromTile.army,
    toTile.army,
  );

  let winnerIndex,
    loserIndex,
    winningPlayer,
    winArmy,
    losingScore,
    winningScore;

  if (attackResult > defendResult) {
    winnerIndex = fromIndex;
    loserIndex = toIndex;
    winningPlayer = this.getActivePlayer();
    winArmy = fromTile.army;
    winningScore = attackResult;
    losingScore = defendResult;
  } else if (attackResult < defendResult) {
    winnerIndex = toIndex;
    loserIndex = fromIndex;
    winningPlayer = toTile.playerId;
    winArmy = toTile.army;
    winningScore = defendResult;
    losingScore = attackResult;
  } else {
    this.setArmyStrength(fromIndex, 1);
    this.setArmyStrength(toIndex, 1);

    // Clear everything
    this.clearMovementPreview();
    this.clearReachableTiles();
    this.clearAttackPreview();
    this.clearSelection();
    this.setMovementMode(false);
    this.consumeAction();

    console.log(`[sh] tied`);

    this.ui.statusbar.update();

    return;
  }

  const resultArmy = winArmy - ~~(winArmy * (losingScore / winningScore));

  this.assignTileToPlayer(loserIndex, winningPlayer);
  this.setArmyStrength(loserIndex, resultArmy);
  this.setArmyStrength(winnerIndex, 1);

  // Clear everything
  this.clearMovementPreview();
  this.clearReachableTiles();
  this.clearAttackPreview();
  this.clearSelection();
  this.setMovementMode(false);
  this.consumeAction();

  console.log(`[sh] ${winningPlayer} WINS: ${resultArmy} army remains`);

  this.ui.statusbar.update();
};

/*****
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * test
 *
 *
 *
 * ****/
const test = () => {
  sh.resetScene(5, 5);
  console.log("Center index:", sh.getTileIndex(0, 0)); // Should be 12 or similar

  // *** map zones
  // blocked
  sh.assignTileToPlayer([65, 56, 55, 45, 56, 66, 75, 57], 0);

  // p1
  sh.assignTileToPlayer([20, 28, 29, 38, 39], 1);
  sh.setArmyStrength([20, 28, 29, 38, 39], 4);

  // p2
  sh.assignTileToPlayer([61, 62, 70, 71, 78], 2);
  sh.setArmyStrength([61, 62, 70, 71, 78], 4);

  // sh.toggleMovementMode(); // ON
  // sh.selectTileByCoords(0, 0); // Selects center ✓

  console.log("Debug:", {
    movementMode: sh.state.movementMode,
    selectedTile: sh.state.selectedTile,
    army: sh.state.tiles[sh.state.selectedTile]?.army,
  });

  console.log("=== TILE 0 DEBUG ===");
  console.log("Tile 0:", sh.state.tiles[0]);
  console.log("Tile 0 playerId:", sh.state.tiles[0]?.playerId);
  console.log("Active player:", sh.getActivePlayer());
  console.log("Tile 0 coords:", sh.state.tiles[0]?.q, sh.state.tiles[0]?.r);
  console.log(
    "Center coords:",
    sh.state.tiles[sh.getTileIndex(0, 0)]?.q,
    sh.state.tiles[sh.getTileIndex(0, 0)]?.r,
  );
};

// setTimeout(test, 1000);

// *** MAP EDITOR FUNCTIONS ***

sh.state.editor = {
  active: false,
  drawMode: false,
  selectedPlayer: 1,
  brushArmy: 1,
};

sh.applyBrush = function (tileIndex) {
  if (!this.state.editor.active) return;

  const tile = this.state.tiles[tileIndex];
  if (!tile) return;

  // Check if change is needed to avoid redundant updates
  if (tile.playerId !== this.state.editor.selectedPlayer) {
    this.assignTileToPlayer(tileIndex, this.state.editor.selectedPlayer);
  }

  if (tile.playerId !== -1 && tile.army !== this.state.editor.brushArmy) {
    this.setArmyStrength(tileIndex, this.state.editor.brushArmy);
  }
};

sh.enterMapEditor = function () {
  console.log("[sh] Entering Map Editor...");
  this.state.editor.active = true;
  this.state.editor.drawMode = false;
  if (this.state.controls) this.state.controls.enabled = true; // Ensure controls are enabled
  this.state.editor.selectedPlayer = -1; // Default brush to UNUSED
  this.state.editor.brushArmy = 0; // Default army to 0 for UNUSED

  // Reset scene to max editor size
  this.resetScene(this.config.editorMapSize.q, this.config.editorMapSize.r);

  // Set all to unused
  this.assignAllTilesToPlayer(-1);

  // Show Editor UI
  if (this.ui.editorTools) this.ui.editorTools.show();
  if (this.ui.statusbar) this.ui.statusbar.setMode("editor");
};

sh.saveMap = function (name) {
  if (!name) return false;

  const mapData = [];
  this.state.tiles.forEach((tile) => {
    // Save only if not unused
    if (tile.playerId != -1) {
      mapData.push({
        q: tile.q,
        r: tile.r,
        playerId: (tile.playerId === undefined) ? "undefined" : tile.playerId,
        army: tile.army,
      });
    }
  });

  const saveObj = {
    name: name,
    date: Date.now(),
    tiles: mapData,
  };

  localStorage.setItem(`hexwar_map_${name}`, JSON.stringify(saveObj));
  console.log(`[sh] Map '${name}' saved with ${mapData.length} tiles.`);
  return true;
};

sh.getMapList = function () {
  const maps = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("hexwar_map_")) {
      const name = key.replace("hexwar_map_", "");
      maps.push(name);
    }
  }
  return maps;
};

sh.deleteMap = function (name) {
  localStorage.removeItem(`hexwar_map_${name}`);
};

sh.saveGameState = function() {
    if (this.state.editor.active) return; // Don't auto-save in editor mode

    const stateObj = {
        turnState: {
            activePlayer: this.state.turnState.activePlayer,
            actionNumber: this.state.turnState.actionNumber,
            turnNumber: this.state.turnState.turnNumber,
            roundNumber: this.state.turnState.roundNumber
        },
        tiles: []
    };

    this.state.tiles.forEach(tile => {
        if (tile.playerId != -1) {
             stateObj.tiles.push({
                q: tile.q,
                r: tile.r,
                playerId: (tile.playerId === undefined) ? "undefined" : tile.playerId,
                army: tile.army
            });
        }
    });

    localStorage.setItem('hexwar_autosave', JSON.stringify(stateObj));
    console.log("[sh] Game state autosaved");
};

sh.loadGameState = function() {
    const dataStr = localStorage.getItem('hexwar_autosave');
    if (!dataStr) return false;

    console.log("[sh] Found autosave, loading...");
    const data = JSON.parse(dataStr);

    // Restore Turn State
    if (data.turnState) {
        Object.assign(this.state.turnState, data.turnState);
    }

    // Restore Map
    let maxQ = 0, maxR = 0;
    data.tiles.forEach(t => {
        maxQ = Math.max(maxQ, Math.abs(t.q));
        maxR = Math.max(maxR, Math.abs(t.r));
    });
    this.resetScene(maxQ, maxR);
    this.assignAllTilesToPlayer(-1);
    
    // UI Cleanup
    this.state.editor.active = false;
    this.state.editor.drawMode = false;
    if (this.state.controls) this.state.controls.enabled = true;
    if (this.ui.editorTools) this.ui.editorTools.hide();
    if (this.ui.statusbar) this.ui.statusbar.setMode("game");

    // Apply Tiles
    data.tiles.forEach(t => {
        const index = this.getTileIndex(t.q, t.r);
        if (index !== undefined) {
             const pid = (t.playerId === "undefined") ? undefined : t.playerId;
             this.assignTileToPlayer(index, pid);
             this.setArmyStrength(index, t.army);
        }
    });
    
    // Hide unused
    this.state.tiles.forEach(tile => {
          if (tile.playerId === -1) {
              tile.group.visible = false;
          }
    });

    this.ui.statusbar.update();
    return true;
};

sh.loadMap = function (name, forEditing = false) {
  const dataStr = localStorage.getItem(`hexwar_map_${name}`);
  if (!dataStr) {
    console.error(`[sh] Map '${name}' not found.`);
    return;
  }

  const data = JSON.parse(dataStr);
  console.log(`[sh] Loading map '${name}'...`);

  if (forEditing) {
    this.enterMapEditor();
    // Delay to allow scene reset to finish if it were async (it's sync but good practice)
  } else {
    // For play: find bounds
    let maxQ = 0,
      maxR = 0;
    data.tiles.forEach((t) => {
      maxQ = Math.max(maxQ, Math.abs(t.q));
      maxR = Math.max(maxR, Math.abs(t.r));
    });
    this.resetScene(maxQ, maxR);

    // If playing, set all to UNUSED first
    this.assignAllTilesToPlayer(-1);

    this.state.editor.active = false;
    this.state.editor.drawMode = false; // Reset draw mode
    if (this.state.controls) this.state.controls.enabled = true; // Ensure controls are enabled
    if (this.ui.editorTools) this.ui.editorTools.hide();
    if (this.ui.statusbar) this.ui.statusbar.setMode("game");
  }

  // Apply tiles
  data.tiles.forEach((t) => {
    const index = this.getTileIndex(t.q, t.r);
    if (index !== undefined) {
      const pid = (t.playerId === "undefined") ? undefined : t.playerId;
      this.assignTileToPlayer(index, pid);
      this.setArmyStrength(index, t.army);
    }
  });

  // Post-load cleanup: If not editing, hide UNUSED tiles
  if (!forEditing) {
      this.state.tiles.forEach(tile => {
          if (tile.playerId === -1) {
              tile.group.visible = false;
          }
      });
      // Start auto-saving for this new game
      this.saveGameState();
  }
};
