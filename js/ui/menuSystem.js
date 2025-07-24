// js/ui/menuSystem.js
import { eventSystem } from '../systems/eventSystem.js';

/**
 * Enhanced Menu System
 * Provides better organization and navigation for game menus
 */
export class MenuSystem {
    constructor() {
        this.menus = new Map();
        this.currentMenu = null;
        this.menuHistory = [];
        this.transitionDuration = 250;
        this.isTransitioning = false;
    }

    /**
     * Initialize the menu system
     */
    initialize() {
        this.setupMenuStructure();
        this.registerDefaultMenus();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
    }

    /**
     * Setup the basic menu structure
     */
    setupMenuStructure() {
        // Create main menu container
        let menuContainer = document.getElementById('main-menu-container');
        if (!menuContainer) {
            menuContainer = document.createElement('div');
            menuContainer.id = 'main-menu-container';
            menuContainer.className = 'main-menu-container';
            document.body.appendChild(menuContainer);
        }

        // Create menu overlay for modal menus
        let menuOverlay = document.getElementById('menu-overlay');
        if (!menuOverlay) {
            menuOverlay = document.createElement('div');
            menuOverlay.id = 'menu-overlay';
            menuOverlay.className = 'menu-overlay hidden';
            document.body.appendChild(menuOverlay);
        }

        // Create breadcrumb navigation
        this.createBreadcrumbNavigation();
    }

    /**
     * Create breadcrumb navigation
     */
    createBreadcrumbNavigation() {
        const topPanel = document.getElementById('top-panel');
        if (topPanel && !document.getElementById('menu-breadcrumb')) {
            const breadcrumb = document.createElement('div');
            breadcrumb.id = 'menu-breadcrumb';
            breadcrumb.className = 'menu-breadcrumb hidden';
            
            // Insert breadcrumb after the title
            const title = topPanel.querySelector('h1');
            title.parentNode.insertBefore(breadcrumb, title.nextSibling);
        }
    }

    /**
     * Register default menu configurations
     */
    registerDefaultMenus() {
        // Main game menu
        this.registerMenu('main', {
            title: 'Menu Principal',
            type: 'overlay',
            content: this.createMainMenuContent.bind(this),
            shortcuts: ['Escape']
        });

        // Settings menu
        this.registerMenu('settings', {
            title: 'Configurações',
            type: 'overlay',
            parent: 'main',
            content: this.createSettingsMenuContent.bind(this),
            shortcuts: ['F1']
        });

        // Graphics settings submenu
        this.registerMenu('graphics', {
            title: 'Configurações Gráficas',
            type: 'overlay',
            parent: 'settings',
            content: this.createGraphicsMenuContent.bind(this)
        });

        // Audio settings submenu
        this.registerMenu('audio', {
            title: 'Configurações de Áudio',
            type: 'overlay',
            parent: 'settings',
            content: this.createAudioMenuContent.bind(this)
        });

        // Controls settings submenu
        this.registerMenu('controls', {
            title: 'Controles',
            type: 'overlay',
            parent: 'settings',
            content: this.createControlsMenuContent.bind(this)
        });

        // Help menu
        this.registerMenu('help', {
            title: 'Ajuda',
            type: 'overlay',
            parent: 'main',
            content: this.createHelpMenuContent.bind(this),
            shortcuts: ['F1']
        });
    }

    /**
     * Register a menu configuration
     */
    registerMenu(id, config) {
        this.menus.set(id, {
            id,
            element: null,
            isVisible: false,
            ...config
        });
    }

    /**
     * Show a menu with smooth transition
     */
    showMenu(menuId, data = {}) {
        if (this.isTransitioning) return;

        const menu = this.menus.get(menuId);
        if (!menu) return;

        this.isTransitioning = true;

        // Hide current menu if exists
        if (this.currentMenu && this.currentMenu !== menuId) {
            this.hideMenu(this.currentMenu, false);
        }

        // Add to history if not going back
        if (!data.isBack && this.currentMenu) {
            this.menuHistory.push(this.currentMenu);
        }

        // Create menu element if it doesn't exist
        if (!menu.element) {
            this.createMenuElement(menuId);
        }

        // Update menu content
        this.updateMenuContent(menuId, data);

        // Show menu with animation
        this.animateMenuIn(menuId);

        // Update breadcrumb
        this.updateBreadcrumb(menuId);

        this.currentMenu = menuId;
        
        setTimeout(() => {
            this.isTransitioning = false;
            eventSystem.emit('menuShown', { menuId, data });
        }, this.transitionDuration);
    }

