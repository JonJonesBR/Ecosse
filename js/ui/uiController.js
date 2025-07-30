// js/ui/uiController.js
import { menuSystem } from './menuSystem.js';
import { contextualPanels } from './panels.js';
import { eventSystem } from '../systems/eventSystem.js';

/**
 * Main UI Controller
 * Coordinates between different UI systems and manages overall UI state
 */
export class UIController {
    constructor() {
        this.currentMode = 'default';
        this.isInitialized = false;
        this.panelStates = new Map();
        this.shortcuts = new Map();
    }

    /**
     * Initialize the UI controller
     */
    initialize() {
        if (this.isInitialized) return;

        // Initialize subsystems
        menuSystem.initialize();
        contextualPanels.initialize();

        // Setup UI event listeners
        this.setupEventListeners();
        this.setupModeTransitions();
        this.setupResponsiveHandlers();

        // Initialize panel states
        this.initializePanelStates();

        this.isInitialized = true;
        eventSystem.emit('uiInitialized');
    }
    
    /**
     * Handle layout changes from the layout manager
     * @param {Object} layoutInfo - Layout change information
     */
    onLayoutChange(layoutInfo) {
        try {
            console.log('🎛️ UI Controller received layout change:', layoutInfo.viewportType);
            
            // Update UI mode based on viewport
            this.updateUIForViewport(layoutInfo.viewportType);
            
            // Adjust panel states if needed
            this.adjustPanelStatesForLayout(layoutInfo);
            
            // Notify subsystems
            if (menuSystem && typeof menuSystem.onLayoutChange === 'function') {
                menuSystem.onLayoutChange(layoutInfo);
            }
            
            if (contextualPanels && typeof contextualPanels.onLayoutChange === 'function') {
                contextualPanels.onLayoutChange(layoutInfo);
            }
            
        } catch (error) {
            console.error('❌ Error handling layout change in UI Controller:', error);
        }
    }
    
    /**
     * Update UI for specific viewport type
     * @param {string} viewportType - Current viewport type
     */
    updateUIForViewport(viewportType) {
        // Remove existing viewport classes
        document.body.classList.remove('ui-mobile', 'ui-tablet', 'ui-desktop');
        
        // Add current viewport class
        document.body.classList.add(`ui-${viewportType}`);
        
        // Adjust UI behavior based on viewport
        switch (viewportType) {
            case 'mobile':
                this.enableMobileUIMode();
                break;
            case 'tablet':
                this.enableTabletUIMode();
                break;
            case 'desktop':
                this.enableDesktopUIMode();
                break;
        }
    }
    
    /**
     * Enable mobile UI mode
     */
    enableMobileUIMode() {
        // Simplify UI for mobile
        this.currentMode = 'mobile';
        
        // Hide complex UI elements
        const complexElements = document.querySelectorAll('.complex-ui');
        complexElements.forEach(el => el.style.display = 'none');
    }
    
    /**
     * Enable tablet UI mode
     */
    enableTabletUIMode() {
        this.currentMode = 'tablet';
        
        // Show most UI elements
        const complexElements = document.querySelectorAll('.complex-ui');
        complexElements.forEach(el => el.style.display = '');
    }
    
    /**
     * Enable desktop UI mode
     */
    enableDesktopUIMode() {
        this.currentMode = 'desktop';
        
        // Show all UI elements
        const complexElements = document.querySelectorAll('.complex-ui');
        complexElements.forEach(el => el.style.display = '');
    }
    
    /**
     * Adjust panel states for layout changes
     * @param {Object} layoutInfo - Layout information
     */
    adjustPanelStatesForLayout(layoutInfo) {
        // Update internal panel state tracking
        Object.keys(layoutInfo.panelStates).forEach(panelName => {
            this.panelStates.set(panelName, layoutInfo.panelStates[panelName]);
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for mode changes
        eventSystem.subscribe('modeChanged', (data) => {
            this.switchMode(data.mode, data.data);
        });

        // Listen for element interactions
        eventSystem.subscribe('elementSelected', (data) => {
            this.handleElementSelection(data);
        });

        eventSystem.subscribe('elementDeselected', () => {
            this.handleElementDeselection();
        });

        // Listen for simulation state changes
        eventSystem.subscribe('simulationStateChanged', (data) => {
            this.handleSimulationStateChange(data);
        });

        // Listen for UI toggle requests
        eventSystem.subscribe('toggleUI', (data) => {
            this.toggleUIElement(data.element, data.state);
        });

        // Listen for panel resize requests
        eventSystem.subscribe('resizePanel', (data) => {
            this.resizePanel(data.panelId, data.size);
        });

        // Setup main menu toggle
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                this.toggleMainMenu();
            }
        });

