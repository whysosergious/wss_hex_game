# Hex-Wars: A Turn-Based Hexagonal Strategy Game

## Project Overview
Hex-Wars is a web-based, turn-based hexagonal strategy game built with vanilla JavaScript and the Three.js library. It offers a 3D environment where players command armies on a hex grid. The game incorporates core mechanics such as army movement, tile-based combat, territory capture, and a turn/round system with reinforcements.

## Features
*   **Dynamic Hexagonal Maps:** Procedural generation of hexagonal tile maps.
*   **Turn-Based Gameplay:** Player-specific actions within a structured turn and round system.
*   **Army Management:** Systems for army movement based on strength, and reinforcement distribution.
*   **Dice-Based Combat:** Tactical combat resolution between adjacent territories.
*   **Territory Control:** Players capture and control tiles, visually represented by player-specific coloring.
*   **User Interface:** An in-game status bar displays critical game state information (turn, active player, actions).
*   **Pathfinding & Previews:** Guidance for players with movement pathfinding and visual previews.
*   **Map Editor:** An in-game tool to create, save, load, and edit custom maps.
*   **Game State Persistence:** Automatic saving and loading of game progress.

## Technology Stack
*   **Frontend Language:** Vanilla JavaScript (ES Modules)
*   **3D Rendering:** Three.js
*   **Camera Controls:** OrbitControls for intuitive camera manipulation.
*   **Type Annotation:** JSDoc for improved code clarity and maintainability.

## Architecture
The project adheres to a modular architecture, organizing core functionalities into distinct directories and files. The global `sh` object acts as the central API and state manager, consolidating application configurations, dynamic state, and various functional modules.

*   `src/config.js`: Defines application-wide configuration settings.
*   `src/state.js`: Manages the dynamic state of the application, including Three.js objects, tile data, and game state.
*   `src/init.js`: Contains the primary application initialization logic.
*   `src/scene/`: Manages Three.js-related aspects such as scene setup, tile creation, and rendering.
*   `src/interaction/`: Handles user input, including camera controls and mouse-based tile selection.
*   `src/game/`: Houses the main game logic, now further modularized into:
    *   `api.js`: General game API functions.
    *   `utils_hex.js`: Hexagonal grid math utilities.
    *   `player_manager.js`: Player-specific logic and tile ownership.
    *   `movement_manager.js`: Army movement, pathfinding, and previews.
    *   `combat_manager.js`: Attack resolution and combat previews.
    *   `turn_manager.js`: Turn, action, and round management.
    *   `editor_manager.js`: Map editor functionalities and map persistence.
    *   `state_manager.js`: Game state saving and loading.
*   `src/ui/`: Contains user interface components like the status bar, menus, and editor tools.

## Getting Started

This project is a client-side application and does not require a separate build step or backend server for basic operation.

1.  **Open `index.html`:** Simply open the `index.html` file in any modern web browser.
2.  **Interact:**
    *   **Pan Camera:** Use `WASD` keys.
    *   **Orbit Camera:** Click and drag the left mouse button.
    *   **Zoom Camera:** Use the mouse wheel.
    *   **Select Tiles:** Click on a hexagonal tile to view movement options or initiate attacks.
3.  **Developer Console:** Utilize your browser's developer console (usually `F12`) to access game state logs and debug information.

## Development Conventions
*   **Modular JavaScript:** Code is organized into ES modules with clear responsibilities, centrally managed by the `sh` object.
*   **JSDoc Typing:** Comprehensive JSDoc comments are used for type annotations across the codebase to enhance clarity and maintainability.
*   **Global `sh` Object:** A singular global `sh` object provides access to the application's API and state, serving as the central hub for all functionalities.
*   **Relative Imports:** All module imports use relative paths (e.g., `./module.js`, `../another_module.js`) to ensure compatibility with GitHub Pages and other static hosting environments.
