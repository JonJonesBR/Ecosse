/**
 * Core Layout Management System
 * Handles viewport calculations, panel positioning, and responsive layout updates
 * Requirements: 1.1, 1.2, 5.1, 5.2
 */

class LayoutManager {
    constructor() {
        this.viewportSize = { width: 0, height: 0 };
        this.panelStates = {
            left: 'visible',
            right: 'visible', 
            controls: 'floating'
        };
        
        // Responsive breakpoints
        this.breakpoints = {
            mobile: 768,
            tablet: 1024,
            desktop: 1440
        };
        
        // Layout configuration
        this.layoutConfig = {
            panels: {
                left: {
                    width: 280,
                    minWidth: 250,
                    maxWidth: 350,
                    collapsible: true,
                    position: 'fixed-left'
                },
                right: {
                    width: 280,
                    minWidth: 250, 
                    maxWidth: 350,
                    collapsible: true,
                    position: 'fixed-right'
                },
                controls: {
                    width: 'auto',
                    height: 'auto',
                    position: 'floating',
                    defaultPosition: 'bottom-center',
                    collapsible: true,
                    draggable: true
                }
            },
            canvas: {
                minWidth: 400,
                minHeight: 300,
                aspectRatio: 'flexible',
                autoResize: true
            }
        };
        
        // Event listeners
        this.resizeListeners = [];
        this.layoutChangeListeners = [];
        
        // Performance optimization properties
        this._lastViewportType = null;
        this._lastViewportSize = null;
        this._forceLayoutUpdate = false;
        this._layoutChangeTimeout = null;
        this._batchedDOMOperations = [];
        this._isProcessingBatch = false;
        
        // Initialize
        this.init();
    }
    
    init() {
        console.log('🎯 Initializing Layout Manager...');
        
        // Set initial viewport size
        this.updateViewportSize();
        
        // Set up resize listener with debouncing
        this.setupResizeListener();
        
        // Apply initial layout
        this.applyLayout();
        
        console.log('✅ Layout Manager initialized');
    }
    
    /**
     * Update viewport size and trigger layout recalculation
     */
    updateViewportSize() {
        const newSize = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Only update if size actually changed
        if (newSize.width !== this.viewportSize.width || 
            newSize.height !== this.viewportSize.height) {
            
            this.viewportSize = newSize;
            console.log(`📐 Viewport updated: ${newSize.width}x${newSize.height}`);
            
            // Trigger layout update
            this.updateLayout();
        }
    }
    
    /**
     * Set up optimized debounced resize listener with performance improvements
     */
    setupResizeListener() {
        let resizeTimeout;
        let rafId;
        let lastResizeTime = 0;
        const minResizeInterval = 16; // ~60fps limit
        
        const optimizedResizeHandler = () => {
            const now = performance.now();
            
            // Throttle rapid resize events
            if (now - lastResizeTime < minResizeInterval) {
                if (rafId) {
                    cancelAnimationFrame(rafId);
                }
                rafId = requestAnimationFrame(optimizedResizeHandler);
                return;
            }
            
            lastResizeTime = now;
            
            // Clear existing timeout
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            
            // Debounce the actual layout update
            resizeTimeout = setTimeout(() => {
                this.updateViewportSize();
            }, 100); // Reduced from 150ms for better responsiveness
        };
        
        window.addEventListener('resize', optimizedResizeHandler, { passive: true });
        
        // Store references for cleanup
        this._resizeHandler = optimizedResizeHandler;
        this._resizeTimeout = resizeTimeout;
        this._rafId = rafId;
    }
    
    /**
     * Get current viewport type based on breakpoints
     */
    getViewportType() {
        const width = this.viewportSize.width;
        
        if (width <= this.breakpoints.mobile) {
            return 'mobile';
        } else if (width <= this.breakpoints.tablet) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }
    