        // Setup responsive panel toggles
        this.setupPanelToggles();
    }

    /**
     * Setup mode transitions
     */
    setupModeTransitions() {
        const modes = {
            'default': {
                panels: ['simulation-context'],
                contextualPanels: true,
                bottomPanel: true
            },
            'creation': {
                panels: ['creation-context'],
                contextualPanels: true,
                bottomPanel: true
            },
            'analysis': {
                panels: ['analysis-context'],
                contextualPanels: true,
                bottomPanel: false
            },
            'element-focus': {
                panels: ['element-context'],
                contextualPanels: true,
                bottomPanel: true
            },
            'menu': {
                panels: [],
                contextualPanels: false,
                bottomPanel: false
            }
        };

        this.modeConfigurations = modes;
    }

    /**
     * Setup responsive handlers
     */
    setupResponsiveHandlers() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Handle orientation change on mobile
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleResize();
            }, 500);
        });
    }

    /**
     * Initialize panel states
     */
    initializePanelStates() {
        const panels = ['left-panel', 'right-panel', 'bottom-panel', 'top-panel'];
        
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (panel) {
                this.panelStates.set(panelId, {
                    visible: true,
                    minimized: false,
                    size: this.getPanelSize(panel)
                });
            }
        });
    }

    /**
     * Setup panel toggle buttons
     */
    setupPanelToggles() {
        // Left panel toggle
        const leftToggle = document.getElementById('toggle-left-panel');
        const openLeftBtn = document.getElementById('open-left-panel-btn');
        
        if (leftToggle) {
            leftToggle.addEventListener('click', () => {
                this.togglePanel('left-panel');
            });
        }
        
        if (openLeftBtn) {
            openLeftBtn.addEventListener('click', () => {
                this.showPanel('left-panel');
            });
        }

        // Right panel toggle
        const rightToggle = document.getElementById('toggle-right-panel');
        const openRightBtn = document.getElementById('open-right-panel-btn');
        
        if (rightToggle) {
            rightToggle.addEventListener('click', () => {
                this.togglePanel('right-panel');
            });
        }
        
        if (openRightBtn) {
            openRightBtn.addEventListener('click', () => {
                this.showPanel('right-panel');
            });
        }
    }

    /**
     * Switch UI mode
     */
    switchMode(newMode, data = {}) {
        if (this.currentMode === newMode) return;

        const oldMode = this.currentMode;
        this.currentMode = newMode;

        const config = this.modeConfigurations[newMode];
        if (!config) return;

        // Animate mode transition
        this.animateModeTransition(oldMode, newMode, config, data);

        eventSystem.emit('uiModeChanged', {
            from: oldMode,
            to: newMode,
            data
        });
    }

    /**
     * Animate mode transition
     */
    animateModeTransition(oldMode, newMode, config, data) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.classList.add('mode-transitioning');
        }

        // Handle contextual panels
        if (config.contextualPanels) {
            const context = this.getModeContext(newMode, data);
            contextualPanels.switchContext(context, data);
        } else {
            contextualPanels.switchContext('hidden');
        }

        // Handle main panels
        this.updatePanelVisibility(config);

        // Apply mode-specific styles
        document.body.className = document.body.className.replace(/mode-\w+/g, '');
        document.body.classList.add(`mode-${newMode}`);

        setTimeout(() => {
            if (mainContent) {
                mainContent.classList.remove('mode-transitioning');
            }
        }, 300);
    }

    /**
     * Get context for mode
     */
    getModeContext(mode, data) {
        const contextMap = {
            'default': 'simulation-running',
            'creation': 'creation-mode',
            'analysis': 'analysis-mode',
            'element-focus': 'element-selected'
        };

        return contextMap[mode] || 'default';
    }

    /**
     * Update panel visibility based on mode
     */
    updatePanelVisibility(config) {
        const bottomPanel = document.getElementById('bottom-panel');
        
        if (bottomPanel) {
            if (config.bottomPanel) {
                bottomPanel.classList.remove('hidden');
                bottomPanel.classList.add('visible');
            } else {
                bottomPanel.classList.add('hidden');
                bottomPanel.classList.remove('visible');
            }
        }
    }

    /**
     * Handle element selection
     */
    handleElementSelection(data) {
        this.switchMode('element-focus', data);
    }

    /**
     * Handle element deselection
     */
    handleElementDeselection() {
        this.switchMode('default');
    }

    /**
     * Handle simulation state change
     */
    handleSimulationStateChange(data) {
        const context = data.state === 'running' ? 'simulation-running' : 'simulation-paused';
        contextualPanels.switchContext(context, data);
    }

    /**
     * Toggle main menu
     */
    toggleMainMenu() {
        if (menuSystem.currentMenu) {
            menuSystem.closeAllMenus();
            this.switchMode('default');
        } else {
            menuSystem.showMenu('main');
            this.switchMode('menu');
        }
    }

    /**
     * Toggle UI element
     */
    toggleUIElement(element, state) {
        switch (element) {
            case 'panels':
                this.toggleAllPanels(state);
                break;
            case 'contextual':
                this.toggleContextualPanels(state);
                break;
            case 'hud':
                this.toggleHUD(state);
                break;
        }
    }

    /**
     * Toggle panel
     */
    togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const state = this.panelStates.get(panelId);
        if (!state) return;

        if (state.visible) {
            this.hidePanel(panelId);
        } else {
            this.showPanel(panelId);
        }
    }

    /**
     * Show panel
     */
    showPanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        panel.classList.add('active');
        panel.classList.remove('hidden');

        const state = this.panelStates.get(panelId);
        if (state) {
            state.visible = true;
        }

        eventSystem.emit('panelShown', { panelId });
    }

    /**
     * Hide panel
     */
    hidePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        panel.classList.remove('active');
        
        // On mobile, hide immediately. On desktop, just remove active state
        if (window.innerWidth <= 1024) {
            panel.classList.add('hidden');
        }

        const state = this.panelStates.get(panelId);
        if (state) {
            state.visible = false;
        }

        eventSystem.emit('panelHidden', { panelId });
    }

    /**
     * Toggle all panels
     */
    toggleAllPanels(state) {
        const panels = ['left-panel', 'right-panel', 'bottom-panel'];
        
        panels.forEach(panelId => {
            if (state !== undefined) {
                if (state) {
                    this.showPanel(panelId);
                } else {
                    this.hidePanel(panelId);
                }
            } else {
                this.togglePanel(panelId);
            }
        });
    }

    /**
     * Toggle contextual panels
     */
    toggleContextualPanels(state) {
        const container = document.getElementById('contextual-panels');
        if (!container) return;

        if (state !== undefined) {
            container.style.display = state ? 'flex' : 'none';
        } else {
            const isVisible = container.style.display !== 'none';
            container.style.display = isVisible ? 'none' : 'flex';
        }
    }

    /**
     * Toggle HUD elements
     */
    toggleHUD(state) {
        const topPanel = document.getElementById('top-panel');
        
        if (topPanel) {
            if (state !== undefined) {
                topPanel.style.display = state ? 'flex' : 'none';
            } else {
                const isVisible = topPanel.style.display !== 'none';
                topPanel.style.display = isVisible ? 'none' : 'flex';
            }
        }
    }

    /**
     * Resize panel
     */
    resizePanel(panelId, size) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        // Apply size constraints
        const constraints = this.getPanelConstraints(panelId);
        const constrainedSize = this.constrainSize(size, constraints);

        // Apply new size
        this.applyPanelSize(panel, constrainedSize);

        // Update state
        const state = this.panelStates.get(panelId);
        if (state) {
            state.size = constrainedSize;
        }

        eventSystem.emit('panelResized', { panelId, size: constrainedSize });
    }

    /**
     * Get panel size
     */
    getPanelSize(panel) {
        const rect = panel.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * Get panel constraints
     */
    getPanelConstraints(panelId) {
        const constraints = {
            'left-panel': { minWidth: 250, maxWidth: 400 },
            'right-panel': { minWidth: 250, maxWidth: 400 },
            'bottom-panel': { minHeight: 150, maxHeight: 300 }
        };

        return constraints[panelId] || {};
    }

    /**
     * Constrain size within limits
     */
    constrainSize(size, constraints) {
        const constrained = { ...size };

        if (constraints.minWidth && constrained.width < constraints.minWidth) {
            constrained.width = constraints.minWidth;
        }
        if (constraints.maxWidth && constrained.width > constraints.maxWidth) {
            constrained.width = constraints.maxWidth;
        }
        if (constraints.minHeight && constrained.height < constraints.minHeight) {
            constrained.height = constraints.minHeight;
        }
        if (constraints.maxHeight && constrained.height > constraints.maxHeight) {
            constrained.height = constraints.maxHeight;
        }

        return constrained;
    }

    /**
     * Apply panel size
     */
    applyPanelSize(panel, size) {
        if (size.width) {
            panel.style.width = `${size.width}px`;
        }
        if (size.height) {
            panel.style.height = `${size.height}px`;
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const isMobile = window.innerWidth <= 1024;
        
        // Update panel states for responsive design
        this.panelStates.forEach((state, panelId) => {
            const panel = document.getElementById(panelId);
            if (panel) {
                if (isMobile) {
                    // On mobile, panels are overlays
                    panel.classList.add('mobile-overlay');
                } else {
                    // On desktop, panels are inline
                    panel.classList.remove('mobile-overlay');
                    panel.classList.remove('hidden');
                }
            }
        });

        // Notify subsystems of resize
        eventSystem.emit('windowResized', {
            width: window.innerWidth,
            height: window.innerHeight,
            isMobile
        });
    }

    /**
     * Get current UI state
     */
    getState() {
        return {
            mode: this.currentMode,
            panels: Object.fromEntries(this.panelStates),
            menuVisible: !!menuSystem.currentMenu,
            contextualPanelsVisible: contextualPanels.currentContext !== 'hidden'
        };
    }

    /**
     * Restore UI state
     */
    restoreState(state) {
        if (state.mode) {
            this.switchMode(state.mode);
        }

        if (state.panels) {
            Object.entries(state.panels).forEach(([panelId, panelState]) => {
                if (panelState.visible) {
                    this.showPanel(panelId);
                } else {
                    this.hidePanel(panelId);
                }
            });
        }
    }
}

// Create and export singleton instance
export const uiController = new UIController();