    /**
     * Hide a menu with smooth transition
     */
    hideMenu(menuId, updateHistory = true) {
        const menu = this.menus.get(menuId);
        if (!menu || !menu.isVisible) return;

        this.animateMenuOut(menuId);

        if (updateHistory && this.menuHistory.length > 0) {
            const previousMenu = this.menuHistory.pop();
            setTimeout(() => {
                this.showMenu(previousMenu, { isBack: true });
            }, this.transitionDuration);
        } else {
            this.currentMenu = null;
            this.hideBreadcrumb();
        }

        eventSystem.emit('menuHidden', { menuId });
    }

    /**
     * Create menu element
     */
    createMenuElement(menuId) {
        const menu = this.menus.get(menuId);
        if (!menu) return;

        const container = menu.type === 'overlay' ? 
            document.getElementById('menu-overlay') : 
            document.getElementById('main-menu-container');

        const menuElement = document.createElement('div');
        menuElement.id = `menu-${menuId}`;
        menuElement.className = `menu-panel ${menu.type}-menu hidden`;
        
        menuElement.innerHTML = `
            <div class="menu-header">
                ${menu.parent ? '<button class="menu-back-btn"><i class="fas fa-arrow-left"></i></button>' : ''}
                <h2 class="menu-title">${menu.title}</h2>
                <button class="menu-close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="menu-content">
                <!-- Content will be dynamically populated -->
            </div>
        `;

        container.appendChild(menuElement);
        menu.element = menuElement;

        // Setup event listeners
        this.setupMenuEventListeners(menuId);
    }

    /**
     * Update menu content
     */
    updateMenuContent(menuId, data) {
        const menu = this.menus.get(menuId);
        if (!menu || !menu.element) return;

        const contentElement = menu.element.querySelector('.menu-content');
        const content = menu.content(data);
        contentElement.innerHTML = content;

        // Setup content-specific event listeners
        this.setupContentEventListeners(menuId, contentElement);
    }

    /**
     * Animate menu in
     */
    animateMenuIn(menuId) {
        const menu = this.menus.get(menuId);
        if (!menu || !menu.element) return;

        if (menu.type === 'overlay') {
            const overlay = document.getElementById('menu-overlay');
            overlay.classList.remove('hidden');
            overlay.classList.add('visible');
        }

        menu.element.classList.remove('hidden');
        menu.element.classList.add('visible');
        
        // Trigger animation
        setTimeout(() => {
            menu.element.classList.add('animated');
        }, 10);

        menu.isVisible = true;
    }

    /**
     * Animate menu out
     */
    animateMenuOut(menuId) {
        const menu = this.menus.get(menuId);
        if (!menu || !menu.element) return;

        menu.element.classList.remove('animated');
        
        setTimeout(() => {
            menu.element.classList.remove('visible');
            menu.element.classList.add('hidden');
            
            if (menu.type === 'overlay' && !this.hasVisibleOverlayMenus()) {
                const overlay = document.getElementById('menu-overlay');
                overlay.classList.remove('visible');
                overlay.classList.add('hidden');
            }
        }, this.transitionDuration);

        menu.isVisible = false;
    }

    /**
     * Check if there are visible overlay menus
     */
    hasVisibleOverlayMenus() {
        return Array.from(this.menus.values()).some(menu => 
            menu.type === 'overlay' && menu.isVisible
        );
    }

    /**
     * Update breadcrumb navigation
     */
    updateBreadcrumb(menuId) {
        const breadcrumb = document.getElementById('menu-breadcrumb');
        if (!breadcrumb) return;

        const path = this.getMenuPath(menuId);
        
        if (path.length > 1) {
            breadcrumb.innerHTML = path.map((id, index) => {
                const menu = this.menus.get(id);
                const isLast = index === path.length - 1;
                
                return `
                    <span class="breadcrumb-item ${isLast ? 'active' : ''}" 
                          ${!isLast ? `data-menu="${id}"` : ''}>
                        ${menu.title}
                    </span>
                `;
            }).join('<i class="fas fa-chevron-right breadcrumb-separator"></i>');
            
            breadcrumb.classList.remove('hidden');
        } else {
            this.hideBreadcrumb();
        }
    }

