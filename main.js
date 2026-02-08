import sh from "./src/sh.js";

import "./src/ui/statusbar.js";
import "./src/ui/editor_tools.js";
import Menu from "./src/ui/menu.js";

console.log("init");

sh.init();

sh.ui.menu = new Menu(sh);
