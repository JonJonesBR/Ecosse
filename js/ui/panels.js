// js/ui/panels.js
import { eventSystem } from '../systems/eventSystem.js';

/**
 * Contextual Panel System
 * Manages adaptive panels that change based on context
 */
export class ContextualPanels {
    constructor() {
        this.panels = new Map();
        this.currentContext = 'default';
        this.transitionDuration = 300;
        this.isTransitioning = false;
    }

    /**
     * Initialize the contextual panel system
     */
    initialize() {
        this.setupPanelStructure();
        this.setupEventListeners();
        this.registerDefaultPanels();
    }

    /**
     * Setup the basic panel structure
     */
    setupPanelStructure() {
        // Create contextual panel container if it doesn't exist
        let contextualContainer = document.getElementById('contextual-panels');
        if (!contextualContainer) {
            contextualContainer = document.createElement('div');
            contextualContainer.id = 'contextual-panels';
            contextualContainer.className = 'contextual-panels-container';
            
            // Insert after the top panel
            const topPanel = document.getElementById('top-panel');
            topPanel.parentNode.insertBefore(contextualContainer, topPanel.nextSibling);
        }

        // Create panel content areas
        this.createPanelArea('element-context', 'Contexto do Elemento');
        this.createPanelArea('simulation-context', 'Controles de Simulação');
        this.createPanelArea('analysis-context', 'Análise do Ecossistema');
        this.createPanelArea('creation-context', 'Modo de Criação');
    }

    /**
     * Create a panel area
     */
    createPanelArea(id, title) {
        const container = document.getElementById('contextual-panels');
        
        const panel = document.createElement('div');
        panel.id = id;
        panel.className = 'contextual-panel hidden';
        panel.innerHTML = `
            <div class="panel-header">
                <h3 class="panel-title">${title}</h3>
                <button class="panel-minimize-btn" data-panel="${id}">
                    <i class="fas fa-chevron-up"></i>
                </button>
            </div>
            <div class="panel-content">
                <!-- Content will be dynamically populated -->
            </div>
        `;
        
        container.appendChild(panel);
        
        // Setup minimize/maximize functionality
        const minimizeBtn = panel.querySelector('.panel-minimize-btn');
        minimizeBtn.addEventListener('click', () => this.togglePanelMinimize(id));
    }

    /**
     * Register default panel configurations
     */
    registerDefaultPanels() {
        // Element context panel
        this.registerPanel('element-context', {
            contexts: ['element-selected', 'element-hover'],
            content: this.createElementContextContent.bind(this),
            priority: 1
        });

        // Simulation context panel
        this.registerPanel('simulation-context', {
            contexts: ['simulation-running', 'simulation-paused'],
            content: this.createSimulationContextContent.bind(this),
            priority: 2
        });

        // Analysis context panel
        this.registerPanel('analysis-context', {
            contexts: ['analysis-mode'],
            content: this.createAnalysisContextContent.bind(this),
            priority: 3
        });

        // Creation context panel
        this.registerPanel('creation-context', {
            contexts: ['creation-mode'],
            content: this.createCreationContextContent.bind(this),
            priority: 4
        });
    }

    /**
     * Register a panel configuration
     */
    registerPanel(id, config) {
        this.panels.set(id, {
            id,
            element: document.getElementById(id),
            ...config
        });
    }

    /**
     * Switch to a new context
     */
    switchContext(newContext, data = {}) {
        if (this.isTransitioning || this.currentContext === newContext) {
            return;
        }

        this.isTransitioning = true;
        const oldContext = this.currentContext;
        this.currentContext = newContext;

        // Hide panels that don't belong to the new context
        this.hidePanelsNotInContext(newContext);

        // Show and update panels for the new context
        setTimeout(() => {
            this.showPanelsForContext(newContext, data);
            this.isTransitioning = false;
            
            eventSystem.emit('contextChanged', {
                from: oldContext,
                to: newContext,
                data
            });
        }, this.transitionDuration / 2);
    }

    /**
     * Hide panels not in the current context
     */
    hidePanelsNotInContext(context) {
        this.panels.forEach((panel) => {
            if (!panel.contexts.includes(context)) {
                this.hidePanel(panel.id);
            }
        });
    }

    /**
     * Show panels for the current context
     */
    showPanelsForContext(context, data) {
        const contextPanels = Array.from(this.panels.values())
            .filter(panel => panel.contexts.includes(context))
            .sort((a, b) => a.priority - b.priority);

        contextPanels.forEach(panel => {
            this.updatePanelContent(panel.id, data);
            this.showPanel(panel.id);
        });
    }

    /**
     * Update panel content
     */
    updatePanelContent(panelId, data) {
        const panel = this.panels.get(panelId);
        if (panel && panel.content) {
            const contentElement = panel.element.querySelector('.panel-content');
            const content = panel.content(data);
            contentElement.innerHTML = content;
            
            // Setup event listeners for the new content
            this.setupPanelEventListeners(panelId, contentElement);
        }
    }

