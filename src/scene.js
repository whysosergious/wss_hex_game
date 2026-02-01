import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
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
  if (!tile || !tile.label?.material?.map) {
    console.warn("[sh] Tile", tileIndex, "not ready");
    return;
  }
  tile.army = value;

  const ctx = tile.ctx;
  const canvas = tile.canvas;

  // Clear and redraw with stroke
  ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.strokeText(value.toString(), 64, 32);
  ctx.fillText(value.toString(), 64, 32);

  tile.label.material.map.needsUpdate = true;
  console.log(`[sh] Tile ${tileIndex} army: ${value}`);
};

sh.setTileColor = function (tileIndex, hexColor) {
  const tile = this.state.tiles[tileIndex];
  if (!tile) {
    console.warn("[sh] Invalid tile index:", tileIndex);
    return;
  }

  // Update original color, then reapply current highlight state
  tile.mesh.userData.originalColor.setHex(hexColor);

  if (this.state.hoveredTile === tileIndex) {
    this._highlightTile(tile);
  } else if (this.state.selectedTile === tileIndex) {
    const selectColor = tile.mesh.userData.originalColor
      .clone()
      .multiplyScalar(1.8);
    selectColor.offsetHSL(0.1, 0, 0.2);
    tile.mesh.material.color.copy(selectColor);
    tile.mesh.material.emissive.setHex(0x664411);
  } else {
    this._resetTileHighlight(tile);
  }

  console.log(`[sh] Tile ${tileIndex} color: 0x${hexColor.toString(16)}`);
};

sh.moveTile = function (tileIndex, x = 0, y = 0, z = 0) {
  const tile = this.state.tiles[tileIndex];
  if (!tile) return;

  tile.group.position.x += x;
  tile.group.position.y += y;
  tile.group.position.z += z;

  console.log(`[sh] Moved tile ${tileIndex} by (${x}, ${y}, ${z})`);
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

sh._initTiles = function (qRadius = 1, rRadius = 1) {
  const size = this.config.tile.radius;
  const spacing = this.config.tile.spacing;

  const hexWidth = size * 2.0;
  const hexHeight = size * 1.732;
  const spacingX = hexWidth * 0.75 + spacing;
  const spacingZ = hexHeight * 0.5 + spacing;

  const positions = [];

  for (let q = -qRadius; q <= qRadius; q++) {
    for (
      let r = Math.max(-rRadius, -q - rRadius);
      r <= Math.min(rRadius, -q + rRadius);
      r++
    ) {
      const x = spacingX * q;
      const z = spacingZ * (r * 2 + q);
      positions.push({ pos: [x, z], q, r });
    }
  }

  positions.forEach(({ pos: [x, z], q, r }, index) => {
    this._createHexTile(x, z, q, r, index);
  });

  console.log(
    `[sh] Generated ${positions.length} tiles (q:${qRadius}, r:${rRadius})`,
  );
};

sh._createHexTile = function (x, z, q, r, index) {
  // CREATE GROUP FIRST
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData = { q, r, index };

  // Hex mesh
  const shape = new THREE.Shape();
  const radius = this.config.tile.radius;

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
  material.color.convertSRGBToLinear();

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = this.config.tile.depth / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Store originals on MESH
  mesh.userData.originalColor = material.color.clone();
  mesh.userData.originalEmissive = material.emissive.clone();
  mesh.userData.index = index;

  group.add(mesh);

  // Canvas + sprite
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0, 0, 0, 0)";
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = "white";
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 2;
  ctx.strokeText("0", 64, 32);
  ctx.fillText("0", 64, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0.95,
  });

  const label = new THREE.Sprite(spriteMaterial);
  label.scale.set(1.4, 0.7, 1);
  label.position.y = this.config.tile.depth + 1;
  label.userData.font = true;

  group.add(label);

  const tile = {
    group,
    mesh,
    canvas,
    ctx,
    label,
    army: 0,
    q,
    r,
  };

  this.state.scene.add(group);
  this.state.tiles.push(tile);
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

  // Mouse interaction setup
  this.state.raycaster = new THREE.Raycaster();
  this.state.mouse = new THREE.Vector2();
  this.state.hoveredTile = null;
  this.state.selectedTile = null;

  const rendererDom = this.state.renderer.domElement;

  const onMouseMove = (event) => {
    const rect = rendererDom.getBoundingClientRect();
    this.state.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.state.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this._updateHover();
  };

  const onMouseClick = (event) => {
    this._selectTile();
  };

  rendererDom.addEventListener("pointermove", onMouseMove);
  rendererDom.addEventListener("click", onMouseClick);
  rendererDom.style.cursor = "default";
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
      const right = new THREE.Vector3(1, 0, 0);
      const forward = new THREE.Vector3(0, 0, -1);

      right.applyQuaternion(cam.quaternion);
      forward.applyQuaternion(cam.quaternion);
      right.y = 0;
      forward.y = 0;
      right.normalize();
      forward.normalize();

      const offset = right
        .clone()
        .multiplyScalar(moveX * panSpeed * dt)
        .add(forward.clone().multiplyScalar(moveZ * panSpeed * dt));

      cam.position.add(offset);
      target.add(offset);
    }

    this.state.controls.update();
    this.state.renderer.render(this.state.scene, this.state.camera);
  };
  tick();
};

