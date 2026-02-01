export const sh = {
  config: {
    tile: {
      spacing: 0.02,
      radius: 1.0,
      depth: 0.2,
      color: 0x888888,
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
  },

  state: {
    initialized: false,
    scene: null,
    camera: null,
    renderer: null,
    tiles: [],
    controls: null,
    keys: { w: false, a: false, s: false, d: false },
  },
};

globalThis.sh = sh;
export default sh;
