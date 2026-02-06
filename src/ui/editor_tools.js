import { h, html } from "../lib/el.js";

class EditorTools extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    sh.ui = sh.ui || {};
    sh.ui.editorTools = this;
    
    this.render();
  }
  
  show() {
      this.style.display = 'block';
  }
  
  hide() {
      this.style.display = 'none';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background: rgba(30, 30, 30, 0.9);
          border: 1px solid #444;
          border-radius: 8px;
          padding: 15px;
          color: white;
          font-family: sans-serif;
          z-index: 1000;
          display: none; /* Hidden by default */
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        
        .row {
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }
        
        label {
            font-size: 13px;
            color: #ccc;
        }
        
        select, input {
            background: #222;
            border: 1px solid #555;
            color: white;
            padding: 4px;
            border-radius: 4px;
        }
        
        input[type="number"] {
            width: 50px;
        }
        
        .toggle {
            cursor: pointer;
            padding: 6px 12px;
            background: #444;
            border-radius: 4px;
            border: 1px solid #555;
            text-align: center;
        }
        
        .toggle.active {
            background: #00aa78;
            border-color: #00ffaa;
            color: white;
        }
      </style>
      
      <div class="container">
          <div class="row">
            <button id="draw-mode-btn" class="toggle">Draw Mode: OFF</button>
          </div>
          
          <div class="row">
              <label>Player:</label>
              <select id="player-select">
                  <option value="-1" selected>__UNUSED__</option>
                  <option value="undefined">__NEUTRAL__</option>
                  <option value="0">__BLOCKED__</option>
                  <option value="1">Player 1</option>
                  <option value="2">Player 2</option>
                  <option value="3">Player 3</option>
                  <option value="4">Player 4</option>
                  <option value="5">Player 5</option>
                  <option value="6">Player 6</option>
              </select>
          </div>
          
          <div class="row">
              <label>Army:</label>
              <input type="number" id="army-input" value="0" min="0" max="99">
          </div>
      </div>
    `;
    
    const drawBtn = this.shadowRoot.getElementById('draw-mode-btn');
    const playerSelect = this.shadowRoot.getElementById('player-select');
    const armyInput = this.shadowRoot.getElementById('army-input');
    
    drawBtn.addEventListener('click', () => {
        sh.state.editor.drawMode = !sh.state.editor.drawMode;
        drawBtn.classList.toggle('active', sh.state.editor.drawMode);
        drawBtn.textContent = sh.state.editor.drawMode ? "Draw Mode: ON" : "Draw Mode: OFF";
        
        // Disable Orbit Controls when in Draw Mode
        if (sh.state.controls) {
            sh.state.controls.enabled = !sh.state.editor.drawMode;
        }
    });
    
    playerSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        sh.state.editor.selectedPlayer = (val === "undefined") ? undefined : parseInt(val);
    });
    
    armyInput.addEventListener('input', (e) => {
        sh.state.editor.brushArmy = parseInt(e.target.value);
    });
  }
}

customElements.define("editor-tools", EditorTools);
