import { h, html } from "../lib/el.js";

// status-bar.js - PROFESSIONAL STATUS BAR
class StatusBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.mode = "game"; // 'game' or 'editor'
  }

  connectedCallback() {
    sh.ui = sh.ui || {};
    sh.ui.statusbar = this;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: #111;
          height: 40px;
          padding: 0px 10px !important;
          border-radius: 3px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro', sans-serif;
          font-size: 14px;
          color: #e0e0e0;
          font-weight: 500;
          border: 1px solid #2a2a2a;
          box-shadow: 0 2px 16px rgba(0,0,0,0.5);
          z-index: 1000;
          backdrop-filter: blur(8px);
          max-width: 95vw;
        }

        #menu-button {
            width: 16px; 
            height: 16px; 
            display: flex;
            flex-direction: column;
            justify-content: space-around;
            cursor: pointer;
            padding: 6px;
            border-radius: 3px;
            margin-right: 5px;
        }
        #menu-button:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        #menu-button .line {
            width: 100%;
            height: 2px;
            background: #999999;
            border-radius: 1px;
        }
        
        /* Game Controls */
        #game-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            overflow: hidden;
        }

        .players {
          display: flex;
          gap: 8px;
          flex: 1;
          overflow: hidden;
        }
        
        .player {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0px 12px;
          border-radius: 3px;
          height: 28px;
          font-size: 13px;
          white-space: nowrap;
        }
        
        .player.active {
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,170,120,0.2);
          border-color: rgba(0,170,120,0.5);
          box-shadow: 0 0 6px rgba(0,170,120,0.3);
        }
        
        .color-dot {
          width: 10px;
          height: 10px;
          border-radius: 1px;
          flex-shrink: 0;
        }
        
        .player-num {
          font-weight: 600;
          min-width: 18px;
        }
        
        .strength {
          font-weight: 600;
          color: #fff;
          font-size: 14px;
          margin-left: 4px;
        }
        
        .turns, .action-btn {
          padding: 6px 12px;
          font-size: 13px;
          color: #888;
          white-space: nowrap;
        }
        
        .action-btn {
          background: rgba(0,0,0,0.4);
          border-radius: 3px;
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
          color: #ccc;
        }
        .action-btn:hover {
            background: rgba(255,255,255,0.1);
            color: #fff;
        }

        /* Editor Controls */
        #editor-controls {
            display: none;
            align-items: center;
            gap: 8px;
            flex: 1;
        }
        
        input {
            background: #222;
            border: 1px solid #444;
            color: white;
            padding: 4px 8px;
            border-radius: 3px;
            width: 100px;
        }

        @media (max-width: 768px) {
            :host {
                /* Layout Wrapper: Invisible & Click-through */
                top: 10px;
                left: 10px;
                right: auto;
                bottom: auto;
                transform: none;
                
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
                backdrop-filter: none !important;
                
                flex-direction: column;
                align-items: flex-start; /* Do not stretch children */
                padding: 0 !important;
                width: fit-content;
                height: auto;
                gap: 10px;
                pointer-events: none; /* Critical: allows clicking map around buttons */
            }

            /* 1. Menu Button: Separate "Island" at top-left */
            #menu-button {
                position: relative;
                display: flex;
                flex-direction: column;
                justify-content: space-around;
                width: 32px;
                height: 32px;
                padding: 7px;
                margin: 0;
                
                background: rgba(20, 20, 20, 0.6); /* Visible contrast */
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                
                pointer-events: auto; /* Re-enable clicks */
                cursor: pointer;
                backdrop-filter: blur(4px);
            }
            #menu-button .line {
                background: #eee;
                height: 2px;
                width: 100%;
            }

            /* 2. Main Status Panel: Players + Actions + End Turn */
            #game-controls {
                display: flex;
                flex-direction: column;
                align-items: stretch; /* Stretch content within this compact panel */
                width: 160px; /* Fixed compact width */
                
                /* Requested 10% opacity background */
                background: rgba(0, 0, 0, 0.4); 
                backdrop-filter: blur(5px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                
                padding: 8px;
                gap: 6px;
                margin: 0;
                pointer-events: auto; /* Re-enable clicks */
            }

            /* Players List */
            .players {
                flex-direction: column;
                gap: 3px;
                overflow: visible;
                padding: 0;
                margin-bottom: 2px;
            }
            
            .player {
                padding: 3px 6px;
                height: auto;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 3px;
                border: 1px solid transparent;
                font-size: 12px;
                color: #ccc;
                justify-content: space-between;
            }

            .player.active {
                background: rgba(0, 170, 120, 0.25);
                border-color: rgba(0, 170, 120, 0.4);
                color: #fff;
            }
            
            .player .color-dot {
                width: 8px;
                height: 8px;
            }

            /* Actions Text */
            .turns {
                text-align: center;
                font-size: 11px;
                color: #bbb;
                padding: 2px 0;
                border: none;
                background: transparent;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            /* End Turn Button */
            .action-btn {
                width: 100%;
                margin-top: 2px;
                padding: 10px 0;
                font-size: 13px;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 3px;
                color: #eee;
            }
            .action-btn:active {
                background: rgba(255, 255, 255, 0.1);
            }
            
            /* Editor Controls Mobile */
            #editor-controls {
                flex-direction: column;
                align-items: stretch;
                width: 160px;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(5px);
                border-radius: 3px;
                padding: 8px;
                gap: 6px;
                pointer-events: auto;
            }
            #editor-controls input {
                width: 100%;
            }
        }
      </style>
      
      <div id="menu-button">
        <div class="line"></div>
        <div class="line"></div>
        <div class="line"></div>
      </div>
      
      <div id="game-controls">
          <div class="players" id="players"></div>
          <div class="turns" id="turns">actions: ?</div>
          <button class="action-btn" id="endTurnButton">End turn</button>
      </div>
      
      <div id="editor-controls">
          <input id="map-name" placeholder="Map Name" />
          <button class="action-btn" id="save-btn">Save</button>
          <button class="action-btn" id="load-btn">Load</button>
          <button class="action-btn" id="data-btn">Data</button>
      </div>
    `;

    this.playersEl = this.shadowRoot.querySelector("#players");
    this.turnsEl = this.shadowRoot.querySelector("#turns");
    this.endTurnButton = this.shadowRoot.querySelector("#endTurnButton");
    this.menuButton = this.shadowRoot.querySelector("#menu-button");

    this.gameControls = this.shadowRoot.querySelector("#game-controls");
    this.editorControls = this.shadowRoot.querySelector("#editor-controls");
    this.mapNameInput = this.shadowRoot.querySelector("#map-name");

    this.endTurnButton.addEventListener("click", () => {
      sh.endTurn();
    });
    // Menu button event listener is attached in src/ui/menu.js,
    // but better to dispatch an event or let menu.js find it.
    // Menu.js finds it via ID.

    // Editor listeners
    this.shadowRoot.querySelector("#save-btn").addEventListener("click", () => {
      const name = this.mapNameInput.value;
      if (name) {
        sh.saveMap(name);
        alert(`Map '${name}' saved!`);
      } else {
        alert("Please enter a map name.");
      }
    });

    this.shadowRoot.querySelector("#load-btn").addEventListener("click", () => {
      // sh.ui.menu.showLoadMapModal(); // Assuming we add this to Menu
      // Or trigger a global event
      if (sh.ui.menu && sh.ui.menu.showLoadMapModal) {
        sh.ui.menu.showLoadMapModal();
      } else {
        console.log("Load Map Modal not implemented yet");
      }
    });

    this.shadowRoot.querySelector("#data-btn").addEventListener("click", () => {
      // Show raw JSON in modal
      const data = [];
      sh.state.tiles.forEach((tile) => {
        // Only include tiles that are not UNUSED
        if (tile.playerId != -1) {
          data.push({
            q: tile.q,
            r: tile.r,
            playerId: tile.playerId === undefined ? "undefined" : tile.playerId,
            army: tile.army,
          });
        }
      });
      const json = JSON.stringify(data, null, 2);

      sh.ui.jsonModal.show(json);
    });

    sh.onTurnChange = () => this.render();
    this.render();
  }

  // push to end of callstack
  update = () => setTimeout(() => this.render());

  setMode(mode) {
    this.mode = mode;
    this.render();
  }

  render() {
    if (this.mode === "editor") {
      this.gameControls.style.display = "none";
      this.editorControls.style.display = "flex";
      return;
    } else {
      this.gameControls.style.display = "flex";
      this.editorControls.style.display = "none";
    }

    const state = sh.state;
    const activePlayer = sh.getActivePlayer() || 1;

    this.playersEl.innerHTML = "";

    for (let i = 1; i <= sh.config.playerCount; i++) {
      const player = state.players[i];
      const strength = player?.tiles
        ? Array.from(player.tiles).reduce(
            (sum, idx) => sum + (state.tiles[idx]?.army || 0),
            0,
          )
        : 0;
      const color = player?.color
        ? `#${player.color.toString(16).padStart(6, "0")}`
        : "#666";
      const isActive = i === activePlayer;

      const player_el = html`
        <div class="player ${isActive ? "active" : ""}">
          <div class="color-dot" style="background:${color}"></div>
          <span class="player-num">P${i}</span>
          <span class="strength">${strength}</span>
        </div>
      `;

      this.playersEl.appendChild(player_el);
    }

    this.turnsEl.textContent = `actions: ${state.turnState?.actionsRemaining || "?"}`;
  }
}

customElements.define("status-bar", StatusBar);
