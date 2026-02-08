/**
 * @fileoverview
 * Logic for managing game turns, rounds, and actions.
 */

/**
 * Consumes an action point for the current turn.
 * If no actions remain, it ends the turn.
 * Also triggers an auto-save.
 *
 * @this {import("../../sh.js").sh}
 */
export function consumeAction() {
  this.state.turnState.actionNumber++;
  if (this.state.turnState.actionsRemaining <= 0) {
    this.state.turnState.actionNumber = 1;
    this.endTurn(); // Just ends CURRENT player's turn
  }
  sh.ui.statusbar.update();
  this.saveGameState(); // Auto-save
  console.log("Action taken");
}

/**
 * Ends the current player's turn.
 * If all players have taken their turns, it ends the round.
 * Advances to the next player otherwise.
 * Triggers an auto-save.
 *
 * @this {import("../../sh.js").sh}
 */
export function endTurn() {
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
}

/**
 * Advances the global turn counter (legacy function, might be redundant with endTurn logic).
 * Increments active player cyclically.
 *
 * @this {import("../../sh.js").sh}
 */
export function nextTurn() {
  this.state.turnState.activePlayer =
    (this.state.turnState.activePlayer % 6) + 1;
  this.state.turnState.turnNumber++;

  console.log(
    `[sh] Turn ${this.state.turnState.turnNumber}: Player ${this.getActivePlayer()}`,
  );

  this.ui.statusbar.update();
}

/**
 * Ends the current round.
 * Distributes reinforcements to all players.
 * Resets the turn order to player 1.
 *
 * @this {import("../../sh.js").sh}
 */
export function endRound() {
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
}