    /**
     * Update layout based on current viewport and panel states with performance optimizations
     */
    updateLayout() {
        try {
            // Performance optimization: Skip layout if viewport hasn't changed significantly
            const currentViewportType = this.getViewportType();
            const currentSize = `${this.viewportSize.width}x${this.viewportSize.height}`;
            
            if (this._lastViewportType === currentViewportType && 
                this._lastViewportSize === currentSize &&
                !this._forceLayoutUpdate) {
                return; // Skip unnecessary layout calculations
            }
            
            // Save current state as last known good before making changes
            if (window.layoutErrorHandler) {
                window.layoutErrorHandler.saveLastKnownGoodState();
            }
            
            console.log(`🔄 Updating layout for ${currentViewportType} viewport (${currentSize})`);
            
            // Batch DOM operations for better performance
            this.batchDOMUpdates(() => {
                // Apply responsive layout configuration
                this.applyResponsiveLayout(currentViewportType);
                
                // Calculate optimal canvas size
                this.updateCanvasLayout();
            });
            
            // Cache viewport state
            this._lastViewportType = currentViewportType;
            this._lastViewportSize = currentSize;
            this._forceLayoutUpdate = false;
            
            // Notify listeners (debounced)
            this.debouncedNotifyLayoutChange();
            
        } catch (error) {
            console.error('❌ Layout update failed:', error);
            
            // Use error handler if available
            if (window.layoutErrorHandler) {
                window.layoutErrorHandler.handleResizeError(error, 'layoutManager.updateLayout');
            } else {
                // Fallback error handling
                console.warn('⚠️ Layout error handler not available, applying basic fallback');
                this.applyBasicFallback();
            }
        }
    }
    
    /**
     * Apply basic fallback layout when error handler is not available
     */
    applyBasicFallback() {
        try {
            const appContainer = document.getElementById('app-container');
            const mainContent = document.getElementById('main-content');
            const canvasContainer = document.getElementById('three-js-canvas-container');
            
            if (appContainer) {
                appContainer.style.display = 'flex';
                appContainer.style.flexDirection = 'row';
                appContainer.style.height = '100vh';
            }
            
            if (mainContent) {
                mainContent.style.flex = '1';
                mainContent.style.display = 'flex';
                mainContent.style.flexDirection = 'column';
            }
            
            if (canvasContainer) {
                canvasContainer.style.flex = '1';
                canvasContainer.style.position = 'relative';
                canvasContainer.style.minHeight = '300px';
            }
            
            console.log('✅ Applied basic layout fallback');
        } catch (fallbackError) {
            console.error('❌ Even basic fallback failed:', fallbackError);
        }
    }
    
    /**
     * Apply responsive layout based on viewport type
     */
    applyResponsiveLayout(viewportType) {
        const appContainer = document.getElementById('app-container');
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        const mainContent = document.getElementById('main-content');
        
        if (!appContainer || !leftPanel || !rightPanel || !mainContent) {
            console.warn('⚠️ Layout elements not found');
            return;
        }
        
        // Remove existing responsive classes
        appContainer.classList.remove('mobile-layout', 'tablet-layout', 'desktop-layout');
        
        switch (viewportType) {
            case 'mobile':
                this.applyMobileLayout(appContainer, leftPanel, rightPanel, mainContent);
                break;
            case 'tablet':
                this.applyTabletLayout(appContainer, leftPanel, rightPanel, mainContent);
                break;
            case 'desktop':
                this.applyDesktopLayout(appContainer, leftPanel, rightPanel, mainContent);
                break;
        }
    }
    
