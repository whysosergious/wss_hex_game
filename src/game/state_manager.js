/**
 * @fileoverview
 * Logic for auto-saving and loading the game state from local storage.
 */

/**
 * Saves the current game state (turns, players, tiles) to local storage.
 * This function is typically called after every action or turn change.
 *
 * @this {import("../../sh.js").sh}
 */
export function saveGameState() {
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
}

/**
 * Loads the saved game state from local storage and restores the game.
 *
 * @this {import("../../sh.js").sh}
 * @returns {boolean} True if a saved game was found and loaded, false otherwise.
 */
export function loadGameState() {
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
}
