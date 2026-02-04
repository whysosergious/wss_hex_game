# Project Overview

This project is a web-based, turn-based hexagonal strategy game built with vanilla JavaScript and the Three.js library. It provides a 3D environment where players control armies on a hex grid. Core mechanics include army movement, tile-based combat, territory capture, and a turn/round system with reinforcements.

**Frontend:**
*   **Language:** Vanilla JavaScript (with JSDoc for type annotations)
*   **3D Rendering:** Three.js
*   **Camera Controls:** OrbitControls for camera interaction.
*   **Core Features:**
    *   Dynamic generation of hexagonal tile maps.
    *   Turn-based gameplay with player-specific actions.
    *   Army movement system based on army strength.
    *   Dice-based combat resolution between adjacent tiles.
    *   Territory control and player-specific tile coloring.
    *   UI status bar for displaying game state (turn, player, actions).
    *   Pathfinding and movement previews for player guidance.

**Architecture:**
The project follows a modular structure, where core functionalities are grouped into dedicated directories and files. A central `sh.js` object serves as the global API and state manager, aggregating configurations, application state, and various functional modules.

*   `src/config.js`: Defines application-wide configuration settings.
*   `src/state.js`: Manages the dynamic state of the application (Three.js objects, tile data, game state).
*   `src/init.js`: Contains the main application initialization logic.
*   `src/scene/`: Houses Three.js related functionalities (scene setup, tile creation, rendering).
*   `src/interaction/`: Handles user input (camera controls, mouse-based tile selection).
*   `src/game/`: Contains high-level game API functions.
*   `src/new.js`: A key file containing a significant amount of core gameplay logic, including hex grid calculations, pathfinding, player management, movement, and combat systems.

# Building and Running

This project does not require a separate build step.

1.  **Open `index.html`:** Simply open the `index.html` file in a modern web browser.
2.  **Interact:**
    *   **Pan Camera:** Use `WASD` keys.
    *   **Orbit Camera:** Click and drag the left mouse button.
    *   **Zoom Camera:** Use the mouse wheel.
    *   **Select Tiles:** Click on a hexagonal tile to see movement options or initiate attacks.
3.  **Developer Console:** Open your browser's developer console (usually `F12`) to see game state logs and debug information.

# Development Conventions

*   **Modular JavaScript:** Code is organized into modules with clear responsibilities, aggregated by the central `sh.js` object.
*   **JSDoc Typing:** JSDoc comments are used for type annotations to improve code clarity and maintainability.
*   **Global `sh` Object:** A single global object `sh` exposes the application's API and state, providing a convenient access point for all functionalities.
*   **Working File for Future Development:** The file `src/new.js` currently houses a large collection of core game logic. It is considered the primary "working" file. Future development should focus on refactoring this file by adding proper JSDoc types, organizing functions, and potentially splitting its logic into more granular modules.
*   **Internal Functions:** Functions prefixed with an underscore (e.g., `_selectTile`) are considered internal to the `sh` object's implementation.