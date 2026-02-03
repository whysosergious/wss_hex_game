import { h, html } from "../lib/el.js";

// status-bar.js - PROFESSIONAL STATUS BAR
class StatusBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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
          padding: 0px 20px !important;
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
        
        .turns {
          padding: 6px 12px;
          background: rgba(0,0,0,0.4);
          border-radius: 3px;
          border: 1px solid rgba(255,255,255,0.08);
          font-size: 13px;
          color: #888;
          white-space: nowrap;
        }
      </style>
      <div class="players" id="players"></div>
      <div class="turns" id="turns">actions: ?</div>
      <button class="turns" id="endTurnButton">End turn</button>
    `;

    this.playersEl = this.shadowRoot.querySelector("#players");
    this.turnsEl = this.shadowRoot.querySelector("#turns");
    this.endTurnButton = this.shadowRoot.querySelector("#endTurnButton");
    this.endTurnButton.addEventListener("click", () => {
      sh.endTurn();
    });
    sh.onTurnChange = () => this.render();
    this.render();
  }

  // push to end of callstack
  update = () => setTimeout(() => this.render());

  render() {
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
