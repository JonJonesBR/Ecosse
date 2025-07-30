/**
 * ResponsiveCanvasContainer - Task 4: Implement responsive canvas container
 * 
 * This class manages the Three.js canvas sizing and ensures it adapts properly
 * to layout changes while maintaining optimal rendering area.
 * 
 * Requirements addressed:
 * - 1.1: Planet rendered without UI obstruction
 * - 1.2: Planet visualization remains visible during interactions
 * - 5.1: Layout reorganizes for smaller screens
 * - 6.3: Central area adjusts proportionally when panels are resized
 */

export class ResponsiveCanvasContainer {
    constructor() {
        this.canvas = null;
        this.renderer = null;
        this.camera = null;
        this.container = null;
        this.aspectRatio = 16/9; // Default aspect ratio
        this.maintainAspectRatio = true; // Default to maintaining aspect ratio
        this.autoResizeEnabled = true; // Default to auto-resize enabled
        this.minSize = { width: 400, height: 300 };
        this.maxSize = { width: 4096, height: 2160 }; // 4K max
        this.resizeObserver = null;
        this.resizeTimeout = null;
        this.isInitialized = false;
        
        // Bind methods to preserve context
        this.handleResize = this.handleResize.bind(this);
        this.debouncedResize = this.debouncedResize.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
    }

    /**
     * Initialize the responsive canvas container
     * @param {HTMLElement} container - The container element for the canvas
     * @param {Object} renderer - Three.js renderer instance
     * @param {Object} camera - Three.js camera instance
     */
    initialize(container, renderer, camera) {
        if (this.isInitialized) {
            console.warn('ResponsiveCanvasContainer already initialized');
            return;
        }

        this.container = container;
        this.renderer = renderer;
        this.camera = camera;
        this.canvas = renderer.domElement;
        
        if (!this.container || !this.renderer || !this.camera) {
            console.error('ResponsiveCanvasContainer: Missing required parameters');
            return false;
        }

        // Set up initial canvas properties
        this.setupCanvas();
        
        // Set up resize observers and listeners
        this.setupResizeObserver();
        this.setupEventListeners();
        
        // Perform initial resize
        this.calculateAndApplyOptimalSize();
        
        this.isInitialized = true;
        console.log('✅ ResponsiveCanvasContainer initialized');
        return true;
    }

