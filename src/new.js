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
  colorHex = this.state.players[playerId].color,
) {
  for (const index of Array.isArray(tileIndex) ? tileIndex : [tileIndex]) {
    const tile = this.state.tiles[index];
    if (!tile) return false;

    // Remove from previous owne
    for (const [pid, player] of Object.entries(this.state.players)) {
      if (player.tiles.has(index)) player.tiles.delete(index);
    }

    // Add to new player
    const playerData = this.state.players[playerId];
    if (!playerData) return false;

    playerData.tiles.add(index);
    this.setTileColor(index, playerData.color || colorHex);
    tile.playerId = playerId;

    console.log(`[sh] Tile ${index} → Player ${playerId}`);
  }
  return true;
};

// Get player info
sh.getPlayerTiles = function (playerId) {
  return this.state.players[playerId]?.tiles || new Set();
};

/////// movement system

// Toggle movement mode
sh.toggleMovementMode = function () {
  if (this.state.movementMode) {
    this.clearMovementPreview();
    this.clearReachableTiles(); // *** NEW ***
    this.state.movementMode = false;
    console.log("[sh] Movement mode OFF");
  } else {
    this.clearReachableTiles(); // *** NEW ***
    this.state.movementMode = true;
    console.log("[sh] Movement mode ON - select source tile");
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
  if (!isEnemy) {
    this.clearMovementPreview();
  }

  // *** ALWAYS COMPUTE PATH (even to enemies) ***
  const path = this.findHexPath(
    selectedTile.q,
    selectedTile.r,
    targetTile.q,
    targetTile.r,
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
    this.state.movementPreview[this.state.movementPreview.length - 1];
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

sh.executeMovement = function (fromIndex, toIndex) {
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
      this.assignTileToPlayer(index, 1, 0xff4444);
      this.setArmyStrength(index, originalArmies[i] + movingArmy);
    } else {
      // *** PATH TILE: ORIGINAL + 1 ***
      this.assignTileToPlayer(index, 1, 0xff4444);
      this.setArmyStrength(index, originalArmies[i] + 1);
      movingArmy -= 1;
    }
  });

  this.clearMovementPreview();
  this.clearReachableTiles();
  this.clearSelection();
  this.toggleMovementMode();

  this.ui.statusbar.update();

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
  this.toggleMovementMode(); // Exit movement mode
  console.log(
    `[sh] Turn ${this.state.turnState.turnNumber}: Player ${this.getActivePlayer()}`,
  );

  this.ui.statusbar.update();
};

// Initialize players with preset colors
sh.initPlayers = function () {
  this.state.players = {
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
  this.state.attackPreviewTile = lastReachableIndex;

  const tile = this.state.tiles[lastReachableIndex];
  const targetTile = this.state.tiles[targetIndex];
  const ctx = tile.ctx;
  const canvas = tile.canvas;

  // *** FORCE REDRAW ARMY FIRST ***
  if (tile.armyPreview !== undefined) {
    this._setArmyPreview(tile, tile.armyPreview);
  } else {
    this.setArmyStrength(lastReachableIndex, tile.army);
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

// sh.executeAttack = async function (fromIndex, toIndex) {
//   const fromTile = this.state.tiles[fromIndex];
//   const toTile = this.state.tiles[toIndex];
//
//   console.log(
//     `[sh] ATTACK: ${fromIndex}(${fromTile.army}) vs ${toIndex}(${toTile.army})`,
//   );
//
//   // Use source tile army for dice roll (not path preview)
//   const [attackResult, defendResult] = await this.diceRoller.roll(
//     fromTile.army,
//     toTile.army,
//   );
//
//   // *** SIMPLE ATTACK: attacker army vs defender army ***
//   if (fromTile.army <= toTile.army) {
//     // Defender wins - attacker loses all but 1
//     this.setArmyStrength(fromIndex, 1);
//   } else {
//     // Attacker wins - conquer tile
//     this.assignTileToPlayer(toIndex, this.getActivePlayer());
//     this.setArmyStrength(toIndex, fromTile.army - toTile.army);
//     this.setArmyStrength(fromIndex, 1);
//   }
//
//   this.consumeAction(); // Decrement actionsRemaining
// };

sh.consumeAction = function () {
  this.state.turnState.actionsRemaining--;
  if (this.state.turnState.actionsRemaining <= 0) {
    this.endTurn(); // → next player
  }
};

sh.endTurn = function () {
  this.state.turnState.turnsRemaining--;
  if (this.state.turnState.turnsRemaining <= 0) {
    this.endRound();
  } else {
    this.nextPlayer();
  }
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
  } else {
    winnerIndex = toIndex;
    loserIndex = fromIndex;
    winningPlayer = toTile.playerId;
    winArmy = toTile.army;
    winningScore = defendResult;
    losingScore = attackResult;
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
  this.toggleMovementMode();
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
  sh.assignTileToPlayer([sh.getTileIndex(0, 0), 56, 66, 75], 1);
  sh.setArmyStrength(sh.getTileIndex(0, 0), 8);
  sh.setArmyStrength(56, 1);
  sh.setArmyStrength(66, 1);
  sh.setArmyStrength(75, 2);

  sh.assignTileToPlayer(63, 2);
  sh.setArmyStrength(63, 4);

  sh.assignTileToPlayer(36, 0);
  sh.assignTileToPlayer(47, 0);

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

setTimeout(test, 1000);
