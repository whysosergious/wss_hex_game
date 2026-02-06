class Menu {
    constructor(sh) {
        this.sh = sh;
        this.menuPanel = document.getElementById('menu-panel');
        this.settingsPanel = document.getElementById('settings-panel');
        this.settingsContainer = document.getElementById('settings-container');
        
        this.mapListPanel = document.getElementById('map-list-panel');
        this.mapListContainer = document.getElementById('map-list-container');
        this.mapListTitle = document.getElementById('map-list-title');

        this.init();
    }

    init() {
        // Main menu buttons
        const menuButton = this.sh.ui.statusbar.shadowRoot.getElementById('menu-button');
        menuButton.addEventListener('click', () => this.showMenu());

        const closeMenuButton = document.getElementById('close-menu');
        closeMenuButton.addEventListener('click', () => this.hideMenu());

        const settingsButton = document.getElementById('settings-button');
        settingsButton.addEventListener('click', () => this.showSettings());
        
        const mapModeButton = document.getElementById('map-mode-button');
        mapModeButton.addEventListener('click', () => {
             this.hideMenu();
             this.sh.enterMapEditor();
        });

        // Settings panel buttons
        const closeSettingsButton = document.getElementById('close-settings');
        closeSettingsButton.addEventListener('click', () => this.hideSettings());
        
        // Map List panel buttons
        const closeMapListButton = document.getElementById('close-map-list');
        closeMapListButton.addEventListener('click', () => this.hideMapList());

        // Other menu buttons
        const newGameButton = document.getElementById('new-game-button');
        newGameButton.addEventListener('click', () => {
            this.showMapList('play');
        });
    }

    showMenu() {
        this.menuPanel.classList.remove('hidden');
    }

    hideMenu() {
        this.menuPanel.classList.add('hidden');
    }

    showSettings() {
        this.hideMenu();
        this.populateSettings();
        this.settingsPanel.classList.remove('hidden');
    }

    hideSettings() {
        this.settingsPanel.classList.add('hidden');
    }
    
    showMapList(mode = 'play') { // 'play' or 'edit'
        this.hideMenu();
        this.mapListPanel.classList.remove('hidden');
        this.mapListTitle.textContent = mode === 'play' ? "New Game - Select Map" : "Load Map";
        this.populateMapList(mode);
    }
    
    hideMapList() {
        this.mapListPanel.classList.add('hidden');
    }
    
    // Alias for Status Bar to call
    showLoadMapModal() {
        this.showMapList('edit');
    }

    populateSettings() {
        this.settingsContainer.innerHTML = ''; // Clear previous settings

        for (const key in this.sh.config) {
            const value = this.sh.config[key];
            const type = typeof value;
            
            // Skip complex objects for now if needed, or handle recursion
            if (typeof value === 'object' && value !== null) {
                // For now, just handle top-level primitives or specifically whitelisted objects
                // If you want to edit nested configs (like editorMapSize), you need more logic.
                // Let's at least handle editorMapSize.q and r if possible or just ignore objects for simplicity in this MVP
                if (key === 'editorMapSize') {
                     ['q', 'r'].forEach(coord => {
                        const item = document.createElement('div');
                        item.className = 'setting-item';
                        const label = document.createElement('label');
                        label.textContent = `Map Size ${coord.toUpperCase()}`;
                        item.appendChild(label);
                        const input = document.createElement('input');
                        input.type = 'number';
                        input.value = value[coord];
                        input.addEventListener('input', (e) => {
                             this.sh.config.editorMapSize[coord] = parseInt(e.target.value);
                        });
                        item.appendChild(input);
                        this.settingsContainer.appendChild(item);
                     });
                }
                continue;
            }

            const item = document.createElement('div');
            item.className = 'setting-item';

            const label = document.createElement('label');
            label.textContent = key;
            item.appendChild(label);

            let input;
            if (type === 'boolean') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = value;
                input.addEventListener('change', (e) => {
                    this.sh.config[key] = e.target.checked;
                });
            } else if (type === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                input.value = value;
                // Add step for floats if needed
                if (!Number.isInteger(value)) {
                    input.step = '0.1';
                }
                input.addEventListener('input', (e) => {
                    this.sh.config[key] = parseFloat(e.target.value);
                });
            } else if (type === 'string') {
                input = document.createElement('input');
                input.type = 'text';
                input.value = value;
                input.addEventListener('input', (e) => {
                    this.sh.config[key] = e.target.value;
                });
            }

            if (input) {
                item.appendChild(input);
                this.settingsContainer.appendChild(item);
            }
        }
    }
    
    populateMapList(mode) {
        this.mapListContainer.innerHTML = '';
        const maps = this.sh.getMapList();
        
        if (maps.length === 0) {
            this.mapListContainer.innerHTML = '<div style="color: #888; text-align: center;">No saved maps found.</div>';
            return;
        }
        
        maps.forEach(mapName => {
            const item = document.createElement('div');
            item.className = 'setting-item'; // Reuse style
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = mapName;
            nameSpan.style.color = '#eee';
            nameSpan.style.cursor = 'pointer';
            nameSpan.style.flex = '1';
            
            nameSpan.addEventListener('click', () => {
                this.sh.loadMap(mapName, mode === 'edit');
                this.hideMapList();
            });
            
            item.appendChild(nameSpan);
            
            if (mode === 'edit') {
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'X';
                deleteBtn.style.background = 'transparent';
                deleteBtn.style.border = 'none';
                deleteBtn.style.color = '#ff4444';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.style.fontWeight = 'bold';
                
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`Delete map '${mapName}'?`)) {
                        this.sh.deleteMap(mapName);
                        this.populateMapList(mode); // Refresh
                    }
                });
                item.appendChild(deleteBtn);
            }
            
            this.mapListContainer.appendChild(item);
        });
    }
}

export default Menu;