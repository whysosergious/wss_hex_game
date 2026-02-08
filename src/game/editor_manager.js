/**
 * @fileoverview
 * Map editor functionality, including brush tools and map persistence (save/load/delete).
 */

/**
 * Applies the current editor brush to a specific tile.
 * Modifies the tile's player ownership or army strength.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} tileIndex - The index of the tile to modify.
 */
export function applyBrush(tileIndex) {
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
}

/**
 * Enters the map editor mode.
 * Resets the scene to the editor map size and initializes the editor UI.
 *
 * @this {import("../../sh.js").sh}
 */
export function enterMapEditor() {
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
}

/**
 * Exits the map editor mode.
 * Resets the UI to game mode.
 *
 * @this {import("../../sh.js").sh}
 */
export function exitMapEditor() {
  this.state.editor.active = false;
  this.ui.statusbar.setMode('game');
  this.ui.editorTools.hide();
}

/**
 * Saves the current map layout to local storage.
 * Only saves tiles that are not "UNUSED".
 *
 * @this {import("../../sh.js").sh}
 * @param {string} name - The name of the map to save.
 * @returns {boolean} True if saved successfully, false otherwise.
 */
export function saveMap(name) {
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
}

/**
 * Retrieves a list of all saved maps from local storage.
 *
 * @this {import("../../sh.js").sh}
 * @returns {string[]} An array of map names.
 */
export function getMapList() {
  const maps = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith("hexwar_map_")) {
      const name = key.replace("hexwar_map_", "");
      maps.push(name);
    }
  }
  return maps;
}

/**
 * Deletes a saved map from local storage.
 *
 * @this {import("../../sh.js").sh}
 * @param {string} name - The name of the map to delete.
 */
export function deleteMap(name) {
  localStorage.removeItem(`hexwar_map_${name}`);
}

/**
 * Loads a map from local storage and applies it to the scene.
 * Can load for editing (keeping editor tools active) or for playing (starting a game).
 *
 * @this {import("../../sh.js").sh}
 * @param {string} name - The name of the map to load.
 * @param {boolean} [forEditing=false] - Whether to load the map in editor mode.
 */
export function loadMap(name, forEditing = false) {
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
}