    /**
     * Apply mobile-specific layout
     */
    applyMobileLayout(appContainer, leftPanel, rightPanel, mainContent) {
        appContainer.classList.add('mobile-layout', 'layout-optimized');
        
        // On mobile, panels should be overlay
        this.panelStates.left = 'overlay';
        this.panelStates.right = 'overlay';
        this.panelStates.controls = 'bottom-fixed';
        
        // Apply mobile styles
        this.applyPanelStyles(leftPanel, {
            position: 'fixed',
            top: '0',
            left: '0',
            height: '100vh',
            width: '280px',
            zIndex: '1000',
            transform: leftPanel.classList.contains('active') ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s ease'
        });
        
        this.applyPanelStyles(rightPanel, {
            position: 'fixed',
            top: '0',
            right: '0',
            height: '100vh',
            width: '280px',
            zIndex: '1000',
            transform: rightPanel.classList.contains('active') ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        // Main content takes full width and height with proper flex
        this.applyPanelStyles(mainContent, {
            flex: '1',
            width: '100%',
            height: '100vh',
            minWidth: '0',
            minHeight: '0'
        });
    }
    
    /**
     * Apply tablet-specific layout
     */
    applyTabletLayout(appContainer, leftPanel, rightPanel, mainContent) {
        appContainer.classList.add('tablet-layout', 'layout-optimized');
        
        // On tablet, panels can be collapsible
        this.panelStates.left = 'collapsible';
        this.panelStates.right = 'collapsible';
        this.panelStates.controls = 'floating';
        
        // Calculate available space
        const leftWidth = this.panelStates.left === 'visible' ? this.layoutConfig.panels.left.width : 0;
        const rightWidth = this.panelStates.right === 'visible' ? this.layoutConfig.panels.right.width : 0;
        
        this.applyPanelStyles(leftPanel, {
            position: 'relative',
            width: `${this.layoutConfig.panels.left.width}px`,
            height: '100vh',
            transform: 'none',
            transition: 'width 0.3s ease',
            flexShrink: '0'
        });
        
        this.applyPanelStyles(rightPanel, {
            position: 'relative',
            width: `${this.layoutConfig.panels.right.width}px`,
            height: '100vh',
            transform: 'none',
            transition: 'width 0.3s ease',
            flexShrink: '0'
        });
        
        this.applyPanelStyles(mainContent, {
            flex: '1',
            height: '100vh',
            minWidth: '0',
            minHeight: '0'
        });
    }
    
    /**
     * Apply desktop-specific layout
     */
    applyDesktopLayout(appContainer, leftPanel, rightPanel, mainContent) {
        appContainer.classList.add('desktop-layout', 'layout-optimized');
        
        // On desktop, panels are visible by default
        this.panelStates.left = 'visible';
        this.panelStates.right = 'visible';
        this.panelStates.controls = 'floating';
        
        // Calculate available space
        const leftWidth = this.layoutConfig.panels.left.width;
        const rightWidth = this.layoutConfig.panels.right.width;
        const mainWidth = this.viewportSize.width - leftWidth - rightWidth;
        
        this.applyPanelStyles(leftPanel, {
            position: 'relative',
            width: `${leftWidth}px`,
            height: '100vh',
            transform: 'none',
            transition: 'width 0.3s ease',
            flexShrink: '0'
        });
        
        this.applyPanelStyles(rightPanel, {
            position: 'relative',
            width: `${rightWidth}px`,
            height: '100vh',
            transform: 'none',
            transition: 'width 0.3s ease',
            flexShrink: '0'
        });
        
        this.applyPanelStyles(mainContent, {
            flex: '1',
            height: '100vh',
            minWidth: '0',
            minHeight: '0'
        });
    }
    
    /**
     * Apply styles to a panel element
     */
    applyPanelStyles(element, styles) {
        if (!element) return;
        
        Object.assign(element.style, styles);
    }
    
    /**
     * Update canvas layout to maximize 3D rendering area
     * Updated for floating controls panel - no longer obstructs canvas
     */
    updateCanvasLayout() {
        try {
            const canvasContainer = document.getElementById('three-js-canvas-container');
            if (!canvasContainer) {
                console.warn('⚠️ Canvas container not found');
                return;
            }
            
            const mainContent = document.getElementById('main-content');
            if (!mainContent) {
                console.warn('⚠️ Main content not found');
                return;
            }
            
            // Calculate available space for canvas
            const topPanel = document.getElementById('top-panel');
            const topHeight = topPanel ? topPanel.offsetHeight : 0;
            
            // Bottom panel is now floating, so it doesn't reduce available height
            const availableHeight = mainContent.offsetHeight - topHeight;
            const availableWidth = mainContent.offsetWidth;
            
            // Ensure canvas gets at least 70% of viewport height for optimal utilization
            const minCanvasHeight = Math.max(
                this.layoutConfig.canvas.minHeight,
                this.viewportSize.height * 0.7
            );
            
            // Apply minimum constraints with height optimization
            const canvasWidth = Math.max(availableWidth, this.layoutConfig.canvas.minWidth);
            const canvasHeight = Math.max(availableHeight, minCanvasHeight);
            
            // Validate dimensions
            if (canvasWidth <= 0 || canvasHeight <= 0) {
                throw new Error(`Invalid canvas dimensions: ${canvasWidth}x${canvasHeight}`);
            }
            
            // Apply flex-based sizing for better responsiveness
            this.applyPanelStyles(canvasContainer, {
                flex: '1',
                minHeight: `${minCanvasHeight}px`,
                width: '100%',
                position: 'relative'
            });
            
            // Calculate height utilization percentage
            const heightUtilization = (canvasHeight / this.viewportSize.height) * 100;
            
            console.log(`🎨 Canvas layout updated: ${canvasWidth}x${canvasHeight} (${heightUtilization.toFixed(1)}% height utilization)`);
            
            // Notify canvas resize listeners
            this.notifyCanvasResize(canvasWidth, canvasHeight);
            
            // Add canvas maximization class if height utilization is good
            if (heightUtilization >= 70) {
                document.body.classList.add('canvas-maximized');
            } else {
                document.body.classList.remove('canvas-maximized');
                document.body.classList.add('canvas-compact');
            }
            
        } catch (error) {
            console.error('❌ Canvas layout update failed:', error);
            
            // Use error handler if available
            if (window.layoutErrorHandler) {
                window.layoutErrorHandler.handleCanvasResizeError(error);
            } else {
                // Fallback: set minimum canvas size with flex
                const canvasContainer = document.getElementById('three-js-canvas-container');
                if (canvasContainer) {
                    canvasContainer.style.flex = '1';
                    canvasContainer.style.minHeight = '300px';
                    canvasContainer.style.width = '100%';
                    console.log('✅ Applied fallback canvas size with flex');
                }
            }
        }
    }
    
    /**
     * Toggle panel visibility
     */
    togglePanel(panelName) {
        const validPanels = ['left', 'right', 'controls'];
        if (!validPanels.includes(panelName)) {
            console.warn(`⚠️ Invalid panel name: ${panelName}`);
            return;
        }
        
        const currentState = this.panelStates[panelName];
        
        // Toggle between visible and hidden states
        if (currentState === 'visible') {
            this.panelStates[panelName] = 'hidden';
        } else {
            this.panelStates[panelName] = 'visible';
        }
        
        console.log(`🔄 Panel ${panelName} toggled to ${this.panelStates[panelName]}`);
        
        // Update layout
        this.updateLayout();
    }
    
    /**
     * Optimize layout for planet rendering
     */
    optimizeForPlanetRendering() {
        console.log('🚀 Optimizing layout for planet rendering...');
        
        // Hide panels temporarily to maximize canvas area
        const originalStates = { ...this.panelStates };
        
        this.panelStates.left = 'hidden';
        this.panelStates.right = 'hidden';
        this.panelStates.controls = 'minimized';
        
        this.updateLayout();
        
        // Return function to restore original states
        return () => {
            this.panelStates = originalStates;
            this.updateLayout();
            console.log('🔄 Layout restored from optimization');
        };
    }
    
    /**
     * Apply initial layout
     */
    applyLayout() {
        this.updateLayout();
    }
    
    /**
     * Add resize listener
     */
    addResizeListener(callback) {
        this.resizeListeners.push(callback);
    }
    
    /**
     * Remove resize listener
     */
    removeResizeListener(callback) {
        const index = this.resizeListeners.indexOf(callback);
        if (index > -1) {
            this.resizeListeners.splice(index, 1);
        }
    }
    
    /**
     * Add layout change listener
     */
    addLayoutChangeListener(callback) {
        this.layoutChangeListeners.push(callback);
    }
    
    /**
     * Remove layout change listener
     */
    removeLayoutChangeListener(callback) {
        const index = this.layoutChangeListeners.indexOf(callback);
        if (index > -1) {
            this.layoutChangeListeners.splice(index, 1);
        }
    }
    
    /**
     * Notify resize listeners
     */
    notifyCanvasResize(width, height) {
        this.resizeListeners.forEach(callback => {
            try {
                callback(width, height);
            } catch (error) {
                console.error('Error in resize listener:', error);
            }
        });
    }
    
    /**
     * Notify layout change listeners
     */
    notifyLayoutChange() {
        const layoutInfo = {
            viewportSize: this.viewportSize,
            viewportType: this.getViewportType(),
            panelStates: this.panelStates,
            timestamp: Date.now()
        };
        
        this.layoutChangeListeners.forEach(callback => {
            try {
                callback(layoutInfo);
            } catch (error) {
                console.error('Error in layout change listener:', error);
            }
        });
        
        // Dispatch custom event for renderer integration
        const event = new CustomEvent('layoutChanged', {
            detail: layoutInfo
        });
        document.dispatchEvent(event);
        
        // Notify specific UI systems
        this.notifyUISystemsOfLayoutChange(layoutInfo);
    }
    
    /**
     * Notify specific UI systems of layout changes
     * @param {Object} layoutInfo - Layout change information
     */
    notifyUISystemsOfLayoutChange(layoutInfo) {
        try {
            // Notify UI Controller
            if (window.uiController && typeof window.uiController.onLayoutChange === 'function') {
                window.uiController.onLayoutChange(layoutInfo);
            }
            
            // Notify Feedback System
            if (window.feedbackSystem && typeof window.feedbackSystem.onLayoutChange === 'function') {
                window.feedbackSystem.onLayoutChange(layoutInfo);
            }
            
            // Notify Controls Manager
            if (window.controlsManager && typeof window.controlsManager.onLayoutChange === 'function') {
                window.controlsManager.onLayoutChange(layoutInfo);
            }
            
            // Notify Element Controls Organizer
            if (window.elementControlsOrganizer && typeof window.elementControlsOrganizer.handleResponsiveLayout === 'function') {
                window.elementControlsOrganizer.handleResponsiveLayout();
            }
            
        } catch (error) {
            console.warn('⚠️ Error notifying UI systems of layout change:', error);
        }
    }
    
    /**
     * Get current layout information
     */
    getLayoutInfo() {
        return {
            viewportSize: this.viewportSize,
            viewportType: this.getViewportType(),
            panelStates: this.panelStates,
            layoutConfig: this.layoutConfig
        };
    }
    
    /**
     * Update layout configuration
     */
    updateLayoutConfig(newConfig) {
        this.layoutConfig = { ...this.layoutConfig, ...newConfig };
        this._forceLayoutUpdate = true; // Force update when config changes
        this.updateLayout();
        console.log('📝 Layout configuration updated');
    }
    
    /**
     * Batch DOM operations for better performance
     * @param {Function} operations - Function containing DOM operations to batch
     */
    batchDOMUpdates(operations) {
        if (this._isProcessingBatch) {
            // If already processing, queue the operations
            this._batchedDOMOperations.push(operations);
            return;
        }
        
        this._isProcessingBatch = true;
        
        // Use requestAnimationFrame for optimal timing
        requestAnimationFrame(() => {
            try {
                // Execute the main operations
                operations();
                
                // Execute any queued operations
                while (this._batchedDOMOperations.length > 0) {
                    const queuedOperation = this._batchedDOMOperations.shift();
                    queuedOperation();
                }
                
            } catch (error) {
                console.error('Error in batched DOM operations:', error);
            } finally {
                this._isProcessingBatch = false;
            }
        });
    }
    
    /**
     * Debounced layout change notification to prevent excessive events
     */
    debouncedNotifyLayoutChange() {
        if (this._layoutChangeTimeout) {
            clearTimeout(this._layoutChangeTimeout);
        }
        
        this._layoutChangeTimeout = setTimeout(() => {
            this.notifyLayoutChange();
        }, 50); // 50ms debounce for layout change notifications
    }
    
    /**
     * Force layout update (bypasses optimization checks)
     */
    forceLayoutUpdate() {
        this._forceLayoutUpdate = true;
        this.updateLayout();
    }
    
    /**
     * Get performance metrics for debugging
     */
    getPerformanceMetrics() {
        return {
            lastViewportType: this._lastViewportType,
            lastViewportSize: this._lastViewportSize,
            isProcessingBatch: this._isProcessingBatch,
            queuedOperations: this._batchedDOMOperations.length,
            resizeListeners: this.resizeListeners.length,
            layoutChangeListeners: this.layoutChangeListeners.length
        };
    }
    
    /**
     * Cleanup method for performance optimization resources
     */
    dispose() {
        // Clear timeouts
        if (this._resizeTimeout) {
            clearTimeout(this._resizeTimeout);
        }
        if (this._layoutChangeTimeout) {
            clearTimeout(this._layoutChangeTimeout);
        }
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }
        
        // Remove event listeners
        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }
        
        // Clear arrays
        this.resizeListeners.length = 0;
        this.layoutChangeListeners.length = 0;
        this._batchedDOMOperations.length = 0;
        
        console.log('🧹 LayoutManager disposed');
    }
}

// Create and export singleton instance
export const layoutManager = new LayoutManager();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.layoutManager = layoutManager;
    console.log('🔧 Layout Manager available globally as window.layoutManager');
}