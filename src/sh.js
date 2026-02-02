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

/**
 * The global application object.
 * @namespace sh
 * @property {import("./config.js").AppConfig} config - Application configuration settings.
 * @property {import("./state.js").AppState} state - Current application state.
 * @property {function(): void} init - Initializes the application.
 * @property {function(): void} _initScene - Internal function to initialize the Three.js scene.
 * @property {function(): void} _initCamera - Internal function to initialize the Three.js camera.
 * @property {function(number=, number=): void} _initTiles - Internal function to initialize hexagonal tiles.
 * @property {function(number, number, number, number, number): void} _createHexTile - Internal function to create a single hexagonal tile.
 * @property {function(): void} _startRenderLoop - Internal function to start the Three.js render loop.
 * @property {function(): void} _initControls - Internal function to initialize user controls (OrbitControls, keyboard/mouse events).
 * @property {function(): void} _updateHover - Internal function to update tile hover state based on mouse position.
 * @property {function(import("./state.js").TileData): void} _highlightTile - Internal function to apply visual highlight to a tile.
 * @property {function(import("./state.js").TileData): void} _resetTileHighlight - Internal function to reset a tile's visual highlight.
 * @property {function(): void} _selectTile - Internal function to handle tile selection on click.
 * @property {function(number, number): void} setArmyStrength - Sets the army strength for a given tile.
 * @property {function(number, number): void} setTileColor - Sets the color of a given tile.
 * @property {function(number, number=, number=, number=): void} moveTile - Moves a tile by the specified offsets.
 * @property {function(number, number): boolean} selectTileByCoords - Selects a tile by its q, r coordinates.
 * @property {function(number, number): (number|undefined)} getTileIndex - Gets the index of a tile by its q, r coordinates.
 * @property {function(number, number): (import("./state.js").TileData|null)} getTileByCoords - Gets tile data by its q, r coordinates.
 * @property {function(number=, number=): void} resetScene - Resets the game scene, reinitializing tiles.
 * @property {function(): (number|null)} getSelectedTile - Gets the index of the currently selected tile.
 * @property {function(): void} clearSelection - Clears the current tile selection.
 * @property {Object} debug - Debugging utilities.
 * @property {function(): void} debug.printState - Prints the state of all tiles to the console.
 * @property {function(): void} debug.printTileMap - Prints the tile map to the console.
 */
export const sh = {
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
};

globalThis.sh = sh;
export default sh;