    /**
     * Show a panel with smooth transition
     */
    showPanel(panelId) {
        const panel = this.panels.get(panelId);
        if (panel) {
            panel.element.classList.remove('hidden');
            panel.element.classList.add('visible');
            
            // Trigger animation
            setTimeout(() => {
                panel.element.classList.add('animated');
            }, 10);
        }
    }

    /**
     * Hide a panel with smooth transition
     */
    hidePanel(panelId) {
        const panel = this.panels.get(panelId);
        if (panel) {
            panel.element.classList.remove('animated');
            
            setTimeout(() => {
                panel.element.classList.remove('visible');
                panel.element.classList.add('hidden');
            }, this.transitionDuration);
        }
    }

    /**
     * Toggle panel minimize state
     */
    togglePanelMinimize(panelId) {
        const panel = this.panels.get(panelId);
        if (panel) {
            const content = panel.element.querySelector('.panel-content');
            const btn = panel.element.querySelector('.panel-minimize-btn i');
            
            if (content.classList.contains('minimized')) {
                content.classList.remove('minimized');
                btn.className = 'fas fa-chevron-up';
            } else {
                content.classList.add('minimized');
                btn.className = 'fas fa-chevron-down';
            }
        }
    }

    /**
     * Create element context content
     */
    createElementContextContent(data) {
        if (!data.element) return '<p class="text-gray-400">Nenhum elemento selecionado</p>';

        const element = data.element;
        return `
            <div class="element-info">
                <div class="element-header">
                    <span class="element-icon">${this.getElementIcon(element.type)}</span>
                    <h4 class="element-name">${this.getElementName(element.type)}</h4>
                </div>
                <div class="element-stats">
                    <div class="stat-row">
                        <span class="stat-label">Saúde:</span>
                        <div class="stat-bar">
                            <div class="stat-fill" style="width: ${element.health}%"></div>
                        </div>
                        <span class="stat-value">${element.health}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Energia:</span>
                        <div class="stat-bar">
                            <div class="stat-fill energy" style="width: ${element.energy}%"></div>
                        </div>
                        <span class="stat-value">${element.energy}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Idade:</span>
                        <span class="stat-value">${element.age} ciclos</span>
                    </div>
                </div>
                <div class="element-actions">
                    <button class="action-btn boost" data-action="boost" data-element="${element.id}">
                        <i class="fas fa-arrow-up"></i> Fortalecer
                    </button>
                    <button class="action-btn heal" data-action="heal" data-element="${element.id}">
                        <i class="fas fa-heart"></i> Curar
                    </button>
                    <button class="action-btn remove" data-action="remove" data-element="${element.id}">
                        <i class="fas fa-trash"></i> Remover
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Create simulation context content
     */
    createSimulationContextContent(data) {
        const isRunning = data.state === 'running';
        return `
            <div class="simulation-controls">
                <div class="control-group">
                    <h4>Controles de Tempo</h4>
                    <div class="time-controls">
                        <button class="control-btn ${isRunning ? 'pause' : 'play'}" data-action="toggle-simulation">
                            <i class="fas fa-${isRunning ? 'pause' : 'play'}"></i>
                            ${isRunning ? 'Pausar' : 'Iniciar'}
                        </button>
                        <button class="control-btn speed" data-action="speed-up">
                            <i class="fas fa-forward"></i> Acelerar
                        </button>
                        <button class="control-btn reset" data-action="reset-time">
                            <i class="fas fa-undo"></i> Resetar
                        </button>
                    </div>
                </div>
                <div class="control-group">
                    <h4>Velocidade da Simulação</h4>
                    <div class="speed-selector">
                        <button class="speed-btn ${data.speed === 1 ? 'active' : ''}" data-speed="1">1x</button>
                        <button class="speed-btn ${data.speed === 2 ? 'active' : ''}" data-speed="2">2x</button>
                        <button class="speed-btn ${data.speed === 5 ? 'active' : ''}" data-speed="5">5x</button>
                        <button class="speed-btn ${data.speed === 10 ? 'active' : ''}" data-speed="10">10x</button>
                    </div>
                </div>
                <div class="control-group">
                    <h4>Eventos Automáticos</h4>
                    <div class="auto-events">
                        <label class="toggle-label">
                            <input type="checkbox" ${data.autoWeather ? 'checked' : ''} data-toggle="auto-weather">
                            <span class="toggle-text">Clima Automático</span>
                        </label>
                        <label class="toggle-label">
                            <input type="checkbox" ${data.autoEvents ? 'checked' : ''} data-toggle="auto-events">
                            <span class="toggle-text">Eventos Aleatórios</span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create analysis context content
     */
    createAnalysisContextContent(data) {
        return `
            <div class="analysis-tools">
                <div class="tool-group">
                    <h4>Visualizações</h4>
                    <div class="visualization-buttons">
                        <button class="viz-btn" data-viz="population">
                            <i class="fas fa-chart-line"></i> População
                        </button>
                        <button class="viz-btn" data-viz="heatmap">
                            <i class="fas fa-fire"></i> Mapa de Calor
                        </button>
                        <button class="viz-btn" data-viz="flow">
                            <i class="fas fa-project-diagram"></i> Fluxo de Energia
                        </button>
                    </div>
                </div>
                <div class="tool-group">
                    <h4>Métricas</h4>
                    <div class="metrics-display">
                        <div class="metric-item">
                            <span class="metric-label">Estabilidade:</span>
                            <span class="metric-value">${data.stability || 0}%</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Biodiversidade:</span>
                            <span class="metric-value">${data.biodiversity || 0}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Eficiência:</span>
                            <span class="metric-value">${data.efficiency || 0}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create creation context content
     */
    createCreationContextContent(data) {
        return `
            <div class="creation-tools">
                <div class="tool-group">
                    <h4>Ferramentas de Criação</h4>
                    <div class="creation-modes">
                        <button class="mode-btn ${data.mode === 'single' ? 'active' : ''}" data-mode="single">
                            <i class="fas fa-mouse-pointer"></i> Individual
                        </button>
                        <button class="mode-btn ${data.mode === 'brush' ? 'active' : ''}" data-mode="brush">
                            <i class="fas fa-paint-brush"></i> Pincel
                        </button>
                        <button class="mode-btn ${data.mode === 'area' ? 'active' : ''}" data-mode="area">
                            <i class="fas fa-vector-square"></i> Área
                        </button>
                    </div>
                </div>
                <div class="tool-group">
                    <h4>Configurações</h4>
                    <div class="creation-settings">
                        <div class="setting-item">
                            <label>Tamanho do Pincel:</label>
                            <input type="range" min="1" max="10" value="${data.brushSize || 3}" data-setting="brush-size">
                            <span class="setting-value">${data.brushSize || 3}</span>
                        </div>
                        <div class="setting-item">
                            <label>Densidade:</label>
                            <input type="range" min="1" max="100" value="${data.density || 50}" data-setting="density">
                            <span class="setting-value">${data.density || 50}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners for panel content
     */
    setupPanelEventListeners(panelId, contentElement) {
        // Element action buttons
        contentElement.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const elementId = e.target.dataset.element;
                eventSystem.emit('elementAction', { action, elementId });
            });
        });

        // Control buttons
        contentElement.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                eventSystem.emit('simulationControl', { action });
            });
        });

        // Speed buttons
        contentElement.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const speed = parseInt(e.target.dataset.speed);
                eventSystem.emit('speedChange', { speed });
                
                // Update active state
                contentElement.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Visualization buttons
        contentElement.querySelectorAll('.viz-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const visualization = e.target.dataset.viz;
                eventSystem.emit('visualizationToggle', { visualization });
            });
        });

        // Mode buttons
        contentElement.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                eventSystem.emit('creationModeChange', { mode });
                
                // Update active state
                contentElement.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Setting inputs
        contentElement.querySelectorAll('[data-setting]').forEach(input => {
            input.addEventListener('input', (e) => {
                const setting = e.target.dataset.setting;
                const value = e.target.value;
                eventSystem.emit('settingChange', { setting, value });
                
                // Update display value
                const valueDisplay = e.target.parentNode.querySelector('.setting-value');
                if (valueDisplay) {
                    valueDisplay.textContent = setting === 'density' ? `${value}%` : value;
                }
            });
        });

        // Toggle inputs
        contentElement.querySelectorAll('[data-toggle]').forEach(input => {
            input.addEventListener('change', (e) => {
                const toggle = e.target.dataset.toggle;
                const enabled = e.target.checked;
                eventSystem.emit('toggleChange', { toggle, enabled });
            });
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for context change requests
        eventSystem.subscribe('requestContextChange', (data) => {
            this.switchContext(data.context, data.data);
        });

        // Listen for element selection
        eventSystem.subscribe('elementSelected', (data) => {
            this.switchContext('element-selected', data);
        });

        // Listen for simulation state changes
        eventSystem.subscribe('simulationStateChanged', (data) => {
            const context = data.state === 'running' ? 'simulation-running' : 'simulation-paused';
            this.switchContext(context, data);
        });
    }

    /**
     * Get element icon
     */
    getElementIcon(type) {
        const icons = {
            water: '💧',
            rock: '🪨',
            plant: '🌿',
            creature: '🐛',
            sun: '☀️',
            rain: '🌧️',
            fungus: '🍄',
            meteor: '☄️',
            volcano: '🌋',
            predator: '🐺',
            tribe: '🛖',
            extractionProbe: '⛏️'
        };
        return icons[type] || '❓';
    }

    /**
     * Get element name
     */
    getElementName(type) {
        const names = {
            water: 'Água',
            rock: 'Rocha',
            plant: 'Planta',
            creature: 'Criatura',
            sun: 'Sol',
            rain: 'Chuva',
            fungus: 'Fungo',
            meteor: 'Meteoro',
            volcano: 'Vulcão',
            predator: 'Predador',
            tribe: 'Tribo',
            extractionProbe: 'Sonda de Extração'
        };
        return names[type] || 'Desconhecido';
    }
}

// Create and export singleton instance
export const contextualPanels = new ContextualPanels();