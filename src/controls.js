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
