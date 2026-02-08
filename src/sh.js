/**
 * @fileoverview
 * This file defines the global `sh` object, which serves as the main API and state manager for the application.
 * It aggregates configurations, application state, initialization routines, scene management,
 * user interaction handlers, and game-specific API functions from various modules.
 */

import { config } from "./config.js";
import { state } from "./state.js";
import { init } from "./init.js";
import { _initScene, _initCamera } from "./scene/core.js";
import { _initTiles, _createHexTile } from "./scene/tiles.js";
import { _startRenderLoop } from "./scene/render_loop.js";
import { _initControls } from "./interaction/controls.js";
import {
  _updateHover,
  _highlightTile,
  _resetTileHighlight,
  _selectTile,
} from "./interaction/mouse.js";
import {
  setArmyStrength,
  setTileColor,
  moveTile,
  selectTileByCoords,
  getTileIndex,
  getTileByCoords,
  resetScene,
  getSelectedTile,
  clearSelection,
  debug,
} from "./game/api.js";
import { _initDiceRoller } from "./dice.js";
import Modal from "./ui/modal.js";

// Game Logic Modules
import {
  hexDistance,
  hexNeighbors,
  findHexPath,
} from "./game/utils_hex.js";
import {
  assignTileToPlayer,
  getPlayerTiles,
  assignAllTilesToPlayer,
  getActivePlayer,
  getActivePlayerData,
  initPlayers,
  nextPlayer,
} from "./game/player_manager.js";
import {
  setMovementMode,
  toggleMovementMode,
  clearMovementPreview,
  updateMovementPreview,
  _setArmyPreview,
  executeMovement,
  updateReachableTiles,
  clearReachableTiles,
} from "./game/movement_manager.js";
import {
  updateAttackPreview,
  showAttackX,
  clearAttackPreview,
  executeAttack,
} from "./game/combat_manager.js";
import {
  consumeAction,
  endTurn,
  nextTurn,
  endRound,
} from "./game/turn_manager.js";
import {
  applyBrush,
  enterMapEditor,
  exitMapEditor,
  saveMap,
  getMapList,
  deleteMap,
  loadMap,
} from "./game/editor_manager.js";
import {
  saveGameState,
  loadGameState,
} from "./game/state_manager.js";

/**
 * The global application object.
 * @namespace sh
 */
export const sh = {
  ui: {
    jsonModal: null, // Initialize jsonModal as null
  },
  config,
  state,
  init,
  _initScene,
  _initCamera,
  _initTiles,
  _createHexTile,
  _startRenderLoop,
  _initControls,
  _updateHover,
  _highlightTile,
  _resetTileHighlight,
  _selectTile,
  setArmyStrength,
  setTileColor,
  moveTile,
  selectTileByCoords,
  getTileIndex,
  getTileByCoords,
  resetScene,
  getSelectedTile,
  clearSelection,
  _initDiceRoller,
  debug: debug,

  // Hex Utils
  hexDistance,
  hexNeighbors,
  findHexPath,

  // Player Manager
  assignTileToPlayer,
  getPlayerTiles,
  assignAllTilesToPlayer,
  getActivePlayer,
  getActivePlayerData,
  initPlayers,
  nextPlayer,

  // Movement Manager
  setMovementMode,
  toggleMovementMode,
  clearMovementPreview,
  updateMovementPreview,
  _setArmyPreview,
  executeMovement,
  updateReachableTiles,
  clearReachableTiles,

  // Combat Manager
  updateAttackPreview,
  showAttackX,
  clearAttackPreview,
  executeAttack,

  // Turn Manager
  consumeAction,
  endTurn,
  nextTurn,
  endRound,

  // Editor Manager
  applyBrush,
  enterMapEditor,
  exitMapEditor,
  saveMap,
  getMapList,
  deleteMap,
  loadMap,

  // State Manager
  saveGameState,
  loadGameState,
};

globalThis.sh = sh;
export default sh;