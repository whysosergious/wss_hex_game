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
