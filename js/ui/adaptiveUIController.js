/**
 * AdaptiveUIController - Task 5: Add adaptive UI controller for different screen sizes
 * 
 * This class manages responsive UI behavior across different viewport types,
 * providing adaptive layouts and touch-friendly controls for mobile devices.
 * 
 * Requirements addressed:
 * - 5.1: Layout reorganizes for smaller screens
 * - 5.2: Touch-friendly controls for mobile devices  
 * - 5.3: Responsive layout configurations for each viewport type
 */

export class AdaptiveUIController {
    constructor() {
        this.currentViewport = 'desktop';
        this.breakpoints = {
            mobile: { max: 768 },
            tablet: { min: 769, max: 1024 },
            desktop: { min: 1025 }
        };
        this.isInitialized = false;
        this.resizeTimeout = null;
        this.lastResizeTime = null;
        this.touchDevice = false;
        this.layoutConfigurations = new Map();
        
        // Bind methods to preserve context
        this.handleResize = this.handleResize.bind(this);
        this.debouncedResize = this.debouncedResize.bind(this);
        this.handleOrientationChange = this.handleOrientationChange.bind(this);
    }

    /**
     * Initialize the adaptive UI controller
     */
    initialize() {
        if (this.isInitialized) {
            console.warn('AdaptiveUIController already initialized');
            return;
        }

        // Detect touch device capability
        this.detectTouchDevice();
        
        // Set up layout configurations
        this.setupLayoutConfigurations();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Perform initial viewport detection and layout application
        this.detectViewportAndApplyLayout();
        
        this.isInitialized = true;
        console.log('✅ AdaptiveUIController initialized');
    }

    /**
     * Detect if device has touch capabilities
     */
    detectTouchDevice() {
        this.touchDevice = (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0
        );
        
        if (this.touchDevice) {
            document.body.classList.add('touch-device');
            console.log('📱 Touch device detected');
        } else {
            document.body.classList.add('non-touch-device');
        }
    }

    /**
     * Set up responsive layout configurations for each viewport type
     */
    setupLayoutConfigurations() {
        // Mobile configuration - Enhanced overlay panels
        this.layoutConfigurations.set('mobile', {
            panelBehavior: 'overlay',
            bottomPanelPosition: 'fixed-bottom',
            elementGridColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            controlButtonSize: 'large',
            touchTargetMinSize: 44, // 44px minimum touch target
            panelWidth: '85vw', // Improved mobile panel width
            panelHeight: 'auto',
            floatingPanelMaxHeight: '50vh',
            compactMode: true,
            hideSecondaryControls: true,
            simplifiedNavigation: true,
            // Enhanced mobile-specific settings
            overlayBackdrop: true,
            swipeGestures: true,
            autoHidePanels: true,
            reducedAnimations: false,
            mobileOptimizedSpacing: true
        });

        // Tablet configuration - Enhanced collapsible panels
        this.layoutConfigurations.set('tablet', {
            panelBehavior: 'collapsible',
            bottomPanelPosition: 'floating',
            elementGridColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            controlButtonSize: 'medium',
            touchTargetMinSize: 40,
            panelWidth: '320px',
            panelHeight: 'auto',
            floatingPanelMaxHeight: '60vh',
            compactMode: false,
            hideSecondaryControls: false,
            simplifiedNavigation: false,
            // Enhanced tablet-specific settings
            collapsedWidth: '60px',
            expandOnHover: true,
            smoothTransitions: true,
            adaptiveSpacing: true,
            contextualCollapse: true
        });

        // Desktop configuration - Enhanced fixed panels
        this.layoutConfigurations.set('desktop', {
            panelBehavior: 'fixed',
            bottomPanelPosition: 'floating',
            elementGridColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            controlButtonSize: 'normal',
            touchTargetMinSize: 32,
            panelWidth: '280px',
            panelHeight: 'auto',
            floatingPanelMaxHeight: '65vh',
            compactMode: false,
            hideSecondaryControls: false,
            simplifiedNavigation: false,
            // Enhanced desktop-specific settings
            fixedPanelLayout: true,
            hoverEffects: true,
            keyboardNavigation: true,
            advancedControls: true,
            maximizedCanvas: true
        });
    }

