import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import sh from "./sh.js";

sh.init = function () {
  if (this.state.initialized) return;
  this._initScene();
  this._initTiles();
  this._initCamera();
  this._initControls();
  this._startRenderLoop();
  this.state.initialized = true;
  console.log("[sh] Initialized 7-tile hex demo");
};

sh.setArmyStrength = function (tileIndex, value) {
  const tile = this.state.tiles[tileIndex];
  if (!tile || !tile.label?.userData?.font) {
    console.warn("[sh] Tile", tileIndex, "not ready");
    return;
  }
  tile.army = value;

  tile.label.geometry.dispose();
  tile.label.geometry = new TextGeometry(value.toString(), {
    font: tile.label.userData.font,
    size: 0.5,
    depth: 0.05,
  });
  tile.label.geometry.computeBoundingBox();
  const box = tile.label.geometry.boundingBox;
  tile.label.position.x = tile.mesh.position.x - (box.max.x - box.min.x) / 2;

  // const intensity = Math.min(1, value / 10);
  // const color = new THREE.Color().setHSL(0.25 - intensity * 0.15, 0.7, 0.5);
  // tile.mesh.material.color.setHex(0x333333);

  console.log(`[sh] Tile ${tileIndex} army: ${value}`);
};

sh.setTileColor = function (tileIndex, hexColor) {
  const tile = this.state.tiles[tileIndex];
  if (!tile) {
    console.warn("[sh] Invalid tile index:", tileIndex);
    return;
  }

  tile.mesh.material.color.setHex(hexColor);
  console.log(`[sh] Tile ${tileIndex} color: 0x${hexColor.toString(16)}`);
};

sh.debug = {
  printState() {
    console.table(
      this.state.tiles.map((t, i) => ({
        id: i,
        q: t.q,
        r: t.r,
        army: t.army,
      })),
    );
  },
};

sh._initScene = function () {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambient);
  const directional = new THREE.DirectionalLight(0xffffff, 0.8);
  directional.position.set(5, 10, 5);
  directional.castShadow = true;
  scene.add(directional);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshLambertMaterial({ color: 0x333333 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  this.state.scene = scene;
  this.state.renderer = renderer;

  window.addEventListener("resize", () => {
    const { innerWidth, innerHeight } = window;
    this.state.camera.aspect = innerWidth / innerHeight;
    this.state.camera.updateProjectionMatrix();
    this.state.renderer.setSize(innerWidth, innerHeight);
  });
};

const loader = new FontLoader();
const fontUrl =
  "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/fonts/helvetiker_bold.typeface.json";

sh._initTiles = function (qRadius = 1, rRadius = 1) {
  const size = this.config.tile.radius;
  const spacing = this.config.tile.spacing;

  // EXACT spacing (no magic numbers)
  const hexWidth = size * 2.0; // 2.0
  const hexHeight = size * 1.732; // √3
  const spacingX = hexWidth * 0.75 + spacing; // 1.5  - horizontal center-to-center
  const spacingZ = hexHeight * 0.5 + spacing; // 0.866 - vertical center-to-center

  const positions = [];

  // Generate all tiles in q,r radius
  for (let q = -qRadius; q <= qRadius; q++) {
    for (
      let r = Math.max(-rRadius, -q - rRadius);
      r <= Math.min(rRadius, -q + rRadius);
      r++
    ) {
      // EXACT axial-to-world conversion
      const x = spacingX * q;
      const z = spacingZ * (r * 2 + q);

      positions.push({ pos: [x, z], q, r });
    }
  }

  positions.forEach(({ pos: [x, z], q, r }, index) => {
    this._createHexTile(x, z, q, r, index, loader, fontUrl);
  });

  console.log(
    `[sh] Generated ${positions.length} tiles (q:${qRadius}, r:${rRadius})`,
  );
};

sh._createHexTile = function (x, z, q, r, index, loader, fontUrl) {
  const shape = new THREE.Shape();
  const radius = this.config.tile.radius;

  // Flat-top hex
  shape.moveTo(radius, 0);
  shape.lineTo(radius * 0.5, radius * 0.866);
  shape.lineTo(-radius * 0.5, radius * 0.866);
  shape.lineTo(-radius, 0);
  shape.lineTo(-radius * 0.5, -radius * 0.866);
  shape.lineTo(radius * 0.5, -radius * 0.866);
  shape.lineTo(radius, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: this.config.tile.depth,
    bevelEnabled: false,
  });

  const material = new THREE.MeshLambertMaterial({
    color: this.config.tile.color,
  });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, this.config.tile.depth / 2, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { q, r, index };

  this.state.scene.add(mesh);

  const labelMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  );
  labelMesh.position.set(x, this.config.tile.depth + 0.4, z);
  labelMesh.visible = false;
  this.state.scene.add(labelMesh);

  this.state.tiles.push({ mesh, label: labelMesh, army: 0, q, r });

  loader.load(fontUrl, (font) => {
    labelMesh.geometry.dispose();
    const textGeom = new TextGeometry("0", { font, size: 0.5, depth: 0.05 });
    textGeom.computeBoundingBox();
    const box = textGeom.boundingBox;

    labelMesh.geometry = textGeom;
    labelMesh.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    labelMesh.position.set(
      x - (box.max.x - box.min.x) / 2,
      this.config.tile.depth + 0.4,
      z,
    );
    labelMesh.userData.font = font;
    labelMesh.visible = true;

    this.setArmyStrength(index, 0);
  });
};

