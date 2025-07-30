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
        // Mobile configuration
        this.layoutConfigurations.set('mobile', {
            panelBehavior: 'overlay',
            bottomPanelPosition: 'fixed-bottom',
            elementGridColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            controlButtonSize: 'large',
            touchTargetMinSize: 44, // 44px minimum touch target
            panelWidth: '100vw',
            panelHeight: 'auto',
            floatingPanelMaxHeight: '50vh',
            compactMode: true,
            hideSecondaryControls: true,
            simplifiedNavigation: true
        });

        // Tablet configuration  
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
            simplifiedNavigation: false
        });

        // Desktop configuration
        this.layoutConfigurations.set('desktop', {
            panelBehavior: 'inline',
            bottomPanelPosition: 'floating',
            elementGridColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            controlButtonSize: 'normal',
            touchTargetMinSize: 32,
            panelWidth: '280px',
            panelHeight: 'auto',
            floatingPanelMaxHeight: '65vh',
            compactMode: false,
            hideSecondaryControls: false,
            simplifiedNavigation: false
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
        
        [leftPanel, rightPanel].forEach(panel => {
            if (!panel) return;
            
            // Remove existing behavior classes
            panel.classList.remove('panel-overlay', 'panel-collapsible', 'panel-inline');
            
            // Apply new behavior
            switch (config.panelBehavior) {
                case 'overlay':
                    panel.classList.add('panel-overlay');
                    panel.style.width = config.panelWidth;
                    // Ensure overlay panels are initially hidden on mobile
                    if (this.currentViewport === 'mobile') {
                        panel.classList.remove('active');
                    }
                    break;
                case 'collapsible':
                    panel.classList.add('panel-collapsible');
                    panel.style.width = config.panelWidth;
                    break;
                case 'inline':
                    panel.classList.add('panel-inline');
                    panel.style.width = config.panelWidth;
                    break;
            }
        });
        
        // Add mobile-specific touch gestures for overlay panels
        if (config.panelBehavior === 'overlay' && this.touchDevice) {
            this.setupMobilePanelGestures();
        }
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