import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import sh from "./sh.js";
import "./api.js";

/**
 * initialize scene
 **/
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

/**
 * @param qRadius {number} hex number of col
 * @param rRadius {number} hex number of rows
 * */
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

  const key = `${q}_${r}`;
  this.state.tileMap.set(key, index);
  console.log(`[sh] Registered tile [${q},${r}] → ${index}`);
};

sh.resetScene(3, 3);
sh.setArmyStrength(sh.getTileIndex(0, 0), 5);
