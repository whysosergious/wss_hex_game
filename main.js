import sh from "./src/sh.js";

import "./src/new.js";

console.log("init");

document.addEventListener("DOMContentLoaded", () => {
  sh.init();
  // sh.setArmyStrength(0, 0); // Test API

  // Test console commands
  console.log("Test commands:");
  console.log("- sh.setArmyStrength(5)");
  console.log("- sh.debug.printState()");
  console.log("- WASD to pan, left-drag to orbit, wheel to zoom");
});

