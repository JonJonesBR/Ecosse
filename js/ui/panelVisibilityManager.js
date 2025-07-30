/**
 * Panel Visibility Manager - Task 2: Implement robust panel visibility system
 * 
 * This class manages smooth show/hide animations for left and right panels,
 * provides panel state persistence across browser sessions, and creates
 * panel toggle controls that don't interfere with 3D rendering.
 * 
 * Requirements addressed:
 * - 1.1: Panels are visible and positioned correctly
 * - 1.2: Panels maintain positioning on resize and behave as overlays on mobile
 * - 4.1: Layout adapts to different screen sizes with appropriate panel behavior
 */

export class PanelVisibilityManager {
    constructor() {
        this.panels = new Map();
        this.isInitialized = false;
        this.animationDuration = 400; // ms
        this.storageKey = 'ecosse_panel_states';
        this.floatingToggles = new Map();
        
        // Panel states: 'visible', 'hidden', 'minimized'
        this.defaultStates = {
            left: 'visible',
            right: 'visible'
        };
        
        this.currentStates = { ...this.defaultStates };
        
        // Animation settings
        this.animations = {
            enabled: true,
            duration: 400,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            staggerDelay: 100
        };
        
        // State persistence settings
        this.persistence = {
            enabled: true,
            key: 'ecosse_panel_states',
            version: '1.0'
        };
        
        // Bind methods to preserve context
        this.handleKeyboardShortcuts = this.handleKeyboardShortcuts.bind(this);
        this.handleWindowResize = this.handleWindowResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    /**
     * Initialize the panel visibility manager
     */
    initialize() {
        if (this.isInitialized) {
            console.warn('PanelVisibilityManager already initialized');
            return;
        }

        console.log('🎛️ Initializing Panel Visibility Manager...');

        // Find and register panels
        this.registerPanels();
        
        // Load saved panel states
        this.loadPanelStates();
        
        // Create panel state management functions
        this.createStateManagementFunctions();
        
        // Add proper show/hide animations
        this.setupAnimations();
        
        // Implement panel toggle functionality with state persistence
        this.setupToggleFunctionality();
        
        // Create floating toggle controls
        this.createFloatingToggles();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Apply initial panel states
        this.applyPanelStates();
        
        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Initialize responsive behavior
        this.initializeResponsiveBehavior();
        
        this.isInitialized = true;
        console.log('✅ Panel Visibility Manager initialized with robust state management');
    }

    /**
     * Register panel elements
     */
    registerPanels() {
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        if (leftPanel) {
            this.panels.set('left', {
                element: leftPanel,
                originalWidth: leftPanel.offsetWidth || 280,
                state: 'visible',
                animating: false,
                lastStateChange: Date.now()
            });
            
            // Add panel content wrapper if not exists
            this.wrapPanelContent(leftPanel);
            
            // Add panel-specific classes
            leftPanel.classList.add('panel-managed', 'panel-left');
        }
        
        if (rightPanel) {
            this.panels.set('right', {
                element: rightPanel,
                originalWidth: rightPanel.offsetWidth || 280,
                state: 'visible',
                animating: false,
                lastStateChange: Date.now()
            });
            
            // Add panel content wrapper if not exists
            this.wrapPanelContent(rightPanel);
            
            // Add panel-specific classes
            rightPanel.classList.add('panel-managed', 'panel-right');
        }
        
        console.log(`📋 Registered ${this.panels.size} panels with enhanced state management`);
    }

    /**
     * Wrap panel content for smooth animations
     */
    wrapPanelContent(panel) {
        const existingWrapper = panel.querySelector('.panel-content');
        if (existingWrapper) return; // Already wrapped
        
        const content = Array.from(panel.children);
        const wrapper = document.createElement('div');
        wrapper.className = 'panel-content';
        
        // Move all children to wrapper
        content.forEach(child => {
            wrapper.appendChild(child);
        });
        
        // Add wrapper back to panel
        panel.appendChild(wrapper);
        
        // Add state indicator
        const indicator = document.createElement('div');
        indicator.className = 'panel-state-indicator';
        panel.appendChild(indicator);
    }

    /**
     * Create floating toggle controls
     */
    createFloatingToggles() {
        // Create left panel toggle
        if (this.panels.has('left')) {
            const leftToggle = this.createFloatingToggle('left', '◀', '▶');
            this.floatingToggles.set('left', leftToggle);
            document.body.appendChild(leftToggle);
        }
        
        // Create right panel toggle
        if (this.panels.has('right')) {
            const rightToggle = this.createFloatingToggle('right', '▶', '◀');
            this.floatingToggles.set('right', rightToggle);
            document.body.appendChild(rightToggle);
        }
    }

    /**
     * Create a floating toggle button
     */
    createFloatingToggle(panelName, showIcon, hideIcon) {
        const toggle = document.createElement('button');
        toggle.className = `floating-panel-toggle ${panelName}`;
        toggle.innerHTML = hideIcon; // Start with hide icon (panel visible)
        toggle.title = `Toggle ${panelName} panel (${panelName === 'left' ? 'Ctrl+1' : 'Ctrl+2'})`;
        toggle.setAttribute('data-panel', panelName);
        toggle.setAttribute('data-show-icon', showIcon);
        toggle.setAttribute('data-hide-icon', hideIcon);
        
        // Add click handler
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel(panelName);
        });
        