sh.resetScene = function () {
  if (!this.state.camera) return;

  const savedCamera = {
    position: this.state.camera.position.clone(),
    target: this.state.controls.target.clone(),
  };

  this.state.tiles.forEach((tile) => {
    this.state.scene.remove(tile.group);
  });
  this.state.tiles.length = 0;
  this.state.hoveredTile = null;
  this.state.selectedTile = null;

  this._initTiles();

  this.state.camera.position.copy(savedCamera.position);
  this.state.controls.target.copy(savedCamera.target);
  this.state.controls.update();

  console.log("[sh] Scene reset - camera preserved");
};

sh._updateHover = function () {
  const raycaster = this.state.raycaster;
  const mouse = this.state.mouse;
  const camera = this.state.camera;
  const tiles = this.state.tiles;
  const selectedTile = this.state.selectedTile;

  if (
    this.state.hoveredTile !== null &&
    this.state.hoveredTile !== selectedTile
  ) {
    const prevTile = tiles[this.state.hoveredTile];
    this._resetTileHighlight(prevTile);
  }

  this.state.hoveredTile = null;
  document.body.style.cursor = "default";

  raycaster.setFromCamera(mouse, camera);
  const tileMeshes = tiles.map((tile) => tile.mesh);
  const intersects = raycaster.intersectObjects(tileMeshes);

  if (intersects.length > 0) {
    const intersect = intersects[0];
    const tileIndex = intersect.object.userData.index;
    this.state.hoveredTile = tileIndex;

    if (tileIndex !== selectedTile) {
      const tile = tiles[tileIndex];
      this._highlightTile(tile);
      document.body.style.cursor = "pointer";
      console.log(`[sh] Hover tile ${tileIndex} (q:${tile.q}, r:${tile.r})`);
    }
  }
};

sh._highlightTile = function (tile) {
  if (!tile.mesh.userData.originalColor) {
    tile.mesh.userData.originalColor = tile.mesh.material.color.clone();
    tile.mesh.userData.originalEmissive = tile.mesh.material.emissive.clone();
  }

  const hoverColor = tile.mesh.userData.originalColor
    .clone()
    .multiplyScalar(1.3);
  tile.mesh.material.color.copy(hoverColor);
  tile.mesh.material.emissive.setHex(0x444444);
};

sh._resetTileHighlight = function (tile) {
  if (this.state.selectedTile === tile.mesh.userData.index) {
    const selectColor = tile.mesh.userData.originalColor
      .clone()
      .multiplyScalar(1.8);
    selectColor.offsetHSL(0.1, 0, 0.2);
    tile.mesh.material.color.copy(selectColor);
    tile.mesh.material.emissive.setHex(0x664411);
  } else {
    tile.mesh.material.color.copy(tile.mesh.userData.originalColor);
    tile.mesh.material.emissive.setHex(0x000000);
  }
};

sh._selectTile = function () {
  if (this.state.hoveredTile === null) return;

  const tileIndex = this.state.hoveredTile;

  if (this.state.selectedTile === tileIndex) {
    this.clearSelection();
    return;
  }

  if (this.state.selectedTile !== null) {
    const prevTile = this.state.tiles[this.state.selectedTile];
    prevTile.group.position.y = 0;
    prevTile.mesh.material.color.copy(prevTile.mesh.userData.originalColor);
    prevTile.mesh.material.emissive.setHex(0x000000);
  }

  const tile = this.state.tiles[tileIndex];
  const selectColor = tile.mesh.userData.originalColor
    .clone()
    .multiplyScalar(1.8);
  selectColor.offsetHSL(0.1, 0, 0.2);

  tile.mesh.material.color.copy(selectColor);
  tile.mesh.material.emissive.setHex(0x664411);

  // Move entire GROUP up
  tile.group.position.y += 0.05;

  this.state.selectedTile = tileIndex;
  console.log(
    `[sh] Selected tile ${tileIndex} (q:${tile.q}, r:${tile.r}, army:${tile.army})`,
  );
};

sh.getSelectedTile = function () {
  return this.state.selectedTile;
};

sh.clearSelection = function () {
  if (this.state.selectedTile !== null) {
    const tile = this.state.tiles[this.state.selectedTile];
    tile.mesh.material.color.copy(tile.mesh.userData.originalColor);
    tile.mesh.material.emissive.setHex(0x000000);
    tile.group.position.y = 0; // Reset group position
    this.state.selectedTile = null;
    console.log("[sh] Selection cleared");
  }
};

sh.resetScene();
