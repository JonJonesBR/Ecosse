/**
 * Canvas Sizing Optimizer - Task 5: Implement canvas sizing optimization
 * 
 * This system optimizes canvas sizing based on available space below the top panel,
 * ensures proper z-index hierarchy, and integrates with Three.js renderer resize handling.
 * 
 * Requirements addressed:
 * - 2.1: Canvas 3D occupies maximum available central area
 * - 2.2: Canvas expands when panels are hidden
 * - 2.3: Canvas adjusts automatically when screen is resized
 * 
 * @class CanvasSizingOptimizer
 */

export class CanvasSizingOptimizer {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.camera = null;
        this.canvasContainer = null;
        this.topPanel = null;
        this.isInitialized = false;
        this.resizeTimeout = null;
        this.lastKnownSize = { width: 0, height: 0 };
        this.topPanelHeight = 0;
        this.minCanvasSize = { width: 400, height: 300 };
        this.maxCanvasSize = { width: 4096, height: 2160 };
        
        // Bind methods to preserve context
        this.handleResize = this.handleResize.bind(this);
        this.debouncedResize = this.debouncedResize.bind(this);
        this.updateCanvasSize = this.updateCanvasSize.bind(this);
        this.calculateOptimalCanvasSize = this.calculateOptimalCanvasSize.bind(this);
    }

    /**
     * Initialize the canvas sizing optimizer
     * @param {Object} options - Configuration options
     * @param {HTMLElement} options.canvasContainer - Canvas container element
     * @param {Object} options.renderer - Three.js renderer instance
     * @param {Object} options.camera - Three.js camera instance
     * @param {HTMLElement} options.topPanel - Top panel element (optional)
     */
    initialize(options = {}) {
        if (this.isInitialized) {
            console.warn('CanvasSizingOptimizer already initialized');
            return false;
        }

        const { canvasContainer, renderer, camera, topPanel } = options;

        // Validate required parameters
        if (!canvasContainer || !renderer || !camera) {
            console.error('CanvasSizingOptimizer: Missing required parameters (canvasContainer, renderer, camera)');
            return false;
        }

        this.canvasContainer = canvasContainer;
        this.renderer = renderer;
        this.camera = camera;
        this.canvas = renderer.domElement;
        this.topPanel = topPanel || document.getElementById('top-panel');

        // Set up canvas container properties
        this.setupCanvasContainer();
        
        // Set up z-index hierarchy
        this.setupZIndexHierarchy();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Perform initial sizing
        this.calculateAndApplyOptimalSize();
        
        this.isInitialized = true;
        console.log('✅ CanvasSizingOptimizer initialized');
        return true;
    }

    /**
     * Set up canvas container properties and styling
     */
    setupCanvasContainer() {
        if (!this.canvasContainer) return;

        // Ensure container has proper positioning
        this.canvasContainer.style.position = 'relative';
        this.canvasContainer.style.width = '100%';
        this.canvasContainer.style.height = '100%';
        this.canvasContainer.style.overflow = 'hidden';
        
        // Ensure canvas fills container
        if (this.canvas) {
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.display = 'block';
        }
    }

    /**
     * Set up proper z-index hierarchy to ensure canvas is above top panel
     */
    setupZIndexHierarchy() {
        // Ensure canvas container is positioned above top panel
        if (this.canvasContainer) {
            this.canvasContainer.style.zIndex = '10';
        }
        
        // Ensure top panel has lower z-index
        if (this.topPanel) {
            this.topPanel.style.zIndex = '5';
        }
        
        // Ensure floating controls are above canvas
        const floatingControls = document.getElementById('floating-controls-panel');
        if (floatingControls) {
            floatingControls.style.zIndex = '20';
        }
        
        console.log('✅ Z-index hierarchy configured: top-panel(5) < canvas(10) < floating-controls(20)');
    }

    /**
     * Set up event listeners for resize handling
     */
    setupEventListeners() {
        // Window resize events
        window.addEventListener('resize', this.debouncedResize);
        window.addEventListener('orientationchange', this.debouncedResize);
        
        // Panel state change events
        document.addEventListener('panelToggle', (e) => {
            this.handlePanelStateChange(e.detail);
        });
        
        // Viewport change events from adaptive UI
        document.addEventListener('viewportChanged', (e) => {
            this.handleViewportChange(e.detail);
        });
        
        // Top panel resize observer if available
        if (this.topPanel && window.ResizeObserver) {
            this.topPanelObserver = new ResizeObserver(() => {
                this.updateTopPanelHeight();
                this.debouncedResize();
            });
            this.topPanelObserver.observe(this.topPanel);
        }
    }

    /**
     * Debounced resize handler to prevent excessive recalculations
     */
    debouncedResize() {
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            this.handleResize();
        }, 16); // ~60fps
    }

    /**
     * Main resize handler
     */
    handleResize() {
        if (!this.isInitialized) return;
        
        try {
            this.updateTopPanelHeight();
            this.calculateAndApplyOptimalSize();
        } catch (error) {
            console.error('Error during canvas resize:', error);
            this.applyFallbackSize();
        }
    }

    /**
     * Update the cached top panel height
     */
    updateTopPanelHeight() {
        if (this.topPanel) {
            const rect = this.topPanel.getBoundingClientRect();
            this.topPanelHeight = rect.height;
        } else {
            this.topPanelHeight = 0;
        }
    }

    /**
     * Calculate optimal canvas size based on available space below top panel
     * @returns {Object} Calculated size {width, height}
     */
    calculateOptimalCanvasSize() {
        if (!this.canvasContainer) {
            return this.minCanvasSize;
        }

        // Get container dimensions
        const containerRect = this.canvasContainer.getBoundingClientRect();
        let availableWidth = containerRect.width;
        let availableHeight = containerRect.height;

        // Subtract top panel height from available height
        availableHeight = Math.max(availableHeight - this.topPanelHeight, this.minCanvasSize.height);

        // Account for container padding/margins
        const containerStyles = window.getComputedStyle(this.canvasContainer);
        const paddingX = parseFloat(containerStyles.paddingLeft) + parseFloat(containerStyles.paddingRight);
        const paddingY = parseFloat(containerStyles.paddingTop) + parseFloat(containerStyles.paddingBottom);
        
        availableWidth -= paddingX;
        availableHeight -= paddingY;

        // Apply minimum constraints
        availableWidth = Math.max(availableWidth, this.minCanvasSize.width);
        availableHeight = Math.max(availableHeight, this.minCanvasSize.height);

        // Apply maximum constraints
        availableWidth = Math.min(availableWidth, this.maxCanvasSize.width);
        availableHeight = Math.min(availableHeight, this.maxCanvasSize.height);

        // Account for panel states to maximize canvas area
        const panelStates = this.getPanelStates();
        if (panelStates.leftPanelHidden && panelStates.rightPanelHidden) {
            // Both panels hidden - canvas can use full width
            console.log('📐 Both panels hidden - maximizing canvas area');
        } else if (panelStates.leftPanelHidden || panelStates.rightPanelHidden) {
            // One panel hidden - canvas gets additional space
            console.log('📐 One panel hidden - expanding canvas area');
        }

        const optimalSize = {
            width: Math.floor(availableWidth),
            height: Math.floor(availableHeight)
        };

        console.log(`📐 Calculated optimal canvas size: ${optimalSize.width}x${optimalSize.height} (top panel: ${this.topPanelHeight}px)`);
        return optimalSize;
    }

    /**
     * Get current panel states
     * @returns {Object} Panel states
     */
    getPanelStates() {
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        return {
            leftPanelHidden: !leftPanel || !leftPanel.classList.contains('active'),
            rightPanelHidden: !rightPanel || !rightPanel.classList.contains('active')
        };
    }

    /**
     * Calculate and apply optimal canvas size
     */
    calculateAndApplyOptimalSize() {
        const optimalSize = this.calculateOptimalCanvasSize();
        
        // Only update if size has changed significantly
        const sizeDiff = Math.abs(optimalSize.width - this.lastKnownSize.width) + 
                        Math.abs(optimalSize.height - this.lastKnownSize.height);
        
        if (sizeDiff > 2) { // Allow for small rounding differences
            this.updateCanvasSize(optimalSize);
            this.lastKnownSize = { ...optimalSize };
        }
    }

    /**
     * Update canvas size and integrate with Three.js renderer
     * @param {Object} newSize - New size {width, height}
     */
    updateCanvasSize(newSize) {
        if (!this.renderer || !this.camera || !newSize) {
            console.warn('Cannot update canvas size: missing renderer, camera, or size');
            return;
        }

        const { width, height } = newSize;

        try {
            // Update Three.js renderer size
            this.renderer.setSize(width, height, false);
            
            // Update camera aspect ratio and projection matrix
            if (this.camera.isPerspectiveCamera) {
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
            } else if (this.camera.isOrthographicCamera) {
                // Handle orthographic camera
                const aspect = width / height;
                this.camera.left = -aspect;
                this.camera.right = aspect;
                this.camera.updateProjectionMatrix();
            }

            // Update canvas pixel ratio for high-DPI displays
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            this.renderer.setPixelRatio(pixelRatio);

            // Position canvas to account for top panel offset
            if (this.canvas && this.topPanelHeight > 0) {
                this.canvas.style.top = `${this.topPanelHeight}px`;
                this.canvas.style.height = `calc(100% - ${this.topPanelHeight}px)`;
            }

            console.log(`✅ Canvas resized to ${width}x${height} with top panel offset: ${this.topPanelHeight}px`);

            // Dispatch custom event for other systems to react
            this.dispatchCanvasResizeEvent(newSize);

        } catch (error) {
            console.error('Error updating canvas size:', error);
            this.applyFallbackSize();
        }
    }

    /**
     * Apply fallback size in case of errors
     */
    applyFallbackSize() {
        console.warn('Applying fallback canvas size');
        this.updateCanvasSize(this.minCanvasSize);
    }

    /**
     * Handle panel state changes
     * @param {Object} detail - Panel state change details
     */
    handlePanelStateChange(detail) {
        console.log('📱 Panel state changed, recalculating canvas size');
        
        // Small delay to allow panel animations to complete
        setTimeout(() => {
            this.calculateAndApplyOptimalSize();
        }, 300);
    }

    /**
     * Handle viewport changes from adaptive UI
     * @param {Object} detail - Viewport change details
     */
    handleViewportChange(detail) {
        console.log(`📱 Viewport changed to ${detail.to}, recalculating canvas size`);
        
        // Recalculate after viewport change
        setTimeout(() => {
            this.setupZIndexHierarchy(); // Ensure z-index is correct for new viewport
            this.calculateAndApplyOptimalSize();
        }, 100);
    }

    /**
     * Dispatch custom canvas resize event
     * @param {Object} size - New size {width, height}
     */
    dispatchCanvasResizeEvent(size) {
        if (!this.canvasContainer) return;

        const event = new CustomEvent('canvasSizeOptimized', {
            detail: {
                width: size.width,
                height: size.height,
                topPanelHeight: this.topPanelHeight,
                container: this.canvasContainer,
                timestamp: Date.now()
            }
        });

        this.canvasContainer.dispatchEvent(event);
        document.dispatchEvent(event); // Also dispatch globally
    }

    /**
     * Set minimum canvas size constraints
     * @param {Object} minSize - Minimum size {width, height}
     */
    setMinimumSize(minSize) {
        if (minSize && minSize.width > 0 && minSize.height > 0) {
            this.minCanvasSize = { ...minSize };
            this.calculateAndApplyOptimalSize();
        }
    }

    /**
     * Set maximum canvas size constraints
     * @param {Object} maxSize - Maximum size {width, height}
     */
    setMaximumSize(maxSize) {
        if (maxSize && maxSize.width > 0 && maxSize.height > 0) {
            this.maxCanvasSize = { ...maxSize };
            this.calculateAndApplyOptimalSize();
        }
    }

    /**
     * Get current canvas size
     * @returns {Object} Current size {width, height}
     */
    getCurrentSize() {
        if (!this.canvas) return this.minCanvasSize;
        
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    /**
     * Get available space metrics
     * @returns {Object} Space metrics
     */
    getSpaceMetrics() {
        const containerSize = this.canvasContainer ? 
            this.canvasContainer.getBoundingClientRect() : 
            { width: 0, height: 0 };
        
        const canvasSize = this.getCurrentSize();
        
        return {
            containerSize: {
                width: containerSize.width,
                height: containerSize.height
            },
            canvasSize,
            topPanelHeight: this.topPanelHeight,
            availableHeight: containerSize.height - this.topPanelHeight,
            utilization: {
                width: canvasSize.width / containerSize.width,
                height: canvasSize.height / (containerSize.height - this.topPanelHeight)
            }
        };
    }

    /**
     * Force a resize recalculation
     */
    forceResize() {
        this.updateTopPanelHeight();
        this.calculateAndApplyOptimalSize();
    }

    /**
     * Check if canvas is properly sized for current layout
     * @returns {boolean} True if canvas size is optimal
     */
    isOptimallySized() {
        const currentSize = this.getCurrentSize();
        const optimalSize = this.calculateOptimalCanvasSize();
        
        const widthDiff = Math.abs(currentSize.width - optimalSize.width);
        const heightDiff = Math.abs(currentSize.height - optimalSize.height);
        
        return widthDiff <= 2 && heightDiff <= 2;
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        const spaceMetrics = this.getSpaceMetrics();
        const panelStates = this.getPanelStates();
        
        return {
            ...spaceMetrics,
            panelStates,
            isOptimallySized: this.isOptimallySized(),
            lastKnownSize: this.lastKnownSize,
            pixelRatio: this.renderer ? this.renderer.getPixelRatio() : 1,
            totalPixels: spaceMetrics.canvasSize.width * spaceMetrics.canvasSize.height
        };
    }

    /**
     * Cleanup and dispose of resources
     */
    dispose() {
        // Remove event listeners
        window.removeEventListener('resize', this.debouncedResize);
        window.removeEventListener('orientationchange', this.debouncedResize);
        
        // Disconnect top panel observer
        if (this.topPanelObserver) {
            this.topPanelObserver.disconnect();
            this.topPanelObserver = null;
        }
        
        // Clear timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        // Clear references
        this.canvas = null;
        this.renderer = null;
        this.camera = null;
        this.canvasContainer = null;
        this.topPanel = null;
        this.isInitialized = false;
        
        console.log('CanvasSizingOptimizer disposed');
    }
}

// Create and export singleton instance
export const canvasSizingOptimizer = new CanvasSizingOptimizer();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.canvasSizingOptimizer = canvasSizingOptimizer;
    console.log('🔧 CanvasSizingOptimizer available globally');
}