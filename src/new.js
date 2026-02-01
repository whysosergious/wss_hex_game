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
  const startKey = `${startQ}_${startR}`;
  const targetKey = `${targetQ}_${targetR}`;
  const startIndex = this.state.tileMap.get(startKey);
  const targetIndex = this.state.tileMap.get(targetKey);

  if (!startIndex || !targetIndex) return [];

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
      if (nIndex && !visited.has(nIndex)) {
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
  const tile = this.state.tiles[tileIndex];
  if (!tile) return false;

  // Remove from previous owne
  for (const [pid, player] of Object.entries(this.state.players)) {
    if (player.tiles.has(tileIndex)) player.tiles.delete(tileIndex);
  }

  // Add to new player
  const playerData = this.state.players[playerId];
  if (!playerData) return false;

  playerData.tiles.add(tileIndex);
  this.setTileColor(tileIndex, playerData.color || colorHex);
  tile.playerId = playerId;

  console.log(`[sh] Tile ${tileIndex} → Player ${playerId}`);
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
  const remainder = Math.max(0, selectedTile.army - pathLength);

  this.clearMovementPreview();

  if (pathLength >= selectedTile.army || hoverIndex === this.state.selectedTile)
    return;

  const path = this.findHexPath(
    selectedTile.q,
    selectedTile.r,
    targetTile.q,
    targetTile.r,
    pathLength,
  );
  this.state.movementPreview = path;

  path.forEach((index, i) => {
    const tile = this.state.tiles[index];

    // *** PATH OVERLAY (brightest - on top of reachable blue) ***
    const pathColor = tile.mesh.userData.originalColor
      .clone()
      .multiplyScalar(2.0);
    tile.mesh.material.color.copy(pathColor);
    tile.mesh.material.emissive.setHex(0x444400); // Bright yellow

    let previewValue = i === path.length - 1 ? remainder : 1;
    this._setArmyPreview(tile, previewValue);
  });
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
  const totalCost = pathLength;
  const remainder = fromTile.army - totalCost;

  if (remainder < 0) {
    console.log(
      `[sh] Not enough army! Need ${totalCost}, have ${fromTile.army}`,
    );
    return;
  }

  // *** EXECUTE: source=1, path=1 each, dest=remainder ***
  this.setArmyStrength(fromIndex, 1); // Real army update

  // Convert entire path to player 1 (permanent)
  const path = this.findHexPath(
    fromTile.q,
    fromTile.r,
    toTile.q,
    toTile.r,
    pathLength,
  );
  path.slice(1).forEach((index) => {
    // Skip source
    this.assignTileToPlayer(index, 1, 0xff4444); // Dark red permanent
    this.setArmyStrength(index, 1); // Real army=1
  });

  // Destination gets remainder
  this.assignTileToPlayer(toIndex, 1, 0xff4444);
  this.setArmyStrength(toIndex, remainder);

  this.clearMovementPreview();
  this.clearReachableTiles();
  this.clearSelection();
  this.toggleMovementMode();

  console.log(`[sh] MOVED ${remainder} army! Path: ${path.join("→")}`);
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

  // BFS to find ALL reachable tiles within range
  const queue = [{ index: this.state.selectedTile, dist: 0 }];
  const visited = new Set([this.state.selectedTile]);
  this.state.reachableTiles = [];

  while (queue.length > 0) {
    const { index, dist } = queue.shift();

    if (dist > 0) {
      // Don't highlight source
      this.state.reachableTiles.push(index);
      const tile = this.state.tiles[index];

      // *** SUBTLE BLUE GLOW ***
      const reachColor = tile.mesh.userData.originalColor
        .clone()
        .multiplyScalar(1.15);
      tile.mesh.material.color.copy(reachColor);
      tile.mesh.material.emissive.setHex(0x000044); // Deep blue glow
    }

    if (dist >= maxDist) continue;

    const tile = this.state.tiles[index];
    const neighbors = this.hexNeighbors(tile.q, tile.r);

    for (const n of neighbors) {
      const nKey = `${n.q}_${n.r}`;
      const nIndex = this.state.tileMap.get(nKey);
      if (
        nIndex &&
        !visited.has(nIndex) &&
        this.state.tiles[nIndex].playerId !== activePlayer
      ) {
        // Only highlight enemy/neutral tiles
        visited.add(nIndex);
        queue.push({ index: nIndex, dist: dist + 1 });
      }
    }
  }

  console.log(
    `[sh] ${this.state.reachableTiles.length} reachable tiles highlighted`,
  );
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
};

// Initialize players with preset colors
sh.initPlayers = function () {
  this.state.players = {
    1: { color: 0x1f77b4, name: "Player 1", tiles: new Set() }, // Blue
    2: { color: 0xff7f0e, name: "Player 2", tiles: new Set() }, // Orange
    3: { color: 0x2ca02c, name: "Player 3", tiles: new Set() }, // Green
    4: { color: 0xd62728, name: "Player 4", tiles: new Set() }, // Red
    5: { color: 0x9467bd, name: "Player 5", tiles: new Set() }, // Purple
    6: { color: 0x8c564b, name: "Player 6", tiles: new Set() }, // Brown
  };
  console.log("[sh] Players initialized with colorblind-safe colors");
};

const test = () => {
  sh.resetScene(4, 4);
  console.log("Center index:", sh.getTileIndex(0, 0)); // Should be 12 or similar
  sh.assignTileToPlayer(sh.getTileIndex(0, 0), 1);
  sh.setArmyStrength(sh.getTileIndex(0, 0), 4);

  sh.assignTileToPlayer(15, 2);
  sh.setArmyStrength(15, 4);

  // sh.toggleMovementMode(); // ON
  // sh.selectTileByCoords(0, 0); // Selects center ✓

  console.log("Debug:", {
    movementMode: sh.state.movementMode,
    selectedTile: sh.state.selectedTile,
    army: sh.state.tiles[sh.state.selectedTile]?.army,
  });
};

setTimeout(test, 1000);