    /**
     * Set up event listeners for responsive behavior
     */
    setupEventListeners() {
        window.addEventListener('resize', this.debouncedResize);
        window.addEventListener('orientationchange', this.handleOrientationChange);
        
        // Listen for panel state changes
        document.addEventListener('panelToggle', (e) => {
            this.handlePanelToggle(e.detail);
        });
    }

    /**
     * Optimized debounced resize handler with performance improvements
     */
    debouncedResize() {
        // Clear existing timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Use shorter debounce for better responsiveness, but throttle rapid calls
        const now = performance.now();
        if (!this.lastResizeTime) {
            this.lastResizeTime = now;
        }
        
        const timeSinceLastResize = now - this.lastResizeTime;
        const minInterval = 16; // ~60fps
        
        if (timeSinceLastResize < minInterval) {
            // Too soon, use longer debounce
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
                this.lastResizeTime = performance.now();
            }, 200);
        } else {
            // Enough time has passed, use shorter debounce
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
                this.lastResizeTime = performance.now();
            }, 100);
        }
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        const previousViewport = this.currentViewport;
        this.detectViewportAndApplyLayout();
        
        if (previousViewport !== this.currentViewport) {
            console.log(`📱 Viewport changed: ${previousViewport} → ${this.currentViewport}`);
            this.dispatchViewportChangeEvent(previousViewport, this.currentViewport);
        }
    }

    /**
     * Handle orientation change events
     */
    handleOrientationChange() {
        // Add delay to allow for orientation change to complete
        setTimeout(() => {
            this.handleResize();
            this.adjustForOrientation();
        }, 500);
    }

    /**
     * Detect current viewport type and apply appropriate layout
     */
    detectViewportAndApplyLayout() {
        const width = window.innerWidth;
        let newViewport = 'desktop';

        if (width <= this.breakpoints.mobile.max) {
            newViewport = 'mobile';
        } else if (width <= this.breakpoints.tablet.max) {
            newViewport = 'tablet';
        }

        if (newViewport !== this.currentViewport) {
            this.currentViewport = newViewport;
            this.applyLayoutConfiguration(newViewport);
        }
    }

    /**
     * Apply layout configuration for specific viewport
     * @param {string} viewport - Viewport type (mobile, tablet, desktop)
     */
    applyLayoutConfiguration(viewport) {
        const config = this.layoutConfigurations.get(viewport);
        if (!config) {
            console.warn(`No configuration found for viewport: ${viewport}`);
            return;
        }

        console.log(`🎨 Applying ${viewport} layout configuration`);

        // Update body class for viewport-specific styling
        document.body.className = document.body.className.replace(/viewport-\w+/g, '');
        document.body.classList.add(`viewport-${viewport}`);

        // Apply panel behavior
        this.applyPanelBehavior(config);
        
        // Apply bottom panel positioning
        this.applyBottomPanelPosition(config);
        
        // Apply element grid configuration
        this.applyElementGridConfiguration(config);
        
        // Apply control button sizing
        this.applyControlButtonSizing(config);
        
        // Apply touch-friendly configurations
        if (this.touchDevice) {
            this.applyTouchFriendlyConfiguration(config);
        }
        
        // Apply compact mode if needed
        if (config.compactMode) {
            this.enableCompactMode();
        } else {
            this.disableCompactMode();
        }
        
        // Handle secondary controls visibility
        this.toggleSecondaryControls(!config.hideSecondaryControls);
        
        // Apply simplified navigation if needed
        if (config.simplifiedNavigation) {
            this.enableSimplifiedNavigation();
        } else {
            this.disableSimplifiedNavigation();
        }
    }

    /**
     * Apply panel behavior configuration
     * @param {Object} config - Layout configuration
     */
    applyPanelBehavior(config) {
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        const mainContent = document.getElementById('main-content');
        
        [leftPanel, rightPanel].forEach(panel => {
            if (!panel) return;
            
            // Remove existing behavior classes
            panel.classList.remove('panel-overlay', 'panel-collapsible', 'panel-inline', 'panel-fixed');
            
            // Apply new behavior
            switch (config.panelBehavior) {
                case 'overlay':
                    this.applyOverlayPanelBehavior(panel, config);
                    break;
                case 'collapsible':
                    this.applyCollapsiblePanelBehavior(panel, config);
                    break;
                case 'fixed':
                    this.applyFixedPanelBehavior(panel, config);
                    break;
                case 'inline':
                    this.applyInlinePanelBehavior(panel, config);
                    break;
            }
        });
        
        // Apply main content adjustments
        this.adjustMainContentForPanels(config);
        
        // Add mobile-specific touch gestures for overlay panels
        if (config.panelBehavior === 'overlay' && this.touchDevice) {
            this.setupMobilePanelGestures();
        }
        
        // Add tablet-specific collapsible behavior
        if (config.panelBehavior === 'collapsible') {
            this.setupTabletCollapsibleBehavior(config);
        }
        
        // Add desktop-specific fixed panel behavior
        if (config.panelBehavior === 'fixed') {
            this.setupDesktopFixedBehavior(config);
        }
    }

    /**
     * Apply overlay panel behavior for mobile
     * @param {HTMLElement} panel - Panel element
     * @param {Object} config - Layout configuration
     */
    applyOverlayPanelBehavior(panel, config) {
        panel.classList.add('panel-overlay');
        panel.style.width = config.panelWidth;
        panel.style.height = '100vh';
        panel.style.position = 'fixed';
        panel.style.top = '0';
        panel.style.zIndex = '1000';
        
        // Set initial position based on panel side
        if (panel.id === 'left-panel') {
            panel.style.left = '0';
            panel.style.transform = 'translateX(-100%)';
        } else if (panel.id === 'right-panel') {
            panel.style.right = '0';
            panel.style.transform = 'translateX(100%)';
        }
        
        // Ensure overlay panels are initially hidden on mobile
        if (this.currentViewport === 'mobile') {
            panel.classList.remove('active');
        }
        
        // Add backdrop if configured
        if (config.overlayBackdrop) {
            this.setupOverlayBackdrop(panel);
        }
        
        // Add mobile-optimized spacing
        if (config.mobileOptimizedSpacing) {
            panel.style.padding = '1rem 0.75rem';
        }
    }

    /**
     * Apply collapsible panel behavior for tablet
     * @param {HTMLElement} panel - Panel element
     * @param {Object} config - Layout configuration
     */
    applyCollapsiblePanelBehavior(panel, config) {
        panel.classList.add('panel-collapsible');
        panel.style.width = config.panelWidth;
        panel.style.position = 'relative';
        panel.style.height = '100vh';
        panel.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        
        // Add collapse toggle functionality
        this.addCollapseToggle(panel, config);
        
        // Set up expand on hover if configured
        if (config.expandOnHover) {
            this.setupExpandOnHover(panel, config);
        }
    }

    /**
     * Apply fixed panel behavior for desktop
     * @param {HTMLElement} panel - Panel element
     * @param {Object} config - Layout configuration
     */
    applyFixedPanelBehavior(panel, config) {
        panel.classList.add('panel-fixed');
        panel.style.width = config.panelWidth;
        panel.style.position = 'relative';
        panel.style.height = '100vh';
        panel.style.flexShrink = '0';
        
        // Ensure panels are always visible on desktop
        panel.classList.add('active');
        panel.style.transform = 'translateX(0)';
        
        // Add desktop-specific enhancements
        if (config.hoverEffects) {
            this.setupDesktopHoverEffects(panel);
        }
        
        if (config.keyboardNavigation) {
            this.setupKeyboardNavigation(panel);
        }
    }

    /**
     * Apply inline panel behavior (fallback)
     * @param {HTMLElement} panel - Panel element
     * @param {Object} config - Layout configuration
     */
    applyInlinePanelBehavior(panel, config) {
        panel.classList.add('panel-inline');
        panel.style.width = config.panelWidth;
        panel.style.position = 'relative';
        panel.style.height = '100vh';
        panel.style.flexShrink = '0';
    }
    
    /**
     * Set up mobile panel gestures for overlay panels
     */
    setupMobilePanelGestures() {
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        [leftPanel, rightPanel].forEach(panel => {
            if (!panel) return;
            
            let startX = 0;
            let currentX = 0;
            let isDragging = false;
            
            panel.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
            }, { passive: true });
            
            panel.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                currentX = e.touches[0].clientX;
                const deltaX = currentX - startX;
                
                // Allow swiping to close panels
                if (panel.id === 'left-panel' && deltaX < -50) {
                    panel.classList.remove('active');
                } else if (panel.id === 'right-panel' && deltaX > 50) {
                    panel.classList.remove('active');
                }
            }, { passive: true });
            
            panel.addEventListener('touchend', () => {
                isDragging = false;
            }, { passive: true });
        });
    }

    /**
     * Apply bottom panel positioning
     * @param {Object} config - Layout configuration
     */
    applyBottomPanelPosition(config) {
        const bottomPanel = document.getElementById('bottom-panel');
        if (!bottomPanel) return;
        
        // Remove existing position classes
        bottomPanel.classList.remove('position-fixed-bottom', 'position-floating');
        
        // Apply new position
        switch (config.bottomPanelPosition) {
            case 'fixed-bottom':
                bottomPanel.classList.add('position-fixed-bottom');
                bottomPanel.style.maxHeight = config.floatingPanelMaxHeight;
                break;
            case 'floating':
                bottomPanel.classList.add('position-floating');
                bottomPanel.style.maxHeight = config.floatingPanelMaxHeight;
                break;
        }
    }

    /**
     * Apply element grid configuration
     * @param {Object} config - Layout configuration
     */
    applyElementGridConfiguration(config) {
        const elementGrids = document.querySelectorAll('.element-grid');
        
        elementGrids.forEach(grid => {
            grid.style.gridTemplateColumns = config.elementGridColumns;
        });
    }

    /**
     * Apply control button sizing
     * @param {Object} config - Layout configuration
     */
    applyControlButtonSizing(config) {
        const buttons = document.querySelectorAll('.btn, .control-btn, .element-item');
        
        // Remove existing size classes
        buttons.forEach(button => {
            button.classList.remove('btn-small', 'btn-medium', 'btn-large');
            
            // Apply new size class
            switch (config.controlButtonSize) {
                case 'large':
                    button.classList.add('btn-large');
                    break;
                case 'medium':
                    button.classList.add('btn-medium');
                    break;
                case 'normal':
                default:
                    // Default styling, no additional class needed
                    break;
            }
        });
    }

    /**
     * Apply touch-friendly configuration
     * @param {Object} config - Layout configuration
     */
    applyTouchFriendlyConfiguration(config) {
        if (!this.touchDevice) return;
        
        const interactiveElements = document.querySelectorAll(
            '.btn, .control-btn, .element-item, .multiplier-btn, .panel-toggle-btn'
        );
        
        interactiveElements.forEach(element => {
            // Ensure minimum touch target size
            const currentStyle = window.getComputedStyle(element);
            const currentHeight = parseInt(currentStyle.height);
            const currentWidth = parseInt(currentStyle.width);
            
            if (currentHeight < config.touchTargetMinSize) {
                element.style.minHeight = `${config.touchTargetMinSize}px`;
            }
            
            if (currentWidth < config.touchTargetMinSize) {
                element.style.minWidth = `${config.touchTargetMinSize}px`;
            }
            
            // Add touch-friendly class for additional styling
            element.classList.add('touch-friendly');
        });
        
        // Add touch-specific event handlers
        this.setupTouchEventHandlers();
    }

    /**
     * Set up touch-specific event handlers
     */
    setupTouchEventHandlers() {
        // Add touch feedback for interactive elements
        const interactiveElements = document.querySelectorAll('.touch-friendly');
        
        interactiveElements.forEach(element => {
            element.addEventListener('touchstart', (e) => {
                element.classList.add('touch-active');
            }, { passive: true });
            
            element.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    element.classList.remove('touch-active');
                }, 150);
            }, { passive: true });
            
            element.addEventListener('touchcancel', (e) => {
                element.classList.remove('touch-active');
            }, { passive: true });
        });
        
        // Add edge swipe gestures for mobile panel access
        if (this.currentViewport === 'mobile') {
            this.setupEdgeSwipeGestures();
        }
    }
    
    /**
     * Set up edge swipe gestures for mobile panel access
     */
    setupEdgeSwipeGestures() {
        let startX = 0;
        let startY = 0;
        let isEdgeSwipe = false;
        
        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            
            // Check if touch started near screen edges
            const edgeThreshold = 20;
            isEdgeSwipe = startX < edgeThreshold || startX > window.innerWidth - edgeThreshold;
        }, { passive: true });
        
        document.addEventListener('touchmove', (e) => {
            if (!isEdgeSwipe) return;
            
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - startX;
            const deltaY = Math.abs(currentY - startY);
            
            // Ensure horizontal swipe (not vertical scroll)
            if (deltaY > 50) {
                isEdgeSwipe = false;
                return;
            }
            
            // Left edge swipe right to open left panel
            if (startX < 20 && deltaX > 50) {
                const leftPanel = document.getElementById('left-panel');
                if (leftPanel) {
                    leftPanel.classList.add('active');
                }
                isEdgeSwipe = false;
            }
            
            // Right edge swipe left to open right panel
            if (startX > window.innerWidth - 20 && deltaX < -50) {
                const rightPanel = document.getElementById('right-panel');
                if (rightPanel) {
                    rightPanel.classList.add('active');
                }
                isEdgeSwipe = false;
            }
        }, { passive: true });
        
        document.addEventListener('touchend', () => {
            isEdgeSwipe = false;
        }, { passive: true });
    }

    /**
     * Enable compact mode
     */
    enableCompactMode() {
        document.body.classList.add('compact-mode');
        
        const bottomPanel = document.getElementById('bottom-panel');
        if (bottomPanel) {
            bottomPanel.classList.add('compact-mode');
        }
    }

    /**
     * Disable compact mode
     */
    disableCompactMode() {
        document.body.classList.remove('compact-mode');
        
        const bottomPanel = document.getElementById('bottom-panel');
        if (bottomPanel) {
            bottomPanel.classList.remove('compact-mode');
        }
    }

    /**
     * Toggle secondary controls visibility
     * @param {boolean} show - Whether to show secondary controls
     */
    toggleSecondaryControls(show) {
        const secondaryControls = document.querySelectorAll('.secondary-control');
        
        secondaryControls.forEach(control => {
            if (show) {
                control.classList.remove('hidden');
                control.style.display = '';
            } else {
                control.classList.add('hidden');
                control.style.display = 'none';
            }
        });
    }

    /**
     * Enable simplified navigation
     */
    enableSimplifiedNavigation() {
        document.body.classList.add('simplified-navigation');
        
        // Hide complex navigation elements
        const complexNavElements = document.querySelectorAll('.complex-nav');
        complexNavElements.forEach(element => {
            element.style.display = 'none';
        });
    }

    /**
     * Disable simplified navigation
     */
    disableSimplifiedNavigation() {
        document.body.classList.remove('simplified-navigation');
        
        // Show complex navigation elements
        const complexNavElements = document.querySelectorAll('.complex-nav');
        complexNavElements.forEach(element => {
            element.style.display = '';
        });
    }

    /**
     * Adjust layout for device orientation
     */
    adjustForOrientation() {
        const isLandscape = window.innerWidth > window.innerHeight;
        
        if (isLandscape) {
            document.body.classList.add('landscape');
            document.body.classList.remove('portrait');
        } else {
            document.body.classList.add('portrait');
            document.body.classList.remove('landscape');
        }
        
        // Adjust floating panel position in landscape mode on mobile
        if (this.currentViewport === 'mobile' && isLandscape) {
            const bottomPanel = document.getElementById('bottom-panel');
            if (bottomPanel) {
                bottomPanel.style.maxHeight = '40vh'; // Reduce height in landscape
            }
        }
    }

    /**
     * Handle panel toggle events
     * @param {Object} detail - Event detail containing panel information
     */
    handlePanelToggle(detail) {
        const { panelId, isOpen } = detail;
        
        // Adjust main content area based on panel states
        this.adjustMainContentArea();
        
        // Dispatch event for other systems to react
        this.dispatchPanelToggleEvent(panelId, isOpen);
    }

    /**
     * Adjust main content area based on current panel states
     */
    adjustMainContentArea() {
        const mainContent = document.getElementById('main-content');
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        if (!mainContent) return;
        
        let leftPanelOpen = leftPanel && leftPanel.classList.contains('active');
        let rightPanelOpen = rightPanel && rightPanel.classList.contains('active');
        
        // Remove existing adjustment classes
        mainContent.classList.remove('left-panel-open', 'right-panel-open', 'both-panels-open');
        
        // Apply appropriate classes based on panel states
        if (leftPanelOpen && rightPanelOpen) {
            mainContent.classList.add('both-panels-open');
        } else if (leftPanelOpen) {
            mainContent.classList.add('left-panel-open');
        } else if (rightPanelOpen) {
            mainContent.classList.add('right-panel-open');
        }
    }

    /**
     * Get current viewport type
     * @returns {string} Current viewport type
     */
    getCurrentViewport() {
        return this.currentViewport;
    }

    /**
     * Get current layout configuration
     * @returns {Object} Current layout configuration
     */
    getCurrentConfiguration() {
        return this.layoutConfigurations.get(this.currentViewport);
    }

    /**
     * Check if current device is touch-enabled
     * @returns {boolean} True if touch device
     */
    isTouchDevice() {
        return this.touchDevice;
    }

    /**
     * Force layout recalculation
     */
    forceLayoutUpdate() {
        this.detectViewportAndApplyLayout();
    }

    /**
     * Dispatch viewport change event
     * @param {string} from - Previous viewport
     * @param {string} to - New viewport
     */
    dispatchViewportChangeEvent(from, to) {
        const event = new CustomEvent('viewportChanged', {
            detail: {
                from,
                to,
                configuration: this.getCurrentConfiguration(),
                isTouchDevice: this.touchDevice,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Dispatch panel toggle event
     * @param {string} panelId - Panel identifier
     * @param {boolean} isOpen - Panel open state
     */
    dispatchPanelToggleEvent(panelId, isOpen) {
        const event = new CustomEvent('adaptivePanelToggle', {
            detail: {
                panelId,
                isOpen,
                viewport: this.currentViewport,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Get adaptive UI metrics
     * @returns {Object} Metrics object
     */
    getMetrics() {
        return {
            currentViewport: this.currentViewport,
            screenSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            isTouchDevice: this.touchDevice,
            isLandscape: window.innerWidth > window.innerHeight,
            configuration: this.getCurrentConfiguration(),
            panelStates: {
                leftPanelOpen: document.getElementById('left-panel')?.classList.contains('active') || false,
                rightPanelOpen: document.getElementById('right-panel')?.classList.contains('active') || false
            }
        };
    }

    /**
     * Adjust main content area for different panel behaviors
     * @param {Object} config - Layout configuration
     */
    adjustMainContentForPanels(config) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;
        
        // Reset main content styles
        mainContent.style.marginLeft = '';
        mainContent.style.marginRight = '';
        mainContent.style.width = '';
        
        switch (config.panelBehavior) {
            case 'fixed':
                // Desktop: Reserve space for fixed panels
                mainContent.style.marginLeft = config.panelWidth;
                mainContent.style.marginRight = config.panelWidth;
                break;
            case 'overlay':
                // Mobile: Full width, panels overlay
                mainContent.style.width = '100%';
                break;
            case 'collapsible':
                // Tablet: Dynamic width based on panel state
                this.updateMainContentForCollapsiblePanels(config);
                break;
        }
    }

    /**
     * Update main content width for collapsible panels
     * @param {Object} config - Layout configuration
     */
    updateMainContentForCollapsiblePanels(config) {
        const mainContent = document.getElementById('main-content');
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        if (!mainContent) return;
        
        let leftWidth = 0;
        let rightWidth = 0;
        
        if (leftPanel && !leftPanel.classList.contains('collapsed')) {
            leftWidth = parseInt(config.panelWidth);
        } else if (leftPanel && leftPanel.classList.contains('collapsed')) {
            leftWidth = parseInt(config.collapsedWidth || '60px');
        }
        
        if (rightPanel && !rightPanel.classList.contains('collapsed')) {
            rightWidth = parseInt(config.panelWidth);
        } else if (rightPanel && rightPanel.classList.contains('collapsed')) {
            rightWidth = parseInt(config.collapsedWidth || '60px');
        }
        
        mainContent.style.marginLeft = `${leftWidth}px`;
        mainContent.style.marginRight = `${rightWidth}px`;
    }

    /**
     * Setup overlay backdrop for mobile panels
     * @param {HTMLElement} panel - Panel element
     */
    setupOverlayBackdrop(panel) {
        const backdropId = `${panel.id}-backdrop`;
        let backdrop = document.getElementById(backdropId);
        
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = backdropId;
            backdrop.className = 'panel-overlay-backdrop';
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                backdrop-filter: blur(2px);
            `;
            document.body.appendChild(backdrop);
            
            // Close panel when backdrop is clicked
            backdrop.addEventListener('click', () => {
                panel.classList.remove('active');
                this.hideOverlayBackdrop(panel);
            });
        }
        
        // Show backdrop when panel is active
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    if (panel.classList.contains('active')) {
                        this.showOverlayBackdrop(panel);
                    } else {
                        this.hideOverlayBackdrop(panel);
                    }
                }
            });
        });
        
        observer.observe(panel, { attributes: true });
    }

    /**
     * Show overlay backdrop
     * @param {HTMLElement} panel - Panel element
     */
    showOverlayBackdrop(panel) {
        const backdrop = document.getElementById(`${panel.id}-backdrop`);
        if (backdrop) {
            backdrop.style.opacity = '1';
            backdrop.style.visibility = 'visible';
        }
    }

    /**
     * Hide overlay backdrop
     * @param {HTMLElement} panel - Panel element
     */
    hideOverlayBackdrop(panel) {
        const backdrop = document.getElementById(`${panel.id}-backdrop`);
        if (backdrop) {
            backdrop.style.opacity = '0';
            backdrop.style.visibility = 'hidden';
        }
    }

    /**
     * Add collapse toggle functionality to panels
     * @param {HTMLElement} panel - Panel element
     * @param {Object} config - Layout configuration
     */
    addCollapseToggle(panel, config) {
        let toggleBtn = panel.querySelector('.panel-collapse-toggle');
        
        if (!toggleBtn) {
            toggleBtn = document.createElement('button');
            toggleBtn.className = 'panel-collapse-toggle';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            toggleBtn.style.cssText = `
                position: absolute;
                top: 50%;
                right: -15px;
                transform: translateY(-50%);
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: rgba(59, 130, 246, 0.9);
                border: none;
                color: white;
                cursor: pointer;
                z-index: 10;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            panel.appendChild(toggleBtn);
            
            toggleBtn.addEventListener('click', () => {
                this.togglePanelCollapse(panel, config);
            });
        }
        
        // Update toggle button based on panel state
        this.updateCollapseToggle(panel, toggleBtn);
    }

    /**
     * Toggle panel collapse state
     * @param {HTMLElement} panel - Panel element
     * @param {Object} config - Layout configuration
     */
    togglePanelCollapse(panel, config) {
        const isCollapsed = panel.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand panel
            panel.classList.remove('collapsed');
            panel.style.width = config.panelWidth;
        } else {
            // Collapse panel
            panel.classList.add('collapsed');
            panel.style.width = config.collapsedWidth || '60px';
        }
        
        // Update main content layout
        this.updateMainContentForCollapsiblePanels(config);
        
        // Update toggle button
        const toggleBtn = panel.querySelector('.panel-collapse-toggle');
        this.updateCollapseToggle(panel, toggleBtn);
        
        // Dispatch event
        this.dispatchPanelCollapseEvent(panel.id, !isCollapsed);
    }

    /**
     * Update collapse toggle button appearance
     * @param {HTMLElement} panel - Panel element
     * @param {HTMLElement} toggleBtn - Toggle button element
     */
    updateCollapseToggle(panel, toggleBtn) {
        const isCollapsed = panel.classList.contains('collapsed');
        const icon = toggleBtn.querySelector('i');
        
        if (panel.id === 'left-panel') {
            icon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
        } else if (panel.id === 'right-panel') {
            icon.className = isCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
            toggleBtn.style.right = isCollapsed ? '-15px' : '-15px';
            toggleBtn.style.left = isCollapsed ? '-15px' : 'auto';
        }
    }

    /**
     * Setup expand on hover for collapsible panels
     * @param {HTMLElement} panel - Panel element
     * @param {Object} config - Layout configuration
     */
    setupExpandOnHover(panel, config) {
        let hoverTimeout;
        
        panel.addEventListener('mouseenter', () => {
            if (panel.classList.contains('collapsed')) {
                hoverTimeout = setTimeout(() => {
                    panel.style.width = config.panelWidth;
                    panel.classList.add('hover-expanded');
                }, 300);
            }
        });
        
        panel.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout);
            if (panel.classList.contains('hover-expanded')) {
                panel.style.width = config.collapsedWidth || '60px';
                panel.classList.remove('hover-expanded');
            }
        });
    }

    /**
     * Setup tablet-specific collapsible behavior
     * @param {Object} config - Layout configuration
     */
    setupTabletCollapsibleBehavior(config) {
        // Add contextual collapse based on content usage
        if (config.contextualCollapse) {
            this.setupContextualCollapse();
        }
        
        // Add smooth transitions
        if (config.smoothTransitions) {
            this.enhancePanelTransitions();
        }
    }

    /**
     * Setup desktop-specific fixed panel behavior
     * @param {Object} config - Layout configuration
     */
    setupDesktopFixedBehavior(config) {
        // Maximize canvas area
        if (config.maximizedCanvas) {
            this.maximizeCanvasArea();
        }
        
        // Add advanced controls
        if (config.advancedControls) {
            this.enableAdvancedControls();
        }
    }

    /**
     * Setup desktop hover effects
     * @param {HTMLElement} panel - Panel element
     */
    setupDesktopHoverEffects(panel) {
        panel.addEventListener('mouseenter', () => {
            panel.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.6)';
            panel.style.borderColor = 'rgba(59, 130, 246, 0.3)';
        });
        
        panel.addEventListener('mouseleave', () => {
            panel.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.5)';
            panel.style.borderColor = 'rgba(59, 130, 246, 0.2)';
        });
    }

    /**
     * Setup keyboard navigation for desktop
     * @param {HTMLElement} panel - Panel element
     */
    setupKeyboardNavigation(panel) {
        // Add keyboard shortcuts for panel navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.togglePanel('left-panel');
                        break;
                    case '2':
                        e.preventDefault();
                        this.togglePanel('right-panel');
                        break;
                }
            }
        });
    }

    /**
     * Toggle panel visibility
     * @param {string} panelId - Panel ID
     */
    togglePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.toggle('active');
        }
    }

    /**
     * Setup contextual collapse behavior
     */
    setupContextualCollapse() {
        // Auto-collapse panels when not in use
        let inactivityTimer;
        const inactivityDelay = 30000; // 30 seconds
        
        const resetInactivityTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                const leftPanel = document.getElementById('left-panel');
                const rightPanel = document.getElementById('right-panel');
                
                [leftPanel, rightPanel].forEach(panel => {
                    if (panel && !panel.matches(':hover') && !panel.classList.contains('collapsed')) {
                        this.togglePanelCollapse(panel, this.getCurrentConfiguration());
                    }
                });
            }, inactivityDelay);
        };
        
        // Reset timer on user interaction
        document.addEventListener('mousemove', resetInactivityTimer);
        document.addEventListener('keydown', resetInactivityTimer);
        document.addEventListener('click', resetInactivityTimer);
        
        resetInactivityTimer();
    }

    /**
     * Enhance panel transitions
     */
    enhancePanelTransitions() {
        const panels = document.querySelectorAll('.panel-collapsible');
        
        panels.forEach(panel => {
            panel.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    }

    /**
     * Maximize canvas area for desktop
     */
    maximizeCanvasArea() {
        const canvasContainer = document.getElementById('three-js-canvas-container');
        if (canvasContainer) {
            canvasContainer.style.flex = '1';
            canvasContainer.style.minHeight = '0';
        }
    }

    /**
     * Enable advanced controls for desktop
     */
    enableAdvancedControls() {
        const advancedControls = document.querySelectorAll('.advanced-control');
        advancedControls.forEach(control => {
            control.style.display = 'block';
        });
    }

    /**
     * Dispatch panel collapse event
     * @param {string} panelId - Panel ID
     * @param {boolean} isCollapsed - Collapse state
     */
    dispatchPanelCollapseEvent(panelId, isCollapsed) {
        const event = new CustomEvent('panelCollapse', {
            detail: {
                panelId,
                isCollapsed,
                viewport: this.currentViewport,
                timestamp: Date.now()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Cleanup and dispose of resources
     */
    dispose() {
        // Remove event listeners
        window.removeEventListener('resize', this.debouncedResize);
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        
        // Clear timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        // Remove backdrops
        const backdrops = document.querySelectorAll('.panel-overlay-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Clear references
        this.layoutConfigurations.clear();
        this.isInitialized = false;
        
        console.log('AdaptiveUIController disposed');
    }
}

// Create and export singleton instance
export const adaptiveUIController = new AdaptiveUIController();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.adaptiveUIController = adaptiveUIController;
    console.log('🔧 AdaptiveUIController available globally');
}