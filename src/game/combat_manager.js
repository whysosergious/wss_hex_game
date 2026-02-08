/**
 * @fileoverview
 * Logic for combat interactions, including attack previews, dice rolls, and attack execution.
 */

/**
 * Updates the attack preview if the hovered tile is an enemy and within range.
 * Shows a visual indicator (red 'X') on the target tile.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} hoverIndex - The index of the hovered tile.
 */
export function updateAttackPreview(hoverIndex) {
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
}

/**
 * Displays a red 'X' on the target tile to indicate an attack.
 *
 * @this {import("../../sh.js").sh}
 * @param {number|import("../state.js").TileData} lastReachableIndex - The index or tile object of the attacking unit's last position.
 * @param {number|import("../state.js").TileData} targetIndex - The index or tile object of the target tile.
 */
export function showAttackX(lastReachableIndex, targetIndex) {
  // Determine if inputs are indices or objects (flexibility)
  let targetTile;
  if (typeof targetIndex === 'object') {
      targetTile = targetIndex;
      // We need the index for state tracking
      const targetKey = `${targetTile.q}_${targetTile.r}`;
      this.state.attackPreviewTile = this.state.tileMap.get(targetKey);
  } else {
      targetTile = this.state.tiles[targetIndex];
      this.state.attackPreviewTile = targetIndex;
  }

  const tile = targetTile;
  const ctx = tile.ctx;
  const canvas = tile.canvas;

  // *** FORCE REDRAW ARMY FIRST ***
  if (tile.armyPreview !== undefined) {
    this._setArmyPreview(tile, tile.armyPreview);
  } else {
    this.setArmyStrength(this.state.attackPreviewTile, tile.army);
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
}

/**
 * Clears the attack preview (removes the red 'X').
 *
 * @this {import("../../sh.js").sh}
 */
export function clearAttackPreview() {
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
}

/**
 * Executes an attack from one tile to another.
 * Uses dice rolls to determine the outcome.
 *
 * @this {import("../../sh.js").sh}
 * @param {number} fromIndex - The index of the attacking tile.
 * @param {number} toIndex - The index of the defending tile.
 */
export async function executeAttack(fromIndex, toIndex) {
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
}
