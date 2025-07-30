/**
 * Renderer Layout Integration - Task 8: Integrate layout system with existing Three.js renderer
 * 
 * This class handles the integration between the layout management system and the Three.js renderer,
 * ensuring that canvas resizing works correctly with the new layout system and that camera and scene
 * scaling work properly with dynamic layout changes.
 * 
 * Requirements addressed:
 * - 1.1: Planet rendered without UI obstruction
 * - 1.2: Planet visualization remains visible during interactions
 * - 1.3: Layout adapts while maintaining planet visibility
 */

import { responsiveCanvasContainer } from '../responsive-canvas-container.js';
import { layoutManager } from '../systems/layoutManager.js';

export class RendererLayoutIntegration {
    constructor() {
        this.isInitialized = false;
        this.renderer = null;
        this.camera = null;
        this.scene = null;
        this.container = null;
        this.renderingComponents = null;
        
        // Integration state
        this.lastKnownSize = { width: 0, height: 0 };
        this.resizeCallbacks = [];
        this.layoutChangeCallbacks = [];
        
        // Performance optimization
        this.resizeDebounceTimeout = null;
        this.lastResizeTime = 0;
        this.minResizeInterval = 16; // ~60fps
        
        // Bind methods to preserve context
        this.handleLayoutChange = this.handleLayoutChange.bind(this);
        this.handleCanvasResize = this.handleCanvasResize.bind(this);
        this.handlePanelStateChange = this.handlePanelStateChange.bind(this);
        this.debouncedResize = this.debouncedResize.bind(this);
    }