sh._initCamera = function () {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.set(...this.config.camera.position);
  this.state.camera = camera;
  this.state.scene.add(camera);
};

sh._initControls = function () {
  const controls = new OrbitControls(
    this.state.camera,
    this.state.renderer.domElement,
  );
  controls.target.set(...this.config.camera.target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = this.config.camera.zoomMin;
  controls.maxDistance = this.config.camera.zoomMax;
  controls.maxPolarAngle = Math.PI / 2.1;
  controls.enablePan = false;

  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
  controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;

  this.state.controls = controls;

  const onKeyDown = (e) => {
    this.state.keys[e.key] = true;
  };
  const onKeyUp = (e) => {
    this.state.keys[e.key] = false;
  };
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
};

sh._startRenderLoop = function () {
  const panSpeed = this.config.controls.strafeSpeed;

  const tick = () => {
    requestAnimationFrame(tick);

    const dt = 0.016;
    const cam = this.state.camera;
    const target = this.state.controls.target;

    const moveX = (this.state.keys.d ? 1 : 0) - (this.state.keys.a ? 1 : 0);
    const moveZ = (this.state.keys.w ? 1 : 0) - (this.state.keys.s ? 1 : 0);

    if (moveX !== 0 || moveZ !== 0) {
      // CAMERA-RELATIVE directions
      const right = new THREE.Vector3(1, 0, 0); // camera right
      const forward = new THREE.Vector3(0, 0, -1); // camera forward

      right.applyQuaternion(cam.quaternion);
      forward.applyQuaternion(cam.quaternion);
      right.y = 0;
      forward.y = 0;
      right.normalize();
      forward.normalize();

      // Strafe relative to camera orientation
      const offset = right
        .clone()
        .multiplyScalar(moveX * panSpeed * dt)
        .add(forward.clone().multiplyScalar(moveZ * panSpeed * dt));

      cam.position.add(offset);
      target.add(offset); // Keep relative distance
    }

    this.state.controls.update();
    this.state.renderer.render(this.state.scene, this.state.camera);
  };
  tick();
};

sh.resetScene = function () {
  if (!this.state.camera) return;
  // Store camera state BEFORE clearing
  const savedCamera = {
    position: this.state.camera.position.clone(),
    target: this.state.controls.target.clone(),
  };

  // Clear existing tiles and labels
  this.state.tiles.forEach((tile) => {
    this.state.scene.remove(tile.mesh);
    this.state.scene.remove(tile.label);
    tile.mesh.geometry.dispose();
    tile.label.geometry.dispose();
  });
  this.state.tiles.length = 0;

  // Recreate tiles (same positions as init)
  this._initTiles();

  // Restore camera state
  this.state.camera.position.copy(savedCamera.position);
  this.state.controls.target.copy(savedCamera.target);
  this.state.controls.update();

  console.log(this.state);
  console.log("[sh] Scene reset - camera preserved");
};

sh.resetScene();