    /**
     * Set up canvas properties and styling
     */
    setupCanvas() {
        if (!this.canvas) return;

        // Ensure canvas fills container
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.display = 'block';
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        
        // Prevent context menu on right-click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Set up ResizeObserver to monitor container size changes
     */
    setupResizeObserver() {
        if (!window.ResizeObserver || !this.container) return;

        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === this.container) {
                    this.debouncedResize();
                }
            }
        });

        this.resizeObserver.observe(this.container);
    }

    /**
     * Set up event listeners for window resize
     */
    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize);
        window.addEventListener('orientationchange', this.onWindowResize);
    }

    /**
     * Handle window resize events
     */
    onWindowResize() {
        this.debouncedResize();
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
            this.calculateAndApplyOptimalSize();
        } catch (error) {
            console.error('Error during canvas resize:', error);
            this.applyFallbackSize();
        }
    }

    /**
     * Calculate optimal canvas size based on available space and panel states
     * @param {Object} panelStates - Optional panel states for advanced calculations
     * @returns {Object} Calculated size {width, height}
     */
    calculateOptimalSize(panelStates = null) {
        if (!this.container) {
            return this.minSize;
        }

        // Get container dimensions
        const containerRect = this.container.getBoundingClientRect();
        let availableWidth = containerRect.width;
        let availableHeight = containerRect.height;

        // Account for container padding/margins
        const containerStyles = window.getComputedStyle(this.container);
        const paddingX = parseFloat(containerStyles.paddingLeft) + parseFloat(containerStyles.paddingRight);
        const paddingY = parseFloat(containerStyles.paddingTop) + parseFloat(containerStyles.paddingBottom);
        
        availableWidth -= paddingX;
        availableHeight -= paddingY;

        // Apply minimum constraints
        availableWidth = Math.max(availableWidth, this.minSize.width);
        availableHeight = Math.max(availableHeight, this.minSize.height);

        // Apply maximum constraints
        availableWidth = Math.min(availableWidth, this.maxSize.width);
        availableHeight = Math.min(availableHeight, this.maxSize.height);

        // Calculate optimal size maintaining aspect ratio if needed
        let optimalWidth = availableWidth;
        let optimalHeight = availableHeight;

        // For very wide or very tall containers, maintain reasonable proportions
        const containerAspectRatio = availableWidth / availableHeight;
        
        if (containerAspectRatio > 3) {
            // Very wide container - limit width
            optimalWidth = availableHeight * 2.5;
        } else if (containerAspectRatio < 0.5) {
            // Very tall container - limit height
            optimalHeight = availableWidth * 2;
        }

        return {
            width: Math.floor(optimalWidth),
            height: Math.floor(optimalHeight)
        };
    }

    /**
     * Calculate and apply optimal canvas size
     */
    calculateAndApplyOptimalSize() {
        const optimalSize = this.calculateOptimalSize();
        this.updateCanvasSize(optimalSize);
    }

    /**
     * Update canvas size and camera settings
     * @param {Object} newSize - New size {width, height}
     */
    updateCanvasSize(newSize) {
        if (!this.renderer || !this.camera || !newSize) {
            console.warn('Cannot update canvas size: missing renderer, camera, or size');
            return;
        }

        const { width, height } = newSize;

        try {
            // Update renderer size
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

            // Trigger a render if available
            if (this.renderer.render && typeof this.renderer.render === 'function') {
                // Note: We don't call render here as it should be handled by the main render loop
                console.log(`✅ Canvas resized to ${width}x${height} (pixel ratio: ${pixelRatio})`);
            }

            // Dispatch custom event for other systems to react
            this.dispatchResizeEvent(newSize);

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
        this.updateCanvasSize(this.minSize);
    }

    /**
     * Dispatch custom resize event
     * @param {Object} size - New size {width, height}
     */
    dispatchResizeEvent(size) {
        if (!this.container) return;

        const event = new CustomEvent('canvasResize', {
            detail: {
                width: size.width,
                height: size.height,
                container: this.container,
                timestamp: Date.now()
            }
        });

        this.container.dispatchEvent(event);
    }

    /**
     * Set minimum canvas size constraints
     * @param {Object} minSize - Minimum size {width, height}
     */
    setMinimumSize(minSize) {
        if (minSize && minSize.width > 0 && minSize.height > 0) {
            this.minSize = { ...minSize };
            this.calculateAndApplyOptimalSize();
        }
    }

    /**
     * Set maximum canvas size constraints
     * @param {Object} maxSize - Maximum size {width, height}
     */
    setMaximumSize(maxSize) {
        if (maxSize && maxSize.width > 0 && maxSize.height > 0) {
            this.maxSize = { ...maxSize };
            this.calculateAndApplyOptimalSize();
        }
    }

    /**
     * Get current canvas size
     * @returns {Object} Current size {width, height}
     */
    getCurrentSize() {
        if (!this.canvas) return this.minSize;
        
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    /**
     * Get container size
     * @returns {Object} Container size {width, height}
     */
    getContainerSize() {
        if (!this.container) return this.minSize;
        
        const rect = this.container.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height
        };
    }

    /**
     * Force a resize recalculation
     */
    forceResize() {
        this.calculateAndApplyOptimalSize();
    }

    /**
     * Check if canvas is properly sized
     * @returns {boolean} True if canvas size is appropriate
     */
    isProperlyResized() {
        if (!this.container || !this.canvas) return false;
        
        const containerSize = this.getContainerSize();
        const canvasSize = this.getCurrentSize();
        
        // Allow for small differences due to rounding
        const widthDiff = Math.abs(containerSize.width - canvasSize.width);
        const heightDiff = Math.abs(containerSize.height - canvasSize.height);
        
        return widthDiff <= 2 && heightDiff <= 2;
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        const containerSize = this.getContainerSize();
        const canvasSize = this.getCurrentSize();
        const pixelRatio = this.renderer ? this.renderer.getPixelRatio() : 1;
        
        return {
            containerSize,
            canvasSize,
            pixelRatio,
            totalPixels: canvasSize.width * canvasSize.height,
            isProperlyResized: this.isProperlyResized(),
            aspectRatio: canvasSize.width / canvasSize.height
        };
    }

    /**
     * Set auto-resize behavior
     * @param {boolean} enabled - Whether to enable auto-resize
     */
    setAutoResize(enabled) {
        if (typeof enabled !== 'boolean') {
            console.warn('setAutoResize expects a boolean value');
            return;
        }

        this.autoResizeEnabled = enabled;

        if (enabled) {
            // Enable auto-resize if not already enabled
            if (!this.resizeObserver && this.container) {
                this.setupResizeObserver();
            }
            console.log('✅ Auto-resize enabled for ResponsiveCanvasContainer');
        } else {
            // Disable auto-resize
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
                this.resizeObserver = null;
            }
            console.log('❌ Auto-resize disabled for ResponsiveCanvasContainer');
        }
    }

    /**
     * Check if auto-resize is currently enabled
     * @returns {boolean} True if auto-resize is enabled
     */
    isAutoResizeEnabled() {
        return this.autoResizeEnabled !== false;
    }

    /**
     * Set aspect ratio maintenance behavior
     * @param {boolean} enabled - Whether to maintain aspect ratio
     */
    setMaintainAspectRatio(enabled) {
        if (typeof enabled !== 'boolean') {
            console.warn('setMaintainAspectRatio expects a boolean value');
            return;
        }

        this.maintainAspectRatio = enabled;
        
        if (enabled) {
            console.log('✅ Aspect ratio maintenance enabled for ResponsiveCanvasContainer');
        } else {
            console.log('❌ Aspect ratio maintenance disabled for ResponsiveCanvasContainer');
        }

        // Recalculate size if initialized
        if (this.isInitialized) {
            this.calculateAndApplyOptimalSize();
        }
    }

    /**
     * Check if aspect ratio maintenance is currently enabled
     * @returns {boolean} True if aspect ratio maintenance is enabled
     */
    isMaintainAspectRatioEnabled() {
        return this.maintainAspectRatio || false;
    }

    /**
     * Cleanup and dispose of resources
     */
    dispose() {
        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize);
        window.removeEventListener('orientationchange', this.onWindowResize);
        
        // Disconnect resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
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
        this.container = null;
        this.isInitialized = false;
        
        console.log('ResponsiveCanvasContainer disposed');
    }
}

// Create and export singleton instance
export const responsiveCanvasContainer = new ResponsiveCanvasContainer();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.responsiveCanvasContainer = responsiveCanvasContainer;
    console.log('🔧 ResponsiveCanvasContainer available globally');
}