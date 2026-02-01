# Project Overview

This project is a web-based interactive 3D application, likely a game or a simulation, built with vanilla JavaScript and the Three.js library. It features a hexagonal tile-based scene, camera controls, and basic user interaction for tile selection and manipulation.

**Frontend:**
*   **Language:** Vanilla JavaScript (with JSDoc for type annotations)
*   **Frameworks:** Three.js (for 3D rendering), OrbitControls (for camera interaction)
*   **Features:**
    *   Hexagonal tile grid generation.
    *   Dynamic tile army strength display via canvas textures.
    *   Camera control (pan with WASD, orbit with left-drag, zoom with wheel).
    *   Mouse interaction for hovering over and selecting individual tiles.
    *   API for programmatic tile manipulation (e.g., setting army strength, color, movement).

**Architecture:**
The project follows a modular structure, where core functionalities are grouped into dedicated directories and files. A central `sh.js` object serves as the global API and state manager, aggregating configurations, application state, and various functional modules.

*   `src/config.js`: Defines application-wide configuration settings (tile properties, camera parameters, control speeds).
*   `src/state.js`: Manages the dynamic state of the application (initialized status, Three.js objects like scene, camera, renderer, tile data, control instances, keyboard input, mouse state, hovered/selected tiles, and a tile map).
*   `src/init.js`: Contains the main application initialization logic.
*   `src/scene/`: Houses Three.js related functionalities.
    *   `core.js`: Responsible for initializing the Three.js scene, renderer, lighting, and camera.
    *   `tiles.js`: Handles the generation and creation of hexagonal 3D tiles.
    *   `render_loop.js`: Manages the main animation loop, including camera movement based on user input and scene rendering.
*   `src/interaction/`: Deals with user input and interaction.
    *   `controls.js`: Sets up `OrbitControls` for camera manipulation and registers keyboard and mouse event listeners.
    *   `mouse.js`: Implements logic for mouse-based tile hovering, highlighting, and selection using Three.js Raycasting.
*   `src/game/`: Contains game-specific API functions.
    *   `api.js`: Provides functions to interact with game elements like setting tile army strength, changing tile colors, moving tiles, selecting tiles by coordinates, and debugging utilities.

# Building and Running

## Compiling and Running the Project

This project does not require a separate build step for its JavaScript frontend beyond what a modern browser can handle directly.

1.  **Open `index.html`:** Simply open the `index.html` file in any modern web browser (e.g., Chrome, Firefox, Edge).
2.  **Interact:**
    *   **Pan Camera:** Use `WASD` keys.
    *   **Orbit Camera:** Click and drag the left mouse button.
    *   **Zoom Camera:** Use the mouse wheel.
    *   **Select Tiles:** Click on a hexagonal tile.
3.  **Developer Console:** For debugging and to observe application logs (e.g., tile generation, tile selections), open your browser's developer console (usually by pressing `F12`).

# Development Conventions

*   **Modular JavaScript:** Code is organized into modules with clear responsibilities, imported and aggregated by a central `sh.js` file.
*   **JSDoc Typing:** All JavaScript code utilizes JSDoc comments for type annotations, improving code readability, maintainability, and enabling better tooling support.
*   **Three.js:** The project heavily relies on the Three.js library for all 3D rendering aspects.
*   **Global `sh` Object:** A single global object `sh` is used to expose the application's API and state, providing a convenient access point for all functionalities.
*   **Internal Functions:** Functions prefixed with an underscore (e.g., `_initScene`) are considered internal to the `sh` object's implementation and are not part of the public API.