        return toggle;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Window resize handler
        window.addEventListener('resize', this.handleWindowResize);
        
        // Visibility change handler
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Listen for viewport changes from adaptive UI controller
        document.addEventListener('viewportChanged', (e) => {
            this.handleViewportChange(e.detail);
        });
        
        // Listen for panel state changes from other systems
        document.addEventListener('panelStateRequest', (e) => {
            this.handlePanelStateRequest(e.detail);
        });
        
        // Save panel states before page unload
        window.addEventListener('beforeunload', () => {
            this.savePanelStates();
        });
        
        // Listen for configuration changes that might affect panels
        document.addEventListener('configApplied', () => {
            // Auto-hide panels on mobile after config changes
            if (window.innerWidth <= 768) {
                this.panels.forEach((panel, name) => {
                    if (this.currentStates[name] === 'visible') {
                        this.hidePanel(name);
                    }
                });
            }
        });
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Ctrl+1: Toggle left panel
        if (e.key === '1' && e.ctrlKey) {
            e.preventDefault();
            this.togglePanel('left');
        }
        
        // Ctrl+2: Toggle right panel
        if (e.key === '2' && e.ctrlKey) {
            e.preventDefault();
            this.togglePanel('right');
        }
        
        // Ctrl+3: Toggle both panels
        if (e.key === '3' && e.ctrlKey) {
            e.preventDefault();
            this.toggleAllPanels();
        }
        
        // Ctrl+4: Minimize all panels
        if (e.key === '4' && e.ctrlKey) {
            e.preventDefault();
            this.minimizeAllPanels();
        }
        