    /**
     * Hide breadcrumb navigation
     */
    hideBreadcrumb() {
        const breadcrumb = document.getElementById('menu-breadcrumb');
        if (breadcrumb) {
            breadcrumb.classList.add('hidden');
        }
    }

    /**
     * Get menu path from root to current menu
     */
    getMenuPath(menuId) {
        const path = [];
        let currentId = menuId;
        
        while (currentId) {
            path.unshift(currentId);
            const menu = this.menus.get(currentId);
            currentId = menu ? menu.parent : null;
        }
        
        return path;
    }

    /**
     * Setup menu event listeners
     */
    setupMenuEventListeners(menuId) {
        const menu = this.menus.get(menuId);
        if (!menu || !menu.element) return;

        // Back button
        const backBtn = menu.element.querySelector('.menu-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.goBack();
            });
        }

        // Close button
        const closeBtn = menu.element.querySelector('.menu-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeAllMenus();
            });
        }
    }

    /**
     * Setup content-specific event listeners
     */
    setupContentEventListeners(menuId, contentElement) {
        // Menu navigation buttons
        contentElement.querySelectorAll('[data-menu]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetMenu = e.target.dataset.menu;
                this.showMenu(targetMenu);
            });
        });

        // Setting controls
        contentElement.querySelectorAll('[data-setting]').forEach(control => {
            control.addEventListener('change', (e) => {
                const setting = e.target.dataset.setting;
                const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                eventSystem.emit('settingChanged', { setting, value });
            });
        });

        // Action buttons
        contentElement.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                eventSystem.emit('menuAction', { action, menuId });
            });
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Check for menu shortcuts
            this.menus.forEach((menu, menuId) => {
                if (menu.shortcuts && menu.shortcuts.includes(e.key)) {
                    e.preventDefault();
                    if (menu.isVisible) {
                        this.hideMenu(menuId);
                    } else {
                        this.showMenu(menuId);
                    }
                }
            });

            // Global shortcuts
            if (e.key === 'Escape' && this.currentMenu) {
                e.preventDefault();
                this.goBack();
            }
        });

        // Breadcrumb navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('breadcrumb-item') && e.target.dataset.menu) {
                const targetMenu = e.target.dataset.menu;
                this.showMenu(targetMenu, { isBack: true });
            }
        });
    }

    /**
     * Go back to previous menu
     */
    goBack() {
        if (this.currentMenu) {
            this.hideMenu(this.currentMenu);
        }
    }

    /**
     * Close all menus
     */
    closeAllMenus() {
        if (this.currentMenu) {
            this.hideMenu(this.currentMenu, false);
            this.menuHistory = [];
            this.currentMenu = null;
            this.hideBreadcrumb();
        }
    }

    /**
     * Create main menu content
     */
    createMainMenuContent(data) {
        return `
            <div class="menu-section">
                <h3>Jogo</h3>
                <button class="menu-btn" data-action="new-game">
                    <i class="fas fa-plus"></i> Novo Jogo
                </button>
                <button class="menu-btn" data-action="save-game">
                    <i class="fas fa-save"></i> Salvar Jogo
                </button>
                <button class="menu-btn" data-action="load-game">
                    <i class="fas fa-folder-open"></i> Carregar Jogo
                </button>
            </div>
            <div class="menu-section">
                <h3>Configurações</h3>
                <button class="menu-btn" data-menu="settings">
                    <i class="fas fa-cog"></i> Configurações
                </button>
                <button class="menu-btn" data-menu="help">
                    <i class="fas fa-question-circle"></i> Ajuda
                </button>
            </div>
            <div class="menu-section">
                <h3>Outros</h3>
                <button class="menu-btn" data-action="about">
                    <i class="fas fa-info-circle"></i> Sobre
                </button>
                <button class="menu-btn" data-action="exit">
                    <i class="fas fa-sign-out-alt"></i> Sair
                </button>
            </div>
        `;
    }

    /**
     * Create settings menu content
     */
    createSettingsMenuContent(data) {
        return `
            <div class="settings-categories">
                <button class="settings-category-btn" data-menu="graphics">
                    <i class="fas fa-desktop"></i>
                    <div class="category-info">
                        <h4>Gráficos</h4>
                        <p>Qualidade visual e desempenho</p>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="settings-category-btn" data-menu="audio">
                    <i class="fas fa-volume-up"></i>
                    <div class="category-info">
                        <h4>Áudio</h4>
                        <p>Volume e efeitos sonoros</p>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </button>
                <button class="settings-category-btn" data-menu="controls">
                    <i class="fas fa-gamepad"></i>
                    <div class="category-info">
                        <h4>Controles</h4>
                        <p>Atalhos e configurações de entrada</p>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
            <div class="settings-actions">
                <button class="menu-btn secondary" data-action="reset-settings">
                    <i class="fas fa-undo"></i> Restaurar Padrões
                </button>
                <button class="menu-btn secondary" data-action="export-settings">
                    <i class="fas fa-download"></i> Exportar Configurações
                </button>
                <button class="menu-btn secondary" data-action="import-settings">
                    <i class="fas fa-upload"></i> Importar Configurações
                </button>
            </div>
        `;
    }

    /**
     * Create graphics menu content
     */
    createGraphicsMenuContent(data) {
        return `
            <div class="settings-group">
                <h4>Qualidade Gráfica</h4>
                <div class="setting-item">
                    <label>Qualidade Geral:</label>
                    <select data-setting="graphics-quality">
                        <option value="low">Baixa</option>
                        <option value="medium" selected>Média</option>
                        <option value="high">Alta</option>
                        <option value="ultra">Ultra</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>Resolução:</label>
                    <select data-setting="resolution">
                        <option value="1280x720">1280x720</option>
                        <option value="1920x1080" selected>1920x1080</option>
                        <option value="2560x1440">2560x1440</option>
                        <option value="3840x2160">3840x2160</option>
                    </select>
                </div>
            </div>
            <div class="settings-group">
                <h4>Efeitos Visuais</h4>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" data-setting="shadows" checked>
                        Sombras Dinâmicas
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" data-setting="particles" checked>
                        Sistema de Partículas
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" data-setting="water-effects" checked>
                        Efeitos de Água
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" data-setting="atmospheric-effects" checked>
                        Efeitos Atmosféricos
                    </label>
                </div>
            </div>
            <div class="settings-group">
                <h4>Performance</h4>
                <div class="setting-item">
                    <label>Limite de FPS:</label>
                    <select data-setting="fps-limit">
                        <option value="30">30 FPS</option>
                        <option value="60" selected>60 FPS</option>
                        <option value="120">120 FPS</option>
                        <option value="unlimited">Ilimitado</option>
                    </select>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" data-setting="vsync">
                        V-Sync
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Create audio menu content
     */
    createAudioMenuContent(data) {
        return `
            <div class="settings-group">
                <h4>Volume</h4>
                <div class="setting-item">
                    <label>Volume Geral:</label>
                    <input type="range" min="0" max="100" value="80" data-setting="master-volume">
                    <span class="volume-value">80%</span>
                </div>
                <div class="setting-item">
                    <label>Música:</label>
                    <input type="range" min="0" max="100" value="70" data-setting="music-volume">
                    <span class="volume-value">70%</span>
                </div>
                <div class="setting-item">
                    <label>Efeitos Sonoros:</label>
                    <input type="range" min="0" max="100" value="90" data-setting="sfx-volume">
                    <span class="volume-value">90%</span>
                </div>
                <div class="setting-item">
                    <label>Ambiente:</label>
                    <input type="range" min="0" max="100" value="60" data-setting="ambient-volume">
                    <span class="volume-value">60%</span>
                </div>
            </div>
            <div class="settings-group">
                <h4>Configurações de Áudio</h4>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" data-setting="spatial-audio" checked>
                        Áudio Espacial 3D
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" data-setting="dynamic-music" checked>
                        Música Dinâmica
                    </label>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" data-setting="ambient-sounds" checked>
                        Sons Ambientes
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Create controls menu content
     */
    createControlsMenuContent(data) {
        return `
            <div class="settings-group">
                <h4>Controles de Câmera</h4>
                <div class="setting-item">
                    <label>Sensibilidade do Mouse:</label>
                    <input type="range" min="0.1" max="2.0" step="0.1" value="1.0" data-setting="mouse-sensitivity">
                    <span class="sensitivity-value">1.0x</span>
                </div>
                <div class="setting-item">
                    <label>
                        <input type="checkbox" data-setting="invert-y">
                        Inverter Eixo Y
                    </label>
                </div>
                <div class="setting-item">
                    <label>Velocidade de Zoom:</label>
                    <input type="range" min="0.5" max="3.0" step="0.1" value="1.5" data-setting="zoom-speed">
                    <span class="speed-value">1.5x</span>
                </div>
            </div>
            <div class="settings-group">
                <h4>Atalhos de Teclado</h4>
                <div class="keybind-list">
                    <div class="keybind-item">
                        <span class="keybind-action">Pausar/Continuar:</span>
                        <span class="keybind-key">Espaço</span>
                    </div>
                    <div class="keybind-item">
                        <span class="keybind-action">Menu Principal:</span>
                        <span class="keybind-key">Esc</span>
                    </div>
                    <div class="keybind-item">
                        <span class="keybind-action">Reset Câmera:</span>
                        <span class="keybind-key">R</span>
                    </div>
                    <div class="keybind-item">
                        <span class="keybind-action">Acelerar Tempo:</span>
                        <span class="keybind-key">T</span>
                    </div>
                    <div class="keybind-item">
                        <span class="keybind-action">Conquistas:</span>
                        <span class="keybind-key">A</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create help menu content
     */
    createHelpMenuContent(data) {
        return `
            <div class="help-sections">
                <div class="help-section">
                    <h4>Como Jogar</h4>
                    <p>Ecosse™ é um sandbox planetário onde você pode criar e gerenciar ecossistemas complexos. Use os elementos disponíveis para construir um mundo vivo e observar como ele evolui.</p>
                </div>
                <div class="help-section">
                    <h4>Controles Básicos</h4>
                    <ul>
                        <li><strong>Mouse:</strong> Clique e arraste para mover a câmera</li>
                        <li><strong>Scroll:</strong> Zoom in/out</li>
                        <li><strong>Clique:</strong> Colocar elemento selecionado</li>
                        <li><strong>Espaço:</strong> Pausar/continuar simulação</li>
                    </ul>
                </div>
                <div class="help-section">
                    <h4>Elementos</h4>
                    <ul>
                        <li><strong>Água:</strong> Essencial para a vida</li>
                        <li><strong>Plantas:</strong> Produtores primários</li>
                        <li><strong>Criaturas:</strong> Consumidores que evoluem</li>
                        <li><strong>Sol:</strong> Fonte de energia</li>
                        <li><strong>Chuva:</strong> Distribui água</li>
                    </ul>
                </div>
                <div class="help-section">
                    <h4>Dicas</h4>
                    <ul>
                        <li>Mantenha um equilíbrio entre produtores e consumidores</li>
                        <li>Use a chuva para distribuir água uniformemente</li>
                        <li>Observe as estatísticas para monitorar a saúde do ecossistema</li>
                        <li>Experimente com diferentes configurações planetárias</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for menu requests
        eventSystem.subscribe('showMenu', (data) => {
            this.showMenu(data.menuId, data.data);
        });

        eventSystem.subscribe('hideMenu', (data) => {
            this.hideMenu(data.menuId);
        });

        // Listen for setting changes to update UI
        eventSystem.subscribe('settingChanged', (data) => {
            this.updateSettingDisplay(data.setting, data.value);
        });
    }

    /**
     * Update setting display values
     */
    updateSettingDisplay(setting, value) {
        // Update volume displays
        if (setting.includes('volume')) {
            const display = document.querySelector(`[data-setting="${setting}"] + .volume-value`);
            if (display) {
                display.textContent = `${value}%`;
            }
        }

        // Update sensitivity displays
        if (setting === 'mouse-sensitivity') {
            const display = document.querySelector('.sensitivity-value');
            if (display) {
                display.textContent = `${value}x`;
            }
        }

        // Update speed displays
        if (setting === 'zoom-speed') {
            const display = document.querySelector('.speed-value');
            if (display) {
                display.textContent = `${value}x`;
            }
        }
    }
}

// Create and export singleton instance
export const menuSystem = new MenuSystem();