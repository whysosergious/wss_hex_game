
class Menu {
    constructor(sh) {
        this.sh = sh;
        this.menuPanel = document.getElementById('menu-panel');
        this.settingsPanel = document.getElementById('settings-panel');
        this.settingsContainer = document.getElementById('settings-container');

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

        // Settings panel buttons
        const closeSettingsButton = document.getElementById('close-settings');
        closeSettingsButton.addEventListener('click', () => this.hideSettings());

        // Other menu buttons
        const newGameButton = document.getElementById('new-game-button');
        newGameButton.addEventListener('click', () => {
            // Assuming sh.reset() or similar function exists
            if (this.sh.resetScene) {
                this.sh.resetScene();
            } else {
                console.log("New Game clicked - no reset function found.");
            }
            this.hideMenu();
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

    populateSettings() {
        this.settingsContainer.innerHTML = ''; // Clear previous settings

        for (const key in this.sh.config) {
            const value = this.sh.config[key];
            const type = typeof value;

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
}

export default Menu;
