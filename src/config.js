/**
 * @typedef {Object} TileConfig
 * @property {number} spacing - The spacing between tiles.
 * @property {number} radius - The radius of the hexagonal tiles.
 * @property {number} depth - The depth of the hexagonal tiles.
 * @property {number} color - The color of the tiles in hexadecimal format.
 */

/**
 * @typedef {Object} CameraConfig
 * @property {number[]} position - The initial [x, y, z] position of the camera.
 * @property {number[]} target - The initial [x, y, z] target of the camera.
 * @property {number} zoomMin - The minimum zoom level for the camera.
 * @property {number} zoomMax - The maximum zoom level for the camera.
 */

/**
 * @typedef {Object} ControlsConfig
 * @property {number} strafeSpeed - The strafing speed for camera movement.
 */

/**
 * @typedef {Object} AppConfig
 * @property {TileConfig} tile - Configuration related to tiles.
 * @property {CameraConfig} camera - Configuration related to the camera.
 * @property {ControlsConfig} controls - Configuration related to controls.
 */

/** @type {AppConfig} */
export const config = {
  actionsPerTurn: 3, // Moves/attacks per turn
  turnsPerRound: 1,
  roundsPerGame: 0, // 0 = unlimited
  reinforcementsPerTurn: 1,
  playerCount: 2,
  maxPlayerCount: 6,
  maxArmyStrength: 10, // 0 no limit
  tile: {
    spacing: 0.04,
    radius: 1.0,
    depth: 0.2,
    color: 0x999999,
    showEmptyLabel: false,
  },
  camera: {
    position: [0, 10, 10],
    target: [0, 0, 0],
    zoomMin: 2,
    zoomMax: 50,
  },
  controls: {
    strafeSpeed: 5.0,
  },
};
