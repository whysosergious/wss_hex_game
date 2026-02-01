sh.init = function () {
  if (this.state.initialized) return;
  this._initScene();
  this._initTiles();
  this._initCamera();
  this._initControls();
  this._startRenderLoop();
  this.state.initialized = true;
  console.log("[sh] Initialized 7-tile hex demo");
};

sh.setArmyStrength = function (tileIndex, value) {
  const tile = this.state.tiles[tileIndex];
  if (!tile || !tile.label?.material?.map) {
    console.warn("[sh] Tile", tileIndex, "not ready");
    return;
  }
  tile.army = value;

  const ctx = tile.ctx;
  const canvas = tile.canvas;

  // crear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // // Clear and redraw with stroke
  // ctx.fillStyle = "rgba(0, 0, 0, 0)";
  // ctx.fillRect(0, 0, 128, 64);
  // ctx.fillStyle = "white";
  // ctx.strokeStyle = "black";
  // ctx.lineWidth = 2;
  // ctx.textAlign = "center";
  // ctx.textBaseline = "middle";

  ctx.strokeText(value.toString(), 64, 32);
  ctx.fillText(value.toString(), 64, 32);

  tile.label.material.map.needsUpdate = true;
  console.log(`[sh] Tile ${tileIndex} army: ${value}`);
};

sh.setTileColor = function (tileIndex, hexColor) {
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
};

sh.moveTile = function (tileIndex, x = 0, y = 0, z = 0) {
  const tile = this.state.tiles[tileIndex];
  if (!tile) return;

  tile.group.position.x += x;
  tile.group.position.y += y;
  tile.group.position.z += z;

  console.log(`[sh] Moved tile ${tileIndex} by (${x}, ${y}, ${z})`);
};

sh.selectTileByCoords = function (q, r) {
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
};

// Get tile index by coordinates
sh.getTileIndex = function (q, r) {
  const key = `${q}_${r}`;
  return this.state.tileMap.get(key);
};

// Get tile data by coordinates
sh.getTileByCoords = function (q, r) {
  const index = this.getTileIndex(q, r);
  return index !== undefined ? this.state.tiles[index] : null;
};

sh.resetScene = function (q = 1, r = 1) {
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
};

sh.getSelectedTile = function () {
  return this.state.selectedTile;
};

sh.clearSelection = function () {
  if (this.state.selectedTile !== null) {
    const tile = this.state.tiles[this.state.selectedTile];
    tile.mesh.material.color.copy(tile.mesh.userData.originalColor);
    tile.mesh.material.emissive.setHex(0x000000);
    tile.group.position.y = 0; // Reset group position
    this.state.selectedTile = null;
    console.log("[sh] Selection cleared");
  }
};

// debug methods
sh.debug = {
  printState() {
    console.table(
      sh.state.tiles.map((t, i) => ({
        id: i,
        q: t.q,
        r: t.r,
        army: t.army,
      })),
    );
  },
  printTileMap() {
    console.table(
      Array.from(sh.state.tileMap.entries()).map(([key, index]) => {
        const [q, r] = key.split("_").map(Number);
        return { q, r, index };
      }),
    );
  },
};
