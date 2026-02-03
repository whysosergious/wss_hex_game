import * as THREE from "three";

/**
 * @typedef {Object} TileData
 * @property {THREE.Group} group - The Three.js group containing the tile mesh and label.
 * @property {THREE.Mesh} mesh - The Three.js mesh representing the tile.
 * @property {HTMLCanvasElement} canvas - The HTML canvas element used for the tile label.
 * @property {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
 * @property {THREE.Sprite} label - The Three.js sprite displaying the tile's text (e.g., army strength).
 * @property {number} army - The army strength on the tile.
 * @property {number} q - The 'q' axial coordinate of the tile.
 * @property {number} r - The 'r' axial coordinate of the tile.
 */

/**
 * @typedef {Object} AppState
 * @property {boolean} initialized - Indicates if the application has been initialized.
 * @property {THREE.Scene | null} scene - The Three.js scene.
 * @property {THREE.PerspectiveCamera | null} camera - The Three.js camera.
 * @property {THREE.WebGLRenderer | null} renderer - The Three.js renderer.
 * @property {TileData[]} tiles - An array of tile data objects.
 * @property {import("three/examples/jsm/controls/OrbitControls").OrbitControls | null} controls - The Three.js OrbitControls instance.
 * @property {Object.<string, boolean>} keys - An object tracking the state of keyboard keys (pressed/not pressed).
 * @property {THREE.Raycaster | null} raycaster - The Three.js Raycaster for mouse interaction.
 * @property {THREE.Vector2 | null} mouse - The normalized 2D coordinates of the mouse.
 * @property {number | null} hoveredTile - The index of the currently hovered tile, or null if no tile is hovered.
 * @property {number | null} selectedTile - The index of the currently selected tile, or null if no tile is selected.
 * @property {Map<string, number>} tileMap - A map from "q_r" string coordinates to tile indices.
 */

/** @type {AppState} */
export const state = {
  initialized: false,
  scene: null,
  camera: null,
  renderer: null,
  tiles: [],
  controls: null,
  keys: {},
  raycaster: null,
  mouse: null,
  hoveredTile: null,
  selectedTile: null,
  tileMap: new Map(),
  // UNTYPED
  isOrbiting: false,
  orbitDragThreshold: 5,
  currentPlayer: 1, // Active player (1-6)
  movementMode: false,
  movementPreview: [],
  reachableTiles: [],
  highlightPriority: 0,
  turnState: {
    activePlayer: 1, // Current turn player
    turnNumber: 1,
  },
  players: {
    0: { color: 0x333333, name: "__BLOCKED__", tiles: new Set() }, // Blue
    1: { color: 0x1f77b4, name: "Player 1", tiles: new Set() }, // Blue
    2: { color: 0xff7f0e, name: "Player 2", tiles: new Set() }, // Orange
    3: { color: 0x2ca02c, name: "Player 3", tiles: new Set() }, // Green
    4: { color: 0xd62728, name: "Player 4", tiles: new Set() }, // Red
    5: { color: 0x9467bd, name: "Player 5", tiles: new Set() }, // Purple
    6: { color: 0x8c564b, name: "Player 6", tiles: new Set() }, // Brown
  },
  armyDeltas: new Map(),
  previewDeltas: new Map(),
  turnState: {
    activePlayer: 1,
    actionNumber: 1,
    turnNumber: 1,
    roundNumber: 1,
    get actionsRemaining() {
      return sh.config.actionsPerTurn - this.actionNumber + 1;
    },
    get turnsRemaining() {
      return (
        sh.config.turnsPerRound * sh.config.playerCount - this.turnNumber + 1
      );
    },
    get roundsRemaining() {
      if (sh.config.roundsPerGame === 0) return 1;
      return sh.config.roundsPerGame - this.roundNumber + 1;
    },
  },
  attack: {
    possible: false,
    offence: { index: null, army: null },
    defence: { index: null, army: null },
  },
  attackPreviewTile: null,
  attackPreview: {
    active: false,
    sourceIndex: null,
    targetIndex: null,
    lastReachableIndex: null,
    canvas: null,
    ctx: null,
  },
};
