/**
 * @fileoverview
 * Functions related to player management, tile ownership, and player state.
 */

/**
 * Assigns ownership of one or more tiles to a player.
 * Updates visual properties like color and visibility based on the owner.
 *
 * @this {import("../../sh.js").sh}
 * @param {number|number[]} tileIndex - The index (or array of indices) of the tile(s) to assign.
 * @param {number|undefined} playerId - The ID of the player to assign the tile to. Use -1 for UNUSED, undefined for NEUTRAL.
 * @param {number} [colorHex] - Optional color to set for the tile. Defaults to the player's color.
 * @returns {boolean} True if assignment was successful, false otherwise.
 */
export function assignTileToPlayer(
  tileIndex,
  playerId,
  colorHex,
) {
  // Handle default colorHex logic inside function if not provided
  if (colorHex === undefined && this.state.players[playerId]) {
      colorHex = this.state.players[playerId].color;
  }

  for (const index of Array.isArray(tileIndex) ? tileIndex : [tileIndex]) {
    const tile = this.state.tiles[index];
    if (!tile) return false;

    // Remove from previous owner
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
}

/**
 * Retrieves the set of tile indices owned by a specific player.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} playerId - The ID of the player.
 * @returns {Set<number>} A set of tile indices.
 */
export function getPlayerTiles(playerId) {
  return this.state.players[playerId]?.tiles || new Set();
}

/**
 * Assigns all tiles in the scene to a specific player.
 * Useful for initializing the map or clearing it.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} [playerId=0] - The player ID to assign all tiles to.
 * @param {number} [colorHex=0x888888] - The color to assign to the tiles.
 */
export function assignAllTilesToPlayer(playerId = 0, colorHex = 0x888888) {
  this.state.tiles.forEach((tile, index) => {
    this.assignTileToPlayer(index, playerId, colorHex);
  });
  console.log(
    `[sh] All ${this.state.tiles.length} tiles assigned to player ${playerId}`,
  );
}

/**
 * returns the current active player's ID.
 *
 * @this {import("../../sh.js").sh}
 * @returns {number} The active player ID.
 */
export function getActivePlayer() {
  return this.state.turnState.activePlayer;
}

/**
 * Returns the data object for the currently active player.
 *
 * @this {import("../../sh.js").sh}
 * @returns {Object} The player data object.
 */
export function getActivePlayerData() {
  return this.state.players[this.getActivePlayer()];
}

/**
 * Initializes the players object with default colors and names.
 *
 * @this {import("../../sh.js").sh}
 */
export function initPlayers() {
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
}

/**
 * Advances the turn state to the next player.
 * cycles through players 1 to config.playerCount.
 *
 * @this {import("../../sh.js").sh}
 */
export function nextPlayer() {
  this.state.turnState.activePlayer++;
  if (this.state.turnState.activePlayer > this.config.playerCount) {
    this.state.turnState.activePlayer = 1;
  }
}