        // Ctrl+0: Reset all panels to default
        if (e.key === '0' && e.ctrlKey) {
            e.preventDefault();
            this.resetPanelsToDefault();
        }
    }

    /**
     * Toggle panel visibility
     */
    togglePanel(panelName) {
        if (!this.panels.has(panelName)) {
            console.warn(`Panel ${panelName} not found`);
            return;
        }
        
        const currentState = this.currentStates[panelName];
        let newState;
        
        // Cycle through states: visible -> minimized -> hidden -> visible
        switch (currentState) {
            case 'visible':
                newState = 'minimized';
                break;
            case 'minimized':
                newState = 'hidden';
                break;
            case 'hidden':
                newState = 'visible';
                break;
            default:
                newState = 'visible';
        }
        
        this.setPanelState(panelName, newState);
    }

    /**
     * Set panel state with animation
     */
    setPanelState(panelName, state, skipAnimation = false) {
        if (!this.panels.has(panelName)) {
            console.warn(`Panel ${panelName} not found`);
            return;
        }
        
        const panel = this.panels.get(panelName);
        const element = panel.element;
        const previousState = this.currentStates[panelName];
        
        // Update state
        this.currentStates[panelName] = state;
        panel.state = state;
        
        console.log(`🎛️ Setting ${panelName} panel to ${state} (from ${previousState})`);
        
        // Apply visual state
        this.applyPanelVisualState(element, state, skipAnimation);
        
        // Update floating toggle
        this.updateFloatingToggle(panelName, state);
        
        // Notify layout change
        this.notifyLayoutChange(panelName, state, previousState);
        
        // Save states
        this.savePanelStates();
        
        // Dispatch custom event
        this.dispatchPanelStateEvent(panelName, state, previousState);
    }

    /**
     * Apply visual state to panel element
     */
    applyPanelVisualState(element, state, skipAnimation = false) {
        // Remove existing state classes
        element.classList.remove('panel-hidden', 'panel-minimized', 'panel-visible');
        element.classList.remove('panel-entering', 'panel-exiting', 'panel-minimizing');
        
        // Set CSS custom property for original width
        element.style.setProperty('--original-width', `${element.offsetWidth || 280}px`);
        
        // Apply new state with animations
        switch (state) {
            case 'hidden':
                if (!skipAnimation && this.animations.enabled) {
                    element.classList.add('panel-exiting');
                    setTimeout(() => {
                        element.classList.add('panel-hidden');
                    }, this.animations.duration);
                } else {
                    element.classList.add('panel-hidden');
                }
                break;
            case 'minimized':
                if (!skipAnimation && this.animations.enabled) {
                    element.classList.add('panel-minimizing');
                    setTimeout(() => {
                        element.classList.add('panel-minimized');
                    }, this.animations.duration);
                } else {
                    element.classList.add('panel-minimized');
                }
                break;
            case 'visible':
            default:
                if (!skipAnimation && this.animations.enabled) {
                    element.classList.add('panel-entering');
                    setTimeout(() => {
                        element.classList.add('panel-visible');
                    }, this.animations.duration);
                } else {
                    element.classList.add('panel-visible');
                }
                break;
        }
        
        // Stagger content animations
        if (!skipAnimation && this.animations.enabled && state === 'visible') {
            const content = element.querySelectorAll('.panel-content > *');
            content.forEach((item, index) => {
                item.style.transitionDelay = `${index * this.animations.staggerDelay}ms`;
            });
        }
    }

    /**
     * Update floating toggle button
     */
    updateFloatingToggle(panelName, state) {
        const toggle = this.floatingToggles.get(panelName);
        if (!toggle) return;
        
        const showIcon = toggle.getAttribute('data-show-icon');
        const hideIcon = toggle.getAttribute('data-hide-icon');
        
        switch (state) {
            case 'hidden':
                toggle.innerHTML = showIcon;
                toggle.title = `Show ${panelName} panel`;
                toggle.style.opacity = '0.7';
                break;
            case 'minimized':
                toggle.innerHTML = '◐';
                toggle.title = `Expand ${panelName} panel`;
                toggle.style.opacity = '0.8';
                break;
            case 'visible':
            default:
                toggle.innerHTML = hideIcon;
                toggle.title = `Hide ${panelName} panel`;
                toggle.style.opacity = '1';
                break;
        }
    }

    /**
     * Toggle all panels
     */
    toggleAllPanels() {
        const allHidden = Object.values(this.currentStates).every(state => state === 'hidden');
        const targetState = allHidden ? 'visible' : 'hidden';
        
        this.panels.forEach((panel, name) => {
            this.setPanelState(name, targetState);
        });
        
        console.log(`🎛️ All panels set to ${targetState}`);
    }

    /**
     * Minimize all panels
     */
    minimizeAllPanels() {
        this.panels.forEach((panel, name) => {
            this.setPanelState(name, 'minimized');
        });
        
        console.log('🎛️ All panels minimized');
    }

    /**
     * Reset panels to default state
     */
    resetPanelsToDefault() {
        Object.keys(this.defaultStates).forEach(panelName => {
            this.setPanelState(panelName, this.defaultStates[panelName]);
        });
        
        console.log('🎛️ Panels reset to default state');
    }

    /**
     * Load panel states from localStorage
     */
    loadPanelStates() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const states = JSON.parse(saved);
                this.currentStates = { ...this.defaultStates, ...states };
                console.log('📂 Loaded panel states:', this.currentStates);
            }
        } catch (error) {
            console.warn('⚠️ Failed to load panel states:', error);
            this.currentStates = { ...this.defaultStates };
        }
    }

    /**
     * Save panel states to localStorage
     */
    savePanelStates() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.currentStates));
        } catch (error) {
            console.warn('⚠️ Failed to save panel states:', error);
        }
    }

    /**
     * Apply panel states (used during initialization)
     */
    applyPanelStates() {
        Object.keys(this.currentStates).forEach(panelName => {
            if (this.panels.has(panelName)) {
                this.setPanelState(panelName, this.currentStates[panelName], true);
            }
        });
    }

    /**
     * Handle window resize
     */
    handleWindowResize() {
        // Update floating toggle positions if needed
        this.updateFloatingTogglePositions();
    }

    /**
     * Update floating toggle positions
     */
    updateFloatingTogglePositions() {
        // Adjust toggle positions based on current panel states and viewport
        this.floatingToggles.forEach((toggle, panelName) => {
            const panel = this.panels.get(panelName);
            if (!panel) return;
            
            const state = this.currentStates[panelName];
            
            // Adjust position based on panel state
            if (state === 'hidden') {
                if (panelName === 'left') {
                    toggle.style.left = '-20px';
                } else if (panelName === 'right') {
                    toggle.style.right = '-20px';
                }
            } else {
                if (panelName === 'left') {
                    toggle.style.left = `${panel.element.offsetWidth - 20}px`;
                } else if (panelName === 'right') {
                    toggle.style.right = `${panel.element.offsetWidth - 20}px`;
                }
            }
        });
    }

    /**
     * Handle viewport change from adaptive UI controller
     */
    handleViewportChange(detail) {
        const { to: viewport } = detail;
        
        // Adjust panel behavior based on viewport
        if (viewport === 'mobile') {
            // On mobile, prefer hidden panels to maximize space
            this.panels.forEach((panel, name) => {
                if (this.currentStates[name] === 'visible') {
                    this.setPanelState(name, 'hidden');
                }
            });
        } else if (viewport === 'desktop') {
            // On desktop, restore visible panels
            this.panels.forEach((panel, name) => {
                if (this.currentStates[name] === 'hidden') {
                    this.setPanelState(name, 'visible');
                }
            });
        }
    }

    /**
     * Handle panel state requests from other systems
     */
    handlePanelStateRequest(detail) {
        const { panelName, state, source } = detail;
        
        console.log(`🎛️ Panel state request from ${source}: ${panelName} -> ${state}`);
        
        if (this.panels.has(panelName)) {
            this.setPanelState(panelName, state);
        }
    }

    /**
     * Notify layout change to other systems
     */
    notifyLayoutChange(panelName, newState, previousState) {
        // Calculate available space for main content
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        let leftWidth = 0;
        let rightWidth = 0;
        
        // Calculate panel widths based on states
        if (this.panels.has('left')) {
            const leftState = this.currentStates.left;
            if (leftState === 'visible') {
                leftWidth = this.panels.get('left').originalWidth;
            } else if (leftState === 'minimized') {
                leftWidth = 60; // Minimized width
            }
        }
        
        if (this.panels.has('right')) {
            const rightState = this.currentStates.right;
            if (rightState === 'visible') {
                rightWidth = this.panels.get('right').originalWidth;
            } else if (rightState === 'minimized') {
                rightWidth = 60; // Minimized width
            }
        }
        
        // Update main content width
        const availableWidth = window.innerWidth - leftWidth - rightWidth;
        mainContent.style.width = `${availableWidth}px`;
        
        // Update floating toggle positions
        this.updateFloatingTogglePositions();
        
        console.log(`📐 Layout updated: main content width = ${availableWidth}px`);
    }

    /**
     * Dispatch panel state change event
     */
    dispatchPanelStateEvent(panelName, newState, previousState) {
        const event = new CustomEvent('panelStateChanged', {
            detail: {
                panelName,
                newState,
                previousState,
                allStates: { ...this.currentStates },
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Get current panel states
     */
    getPanelStates() {
        return { ...this.currentStates };
    }

    /**
     * Get panel visibility info
     */
    getPanelVisibilityInfo() {
        const info = {};
        
        this.panels.forEach((panel, name) => {
            info[name] = {
                state: this.currentStates[name],
                element: panel.element,
                width: panel.element.offsetWidth,
                visible: this.currentStates[name] !== 'hidden'
            };
        });
        
        return info;
    }

    /**
     * Check if panel is visible
     */
    isPanelVisible(panelName) {
        return this.currentStates[panelName] === 'visible';
    }

    /**
     * Check if panel is hidden
     */
    isPanelHidden(panelName) {
        return this.currentStates[panelName] === 'hidden';
    }

    /**
     * Check if panel is minimized
     */
    isPanelMinimized(panelName) {
        return this.currentStates[panelName] === 'minimized';
    }

    /**
     * Create panel state management functions
     */
    createStateManagementFunctions() {
        // Enhanced show panel function
        this.showPanel = (panelName, options = {}) => {
            if (!this.panels.has(panelName)) {
                console.warn(`Panel ${panelName} not found`);
                return Promise.reject(new Error(`Panel ${panelName} not found`));
            }

            const { animate = true, force = false } = options;
            const currentState = this.currentStates[panelName];

            if (currentState === 'visible' && !force) {
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                this.setPanelState(panelName, 'visible', !animate);
                
                if (animate) {
                    setTimeout(resolve, this.animations.duration);
                } else {
                    resolve();
                }
            });
        };

        // Enhanced hide panel function
        this.hidePanel = (panelName, options = {}) => {
            if (!this.panels.has(panelName)) {
                console.warn(`Panel ${panelName} not found`);
                return Promise.reject(new Error(`Panel ${panelName} not found`));
            }

            const { animate = true, force = false } = options;
            const currentState = this.currentStates[panelName];

            if (currentState === 'hidden' && !force) {
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                this.setPanelState(panelName, 'hidden', !animate);
                
                if (animate) {
                    setTimeout(resolve, this.animations.duration);
                } else {
                    resolve();
                }
            });
        };

        // Enhanced minimize panel function
        this.minimizePanel = (panelName, options = {}) => {
            if (!this.panels.has(panelName)) {
                console.warn(`Panel ${panelName} not found`);
                return Promise.reject(new Error(`Panel ${panelName} not found`));
            }

            const { animate = true, force = false } = options;
            const currentState = this.currentStates[panelName];

            if (currentState === 'minimized' && !force) {
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                this.setPanelState(panelName, 'minimized', !animate);
                
                if (animate) {
                    setTimeout(resolve, this.animations.duration);
                } else {
                    resolve();
                }
            });
        };

        console.log('📋 Panel state management functions created');
    }

    /**
     * Setup animations for panels
     */
    setupAnimations() {
        // Add CSS animation classes if not already present
        this.injectAnimationStyles();
        
        // Set up animation event listeners
        this.panels.forEach((panel, name) => {
            const element = panel.element;
            
            // Animation start listener
            element.addEventListener('animationstart', (e) => {
                if (e.target === element) {
                    panel.animating = true;
                    console.log(`🎬 Animation started for ${name} panel: ${e.animationName}`);
                }
            });
            
            // Animation end listener
            element.addEventListener('animationend', (e) => {
                if (e.target === element) {
                    panel.animating = false;
                    console.log(`🎬 Animation ended for ${name} panel: ${e.animationName}`);
                    
                    // Clean up animation classes
                    element.classList.remove('panel-entering', 'panel-exiting', 'panel-minimizing');
                }
            });
            
            // Transition end listener
            element.addEventListener('transitionend', (e) => {
                if (e.target === element && (e.propertyName === 'transform' || e.propertyName === 'opacity')) {
                    panel.animating = false;
                    console.log(`🎬 Transition ended for ${name} panel: ${e.propertyName}`);
                }
            });
        });
        
        console.log('🎬 Panel animations configured');
    }

    /**
     * Inject animation styles
     */
    injectAnimationStyles() {
        const styleId = 'panel-visibility-animations';
        
        if (document.getElementById(styleId)) {
            return; // Already injected
        }
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Panel visibility animations */
            .panel-managed {
                transition: all ${this.animations.duration}ms ${this.animations.easing};
            }
            
            .panel-entering {
                animation: panelSlideIn ${this.animations.duration}ms ${this.animations.easing} forwards;
            }
            
            .panel-exiting {
                animation: panelSlideOut ${this.animations.duration}ms ${this.animations.easing} forwards;
            }
            
            .panel-minimizing {
                animation: panelMinimize ${this.animations.duration}ms ${this.animations.easing} forwards;
            }
            
            @keyframes panelSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(-100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            .panel-right.panel-entering {
                animation: panelSlideInRight ${this.animations.duration}ms ${this.animations.easing} forwards;
            }
            
            .panel-right.panel-exiting {
                animation: panelSlideOutRight ${this.animations.duration}ms ${this.animations.easing} forwards;
            }
            
            @keyframes panelSlideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes panelSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-100%);
                }
            }
            
            @keyframes panelSlideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
            
            @keyframes panelMinimize {
                from {
                    width: var(--original-width, 280px);
                    opacity: 1;
                }
                to {
                    width: 60px;
                    opacity: 0.8;
                }
            }
            
            /* Content stagger animations */
            .panel-content > * {
                transition: all ${this.animations.duration * 0.6}ms ${this.animations.easing};
            }
            
            .panel-hidden .panel-content > * {
                opacity: 0;
                transform: translateY(-10px);
            }
            
            .panel-minimized .panel-content > * {
                opacity: 0;
                transform: scale(0.8);
            }
            
            .panel-visible .panel-content > * {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            
            /* Responsive animations */
            @media (max-width: 768px) {
                .panel-managed {
                    transition-duration: ${this.animations.duration * 0.8}ms;
                }
            }
            
            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
                .panel-managed,
                .panel-content > * {
                    transition: none !important;
                    animation: none !important;
                }
            }
        `;
        
        document.head.appendChild(style);
        console.log('🎨 Panel animation styles injected');
    }

    /**
     * Setup toggle functionality with state persistence
     */
    setupToggleFunctionality() {
        // Enhanced toggle functionality that integrates with existing buttons
        const leftToggleBtn = document.getElementById('toggle-left-panel');
        const rightToggleBtn = document.getElementById('toggle-right-panel');
        const openLeftBtn = document.getElementById('open-left-panel-btn');
        const openRightBtn = document.getElementById('open-right-panel-btn');
        
        // Replace existing event listeners with enhanced ones
        if (leftToggleBtn) {
            // Remove existing listeners by cloning the element
            const newLeftToggleBtn = leftToggleBtn.cloneNode(true);
            leftToggleBtn.parentNode.replaceChild(newLeftToggleBtn, leftToggleBtn);
            
            newLeftToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.togglePanel('left');
            });
        }
        
        if (rightToggleBtn) {
            // Remove existing listeners by cloning the element
            const newRightToggleBtn = rightToggleBtn.cloneNode(true);
            rightToggleBtn.parentNode.replaceChild(newRightToggleBtn, rightToggleBtn);
            
            newRightToggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.togglePanel('right');
            });
        }
        
        if (openLeftBtn) {
            // Remove existing listeners by cloning the element
            const newOpenLeftBtn = openLeftBtn.cloneNode(true);
            openLeftBtn.parentNode.replaceChild(newOpenLeftBtn, openLeftBtn);
            
            newOpenLeftBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showPanel('left');
            });
        }
        
        if (openRightBtn) {
            // Remove existing listeners by cloning the element
            const newOpenRightBtn = openRightBtn.cloneNode(true);
            openRightBtn.parentNode.replaceChild(newOpenRightBtn, openRightBtn);
            
            newOpenRightBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showPanel('right');
            });
        }
        
        console.log('🔄 Enhanced toggle functionality configured with state persistence');
    }

    /**
     * Initialize responsive behavior
     */
    initializeResponsiveBehavior() {
        // Set up media query listeners for responsive behavior
        const mobileQuery = window.matchMedia('(max-width: 768px)');
        const tabletQuery = window.matchMedia('(min-width: 769px) and (max-width: 1024px)');
        const desktopQuery = window.matchMedia('(min-width: 1025px)');
        
        const handleMobileChange = (e) => {
            if (e.matches) {
                // Mobile: panels should behave as overlays
                this.panels.forEach((panel, name) => {
                    panel.element.classList.add('panel-overlay');
                    if (this.currentStates[name] === 'visible') {
                        // Keep visible panels but make them overlay
                        panel.element.style.position = 'fixed';
                        panel.element.style.zIndex = '100';
                    }
                });
                console.log('📱 Mobile layout: panels set to overlay mode');
            } else {
                // Not mobile: remove overlay behavior
                this.panels.forEach((panel, name) => {
                    panel.element.classList.remove('panel-overlay');
                    panel.element.style.position = '';
                    panel.element.style.zIndex = '';
                });
            }
        };
        
        const handleTabletChange = (e) => {
            if (e.matches) {
                // Tablet: panels should be collapsible
                this.panels.forEach((panel, name) => {
                    panel.element.classList.add('panel-collapsible');
                });
                console.log('📱 Tablet layout: panels set to collapsible mode');
            } else {
                this.panels.forEach((panel, name) => {
                    panel.element.classList.remove('panel-collapsible');
                });
            }
        };
        
        const handleDesktopChange = (e) => {
            if (e.matches) {
                // Desktop: panels should be fixed side panels
                this.panels.forEach((panel, name) => {
                    panel.element.classList.add('panel-fixed');
                    // Restore visible state for desktop
                    if (this.currentStates[name] === 'hidden') {
                        this.setPanelState(name, 'visible', false);
                    }
                });
                console.log('🖥️ Desktop layout: panels set to fixed mode');
            } else {
                this.panels.forEach((panel, name) => {
                    panel.element.classList.remove('panel-fixed');
                });
            }
        };
        
        // Add listeners
        mobileQuery.addListener(handleMobileChange);
        tabletQuery.addListener(handleTabletChange);
        desktopQuery.addListener(handleDesktopChange);
        
        // Initial check
        handleMobileChange(mobileQuery);
        handleTabletChange(tabletQuery);
        handleDesktopChange(desktopQuery);
        
        console.log('📱 Responsive behavior initialized');
    }

    /**
     * Enhanced state persistence with versioning
     */
    loadPanelStates() {
        if (!this.persistence.enabled) {
            this.currentStates = { ...this.defaultStates };
            return;
        }
        
        try {
            const saved = localStorage.getItem(this.persistence.key);
            if (saved) {
                const data = JSON.parse(saved);
                
                // Check version compatibility
                if (data.version === this.persistence.version) {
                    this.currentStates = { ...this.defaultStates, ...data.states };
                    console.log('📂 Loaded panel states:', this.currentStates);
                } else {
                    console.log('📂 Panel states version mismatch, using defaults');
                    this.currentStates = { ...this.defaultStates };
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to load panel states:', error);
            this.currentStates = { ...this.defaultStates };
        }
    }

    /**
     * Enhanced state persistence with versioning
     */
    savePanelStates() {
        if (!this.persistence.enabled) {
            return;
        }
        
        try {
            const data = {
                version: this.persistence.version,
                states: this.currentStates,
                timestamp: Date.now()
            };
            localStorage.setItem(this.persistence.key, JSON.stringify(data));
        } catch (error) {
            console.warn('⚠️ Failed to save panel states:', error);
        }
    }

    /**
     * Handle visibility change (pause animations when tab is hidden)
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Pause animations when tab is hidden
            this.animations.enabled = false;
            document.body.classList.add('animations-paused');
        } else {
            // Resume animations when tab is visible
            this.animations.enabled = true;
            document.body.classList.remove('animations-paused');
        }
    }

    /**
     * Dispose of resources
     */
    dispose() {
        // Remove event listeners
        window.removeEventListener('resize', this.handleWindowResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
        
        // Remove floating toggles
        this.floatingToggles.forEach(toggle => {
            if (toggle.parentNode) {
                toggle.parentNode.removeChild(toggle);
            }
        });
        
        // Remove injected styles
        const styleElement = document.getElementById('panel-visibility-animations');
        if (styleElement) {
            styleElement.remove();
        }
        
        // Clear references
        this.panels.clear();
        this.floatingToggles.clear();
        this.isInitialized = false;
        
        console.log('PanelVisibilityManager disposed with enhanced cleanup');
    }
}

// Create and export singleton instance
export const panelVisibilityManager = new PanelVisibilityManager();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.panelVisibilityManager = panelVisibilityManager;
    console.log('🔧 Panel Visibility Manager available globally');
}