    /**
     * Initialize the renderer layout integration
     * @param {Object} renderingComponents - Object containing renderer, camera, scene
     * @param {HTMLElement} container - Canvas container element
     */
    initialize(renderingComponents, container) {
        if (this.isInitialized) {
            console.warn('RendererLayoutIntegration already initialized');
            return false;
        }

        console.log('🎨 Initializing Renderer Layout Integration...');

        // Store rendering components
        this.renderingComponents = renderingComponents;
        this.renderer = renderingComponents.renderer;
        this.camera = renderingComponents.camera;
        this.scene = renderingComponents.scene;
        this.container = container;

        if (!this.renderer || !this.camera || !this.container) {
            console.error('❌ Missing required rendering components or container');
            return false;
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Connect with responsive canvas container
        this.connectWithResponsiveCanvas();
        
        // Connect with layout manager
        this.connectWithLayoutManager();
        
        // Perform initial integration
        this.performInitialIntegration();
        
        this.isInitialized = true;
        console.log('✅ Renderer Layout Integration initialized');
        return true;
    }

    /**
     * Set up event listeners for layout and panel changes
     */
    setupEventListeners() {
        // Listen for layout changes from layout manager
        document.addEventListener('layoutChanged', this.handleLayoutChange);
        
        // Listen for panel state changes
        document.addEventListener('panelStateChanged', this.handlePanelStateChange);
        
        // Listen for viewport changes from adaptive UI controller
        document.addEventListener('viewportChanged', (e) => {
            this.handleViewportChange(e.detail);
        });
        
        // Listen for canvas resize events
        if (this.container) {
            this.container.addEventListener('canvasResize', this.handleCanvasResize);
        }
        
        // Listen for window resize as fallback
        window.addEventListener('resize', this.debouncedResize);
    }

    /**
     * Connect with responsive canvas container
     */
    connectWithResponsiveCanvas() {
        if (responsiveCanvasContainer.isInitialized) {
            console.log('🔗 Connecting with existing responsive canvas container');
            
            // Add our resize callback to the responsive canvas container
            this.addResizeCallback((size) => {
                this.updateRenderingForSize(size);
            });
        } else {
            console.log('🔗 Initializing responsive canvas container integration');
            
            // Initialize responsive canvas container if not already done
            const success = responsiveCanvasContainer.initialize(
                this.container, 
                this.renderer, 
                this.camera
            );
            
            if (success) {
                this.addResizeCallback((size) => {
                    this.updateRenderingForSize(size);
                });
            } else {
                console.warn('⚠️ Failed to initialize responsive canvas container');
            }
        }
    }

    /**
     * Connect with layout manager
     */
    connectWithLayoutManager() {
        if (layoutManager) {
            console.log('🔗 Connecting with layout manager');
            
            // Add layout change listener
            layoutManager.addLayoutChangeListener(this.handleLayoutChange);
            
            // Add resize listener
            layoutManager.addResizeListener((width, height) => {
                this.handleCanvasResize({ detail: { width, height } });
            });
        } else {
            console.warn('⚠️ Layout manager not available');
        }
    }

    /**
     * Perform initial integration setup
     */
    performInitialIntegration() {
        // Get current container size
        const containerRect = this.container.getBoundingClientRect();
        const initialSize = {
            width: containerRect.width,
            height: containerRect.height
        };
        
        // Update rendering for initial size
        this.updateRenderingForSize(initialSize);
        
        // Store initial size
        this.lastKnownSize = initialSize;
        
        console.log(`🎨 Initial rendering setup: ${initialSize.width}x${initialSize.height}`);
    }

    /**
     * Handle layout changes from layout manager
     * @param {Object} layoutInfo - Layout information
     */
    handleLayoutChange(layoutInfo) {
        console.log('🔄 Handling layout change:', layoutInfo);
        
        // Recalculate optimal canvas size based on new layout
        this.recalculateCanvasSize();
        
        // Optimize rendering for new layout
        this.optimizeRenderingForLayout(layoutInfo);
        
        // Notify callbacks
        this.layoutChangeCallbacks.forEach(callback => {
            try {
                callback(layoutInfo);
            } catch (error) {
                console.error('Error in layout change callback:', error);
            }
        });
    }

    /**
     * Handle canvas resize events
     * @param {Event} event - Canvas resize event
     */
    handleCanvasResize(event) {
        const { width, height } = event.detail;
        
        console.log(`🎨 Canvas resize detected: ${width}x${height}`);
        
        // Update rendering components
        this.updateRenderingForSize({ width, height });
        
        // Store new size
        this.lastKnownSize = { width, height };
        
        // Notify callbacks
        this.resizeCallbacks.forEach(callback => {
            try {
                callback({ width, height });
            } catch (error) {
                console.error('Error in resize callback:', error);
            }
        });
    }

    /**
     * Handle panel state changes
     * @param {Event} event - Panel state change event
     */
    handlePanelStateChange(event) {
        const { panelName, newState, allStates } = event.detail;
        
        console.log(`🎛️ Panel state change: ${panelName} -> ${newState}`);
        
        // Recalculate canvas size based on new panel states
        this.recalculateCanvasSizeForPanelStates(allStates);
        
        // Optimize rendering area when panels are hidden
        if (newState === 'hidden') {
            this.optimizeRenderAreaForHiddenPanel(panelName);
        }
    }

    /**
     * Handle viewport changes from adaptive UI controller
     * @param {Object} detail - Viewport change details
     */
    handleViewportChange(detail) {
        const { from, to, configuration } = detail;
        
        console.log(`📱 Viewport change: ${from} -> ${to}`);
        
        // Adjust rendering quality based on viewport
        this.adjustRenderingQualityForViewport(to, configuration);
        
        // Recalculate canvas size for new viewport
        this.recalculateCanvasSize();
    }

    /**
     * Debounced resize handler
     */
    debouncedResize() {
        const now = Date.now();
        
        if (now - this.lastResizeTime < this.minResizeInterval) {
            if (this.resizeDebounceTimeout) {
                clearTimeout(this.resizeDebounceTimeout);
            }
            
            this.resizeDebounceTimeout = setTimeout(() => {
                this.performResize();
            }, this.minResizeInterval);
        } else {
            this.performResize();
        }
        
        this.lastResizeTime = now;
    }

    /**
     * Perform actual resize operation
     */
    performResize() {
        if (this.resizeDebounceTimeout) {
            clearTimeout(this.resizeDebounceTimeout);
            this.resizeDebounceTimeout = null;
        }
        
        this.recalculateCanvasSize();
    }

    /**
     * Recalculate canvas size based on current layout
     */
    recalculateCanvasSize() {
        if (!this.container) return;
        
        // Get current container dimensions
        const containerRect = this.container.getBoundingClientRect();
        const newSize = {
            width: containerRect.width,
            height: containerRect.height
        };
        
        // Only update if size actually changed
        if (newSize.width !== this.lastKnownSize.width || 
            newSize.height !== this.lastKnownSize.height) {
            
            console.log(`🎨 Recalculating canvas size: ${newSize.width}x${newSize.height}`);
            
            // Update responsive canvas container
            if (responsiveCanvasContainer.isInitialized) {
                responsiveCanvasContainer.forceResize();
            } else {
                // Fallback: update renderer directly
                this.updateRenderingForSize(newSize);
            }
        }
    }

    /**
     * Recalculate canvas size based on panel states
     * @param {Object} panelStates - Current panel states
     */
    recalculateCanvasSizeForPanelStates(panelStates) {
        // Calculate available space based on panel states
        let leftPanelWidth = 0;
        let rightPanelWidth = 0;
        
        if (panelStates.left === 'visible') {
            leftPanelWidth = 280; // Default panel width
        } else if (panelStates.left === 'minimized') {
            leftPanelWidth = 60; // Minimized panel width
        }
        
        if (panelStates.right === 'visible') {
            rightPanelWidth = 280; // Default panel width
        } else if (panelStates.right === 'minimized') {
            rightPanelWidth = 60; // Minimized panel width
        }
        
        // Calculate available width for canvas
        const totalWidth = window.innerWidth;
        const availableWidth = totalWidth - leftPanelWidth - rightPanelWidth;
        
        // Update container width if needed
        if (this.container) {
            this.container.style.width = `${availableWidth}px`;
            
            // Trigger resize
            setTimeout(() => {
                this.recalculateCanvasSize();
            }, 50); // Small delay to allow DOM update
        }
    }

    /**
     * Update rendering components for new size
     * @param {Object} size - New size {width, height}
     */
    updateRenderingForSize(size) {
        if (!this.renderer || !this.camera) return;
        
        const { width, height } = size;
        
        try {
            // Update renderer size
            this.renderer.setSize(width, height, false);
            
            // Update camera aspect ratio
            if (this.camera.isPerspectiveCamera) {
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
            } else if (this.camera.isOrthographicCamera) {
                const aspect = width / height;
                this.camera.left = -aspect;
                this.camera.right = aspect;
                this.camera.updateProjectionMatrix();
            }
            
            // Update pixel ratio for high-DPI displays
            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            this.renderer.setPixelRatio(pixelRatio);
            
            console.log(`✅ Rendering updated for size: ${width}x${height} (ratio: ${pixelRatio})`);
            
        } catch (error) {
            console.error('❌ Error updating rendering for size:', error);
        }
    }

    /**
     * Optimize rendering for layout changes
     * @param {Object} layoutInfo - Layout information
     */
    optimizeRenderingForLayout(layoutInfo) {
        const { viewportType, panelStates } = layoutInfo;
        
        // Adjust rendering quality based on available space
        if (viewportType === 'mobile') {
            this.setRenderingQuality('medium');
        } else if (viewportType === 'tablet') {
            this.setRenderingQuality('high');
        } else {
            this.setRenderingQuality('ultra');
        }
        
        // Optimize for panel states
        const hiddenPanels = Object.values(panelStates).filter(state => state === 'hidden').length;
        if (hiddenPanels >= 2) {
            // Both panels hidden - maximize rendering area
            this.maximizeRenderingArea();
        }
    }

    /**
     * Optimize render area when panel is hidden
     * @param {string} panelName - Name of hidden panel
     */
    optimizeRenderAreaForHiddenPanel(panelName) {
        console.log(`🎨 Optimizing render area for hidden ${panelName} panel`);
        
        // Recalculate canvas size to take advantage of extra space
        setTimeout(() => {
            this.recalculateCanvasSize();
        }, 300); // Wait for panel animation to complete
    }

    /**
     * Adjust rendering quality for viewport
     * @param {string} viewport - Viewport type
     * @param {Object} configuration - Viewport configuration
     */
    adjustRenderingQualityForViewport(viewport, configuration) {
        switch (viewport) {
            case 'mobile':
                this.setRenderingQuality('low');
                break;
            case 'tablet':
                this.setRenderingQuality('medium');
                break;
            case 'desktop':
                this.setRenderingQuality('high');
                break;
        }
    }

    /**
     * Set rendering quality level
     * @param {string} quality - Quality level: 'low', 'medium', 'high', 'ultra'
     */
    setRenderingQuality(quality) {
        if (!this.renderer) return;
        
        const qualitySettings = {
            low: { pixelRatio: 1, antialias: false },
            medium: { pixelRatio: 1.5, antialias: true },
            high: { pixelRatio: 2, antialias: true },
            ultra: { pixelRatio: 2, antialias: true }
        };
        
        const settings = qualitySettings[quality] || qualitySettings.medium;
        
        // Update pixel ratio
        this.renderer.setPixelRatio(Math.min(settings.pixelRatio, window.devicePixelRatio || 1));
        
        console.log(`🎨 Rendering quality set to: ${quality}`);
    }

    /**
     * Maximize rendering area (when panels are hidden)
     */
    maximizeRenderingArea() {
        console.log('🎨 Maximizing rendering area');
        
        // Force canvas to use full available space
        if (this.container) {
            this.container.style.width = '100%';
            this.container.style.height = '100%';
            
            // Trigger resize
            setTimeout(() => {
                this.recalculateCanvasSize();
            }, 50);
        }
    }

    /**
     * Add resize callback
     * @param {Function} callback - Callback function
     */
    addResizeCallback(callback) {
        if (typeof callback === 'function') {
            this.resizeCallbacks.push(callback);
        }
    }

    /**
     * Remove resize callback
     * @param {Function} callback - Callback function
     */
    removeResizeCallback(callback) {
        const index = this.resizeCallbacks.indexOf(callback);
        if (index > -1) {
            this.resizeCallbacks.splice(index, 1);
        }
    }

    /**
     * Add layout change callback
     * @param {Function} callback - Callback function
     */
    addLayoutChangeCallback(callback) {
        if (typeof callback === 'function') {
            this.layoutChangeCallbacks.push(callback);
        }
    }

    /**
     * Remove layout change callback
     * @param {Function} callback - Callback function
     */
    removeLayoutChangeCallback(callback) {
        const index = this.layoutChangeCallbacks.indexOf(callback);
        if (index > -1) {
            this.layoutChangeCallbacks.splice(index, 1);
        }
    }

    /**
     * Get current integration status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasRenderer: !!this.renderer,
            hasCamera: !!this.camera,
            hasContainer: !!this.container,
            lastKnownSize: { ...this.lastKnownSize },
            responsiveCanvasConnected: responsiveCanvasContainer.isInitialized,
            layoutManagerConnected: !!layoutManager,
            callbackCounts: {
                resize: this.resizeCallbacks.length,
                layoutChange: this.layoutChangeCallbacks.length
            }
        };
    }

    /**
     * Force integration update
     */
    forceUpdate() {
        console.log('🔄 Forcing integration update');
        
        this.recalculateCanvasSize();
        
        if (responsiveCanvasContainer.isInitialized) {
            responsiveCanvasContainer.forceResize();
        }
    }

    /**
     * Dispose of resources
     */
    dispose() {
        // Remove event listeners
        document.removeEventListener('layoutChanged', this.handleLayoutChange);
        document.removeEventListener('panelStateChanged', this.handlePanelStateChange);
        window.removeEventListener('resize', this.debouncedResize);
        
        if (this.container) {
            this.container.removeEventListener('canvasResize', this.handleCanvasResize);
        }
        
        // Clear timeouts
        if (this.resizeDebounceTimeout) {
            clearTimeout(this.resizeDebounceTimeout);
            this.resizeDebounceTimeout = null;
        }
        
        // Remove callbacks from layout manager
        if (layoutManager) {
            layoutManager.removeLayoutChangeListener(this.handleLayoutChange);
        }
        
        // Clear callbacks
        this.resizeCallbacks = [];
        this.layoutChangeCallbacks = [];
        
        // Clear references
        this.renderer = null;
        this.camera = null;
        this.scene = null;
        this.container = null;
        this.renderingComponents = null;
        this.isInitialized = false;
        
        console.log('RendererLayoutIntegration disposed');
    }
}

// Create and export singleton instance
export const rendererLayoutIntegration = new RendererLayoutIntegration();

// Make available globally for debugging
if (typeof window !== 'undefined') {
    window.rendererLayoutIntegration = rendererLayoutIntegration;
    console.log('🔧 Renderer Layout Integration available globally');
}